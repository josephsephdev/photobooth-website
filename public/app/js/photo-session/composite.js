import { state } from './state.js';
import { calculateCoverCrop } from './utils.js';

/**
 * Composite photos onto the selected template background
 * @param {Object} options - Export options
 * @param {string} options.format - Export format: 'png' (lossless) or 'jpeg' (lossy)
 * @param {number} options.jpegQuality - JPEG quality 0-1 (default 0.95 for high quality)
 * @returns {Object} { dataUrl, dpi } - Base64 data URL and DPI metadata
 */
export async function compositePhotos(options = {}) {
  const {
    format = state.exportFormat || 'png',  // Default to PNG (lossless)
    jpegQuality = state.jpegQuality !== undefined ? state.jpegQuality : 0.95  // Default 95% quality
  } = options;

  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = state.selectedTemplate.width;
  compositeCanvas.height = state.selectedTemplate.height;
  const compositeCtx = compositeCanvas.getContext('2d');

  // background
  const bg = new Image();
  await new Promise((resolve) => {
    bg.onload = resolve;
    bg.src = state.selectedTemplate.bg;
  });
  // Scale background to match template dimensions exactly
  compositeCtx.drawImage(bg, 0, 0, state.selectedTemplate.width, state.selectedTemplate.height);

  // Create a map of primary box IDs to captured photos
  const primaryBoxes = state.selectedTemplate.pb.filter(box => !box.li);
  const primaryPhotoMap = {};
  primaryBoxes.forEach((box, index) => {
    primaryPhotoMap[box.id] = state.capturedPhotos[index];
  });

  for (const box of state.selectedTemplate.pb) {
    const photoDataUrl = box.li
      ? primaryPhotoMap[box.li]
      : primaryPhotoMap[box.id];

    if (!photoDataUrl) continue; // Skip if no photo available

    const photo = new Image();

    await new Promise((resolve) => {
      photo.onload = () => {
        // Calculate crop dimensions using cover mode
        const crop = calculateCoverCrop(photo.width, photo.height, box.width, box.height);
        
        // Draw photo with crop-to-fill behavior
        compositeCtx.drawImage(
          photo,
          crop.src.x, crop.src.y, crop.src.width, crop.src.height,  // source crop area
          box.x, box.y, box.width, box.height                         // destination box
        );
        
        resolve();
      };
      photo.onerror = resolve; // Continue even if image fails
      photo.src = photoDataUrl;
    });
  }

  // Export with selected format and quality settings
  let dataUrl;
  if (format === 'png') {
    // PNG: Lossless compression - preserves full quality
    dataUrl = compositeCanvas.toDataURL('image/png');
  } else {
    // JPEG: Use high quality (default 0.95 = 95%)
    // Clamp quality between 0 and 1
    const quality = Math.min(1, Math.max(0, jpegQuality));
    dataUrl = compositeCanvas.toDataURL('image/jpeg', quality);
  }

  // ⭐ Return both dataUrl and DPI for server-side processing
  return {
    dataUrl,
    dpi: state.backgroundImageDPI || 96,  // Include DPI metadata
    format
  };
}
