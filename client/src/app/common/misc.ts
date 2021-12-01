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
 *
 * @param filename The name of the file to be downloaded
 * @param fileContent The content of the file to be downloaded
 * @param contentType The content type of the downloaded file
 */
export function download(filename: string, fileContent: string, contentType: DownloadType) {
  const a = document.createElement('a');
  a.setAttribute('style', 'display:none');
  const blob = new Blob([fileContent], { type: contentType });
  const downloadUrl = URL.createObjectURL(blob);
  a.href = downloadUrl;
  a.download = `${filename}.${contentType === DownloadType.JSON ? 'json' : 'csv'}`;
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
 */
export function fuzzySearch(needle: string): (haystack?: string) => null | FuzzySearchResult {
  if (needle === '' || needle === undefined) {
    return () => null;
  }

  return (haystack: string) => {
    if (!haystack) {
      return null;
    }
    const originalHaystack = haystack;
    const boundaries: FuzzySearchBoundary[] = [];
    let startOfCurrentMatch = haystack.indexOf(needle[0]);
    let inaccuracy = needle.length === 1 ? startOfCurrentMatch : 0;

    haystack = haystack.toLowerCase();
    needle = needle.toLowerCase();

    for (const piece of needle) {
      const endOfLastMatch = boundaries.length > 0 ? boundaries[boundaries.length - 1].end : 0;
      startOfCurrentMatch = haystack.indexOf(piece, endOfLastMatch);
      if (startOfCurrentMatch === -1) {
        return null;
      }
      // If the haystack is an exact match to the needle
      // we want it to have the smallest possible inaccuracy
      // which is negative infinity
      // then we want to break out of the loop
      if (needle === haystack) {
        inaccuracy = -Infinity;
        boundaries.push({
          start: 0,
          end: Infinity,
          highlight: true
        });
        break;
      }
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
 *
 * @param predicate A function that determines when to stop waiting
 * @param waitDelay How often to check if the predicate function returns true
 */
export function waitUntil(predicate: () => boolean, waitDelay = 500): Promise<void> {
  return new Promise(resolve => {
    if (predicate()) {
      resolve();
    } else {
      let retries = 0;
      const repeater = setInterval(() => {
        if (predicate()) {
          resolve();
          clearInterval(repeater);
        }
        retries++;
        if (retries === 3) {
          clearInterval(repeater);
        }
      }, waitDelay);
    }
  });
}

export function generateUniqueId() {
  return btoa(String(Math.random() + Math.random())).toLowerCase().substr(10, 10);
}

export function unique<T>(iterable: Iterable<T>): T[] {
  const visitedElements = new Map<T, true>();
  for (const element of iterable) {
    if (!visitedElements.has(element)) {
      visitedElements.set(element, true);
    }
  }
  return [...visitedElements.keys()];
}
