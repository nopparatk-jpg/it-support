# Google Drive Photo Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Vercel Blob with Google Drive for device-photo upload, serving photos as public Drive links and deleting Drive files when photos are removed.

**Architecture:** A new `src/lib/google-drive.ts` module wraps the `googleapis` Drive client (service-account auth) and exposes upload/delete/url helpers. The `/api/upload` route uses it for POST (upload) and DELETE (immediate removal from the new-device form). The device `[id]` route deletes Drive files on update (diff of old vs new photos) and on device delete. Photo data shape (`{ name, url }`) is unchanged, so display pages and the DB schema stay as-is.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Mongoose, `googleapis`, Vitest.

## Global Constraints

- Photo data model stays `photos: { name: string; url: string }[]` — no schema migration.
- Generated photo URL format is exactly `https://drive.google.com/thumbnail?id=<fileId>&sz=w1920`. `extractFileId` is the only place that parses it.
- All Drive API calls that touch the Shared Drive pass `supportsAllDrives: true`.
- Deletion is best-effort: a failed/`not found` delete is logged, never thrown — it must never block a device save or delete.
- Config is read through `@/lib/env` (tests mock `@/lib/env`, matching the existing `tests/unit/auth.test.ts` pattern).
- Test runner is Vitest (`environment: 'node'`, `@` → `src` alias). Test files live in `tests/**/*.test.ts`.

---

### Task 1: Dependencies and environment config

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `src/lib/env.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64: string`, `env.GOOGLE_DRIVE_FOLDER_ID: string` (getters, default `''`). `env.BLOB_READ_WRITE_TOKEN` is removed.

- [ ] **Step 1: Install project dependencies and swap the storage package**

`node_modules` is not present in this checkout. Install, add `googleapis`, remove `@vercel/blob`:

```bash
npm install
npm install googleapis
npm uninstall @vercel/blob
```

- [ ] **Step 2: Update `src/lib/env.ts`**

Replace the `BLOB_READ_WRITE_TOKEN` getter with the two Google getters. Full file:

```ts
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const env = {
  MONGODB_URI: required('MONGODB_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  get RESEND_API_KEY() { return process.env.RESEND_API_KEY ?? ''; },
  get GOOGLE_SERVICE_ACCOUNT_KEY_BASE64() { return process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 ?? ''; },
  get GOOGLE_DRIVE_FOLDER_ID() { return process.env.GOOGLE_DRIVE_FOLDER_ID ?? ''; },
  get APP_URL() { return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'; },
};
```

- [ ] **Step 3: Verify nothing else references the removed token**

Run: `grep -rn "BLOB_READ_WRITE_TOKEN\|@vercel/blob" src/`
Expected: no matches (Task 4 rewrites the upload route; if it still matches here that is fine because Task 4 runs after — but confirm `src/lib/env.ts` no longer contains it).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/env.ts
git commit -m "chore: add googleapis, drop @vercel/blob, add Drive env vars"
```

---

### Task 2: Drive URL helpers (`buildPhotoUrl`, `extractFileId`)

**Files:**
- Create: `src/lib/google-drive.ts`
- Test: `tests/unit/google-drive.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `buildPhotoUrl(fileId: string): string`
  - `extractFileId(url: string): string | null`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/google-drive.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildPhotoUrl, extractFileId } from '@/lib/google-drive';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/google-drive.test.ts`
Expected: FAIL — cannot resolve `@/lib/google-drive` / exports not defined.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/google-drive.ts`:

```ts
export function buildPhotoUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
}

export function extractFileId(url: string): string | null {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/google-drive.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/google-drive.ts tests/unit/google-drive.test.ts
git commit -m "feat: add Drive photo url helpers"
```

---

### Task 3: Drive operations (`uploadPhoto`, `deletePhoto`, `deletePhotosByUrls`)

**Files:**
- Modify: `src/lib/google-drive.ts`
- Test: `tests/unit/google-drive.test.ts`

