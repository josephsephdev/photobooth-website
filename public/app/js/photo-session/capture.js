import { els } from './ui.js';
import { state } from './state.js';
import { sleep, applyCropToPhoto } from './utils.js';
import { updateProgressDots } from './progress.js';
import { captureDslrPhoto, captureWebcamPhoto } from './capture-sources.js';
import { freezeDslrPreview, startDslrLivePreview } from './camera-ui.js';
import { finishSession } from './finish.js';
import { showCropGuide, hideCropGuide } from './crop-guide.js';
import { showPhotoReview, initializeReviewListeners } from './review.js';

export async function captureNextPhoto() {
  // Count only primary photo boxes (those without linkedToId)
  const primaryBoxes = state.selectedTemplate?.photoBoxes?.filter(box => !box.linkedToId) || [];
  const total = primaryBoxes.length;
  if (!total) return;

  if (state.currentPhotoIndex >= total) {
    await finishSession();
    return;
  }

  els.progressText.textContent = `Photo ${state.currentPhotoIndex + 1} of ${total}`;
  updateProgressDots();

  // Show crop guide based on video dimensions
  // For DSLR mode, videoWidth/height are set to EVF resolution by camera-ui.js
  // For webcam mode, these are the actual stream dimensions
  const previewWidth = els.video.videoWidth || 320;
  const previewHeight = els.video.videoHeight || 240;
  showCropGuide(previewWidth, previewHeight);

  // DSLR: keep live preview visible and streaming during countdown.
  // The canvas stays in place — countdown overlay renders on top of it.

  // countdown (live preview stays active for DSLR)
  for (let i = state.countdownSeconds; i > 0; i--) {
    els.countdown.textContent = i;
    els.countdown.style.display = 'block';
    await sleep(1000);
  }

  els.countdown.textContent = 'SMILE!';
  hideCropGuide();
  await sleep(500);

  // Hide the countdown overlay before freezing so the frozen frame is clean
  els.countdown.style.display = 'none';

  // capture
  let photoData = null;

  if (state.cameraType === 'dslr') {
    // Freeze the last EVF frame on canvas — stops the WebSocket stream
    // but keeps the last frame visible so the user sees the capture moment.
    // EDSDK cannot do EVF + TakePicture simultaneously.
    freezeDslrPreview();
    photoData = await captureDslrPhoto();
    if (!photoData) {
      console.error('❌ DSLR capture failed');
      // Resume live preview even on failure
      await startDslrLivePreview();
      state.capturedPhotos.push(null);
      els.countdown.style.display = 'none';
      return;
    }
    // Resume live preview after successful capture
    await startDslrLivePreview();
  } else if (state.cameraType === 'webcam') {
    // Retry webcam capture in case video isn't ready
    for (let retries = 0; retries < 3; retries++) {
      photoData = captureWebcamPhoto();
      if (photoData) break;
      await sleep(150);
    }
    
    if (!photoData) {
      console.error('❌ Webcam capture failed');
      state.capturedPhotos.push(null);
      els.countdown.style.display = 'none';
      return;
    }
    
    // Apply crop for webcam photos
    if (state.selectedTemplate) {
      const primaryBoxes2 = state.selectedTemplate.photoBoxes.filter(box => !box.linkedToId);
      if (state.currentPhotoIndex < primaryBoxes2.length) {
        const currentBox = primaryBoxes2[state.currentPhotoIndex];
        photoData = await applyCropToPhoto(photoData, currentBox.width, currentBox.height);
      }
    }
  } else {
    console.error('❌ No camera connected — go to Camera Settings');
    els.countdown.style.display = 'none';
    alert('No camera connected. Please go to Camera Settings and connect a camera first.');
    return;
  }

  els.countdown.style.display = 'none';

  // Show photo review overlay instead of auto-continuing
  showPhotoReview(photoData, state.currentPhotoIndex, total);
}
