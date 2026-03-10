import { els } from './ui.js';
import { state } from './state.js';
import { calculateCoverCrop } from './utils.js';

/**
 * Compute the actual rendered content rectangle inside an element that
 * uses object-fit: contain.  If the element has no object-fit (e.g. a
 * plain <video> with max-width/max-height), the element rect IS the
 * content rect so this is a no-op.
 *
 * @param {DOMRect} elemRect  – getBoundingClientRect() of the element
 * @param {number}  contentW  – intrinsic width  (e.g. canvas.width / videoWidth)
 * @param {number}  contentH  – intrinsic height (e.g. canvas.height / videoHeight)
 * @returns {{ left, top, width, height }}
 */
function getContentRect(elemRect, contentW, contentH) {
  const elemAspect    = elemRect.width / elemRect.height;
  const contentAspect = contentW / contentH;

  let renderW, renderH, offsetX, offsetY;

  if (elemAspect > contentAspect) {
    // Element is wider than content → content fits by height, pillarboxed
    renderH = elemRect.height;
    renderW = elemRect.height * contentAspect;
    offsetX = (elemRect.width - renderW) / 2;
    offsetY = 0;
  } else {
    // Element is taller than content → content fits by width, letterboxed
    renderW = elemRect.width;
    renderH = elemRect.width / contentAspect;
    offsetX = 0;
    offsetY = (elemRect.height - renderH) / 2;
  }

  return {
    left:   elemRect.left + offsetX,
    top:    elemRect.top  + offsetY,
    width:  renderW,
    height: renderH,
  };
}

/**
 * Show the crop guide overlay based on video dimensions and current photo box
 * For DSLR mode, uses the preview canvas element; for webcam, uses the video element
 */
export function showCropGuide(videoWidth, videoHeight) {
  const overlay = els.cropGuideOverlay;
  if (!overlay) {
    console.warn('Crop guide overlay element not found');
    return;
  }

  const primaryBoxes = state.selectedTemplate.photoBoxes.filter(box => !box.linkedToId);
  const currentBoxIndex = state.currentPhotoIndex;
  
  if (currentBoxIndex >= primaryBoxes.length) {
    hideCropGuide();
    return;
  }

  const currentBox = primaryBoxes[currentBoxIndex];
  const crop = calculateCoverCrop(videoWidth, videoHeight, currentBox.width, currentBox.height);
  
  // Determine which actual element to position the crop guide relative to
  let displayElement = els.video;
  let displayWidth = videoWidth;
  let displayHeight = videoHeight;
  
  if (state.cameraType === 'dslr') {
    // For DSLR, use the actual preview canvas for positioning
    const previewCanvas = document.getElementById('dslrPreviewCanvas');
    if (previewCanvas && previewCanvas.style.display !== 'none') {
      displayElement = previewCanvas;
    }
  }
  
  // Get element dimensions on screen
  const elementRect = displayElement.getBoundingClientRect();
  
  // Validate display element is actually visible
  if (elementRect.width === 0 || elementRect.height === 0) {
    console.warn('⚠️  Display element has invalid dimensions (hidden or not rendered)');
    hideCropGuide();
    return;
  }
  
  // Calculate the actual content rect, accounting for object-fit: contain.
  // When object-fit: contain is used (DSLR canvas), the rendered content is
  // letterboxed inside the element — getBoundingClientRect() returns the full
  // element size, not the fitted content area.  We must compute the real
  // content rect so our scale factors are correct.
  const contentRect = getContentRect(elementRect, displayWidth, displayHeight);
  
  const scaleX = contentRect.width / displayWidth || 1;
  const scaleY = contentRect.height / displayHeight || 1;
  
  // Prevent NaN from invalid dimensions
  if (!isFinite(scaleX) || !isFinite(scaleY) || scaleX === 0 || scaleY === 0) {
    console.warn('Invalid crop guide scale factors', { scaleX, scaleY, contentRect, displayWidth, displayHeight });
    hideCropGuide();
    return;
  }
  
  const cropDisplayX = crop.src.x * scaleX;
  const cropDisplayY = crop.src.y * scaleY;
  const cropDisplayWidth = crop.src.width * scaleX;
  const cropDisplayHeight = crop.src.height * scaleY;
  
  // Get container (camera-container) position for proper offset calculation
  const containerRect = overlay.parentElement.getBoundingClientRect();
  
  // Validate container is visible
  if (containerRect.width === 0 || containerRect.height === 0) {
    console.warn('⚠️  Container has invalid dimensions');
    hideCropGuide();
    return;
  }
  
  // Calculate keep-area position relative to camera-container
  // Use contentRect (not elementRect) so the guide aligns with the actual
  // rendered content, not the full element box.
  const relativeX = Math.max(0, contentRect.left - containerRect.left + cropDisplayX);
  const relativeY = Math.max(0, contentRect.top - containerRect.top + cropDisplayY);
  
  // Validate coordinates are reasonable
  if (relativeX < -1000 || relativeY < -1000 || relativeX > 5000 || relativeY > 5000) {
    console.warn(`⚠️  Crop guide coordinates out of range: ${relativeX}, ${relativeY}`);
    hideCropGuide();
    return;
  }
  
  // Update inner guide area (the part that will be kept)
  const keepArea = overlay.querySelector('.crop-guide-keep-area');
  if (keepArea) {
    keepArea.style.top = relativeY + 'px';
    keepArea.style.left = relativeX + 'px';
    keepArea.style.width = cropDisplayWidth + 'px';
    keepArea.style.height = cropDisplayHeight + 'px';
  }
  
  // Store crop metadata in state for later scaling to high-res image
  state.previewCropMetadata = {
    cropWidth: currentBox.width,
    cropHeight: currentBox.height,
    previewWidth: displayWidth,
    previewHeight: displayHeight
  };
  
  // Show the overlay
  overlay.style.display = 'block';
}

export function hideCropGuide() {
  const overlay = els.cropGuideOverlay;
  if (overlay) {
    overlay.style.display = 'none';
  }
}
