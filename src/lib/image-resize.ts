/**
 * Client-side image compression before upload.
 * Resizes large photos (e.g. 20MB phone camera shots) to max 1920px
 * and compresses to JPEG quality 0.8 — typically yields 100-300KB.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;
const MAX_FILE_SIZE = 1 * 1024 * 1024; // Compress files over 1MB

export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;
      const needsCompress = file.size > MAX_FILE_SIZE;

      // Skip if both dimensions are fine and file is small enough
      if (!needsResize && !needsCompress) {
        resolve(file);
        return;
      }

      if (needsResize) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          // Release canvas memory
          canvas.width = 0;
          canvas.height = 0;

          if (!blob) {
            resolve(file);
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
