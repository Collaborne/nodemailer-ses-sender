declare module 'nodemailer-ses-sender' {
	interface IOptions {
		smtpHost: string;
		smtpPort: string;
		configurationSet: string;
		region: string;
	}

	interface ISendEmailOptions {
		from: string;
		tags: object;
		html: string;
		subject: string;
		to: string;
		isDryRun: boolean;
	}

	class SESEmailSender {
		constructor(isDryRun: boolean, {});
		public sendEmail(options: ISendEmailOptions): Promise<any>;
	}
	export = SESEmailSender;
}

