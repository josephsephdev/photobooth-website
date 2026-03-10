export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

/**
 * Apply crop to a photo based on cover-crop dimensions
 * @param {string} photoDataUrl - Base64 photo data URL
 * @param {number} cropWidth - Target crop width
 * @param {number} cropHeight - Target crop height
 * @returns {Promise<string>} Cropped photo as base64 data URL
 */
export async function applyCropToPhoto(photoDataUrl, cropWidth, cropHeight) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Calculate crop dimensions
      const crop = calculateCoverCrop(img.width, img.height, cropWidth, cropHeight);
      
      // Create canvas for cropped image
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = crop.src.width;
      croppedCanvas.height = crop.src.height;
      const ctx = croppedCanvas.getContext('2d');
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        crop.src.x, crop.src.y, crop.src.width, crop.src.height,
        0, 0, crop.src.width, crop.src.height
      );
      
      // Return as JPEG for consistency
      const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);
      resolve(croppedDataUrl);
    };
    img.onerror = () => resolve(photoDataUrl); // Fallback to original if crop fails
    img.src = photoDataUrl;
  });
}

/**
 * Calculate crop dimensions for object-fit: cover mode
 * Returns source crop and destination placement info
 */
export function calculateCoverCrop(imageWidth, imageHeight, boxWidth, boxHeight) {
  const imageAspect = imageWidth / imageHeight;
  const boxAspect = boxWidth / boxHeight;

  let srcX = 0, srcY = 0, srcWidth = imageWidth, srcHeight = imageHeight;
  let destX = 0, destY = 0, destWidth = boxWidth, destHeight = boxHeight;

  if (imageAspect > boxAspect) {
    // Image is wider: crop left/right sides
    srcHeight = imageHeight;
    srcWidth = imageHeight * boxAspect;
    srcX = (imageWidth - srcWidth) / 2;
  } else {
    // Image is taller: crop top/bottom
    srcWidth = imageWidth;
    srcHeight = imageWidth / boxAspect;
    srcY = (imageHeight - srcHeight) / 2;
  }

  return {
    src: { x: Math.round(srcX), y: Math.round(srcY), width: Math.round(srcWidth), height: Math.round(srcHeight) },
    dest: { x: Math.round(destX), y: Math.round(destY), width: Math.round(destWidth), height: Math.round(destHeight) }
  };
}
