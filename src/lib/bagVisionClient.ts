/**
 * Espresso Flow - Beandex Bag Vision™ Client Engine
 * Client-side camera frame capture, downscaling to 768px WebP (<40KB payload),
 * and square thumbnail generation.
 */

export interface CapturedBagFrame {
  base64: string; // Clean base64 string or data URL for AI vision payload (~35KB)
  thumbnailBase64: string; // 280x280 thumbnail for profile card display
  width: number;
  height: number;
}

/**
 * Capture and compress a frame from an active HTMLVideoElement
 */
export function captureBagFrameFromVideo(
  video: HTMLVideoElement,
  maxDimension = 768
): CapturedBagFrame | null {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;

  // Calculate scaled dimensions (keep aspect ratio, max dimension 768px)
  let targetWidth = vWidth;
  let targetHeight = vHeight;

  if (vWidth > maxDimension || vHeight > maxDimension) {
    if (vWidth > vHeight) {
      targetWidth = maxDimension;
      targetHeight = Math.round((vHeight * maxDimension) / vWidth);
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.round((vWidth * maxDimension) / vHeight);
    }
  }

  // 1. Offscreen canvas for Vision AI payload (768px WebP)
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  // WebP compression at 0.82 quality gives crystal clear text with minimal bytes (<40KB)
  const base64 = canvas.toDataURL('image/webp', 0.82);

  // 2. Offscreen canvas for 280x280 square profile thumbnail
  const thumbSize = 280;
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbSize;
  thumbCanvas.height = thumbSize;
  const thumbCtx = thumbCanvas.getContext('2d');

  let thumbnailBase64 = base64;
  if (thumbCtx) {
    thumbCtx.imageSmoothingEnabled = true;
    thumbCtx.imageSmoothingQuality = 'high';

    // Center-crop to square
    const minEdge = Math.min(vWidth, vHeight);
    const cropX = (vWidth - minEdge) / 2;
    const cropY = (vHeight - minEdge) / 2;

    thumbCtx.drawImage(
      video,
      cropX,
      cropY,
      minEdge,
      minEdge,
      0,
      0,
      thumbSize,
      thumbSize
    );
    thumbnailBase64 = thumbCanvas.toDataURL('image/webp', 0.78);
  }

  return {
    base64,
    thumbnailBase64,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Compress an uploaded file or gallery image into a 768px WebP vision payload
 */
export async function compressFileToBagFrame(
  file: File | Blob,
  maxDimension = 768
): Promise<CapturedBagFrame> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      let targetWidth = width;
      let targetHeight = height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          targetWidth = maxDimension;
          targetHeight = Math.round((height * maxDimension) / width);
        } else {
          targetHeight = maxDimension;
          targetWidth = Math.round((width * maxDimension) / height);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const base64 = canvas.toDataURL('image/webp', 0.82);

      // Thumbnail
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 280;
      thumbCanvas.height = 280;
      const thumbCtx = thumbCanvas.getContext('2d');
      let thumbnailBase64 = base64;

      if (thumbCtx) {
        const minEdge = Math.min(width, height);
        const cropX = (width - minEdge) / 2;
        const cropY = (height - minEdge) / 2;
        thumbCtx.drawImage(img, cropX, cropY, minEdge, minEdge, 0, 0, 280, 280);
        thumbnailBase64 = thumbCanvas.toDataURL('image/webp', 0.78);
      }

      resolve({
        base64,
        thumbnailBase64,
        width: targetWidth,
        height: targetHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Kunne ikke indlæse billedfilen.'));
    };

    img.src = url;
  });
}
