/**
 * Image preprocessing pipeline for OCR.
 * Provides grayscale conversion, contrast stretching, and Otsu thresholding.
 */

/**
 * Compute Otsu threshold for a grayscale image.
 * @param data - Uint8ClampedArray of pixel data (R, G, B, A per pixel, but only R used as grayscale)
 * @param width - image width
 * @param height - image height
 * @returns optimal threshold value (0-255)
 */
export function computeOtsuThreshold(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  const size = width * height;
  // Build histogram (256 bins)
  const histogram = new Uint32Array(256);
  for (let i = 0; i < size; i++) {
    // Since image is grayscale, R == G == B, use R
    const idx = i * 4;
    const luminance = data[idx];
    histogram[luminance]++;
  }

  const totalPixels = size;
  let sumTotal = 0;
  for (let t = 0; t < 256; t++) {
    sumTotal += t * histogram[t];
  }

  let sumBack = 0;
  let weightBack = 0;
  let weightFore = 0;
  let maxVariance = 0;
  let optimalThreshold = 0;

  for (let t = 0; t < 256; t++) {
    weightBack += histogram[t];
    if (weightBack === 0) continue;

    weightFore = totalPixels - weightBack;
    if (weightFore === 0) break;

    sumBack += t * histogram[t];
    const meanBack = sumBack / weightBack;
    const meanFore = (sumTotal - sumBack) / weightFore;

    // Between-class variance
    const variance = weightBack * weightFore * (meanBack - meanFore) * (meanBack - meanFore);

    if (variance > maxVariance) {
      maxVariance = variance;
      optimalThreshold = t;
    }
  }

  return optimalThreshold;
}

/**
 * Preprocess a canvas image for OCR.
 * Pipeline: grayscale → contrast histogram stretch → Otsu thresholding → PNG output.
 */
export function preprocessImage(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = width * height;

  // ── Step 1: Grayscale conversion ──
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    data[idx] = gray;
    data[idx + 1] = gray;
    data[idx + 2] = gray;
    // alpha unchanged
  }

  // ── Step 2: Contrast histogram stretch ──
  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const lum = data[idx];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = maxLum - minLum;
  if (range > 0) {
    const scale = 255 / range;
    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      const stretched = Math.round((data[idx] - minLum) * scale);
      data[idx] = stretched;
      data[idx + 1] = stretched;
      data[idx + 2] = stretched;
    }
  }

  // ── Step 3: Otsu thresholding ──
  const threshold = computeOtsuThreshold(data, width, height);
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const binary = data[idx] >= threshold ? 255 : 0;
    data[idx] = binary;
    data[idx + 1] = binary;
    data[idx + 2] = binary;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Aggressive preprocessing for low-contrast or dark cards.
 * Uses 1.8x contrast multiplier and lower threshold offset (-20).
 */
export function preprocessImageAggressive(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = width * height;

  // ── Step 1: Grayscale conversion ──
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    data[idx] = gray;
    data[idx + 1] = gray;
    data[idx + 2] = gray;
  }

  // ── Step 2: Contrast stretch with 1.8x multiplier ──
  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const lum = data[idx];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = maxLum - minLum;
  if (range > 0) {
    // 1.8x contrast multiplier
    const scale = (255 / range) * 1.8;
    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      let stretched = Math.round((data[idx] - minLum) * scale);
      if (stretched > 255) stretched = 255;
      data[idx] = stretched;
      data[idx + 1] = stretched;
      data[idx + 2] = stretched;
    }
  }

  // ── Step 3: Otsu thresholding with -20 offset ──
  const threshold = computeOtsuThreshold(data, width, height);
  const adjustedThreshold = Math.max(0, threshold - 20);
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const binary = data[idx] >= adjustedThreshold ? 255 : 0;
    data[idx] = binary;
    data[idx + 1] = binary;
    data[idx + 2] = binary;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
