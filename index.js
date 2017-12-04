'use strict';

const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');

function getSESConfig() {
	return {
		SES: new AWS.SES({ apiVersion: '2010-12-01' }),
		sendingRate: 1
	};
}

function doSendEmail({ from, headers, html, subject, receiver, transporter}) {
	const mailOptions = {
		from,
		headers,
		html,
		subject,
		to: receiver
	};

	transporter.sendMail(mailOptions, function onSent(error, info) {
		if (error) {
			throw new Error(`Could not send email through SES: ${error.message}`);
		} else {
			return info;
		}
	});
}

function sendEmails({ from, headers, html, text, subject, receivers, transporter }) {
	return receivers.map(receiver => doSendEmail({
		from, headers, html, subject, receiver, transporter
	}));
}

module.exports = function createSendEmails() {
	const transporter = nodemailer.createTransport(getSESConfig());

	return function sendEmail({ from, headers, html, text, subject, receivers }) {
		return sendEmails({
			from,
			headers,
			html,
			text,
			subject,
			receivers,
			transporter
		});
	};
};
