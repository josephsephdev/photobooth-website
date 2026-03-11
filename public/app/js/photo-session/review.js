import { els } from './ui.js';
import { state } from './state.js';
import { sleep } from './utils.js';
import { captureNextPhoto } from './capture.js';

/**
 * Show the photo review overlay
 * @param {string} photoData - Data URL of the captured photo
 * @param {number} photoIndex - Current photo index (0-based)
 * @param {number} totalPhotos - Total number of photos needed
 */
export function showPhotoReview(photoData, photoIndex, totalPhotos) {
  state.isInReview = true;
  state.reviewPhotoData = photoData;
  state.reviewPhotoIndex = photoIndex;

  const overlay = els.photoReviewOverlay;
  const img = document.getElementById('reviewPhotoImg');
  const countText = document.getElementById('reviewPhotoCount');
  const timerText = document.getElementById('reviewTimerText');
  const timerFill = document.getElementById('reviewTimerFill');

  // Set image and count text
  img.src = photoData;
  countText.textContent = `Photo ${photoIndex + 1} of ${totalPhotos}`;

  // Show overlay
  overlay.style.display = 'flex';

  // Reset and start the auto-continue timer
  startAutoReviewTimer(timerText, timerFill);
}

/**
 * Hide the photo review overlay
 */
export function hidePhotoReview() {
  state.isInReview = false;
  state.reviewPhotoData = null;
  cancelAutoReviewTimer();
  
  const overlay = els.photoReviewOverlay;
  overlay.style.display = 'none';
}

/**
 * Start the 3-second auto-continue timer
 */
export function startAutoReviewTimer(timerText, timerFill) {
  // Reset animation
  timerFill.style.animation = 'none';
  void timerFill.offsetWidth; // Trigger reflow to restart animation
  timerFill.style.animation = 'photoReviewTimerShrink 3s linear forwards';

  let timeRemaining = 3;
  state.reviewAutoCountdown = 3;
  updateTimerText(timerText, timeRemaining);

  state.reviewAutoTimeoutId = setInterval(() => {
    timeRemaining--;
    state.reviewAutoCountdown = timeRemaining;
    updateTimerText(timerText, timeRemaining);

    if (timeRemaining <= 0) {
      cancelAutoReviewTimer();
      if (state.isInReview) {
        // Auto-continue: treat as "Use Photo"
        handleUsePhoto();
      }
    }
  }, 1000);
}

/**
 * Cancel the auto-continue timer
 */
export function cancelAutoReviewTimer() {
  if (state.reviewAutoTimeoutId !== null) {
    clearInterval(state.reviewAutoTimeoutId);
    state.reviewAutoTimeoutId = null;
  }
}

/**
 * Update the timer display text
 */
function updateTimerText(element, seconds) {
  if (seconds <= 0) {
    element.textContent = 'Continuing...';
  } else {
    element.textContent = `Continuing in ${seconds}...`;
  }
}

/**
 * Handle "Use Photo" button click
 * Save the reviewed photo and continue to next shot
 */
export function handleUsePhoto() {
  cancelAutoReviewTimer();

  // Save photo data BEFORE hidePhotoReview() clears it
  const photoData = state.reviewPhotoData;
  const photoIndex = state.reviewPhotoIndex;

  hidePhotoReview();

  // Store the accepted photo in the captured photos array
  state.capturedPhotos[photoIndex] = photoData;

  // Update or create preview image
  const existingPreview = document.querySelector(`.preview-image[data-index="${photoIndex}"]`);
  if (existingPreview) {
    existingPreview.src = photoData;
  } else {
    const preview = document.createElement('img');
    preview.src = photoData;
    preview.className = 'preview-image';
    preview.setAttribute('data-index', photoIndex);
    els.previewGrid.appendChild(preview);
  }

  // Move to next shot
  state.currentPhotoIndex++;

  // Continue the capture loop
  sleep(500).then(() => captureNextPhoto());
}

/**
 * Handle "Retake" button click
 * Discard the current photo and go back to live preview
 */
export function handleRetakePhoto() {
  cancelAutoReviewTimer();
  hidePhotoReview();

  // Mark this index as retaken (discard)
  state.reviewPhotoData = null;
  state.reviewPhotoIndex = -1; // Will be set again on next capture

  // Continue the capture loop which will show live preview for the same shot
  sleep(500).then(() => captureNextPhoto());
}

/**
 * Initialize review event listeners
 */
export function initializeReviewListeners() {
  const usePhotoBtn = document.getElementById('usePhotoBtn');
  const retakePhotoBtn = document.getElementById('retakePhotoBtn');

  if (usePhotoBtn) {
    usePhotoBtn.addEventListener('click', handleUsePhoto);
  }

  if (retakePhotoBtn) {
    retakePhotoBtn.addEventListener('click', handleRetakePhoto);
  }
}
