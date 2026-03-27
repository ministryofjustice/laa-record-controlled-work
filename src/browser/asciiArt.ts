// Optional for your frontend
/**
 * @file Custom TypeScript for GOV.UK Frontend Express.
 * Displays an ASCII art banner and job availability information in the console.
 *
 * ASCII Art created by: https://patorjk.com/software/taag/#p=display&f=Graffiti&t=Type%20Something%20
 */

import type { DisplayConsoleBannerFunction } from '#types/ascii-art-types.js';

/**
 * Messages to display in the console.
 */
const messages: string[] = [
    "Welcome to LAA Express TypeScript Template",
    "Like what you see? Want to work with us?",
    "View our job availabilities or sign up for alerts:",
    "{URL link to your departments jobs}" // Update this dynamically if needed
];

/**
 * Joins messages into a single formatted string with line breaks.
 * @returns {string} Formatted message string
 */
const getFormattedMessage = (): string => messages.join("\n");

/**
 * Displays an ASCII Art banner with department name in the console.
 * @returns {void}
 */
const displayConsoleBanner: DisplayConsoleBannerFunction = (): void => {
    console.log(`
 _____ _____ _____ 
| ____|_   _|_   _|
|  _|   | |   | |  
| |___  | |   | |  
|_____| |_|   |_|  

${getFormattedMessage()}
`);
};

// Run banner display when the script loads
displayConsoleBanner();

export { displayConsoleBanner };