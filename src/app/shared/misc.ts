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
