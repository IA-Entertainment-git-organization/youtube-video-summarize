/**
 * This utility provides methods to make requests through proxies
 * which can help with region-locked content.
 */
/**
 * Makes a fetch request through a proxy
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The response
 */
export declare function fetchWithProxy(url: string, options?: RequestInit): Promise<Response>;
/**
 * Checks if proxy support is available
 */
export declare function isProxySupported(): boolean;
