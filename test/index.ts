import { expect } from 'chai';

import { SESEmailSender } from '../src/index';

describe('SESEmailSender', () => {
	describe('SES header behavior', () => {
		it('add multiple SES tags', () => {
			const sender = new SESEmailSender(true, {
				configurationSet: 'configuration-set',
				region: 'eu-west-1',
			});
			const header = sender.createHeader({});
			expect(header['X-SES-CONFIGURATION-SET']).to.be.equal('configuration-set');
		});

		it('add multiple SES tags', () => {
			const sender = new SESEmailSender(true, {region: 'eu-west-1'});
			const header = sender.createHeader({
				id: 'ID',
				title: 'TITLE',
			});
			expect(header['X-SES-MESSAGE-TAGS']).to.be.equal('id=ID, title=TITLE');
		});

		it('encodes SES tags', () => {
			const sender = new SESEmailSender(true, {region: 'eu-west-1'});
			const header = sender.createHeader({
				title: 'My Title',
			});
			expect(header['X-SES-MESSAGE-TAGS']).to.be.equal('title=My_Title');
		});
	});
});
