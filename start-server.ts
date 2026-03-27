import chokidar from 'chokidar'; // Import chokidar for file watching
import livereload from 'livereload'; // Import livereload for live reloading
import path from 'node:path'; // Import path module for handling file paths
import { fileURLToPath } from 'node:url'; // Import fileURLToPath to convert file URLs to paths
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process'; // Import spawn from child_process to spawn new processes
import config from './config.js'; // Import the config
import { build } from './esbuild.js'; // Import the build function with correct extension

const NO_MORE_ASYNC_OPERATIONS = 0;
const UNCAUGHT_FATAL_EXCEPTION = 1;
const ADDING_TO_PORT_NUMBER = 1;
const ONE_SECOND_DELAY = 1000;

// Get the directory name
const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);

let serverProcess: ChildProcess | null = null; // Variable to hold the server process
let livereloadServer: ReturnType<typeof livereload.createServer> | null = null; // Variable to hold the livereload server

/**
 * Starts the server by spawning a new process.
 * If an existing server process is running, it kills the process before starting a new one.
 * If the specified port is in use, it attempts to start the server on the next available port.
 *
 * @param {number} port - The port number to start the server on.
 * @returns {void}
 */
const startServer = (port: number): void => {
	// If there's an existing server process, kill it
	if ((serverProcess !== null)) {
		serverProcess.kill();
		serverProcess = null;
	}

	// Add a delay to ensure the port is released before starting a new server process
	setTimeout(() => {
		// Spawn a new server process
		serverProcess = spawn('node', ['public/app.js'], {
			stdio: 'inherit', // Inherit stdio to display server logs in the console
			env: { ...process.env, PORT: port.toString() } // Pass the environment variables, including the port
		});

		// Handle server process close event
		serverProcess.on('close', (code: number | null) => {
			if (code !== NO_MORE_ASYNC_OPERATIONS) {
				console.error(`Server process exited with code ${code}`);
			}
		});

		// Handle server process error event
		serverProcess.on('error', (error: Error & { code?: string }) => {
			if (error.code === 'EADDRINUSE') {
				console.error(`Port ${port} is already in use. Trying to restart the server on a different port...`);
				// If the port is in use, try to restart the server on the next port
				setTimeout(() => { startServer(port + ADDING_TO_PORT_NUMBER); }, ONE_SECOND_DELAY);
			} else {
				console.error('Server process error:', sanitizeError(error));
			}
		});
	}, ONE_SECOND_DELAY); // 1-second delay to ensure the port is released
};

/**
 * Starts the build process and server.
 * If in development mode, sets up livereload and file watching for automatic rebuilds.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the server and file watching setup are complete.
 */
const start = async (): Promise<void> => {
	// Log the current NODE_ENV and port
	console.log(`Current NODE_ENV: ${config.app.environment}`);
	console.log(`Server running on port: ${config.app.port}`);

	// Build the project
	await build();
	// Start the server on the configured port
	startServer(config.app.port);

	// If in development mode, set up livereload and file watching
	if (process.env.NODE_ENV === 'development') {
		// Start livereload server
		livereloadServer = livereload.createServer();
		livereloadServer.watch(path.join(dirName, 'public'));

		// Watch for changes in JS and SCSS files
		const watcher = chokidar.watch('src/**/*.{js,ts,scss}', {
			ignored: /node_modules/, // Ignore node_modules directory
			persistent: true, // Keep watching for changes
		});

		// Handle file change event
		watcher.on('change', (filePath: string) => {
			console.log(`File ${filePath} has been changed. Rebuilding...`);
			// Rebuild the project and handle errors
			void (async () => {
				try {
					await build();
					// Refresh livereload server
					if (livereloadServer !== null) {
						livereloadServer.refresh('/');
					}
					// Restart the server
					startServer(config.app.port);
				} catch (error) {
					console.error('Error during rebuild:', sanitizeError(error));
				}
			})();
		});

		// Handle watcher ready event
		watcher.on('ready', () => {
			console.log('Watching for file changes...');
		});

		// Handle watcher error event
		watcher.on('error', (error: unknown) => {
			console.error('Watcher error:', sanitizeError(error));
		});
	}
};

/**
 * Sanitizes error messages to remove sensitive information before logging.
 * This function can be customized to remove or mask specific details.
 *
 * @param {unknown} error - The error object to sanitize.
 * @returns {object} A sanitized version of the error object.
 */
const sanitizeError = (error: unknown): object => {
	// Type guard to check if error is an Error object
	if (error instanceof Error) {
		const sanitizedError: Record<string, unknown> = {
			name: error.name,
			message: error.message
		};

		// Remove any other sensitive information if necessary
		if (typeof sanitizedError.message === 'string') {
			sanitizedError.message = sanitizedError.message.replace(/sensitive information/g, '[REDACTED]');
		}

		return sanitizedError;
	}

	// If it's not an Error instance, return a generic error object
	return { message: 'An unknown error occurred' };
};

// Start the build and server process
start().catch((error: unknown) => {
	// Log sanitized error
	console.error('Start script failed:', sanitizeError(error));
	process.exit(UNCAUGHT_FATAL_EXCEPTION);
});