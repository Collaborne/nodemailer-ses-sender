import { expect } from 'chai';

import { createHeader, getSESConfig } from '../src/ses';

describe('ses utils', () => {
	describe('createHeader()', () => {
		it('add multiple SES tags', () => {
			const header = createHeader({}, 'configuration-set');
			expect(header['X-SES-CONFIGURATION-SET']).to.be.equal('configuration-set');
		});

		it('add multiple SES tags', () => {
			const header = createHeader({
				id: 'ID',
				title: 'TITLE',
			});
			expect(header['X-SES-MESSAGE-TAGS']).to.be.equal('id=ID, title=TITLE');
		});

		it('encodes SES tags', () => {
			const header = createHeader({
				title: 'My Title',
			});
			expect(header['X-SES-MESSAGE-TAGS']).to.be.equal('title=My_Title');
		});
	});

	describe('getSESConfig', () => {
		it('returns a valid result without a region specified', () => {
			const config = getSESConfig();
			expect(config.SES).to.be.ok;
		});
	})
});
