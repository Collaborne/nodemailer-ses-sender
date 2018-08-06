import AWS from 'aws-sdk';

export interface Tags {
	[key: string]: string;
}

export function getSESConfig(region: string) {
	return {
		SES: new AWS.SES({
			apiVersion: '2010-12-01',
			region,
		}),
	};
}

/**
 * Creates the SES header
 *
 * @VisibleForTesting
 * @param tags Tags that should be added to the SES header
 * @returns SES header
 */
export function createHeader(tags: Tags = {}, configurationSet?: string): Tags {
	const messageTags = Object.keys(tags).map(tag => {
		const value = tags[tag];
		return `${tag}=${escapeSESTag(value)}`;
	}).join(', ');

	const header: { [key: string]: string } = {
		'X-SES-MESSAGE-TAGS': messageTags,
	};

	if (configurationSet) {
		header['X-SES-CONFIGURATION-SET'] = configurationSet;
	}

	return header;
}

/**
 * SES tags must only contain alphanumeric ASCII characters, '_' and '-'
 *
 * @param tag Unescaped tag
 * @returns escaped tag
 */
function escapeSESTag(tag: string): string {
	if (!tag) {
		return tag;
	}

	// Replace all invalid characters
	return tag.replace(/[^a-zA-Z0-9_-]/g, '_');
}
