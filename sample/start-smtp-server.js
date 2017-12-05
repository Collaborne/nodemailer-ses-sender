'use strict';

const {SMTPServer} = require('smtp-server');

const server = new SMTPServer({
	authOptional: true,
	logger: true,
	onData(stream, session, callback) {
		// Print message to console
		stream.pipe(process.stdout);
		stream.on('end', callback);
	},
});

server.listen(process.env.SMTP_PORT);
