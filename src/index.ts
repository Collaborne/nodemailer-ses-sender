import { ClientConfiguration } from 'aws-sdk/clients/ses';
import nodemailer, { Transporter } from 'nodemailer';
import { Options as SMTPOptions } from 'nodemailer/lib/smtp-transport';

import { getLogger } from '@log4js-node/log4js-api';

import { delay } from './delay';
import { createHeader, getSESConfig } from './ses';

const logger = getLogger('SESEmailSender');

const DEFAULT_SMTP_PORT: number = 587;
const DEFAULT_SMTP_HOST: string = '127.0.0.1';

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

export interface Options {
	smtpHost?: string;
	smtpPort?: number;
	configurationSet?: string;
	region?: string;

	/**
	 * Additional configuration options when creating the SES client
	 *
	 * Note that if both a `region` and a `sesConfiguration.region` are specified the region setting from
	 * the `sesConfiguration` will be used.
	 */
	sesConfiguration?: ClientConfiguration;
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
		this.transporterSES = nodemailer.createTransport(getSESConfig(options.region, options.sesConfiguration));

		const smtpHost = options.smtpHost || DEFAULT_SMTP_HOST;
		const smtpPort = options.smtpPort || DEFAULT_SMTP_PORT;
		const configDryRun = getDefaultSMTPConfig(smtpHost, smtpPort);
		this.transporterDryRun = nodemailer.createTransport(configDryRun);

		this.configurationSet = options.configurationSet;

		this.defaultDryRun = isDryRun;
	}

	public async sendEmail(options: SendOptions): Promise<any> {
		const errorRetryDelay = 30000;
		const mailOptions = {
			from: options.from,
			headers: createHeader(options.tags || {}, this.configurationSet),
			html: options.html,
			subject: options.subject,
			to: options.to,
		};

		const isDryRun = options.isDryRun || this.defaultDryRun;
		const transporter = isDryRun ? this.transporterDryRun : this.transporterSES;

		try {
			return await transporter.sendMail(mailOptions)
		} catch (error) {
			if (error.code === 'Throttling' && error.message === 'Maximum sending rate exceeded.') {
				logger.error(`${error.code}: ${error.message}, retrying in ${errorRetryDelay / 1000}s`);
				await delay(errorRetryDelay)
				return this.sendEmail(options);
			}
			throw new Error(`Could not send email through SES: ${error.code}, ${error.message}`);
		}
	}
}
