import { describe, it, expect, vi, beforeEach } from 'vitest';

const { filesCreate, filesDelete, permissionsCreate } = vi.hoisted(() => ({
  filesCreate: vi.fn(),
  filesDelete: vi.fn(),
  permissionsCreate: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  env: {
    GOOGLE_SERVICE_ACCOUNT_KEY_BASE64: Buffer.from(
      JSON.stringify({
        client_email: 'svc@test.iam.gserviceaccount.com',
        private_key: 'KEY',
      }),
    ).toString('base64'),
    GOOGLE_DRIVE_FOLDER_ID: 'FOLDER1',
  },
}));

vi.mock('googleapis', () => ({
  google: {
    auth: { JWT: vi.fn() },
    drive: () => ({
      files: { create: filesCreate, delete: filesDelete },
      permissions: { create: permissionsCreate },
    }),
  },
}));

import { buildPhotoUrl, extractFileId } from '@/lib/google-drive';
import { env } from '@/lib/env';

describe('buildPhotoUrl', () => {
  it('builds an embeddable thumbnail url', () => {
    expect(buildPhotoUrl('ABC123')).toBe(
      'https://drive.google.com/thumbnail?id=ABC123&sz=w1920',
    );
  });
});

describe('extractFileId', () => {
  it('extracts the id from a generated url', () => {
    expect(
      extractFileId('https://drive.google.com/thumbnail?id=ABC123&sz=w1920'),
    ).toBe('ABC123');
  });

  it('returns null when there is no id param', () => {
    expect(extractFileId('https://example.com/foo')).toBeNull();
  });
});

describe('uploadPhoto', () => {
  beforeEach(() => {
    filesCreate.mockReset();
    permissionsCreate.mockReset();
  });

  it('uploads, makes the file public, and returns the embeddable url', async () => {
    const { uploadPhoto } = await import('@/lib/google-drive');
    filesCreate.mockResolvedValue({ data: { id: 'NEWID' } });
    permissionsCreate.mockResolvedValue({});

    const file = new File([new Uint8Array([1, 2, 3])], 'pic.jpg', { type: 'image/jpeg' });
    const result = await uploadPhoto(file);

    expect(result).toEqual({
      url: 'https://drive.google.com/thumbnail?id=NEWID&sz=w1920',
      name: 'pic.jpg',
      fileId: 'NEWID',
    });
    expect(filesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ supportsAllDrives: true }),
    );
    expect(permissionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'NEWID',
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      }),
    );
  });
});

describe('deletePhotosByUrls', () => {
  beforeEach(() => filesDelete.mockReset());

  it('deletes a file for each url that has an id', async () => {
    const { deletePhotosByUrls } = await import('@/lib/google-drive');
    filesDelete.mockResolvedValue({});

    await deletePhotosByUrls([
      'https://drive.google.com/thumbnail?id=A&sz=w1920',
      'https://example.com/no-id',
      'https://drive.google.com/thumbnail?id=B&sz=w1920',
    ]);

    expect(filesDelete).toHaveBeenCalledTimes(2);
    expect(filesDelete).toHaveBeenCalledWith({ fileId: 'A', supportsAllDrives: true });
    expect(filesDelete).toHaveBeenCalledWith({ fileId: 'B', supportsAllDrives: true });
  });

  it('swallows errors instead of throwing (best-effort)', async () => {
    // Force getDrive() to fail (Drive misconfigured) — deletePhoto must log
    // and resolve so a failed cleanup never blocks a device save/delete.
    const { deletePhoto } = await import('@/lib/google-drive');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const original = env.GOOGLE_DRIVE_FOLDER_ID;
    (env as { GOOGLE_DRIVE_FOLDER_ID: string }).GOOGLE_DRIVE_FOLDER_ID = '';

    await expect(deletePhoto('A')).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();

    (env as { GOOGLE_DRIVE_FOLDER_ID: string }).GOOGLE_DRIVE_FOLDER_ID = original;
    errSpy.mockRestore();
  });
});
