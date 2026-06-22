export function buildPhotoUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
}

export function extractFileId(url: string): string | null {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}
