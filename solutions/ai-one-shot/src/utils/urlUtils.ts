import fetch from 'node-fetch';

/**
 * Extracts URLs from a given text.
 * @param text The text to search for URLs.
 * @returns An array of URLs found in the text.
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Fetches the content of a URL as text.
 * @param url The URL to fetch.
 * @returns The content of the URL as text.
 */
export async function fetchUrlContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch URL: ${url}, Status: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching URL: ${url}, Error: ${errorMessage}`);
    return null;
  }
}