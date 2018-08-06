/**
 * Resolve a promise after the `timeout` has passed.
 *
 * @param after timeout in milliseconds
 * @return promise resolved after timeout
 */
export function delay(after: number): Promise<void> {
	return new Promise(resolve => {
		return setTimeout(() => resolve(), after);
	});
}
