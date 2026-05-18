/**
 * Types for ASCII art message display functionality
 */

/**
 * Interface for the messages displayed in the console
 */
export interface AsciiArtMessages {
  getFormattedMessage: () => string;
  messages: string[];
}

/**
 * Type for the console banner display function
 */
export type DisplayConsoleBannerFunction = () => void;
