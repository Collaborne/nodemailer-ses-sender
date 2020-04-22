import { expect } from 'chai';
import 'mocha';

import { globalAgent } from 'http';

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

		it('applies the provided region and sesConfiguration', () => {
			const config = getSESConfig('region', {endpoint: 'endpoint'});
			expect(config.SES.config.region).to.be.equal('region');
			expect(config.SES.config.endpoint).to.be.equal('endpoint');
		});
		it('applies the provided sesConfiguration after the default configuration', () => {
			const config = getSESConfig('regionA', {region: 'regionB'});
			expect(config.SES.config.region).to.be.equal('regionB');
		});
		it('applies the httpOptions from the provided sesConfiguration', () => {
			const config = getSESConfig('region', {httpOptions: {agent: globalAgent}});
			expect(config.SES.config.httpOptions!.agent).to.be.equal(globalAgent);
		});
	});
});
