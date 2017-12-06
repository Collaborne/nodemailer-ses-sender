# nodemailer-ses-sender [![Build Status](https://travis-ci.org/Collaborne/nodemailer-ses-sender.svg?branch=master)](https://travis-ci.org/Collaborne/nodemailer-ses-sender)

Send emails through SES with Nodemailer (wrapper for the SES transport in Nodemailer)

## Usage

This module requires the environment variables `AWS_PROFILE` (or the individual `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) and `AWS_REGION` to be set.

```js
const emailSender = new EmailsSender();

emailSender.sendEmail({
	from: 'mysender@test.com',
	headers: {
		'X-SES-MESSAGE-TAGS': 'myTag=test-email'
	},
	html: 'This is the <b>content</b> of this test email',
	subject: 'Test Nodemailer SES',
	receiver: 'myreceiver@test.com'
})
```

### Dry Run
To test the email sending against a local SMTP server, create the `EmailSender` with a flag, providing host and port of the SMTP server.

```js
const emailSender = new EmailsSender(true, {smtpHost: '127.0.0.1', smtpPort: '587'});
```
> If not provided, SMTP host and port will default to `{smtpHost: '127.0.0.1', smtpPort: '587'}`

To see how to start a local SMTP server that outputs the emails to `STDOUT`, check out `./sample/start-smtp-server.js`

## Development

### VSCode Config

#### Local SMTP Server
```json
{
	"type": "node",
	"request": "launch",
	"name": "Start SMTP Server",
	"program": "${workspaceFolder}/sample/start-smtp-server.js",
	"env": {
		"SMTP_PORT": "587"
	}
}
```

#### Send sample message to yourself
```js
{
	"type": "node",
	"request": "launch",
	"name": "Send test email",
	"program": "${workspaceFolder}/sample/send-test-email.js",
	"args": [
		"--dry-run",
		"--receiver",
		"<YOUR_RECEIVER_EMAIL>",
		"--sender",
		"<YOUR_SENDER_EMAIL>"
	],
	"env": {
		"AWS_PROFILE": "<YOUR_AWS_PROFILE>",
		"AWS_REGION": "<YOUR_AWS_REGION>",
		"SMTP_PORT": "587"
	}
}
```
