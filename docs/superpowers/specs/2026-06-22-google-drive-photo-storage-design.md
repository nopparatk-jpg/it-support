# Google Drive Photo Storage — Design

**Date:** 2026-06-22
**Status:** Approved (pending implementation)

## Problem

Device photo upload fails. Root cause: the upload route (`src/app/api/upload/route.ts`)
uses Vercel Blob's `put()`, which requires `BLOB_READ_WRITE_TOKEN`. No `.env` exists in
the project, so the token is unset and `put()` throws a 500. The client swallows the error
silently (`catch {}`), so the UI gives no feedback — it just appears to do nothing.

## Decision

Migrate photo storage from Vercel Blob to **Google Drive**, using:

- **Service account** authentication (server-to-server, no user interaction).
- **Public links** — each uploaded file is shared `anyone / reader` and embedded directly
  via a Drive URL.
- Target folder is a **Shared Drive**: `0ALkmpIuoLp30Uk9PVA`.

### Accepted trade-offs

- Public Drive links can be throttled/unreliable for hotlinking.
- Every uploaded device photo becomes publicly accessible to anyone with the URL.
- If this becomes a problem, revisit with an API-proxy approach (store file ID, stream
  through `/api/photos/[id]` using the service account; keeps files private).

## Data model

**No change.** Devices keep `photos: { name: string; url: string }[]`. No DB migration.
Display pages (`devices/[id]/page.tsx`, `devices/[id]/edit/page.tsx`) are unchanged —
they keep rendering `<img src={photo.url}>`.

## Components

### 1. Dependencies & config

- Add `googleapis`.
- Remove `@vercel/blob` usage (drop the dependency).
- `src/lib/env.ts`: remove `BLOB_READ_WRITE_TOKEN`, add:
  - `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` — service-account JSON key, base64-encoded.
    Base64 avoids private-key newline/escaping problems in env files.
  - `GOOGLE_DRIVE_FOLDER_ID` — `0ALkmpIuoLp30Uk9PVA`.

### 2. `src/lib/google-drive.ts` (new)

Focused module. Responsibilities:

- Build an authenticated Drive client from the base64-decoded service-account key.
  Scope: `https://www.googleapis.com/auth/drive`.
- Export `uploadPhoto(file: File): Promise<{ url: string; name: string; fileId: string }>`:
  1. Read the file into a Buffer (images are already compressed client-side to ~100–300KB).
  2. `drive.files.create` into `GOOGLE_DRIVE_FOLDER_ID` with `supportsAllDrives: true`,
     `fields: 'id'`.
  3. `drive.permissions.create` with `{ type: 'anyone', role: 'reader' }`,
     `supportsAllDrives: true`.
  4. Return embeddable URL: `https://drive.google.com/thumbnail?id=<id>&sz=w1920`
     (this form renders in `<img>`; `uc?export=view` does not reliably).
- Export `extractFileId(url: string): string | null` — pull the `id` query param out of a
  generated Drive URL. The single source of truth for parsing our URL format.
- Export `deletePhoto(fileId: string): Promise<void>` — `drive.files.delete` with
  `supportsAllDrives: true`. Best-effort: log and swallow "not found" so a missing file
  never blocks a device save/delete.

### 3. `src/app/api/upload/route.ts` (rewrite)

- `POST`: keep `requireAuth()` and `formData` handling. Add validation: reject non-image
  files and files over 10MB (HTTP 400). Call `uploadPhoto(file)`; return
  `{ url, name, size, fileId }`. `fileId` is extra metadata; the client only consumes
  `name` + `url`.
- `DELETE`: `requireAuth()`, read `url` (or `fileId`) from the request, resolve the file ID
  via `extractFileId`, and call `deletePhoto`. Used by the new-device form only (see §6),
  where a removed photo has no DB record to diff against.

### 4. Photo cleanup on device update & delete (server-side)

`src/app/api/devices/[id]/route.ts`:

- `PUT`: when `photos` is part of the update, load the device's **current** photos first,
  diff against the incoming array (by file ID via `extractFileId`), and `deletePhoto` each
  URL that is present before but absent after. Then apply the update. Failures to delete
  are logged, not fatal — the update still succeeds.
- `DELETE`: before/after `findByIdAndDelete`, `deletePhoto` every photo on the device so a
  deleted device leaves no orphaned files in Drive.

### 5. Client error surfacing (in-scope bug fix)

In `src/app/(app)/devices/new/page.tsx` and `src/app/(app)/devices/[id]/edit/page.tsx`,
replace the silent `catch {}` and the silent `res.ok === false` path so failed uploads
show the user an error message instead of doing nothing.

### 6. New-device form immediate delete

`src/app/(app)/devices/new/page.tsx`: `removePhoto` calls `DELETE /api/upload` with the
photo URL so the just-uploaded file is removed from Drive immediately — there is no device
record yet, so the server-side diff in §4 can never reach it. The **edit** page's
`removePhoto` only mutates local state; its deletion is handled by the §4 `PUT` diff on save.

## Error handling

- Missing/invalid env vars → fail fast with a clear server error (existing `env.ts` pattern).
- Drive API errors → surface through existing `errorResponse()`; client shows a message.
- Per-file upload failure in a multi-file batch → that file reports an error; others continue.
- Deletion is best-effort: a failed/`not found` `deletePhoto` is logged and never blocks a
  device save or delete (avoids the situation where a stray Drive file makes the device
  un-editable).

## Manual setup required (documented for the user)

1. In Google Cloud Console, create a project (or reuse one) and **enable the Google Drive API**.
2. Create a **service account**; create a **JSON key** and download it.
3. Base64-encode the JSON key and set `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`.
4. Set `GOOGLE_DRIVE_FOLDER_ID=0ALkmpIuoLp30Uk9PVA`.
5. Open the Shared Drive in Drive, share it with the service account's email
   (`...@<project>.iam.gserviceaccount.com`) as **Content Manager**.
6. Also set the other required env vars (`MONGODB_URI`, `JWT_SECRET`) in `.env` if not
   already present — the app needs them to boot.

## Testing

- Unit: `uploadPhoto` builds the client and returns the expected URL shape (mock googleapis).
- Manual: upload a photo from the new-device form; confirm it appears in the Shared Drive,
  renders on the device detail page, and that a failed upload now shows an error.
- Manual: remove a photo on the new-device form → file disappears from Drive immediately.
  Remove a saved photo on the edit page + save → file disappears from Drive on save.
  Delete a device → all its photos disappear from Drive.

## Out of scope

- API-proxy / private-image serving (future option if public links prove unreliable).
