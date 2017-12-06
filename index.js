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
	constructor(isDryRun = false, { smtpHost = DEFAULT_SMTP_HOST, smtpPort = DEFAULT_SMTP_PORT }) {
		const config = isDryRun ? getDefaultSMTPConfig(smtpHost, smtpPort) : getSESConfig();
		this.transporter = nodemailer.createTransport(config);
	}

	sendEmail({ from, headers = null, html, subject, to }) {
		const errorRetryDelay = 30000;
		const mailOptions = {
			from,
			headers,
			html,
			subject,
			to
		};
	
		return this.transporter.sendMail(mailOptions)
			.catch(error => {
				if (error.code === 'Throttling' && error.message === 'Maximum sending rate exceeded.') {
					logger.error(`${error.code}: ${error.message}, retrying in ${errorRetryDelay / 1000}s`);
					return delay(errorRetryDelay).then(this.sendEmail({ from, headers, html, subject, to }));
				}
				throw new Error(`Could not send email through SES: ${error.code}, ${error.message}`);
			});
	}
}
