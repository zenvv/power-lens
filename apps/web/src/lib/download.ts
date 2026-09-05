export function downloadBytes(bytes: Uint8Array | string, fileName: string, mimeType: string): void {
  const part: BlobPart = typeof bytes === "string" ? bytes : new Uint8Array(bytes);
  const blob = new Blob([part], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
