import AWS from 'aws-sdk';
import { getLogger} from 'log4js';
import nodemailer, { Transporter } from 'nodemailer';
import { Options as SMTPOptions } from 'nodemailer/lib/smtp-transport';

const logger = getLogger('SESEmailSender');

const DEFAULT_SMTP_PORT: number = 587;
const DEFAULT_SMTP_HOST: string = '127.0.0.1';

function getSESConfig(region: string) {
	return {
		SES: new AWS.SES({
			apiVersion: '2010-12-01',
			region,
		}),
	};
}

function getDefaultSMTPConfig(smtpHost: string, smtpPort: number): SMTPOptions {
	logger.info(`Configured SMTP on ${smtpHost}:${smtpPort} for dry-run`);
	return {
		host: smtpHost,
		port: smtpPort,
		secure: false,
		tls: {
			// Do not fail on invalid certs
			rejectUnauthorized: false,
		},
	};
}

/**
 * Resolve a promise after the `timeout` has passed.
 *
 * @param after timeout in milliseconds
 * @return promise resolved after timeout
 */
function delay(after: number): Promise<void> {
	return new Promise(resolve => {
		return setTimeout(() => resolve(), after);
	});
}

export interface Options {
	smtpHost?: string;
	smtpPort?: number;
	configurationSet?: string;
	region: string;
}

export interface SendOptions {
	from: string;
	html: string;
	subject: string;
	tags?: { [key: string]: string };
	to: string;
	isDryRun?: boolean;
}

export class SESEmailSender {
	private transporterSES: Transporter;
	private transporterDryRun: Transporter;
	private configurationSet: string | undefined;
	private defaultDryRun: boolean;

	constructor(isDryRun = false, options: Options) {
		this.transporterSES = nodemailer.createTransport(getSESConfig(options.region));

		const smtpHost = options.smtpHost || DEFAULT_SMTP_HOST;
		const smtpPort = options.smtpPort || DEFAULT_SMTP_PORT;
		const configDryRun = getDefaultSMTPConfig(smtpHost, smtpPort);
		this.transporterDryRun = nodemailer.createTransport(configDryRun);

		this.configurationSet = options.configurationSet;

		this.defaultDryRun = isDryRun;
	}

	public sendEmail(options: SendOptions): Promise<any> {
		const errorRetryDelay = 30000;
		const mailOptions = {
			from: options.from,
			headers: this.createHeader(options.tags || {}),
			html: options.html,
			subject: options.subject,
			to: options.to,
		};

		const isDryRun = options.isDryRun || this.defaultDryRun;
		const transporter = isDryRun ? this.transporterDryRun : this.transporterSES;

		return transporter.sendMail(mailOptions)
			.catch(error => {
				if (error.code === 'Throttling' && error.message === 'Maximum sending rate exceeded.') {
					logger.error(`${error.code}: ${error.message}, retrying in ${errorRetryDelay / 1000}s`);
					return delay(errorRetryDelay)
						.then(() => this.sendEmail(options));
				}
				throw new Error(`Could not send email through SES: ${error.code}, ${error.message}`);
			});
	}

	/**
	 * Creates the SES header
	 *
	 * @VisibleForTesting
	 * @param tags Tags that should be added to the SES header
	 * @returns SES header
	 */
	public createHeader(tags: { [key: string]: string } = {}): { [key: string]: string } {
		const messageTags = Object.keys(tags).map(tag => {
			const value = tags[tag];
			return `${tag}=${this.escapeSESTag(value)}`;
		}).join(', ');

		const header: { [key: string]: string } = {
			'X-SES-MESSAGE-TAGS': messageTags,
		};

		if (this.configurationSet) {
			header['X-SES-CONFIGURATION-SET'] = this.configurationSet;
		}

		return header;
	}

	/**
	 * SES tags must only contain alphanumeric ASCII characters, '_' and '-'
	 *
	 * @param tag Unescaped tag
	 * @returns escaped tag
	 */
	private escapeSESTag(tag: string): string {
		if (!tag) {
			return tag;
		}

		// Replace all invalid characters
		return tag.replace(/[^a-zA-Z0-9_-]/g, '_');
	}
}
