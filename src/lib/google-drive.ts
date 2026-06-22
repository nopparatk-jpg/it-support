import { google } from 'googleapis';
import { Readable } from 'node:stream';
import { env } from '@/lib/env';
import { ApiError } from '@/lib/api-utils';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export function buildPhotoUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
}

export function extractFileId(url: string): string | null {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}

function getDrive() {
  const b64 = env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  const folderId = env.GOOGLE_DRIVE_FOLDER_ID;
  if (!b64 || !folderId) {
    throw new ApiError(500, 'Google Drive is not configured');
  }
  const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as {
    client_email: string;
    private_key: string;
  };
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });
  return { drive: google.drive({ version: 'v3', auth }), folderId };
}

export async function uploadPhoto(
  file: File,
): Promise<{ url: string; name: string; fileId: string }> {
  const { drive, folderId } = getDrive();
  const buffer = Buffer.from(await file.arrayBuffer());

  const created = await drive.files.create({
    requestBody: { name: file.name, parents: [folderId] },
    media: {
      mimeType: file.type || 'application/octet-stream',
      body: Readable.from(buffer),
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  const fileId = created.data.id;
  if (!fileId) {
    throw new ApiError(500, 'Drive upload returned no file id');
  }

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });

  return { url: buildPhotoUrl(fileId), name: file.name, fileId };
}

export async function deletePhoto(fileId: string): Promise<void> {
  try {
    const { drive } = getDrive();
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (err) {
    console.error(`Failed to delete Drive file ${fileId}:`, err);
  }
}

export async function deletePhotosByUrls(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map((url) => {
      const fileId = extractFileId(url);
      return fileId ? deletePhoto(fileId) : Promise.resolve();
    }),
  );
}
