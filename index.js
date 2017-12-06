'use strict';

const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');
const logger = require('log4js').getLogger('SESEmailSender');

const DEFAULT_SMTP_PORT = '587';
const DEFAULT_SMTP_HOST = '127.0.0.1';

function getSESConfig() {
	return { SES: new AWS.SES({ apiVersion: '2010-12-01' }) };
}

function getDefaultSMTPConfig(smtpHost, smtpPort) {
	logger.info(`Configured SMTP on ${smtpHost}:${smtpPort} for dry-run`);
	return {
		host: smtpHost,
		port: smtpPort,
		secure: false,
		tls: {
			// Do not fail on invalid certs
			rejectUnauthorized: false
		}
	};
}

/**
 * Resolve a promise after the `timeout` has passed.
 *
 * @param {Number} after timeout in milliseconds
 * @return {Promise<void>} promise resolved after timeout
 */
function delay(after) {
	return new Promise(resolve => {
		return setTimeout(() => {
			return resolve();
		}, after);
	});
}

module.exports = class SESEmailSender {
	constructor(isDryRun = false, { smtpHost = DEFAULT_SMTP_HOST, smtpPort = DEFAULT_SMTP_PORT, configurationSet }) {
		const config = isDryRun ? getDefaultSMTPConfig(smtpHost, smtpPort) : getSESConfig();
		this.transporter = nodemailer.createTransport(config);

		this.configurationSet = configurationSet;
	}

	sendEmail({ from, tags = {}, html, subject, to }) {
		const errorRetryDelay = 30000;
		const mailOptions = {
			from,
			headers: this.createHeader(tags),
			html,
			subject,
			to
		};
	
		return this.transporter.sendMail(mailOptions)
			.catch(error => {
				if (error.code === 'Throttling' && error.message === 'Maximum sending rate exceeded.') {
					logger.error(`${error.code}: ${error.message}, retrying in ${errorRetryDelay / 1000}s`);
					return delay(errorRetryDelay).then(this.sendEmail({ from, tags, html, subject, to }));
				}
				throw new Error(`Could not send email through SES: ${error.code}, ${error.message}`);
			});
	}

	/**
	 * Creates the SES header
	 *
	 * @param {Object.<String, String>} tags 
	 */
	createHeader(tags = {}) {
		const messageTags = Object.keys(tags).map(tag => {
			const value = tags[tag];
			return `${tag}=${this.escapeSESTag(value)}`;
		}).join(', ');

		return {
			'X-SES-CONFIGURATION-SET': this.configurationSet,
			'X-SES-MESSAGE-TAGS': messageTags,
		};
	}

	/**
	 * SES tags must only contain alphanumeric ASCII characters, '_' and '-'
	 *
	 * @param {string} tag Unescaped tag
	 * @returns {string} escaped tag
	 */
	escapeSESTag(tag) {
		if (!tag) {
			return tag;
		}

		// Replace all invalid characters
		return tag.replace(/[^a-zA-Z0-9_-]/g, '_');
	}
}
