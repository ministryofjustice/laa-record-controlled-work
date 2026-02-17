/**
 * Type declarations for frontend packages that don't have built-in TypeScript support.
 */

declare module 'govuk-frontend' {
	/**
	 * Initializes all GOV.UK Frontend components on the page.
	 * @returns {void}
	 */
	export function initAll(): void;
}

declare module '@ministryofjustice/frontend' {
	/**
	 * Initializes all MOJ Frontend components on the page.
	 * @returns {void}
	 */
	export function initAll(): void;
}
