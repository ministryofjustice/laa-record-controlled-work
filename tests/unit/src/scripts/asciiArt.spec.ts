/**
 * Tests for the asciiArt module.
 *
 * @description Tests for the ASCII art banner display functionality
 */

import { equal, ok } from "assert";
import sinon from "sinon";
import { displayConsoleBanner } from "#src/scripts/asciiArt.js";

describe("ASCII Art Banner", () => {
	let consoleLogStub: sinon.SinonStub;

	// Set up a stub for console.log before each test
	beforeEach(() => {
		consoleLogStub = sinon.stub(console, "log");
	});

	// Restore the original console.log after each test
	afterEach(() => {
		consoleLogStub.restore();
	});

	it("should display a banner with the correct format", () => {
		// Call the function that displays the banner
		displayConsoleBanner();

		// Assert that console.log was called
		equal(consoleLogStub.calledOnce, true, "console.log should be called once");

		// Get the actual output that was passed to console.log
		const output = consoleLogStub.firstCall.args[0];

		// Verify the output contains expected elements
		ok(output.includes("Welcome to LAA Express TypeScript Template"), "Banner should include welcome message");
		ok(output.includes("Like what you see? Want to work with us?"), "Banner should include recruitment message");
		ok(output.includes("View our job availabilities"), "Banner should include job reference");
	});

	it("should include all required messages in the output", () => {
		// Call the function that displays the banner
		displayConsoleBanner();

		// Get the actual output that was passed to console.log
		const output = consoleLogStub.firstCall.args[0];

		// Define the messages we expect to find
		const requiredMessages = [
			"Welcome to LAA Express TypeScript Template",
			"Like what you see? Want to work with us?",
			"View our job availabilities or sign up for alerts:",
			"{URL link to your departments jobs}"
		];

		// Check that each message is included in the output
		requiredMessages.forEach(message => {
			ok(output.includes(message), `Output should include: ${message}`);
		});
	});

	it("should properly format messages with line breaks", () => {
		// This test validates that the getFormattedMessage function works properly
		displayConsoleBanner();

		const output = consoleLogStub.firstCall.args[0];

		// Check that each message is on its own line
		ok(
			output.includes("Welcome to LAA Express TypeScript Template\nLike what you see?"),
			"Messages should be formatted with line breaks between them"
		);
	});
});
