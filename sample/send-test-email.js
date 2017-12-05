'use strict';

const EmailsSender = require('./../index');

const argv = require('yargs')
	.boolean('dry-run').default('dry-run', false)
	.string('receiver').default('receiver', 'test')
	.string('sender').default('sender', 'test')
	.help()
	.argv;

const emailSender = new EmailsSender(argv.dryRun, {smtpPort: process.env.SMTP_PORT});

const html = 'This is the <b>content</b> of this test email';
const subject = 'Test Nodemailer SES';

emailSender.sendEmail({
	from: argv.sender,
	html,
	subject,
	to: argv.receiver
})
	.then(info => {
		console.log(JSON.stringify(info));
	})
	.catch(error => {
		console.error(error.stack);
	})
