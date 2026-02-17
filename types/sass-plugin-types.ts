// SassPlugin type definitions

export interface SassPluginOptions {
	resolveDir?: string;
	loadPaths?: string[];
	transform?: (source: string) => string;
	// Add other possible options
}