/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('compressImage', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function getCompressImage() {
    const mod = await import('@/lib/image-resize');
    return mod.compressImage;
  }

  it('skips non-image files', async () => {
    const compressImage = await getCompressImage();
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it('skips small images with small dimensions', async () => {
    const compressImage = await getCompressImage();
    // Under 1MB, under 1920px → should skip
    const smallData = new Uint8Array(500 * 1024); // 500KB
    const file = new File([smallData], 'small.jpg', { type: 'image/jpeg' });

    // Mock Image to have small dimensions
    const OrigImage = window.Image;
    window.Image = class extends OrigImage {
      constructor() {
        super();
        Object.defineProperty(this, 'width', { value: 800, writable: true });
        Object.defineProperty(this, 'height', { value: 600, writable: true });
        setTimeout(() => {
          if (this.onload) this.onload(new Event('load'));
        }, 0);
      }
      set src(_: string) { /* trigger handled in constructor */ }
      get src() { return ''; }
    } as unknown as typeof Image;

    const result = await compressImage(file);
    // Should return original since it's small
    expect(result).toBe(file);

    window.Image = OrigImage;
  });

  it('falls back to original when canvas context unavailable', async () => {
    // jsdom does not support canvas getContext, so compressImage
    // should gracefully fall back to the original file
    const compressImage = await getCompressImage();
    const bigData = new Uint8Array(2 * 1024 * 1024); // 2MB
    const file = new File([bigData], 'photo.png', { type: 'image/png' });

    const OrigImage = window.Image;
    window.Image = class extends OrigImage {
      constructor() {
        super();
        Object.defineProperty(this, 'width', { value: 800, writable: true });
        Object.defineProperty(this, 'height', { value: 600, writable: true });
        setTimeout(() => {
          if (this.onload) this.onload(new Event('load'));
        }, 0);
      }
      set src(_: string) { /* trigger handled in constructor */ }
      get src() { return ''; }
    } as unknown as typeof Image;

    const result = await compressImage(file);
    // Without real canvas, falls back to original
    expect(result).toBe(file);

    window.Image = OrigImage;
  });
});
