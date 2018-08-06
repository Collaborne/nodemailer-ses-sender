import { delay } from '../src/delay';

describe('delay utils', () => {
	it('resolves after timeout', () => {
		return delay(1);
	});
});
