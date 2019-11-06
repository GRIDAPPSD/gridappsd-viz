/**
 * Copy the provided content to clipboard, returns true if copy was
 * was successful, false otherwise
 */
export function copyToClipboard(content: string) {
  const fakeInput = document.createElement('textarea');
  fakeInput.setAttribute('style', 'position:fixed');
  fakeInput.value = content;
  document.body.appendChild(fakeInput);
  fakeInput.select();

  const copyResult = document.execCommand('copy');
  window.getSelection().removeAllRanges();
  document.body.removeChild(fakeInput);

  return copyResult;
}

export const enum DownloadType {
  CSV = 'text/csv',
  JSON = 'application/json'
}

/**
 * Download the content into a file with the provided MIME type
 * @param filename The name of the file to be downloaded
 * @param fileContent The content of the file to be downloaded
 * @param contentType The content type of the downloaded file
 */
export function download(filename: string, fileContent: any, contentType: DownloadType) {
  const a = document.createElement('a');
  a.setAttribute('style', 'display:none');
  const blob = new Blob([fileContent], { type: contentType });
  const downloadUrl = URL.createObjectURL(blob);
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
}


interface FuzzySearchBoundary {
  /**
   * Inclusive
   */
  start: number;
  /**
   * Exclusive
   */
  end: number;
  highlight: boolean;
}

export interface FuzzySearchResult {
  inaccuracy: number;
  input: string;
  boundaries: FuzzySearchBoundary[];
}
/**
 *
 * @param needle The string to search for in {@see haystack}
 * @param hightlightMatches Whether or not the matched boundaries should be highlighted
 */
export function fuzzySearch(needle: string, hightlightMatches = false): (haystack?: string) => null | FuzzySearchResult {
  if (needle === '' || needle === undefined)
    return () => null;

  if (!hightlightMatches) {
    const specialTokens = ['(', ')', '[', ']', '{', '}', '?', '\\', '/', '*', '+', '-', '.', '^', '$'];
    const tokens = needle.split('')
      .map(token => specialTokens.includes(token) ? `\\${token}` : hightlightMatches ? `(${token})` : token);
    const pattern = new RegExp(tokens.join('[\\s\\S]*'), 'i');
    return (haystack: string) => {
      const matches = pattern.test(haystack);
      if (!matches)
        return null;
      return {
        inaccuracy: Infinity,
        input: haystack,
        boundaries: [
          {
            start: 0,
            end: undefined,
            highlight: false
          }
        ]
      };
    };
  }

  return (haystack: string) => {
    if (!haystack)
      return null;
    const originalHaystack = haystack;
    haystack = haystack.toLowerCase();
    needle = needle.toLowerCase();
    let startOfCurrentMatch = haystack.indexOf(needle[0]);
    if (startOfCurrentMatch === -1)
      return null;
    const boundaries: FuzzySearchBoundary[] = [];
    if (startOfCurrentMatch > 0)
      boundaries.push({
        start: 0,
        end: startOfCurrentMatch,
        highlight: false
      });
    let inaccuracy = needle.length === 1 ? startOfCurrentMatch : 0;
    for (const piece of needle) {
      const endOfLastMatch = boundaries.length > 0 ? boundaries[boundaries.length - 1].end : 0;
      startOfCurrentMatch = haystack.indexOf(piece, endOfLastMatch);
      if (startOfCurrentMatch === -1)
        return null;
      if (startOfCurrentMatch > endOfLastMatch) {
        boundaries.push({
          start: endOfLastMatch,
          end: startOfCurrentMatch,
          highlight: false
        });
        inaccuracy += startOfCurrentMatch - endOfLastMatch;
      }
      boundaries.push({
        start: startOfCurrentMatch,
        end: startOfCurrentMatch + 1,
        highlight: true
      });
    }
    boundaries.push({
      start: boundaries[boundaries.length - 1].end,
      end: undefined,
      highlight: false
    });
    return {
      inaccuracy,
      input: originalHaystack,
      boundaries
    };
  };
}

/**
 * Returns a promise that resolves when the predicate returns true
 * @param predicate A function that determines when to stop waiting
 * @param waitDelay How often to check if the predicate function returns true
 */
export function waitUntil(predicate: () => boolean, waitDelay = 500): Promise<void> {
  return new Promise(resolve => {
    if (predicate())
      resolve();
    else {
      const repeater = setTimeout(() => {
        if (predicate()) {
          resolve();
          clearInterval(repeater);
        }
      }, waitDelay);
    }
  });
}

export function generateUniqueId() {
  return btoa(String(Math.random())).toLowerCase().substr(10, 10);
}