**Interfaces:**
- Consumes: `buildPhotoUrl`, `extractFileId` (Task 2); `env` from `@/lib/env`; `google` from `googleapis`.
- Produces:
  - `uploadPhoto(file: File): Promise<{ url: string; name: string; fileId: string }>`
  - `deletePhoto(fileId: string): Promise<void>` (best-effort, never throws)
  - `deletePhotosByUrls(urls: string[]): Promise<void>` (extracts ids, calls `deletePhoto` for each)

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/google-drive.test.ts`. Add these imports/mocks at the top of the file (above the existing `describe`s), then the new `describe` blocks:

```ts
import { vi } from 'vitest';

const filesCreate = vi.fn();
const filesDelete = vi.fn();
const permissionsCreate = vi.fn();

vi.mock('@/lib/env', () => ({
  env: {
    GOOGLE_SERVICE_ACCOUNT_KEY_BASE64: Buffer.from(
      JSON.stringify({ client_email: 'svc@test.iam.gserviceaccount.com', private_key: 'KEY' }),
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
```

```ts
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

  it('swallows delete errors (best-effort)', async () => {
    const { deletePhotosByUrls } = await import('@/lib/google-drive');
    filesDelete.mockRejectedValue(new Error('not found'));

    await expect(
      deletePhotosByUrls(['https://drive.google.com/thumbnail?id=A&sz=w1920']),
    ).resolves.toBeUndefined();
  });
});
```

Also ensure `beforeEach` is imported from vitest at the top: `import { describe, it, expect, vi, beforeEach } from 'vitest';` (replace the existing `vitest` import line).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/google-drive.test.ts`
Expected: FAIL — `uploadPhoto` / `deletePhotosByUrls` not exported.

- [ ] **Step 3: Write the implementation**

Replace the contents of `src/lib/google-drive.ts` with (keeps Task 2 helpers):

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/google-drive.test.ts`
Expected: PASS (all `google-drive` tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/google-drive.ts tests/unit/google-drive.test.ts
git commit -m "feat: add Drive upload and delete operations"
```

---

### Task 4: Rewrite the upload route (POST + DELETE)

**Files:**
- Modify (rewrite): `src/app/api/upload/route.ts`

**Interfaces:**
- Consumes: `uploadPhoto`, `deletePhoto`, `extractFileId` (Task 3); `requireAuth`, `connectDB`, `errorResponse`, `ApiError`.
- Produces: `POST` returns `{ url, name, size, fileId }`; `DELETE` accepts JSON `{ url }` and returns `{ success: true }`.

This route can't be meaningfully unit-tested in this repo (it needs auth + DB). Verify via typecheck/lint and the manual flow in Task 7.

- [ ] **Step 1: Rewrite `src/app/api/upload/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { uploadPhoto, deletePhoto, extractFileId } from '@/lib/google-drive';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError(400, 'File is required');
    }
    if (!file.type.startsWith('image/')) {
      throw new ApiError(400, 'Only image files are allowed');
    }
    if (file.size > MAX_SIZE) {
      throw new ApiError(400, 'File is too large (max 10MB)');
    }

    const result = await uploadPhoto(file);

    return NextResponse.json({
      url: result.url,
      name: result.name,
      size: file.size,
      fileId: result.fileId,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth();

    const { url } = await req.json();
    if (!url) {
      throw new ApiError(400, 'url is required');
    }

    const fileId = extractFileId(url);
    if (fileId) {
      await deletePhoto(fileId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors referencing `src/app/api/upload/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload/route.ts
git commit -m "feat: upload route uses Google Drive (POST upload, DELETE remove)"
```

---

### Task 5: Delete Drive files on device update and device delete

**Files:**
- Modify: `src/app/api/devices/[id]/route.ts`

**Interfaces:**
- Consumes: `deletePhotosByUrls` (Task 3).
- Produces: no new exports; behavioral change to existing `PUT` and `DELETE` handlers.

- [ ] **Step 1: Add the import**

In `src/app/api/devices/[id]/route.ts`, add to the imports:

```ts
import { deletePhotosByUrls } from '@/lib/google-drive';
```

- [ ] **Step 2: Diff-delete in `PUT` before applying the update**

In the `PUT` handler, after building `update` and before `const device = await Device.findByIdAndUpdate(...)`, insert:

```ts
    if ('photos' in body) {
      const existing = await Device.findById(id);
      if (existing) {
        const incomingUrls = new Set(
          ((body.photos ?? []) as { url: string }[]).map((p) => p.url),
        );
        const removedUrls = existing.photos
          .filter((p) => !incomingUrls.has(p.url))
          .map((p) => p.url);
        if (removedUrls.length) {
          await deletePhotosByUrls(removedUrls);
        }
      }
    }
```

- [ ] **Step 3: Cleanup all photos in `DELETE` after the device is removed**

In the `DELETE` handler, after `const device = await Device.findByIdAndDelete(id);` and its `if (!device)` guard, before `logActivity`, insert:

```ts
    if (device.photos?.length) {
      await deletePhotosByUrls(device.photos.map((p) => p.url));
    }
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors referencing `src/app/api/devices/[id]/route.ts`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/devices/[id]/route.ts"
git commit -m "feat: delete Drive photos on device update and delete"
```

---

### Task 6: Surface upload errors + immediate delete on the new-device form

**Files:**
- Modify: `src/app/(app)/devices/new/page.tsx`
- Modify: `src/app/(app)/devices/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `DELETE /api/upload` (Task 4); existing `error`/`setError` state and `<ErrorAlert>` already present in both pages.
- Produces: no exports; UI behavior change.

- [ ] **Step 1: Confirm both pages render the error state**

Run: `grep -n "ErrorAlert" "src/app/(app)/devices/new/page.tsx" "src/app/(app)/devices/[id]/edit/page.tsx"`
Expected: each file both imports and renders `<ErrorAlert ... />` bound to `error`. If a file imports but does not render it, add `{error && <ErrorAlert message={error} />}` near the top of the form (match how other pages in this repo render `ErrorAlert`).

- [ ] **Step 2: Replace `handlePhotoUpload` in `src/app/(app)/devices/new/page.tsx`**

```tsx
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const results: { name: string; url: string }[] = [];
      for (const rawFile of Array.from(files)) {
        const file = await compressImage(rawFile);
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Upload failed');
        }
        const data = await res.json();
        results.push({ name: data.name, url: data.url });
      }
      if (results.length) setPhotos((prev) => [...prev, ...results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
```

- [ ] **Step 3: Replace `removePhoto` in `src/app/(app)/devices/new/page.tsx`**

```tsx
  const removePhoto = (index: number) => {
    const photo = photos[index];
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (photo?.url) {
      fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: photo.url }),
      }).catch(() => {});
    }
  };
```

- [ ] **Step 4: Replace `handlePhotoUpload` in `src/app/(app)/devices/[id]/edit/page.tsx`**

Use the exact same body as Step 2. Leave the edit page's `removePhoto` unchanged — deletion there happens server-side on save (Task 5).

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors referencing the two device pages.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/devices/new/page.tsx" "src/app/(app)/devices/[id]/edit/page.tsx"
git commit -m "feat: surface photo upload errors; delete new-device photos immediately"
```

---

### Task 7: Full verification

**Files:** none (verification only).

Requires the manual GCP setup from the spec (service account, Drive API enabled, Shared Drive `0ALkmpIuoLp30Uk9PVA` shared with the service-account email as Content Manager) and a local `.env` with `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`, `GOOGLE_DRIVE_FOLDER_ID`.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: PASS, including the new `tests/unit/google-drive.test.ts`.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: Manual flow (dev server)**

Run: `npm run dev`, then:
- Create a device, upload a photo → it appears in the Shared Drive and renders on the device detail page.
- Trigger a failure (e.g. temporarily blank `GOOGLE_DRIVE_FOLDER_ID`) → the form now shows an error message instead of doing nothing.
- On the new-device form, remove a just-uploaded photo → the file disappears from the Shared Drive.
- On the edit page, remove a saved photo and click Save → the file disappears from the Shared Drive.
- Delete a device that has photos → all its photos disappear from the Shared Drive.

- [ ] **Step 4: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "chore: verification fixes for Drive photo storage"
```
