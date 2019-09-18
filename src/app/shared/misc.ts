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
