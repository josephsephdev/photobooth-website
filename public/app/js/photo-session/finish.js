import { els } from './ui.js';
import { state } from './state.js';
import { stopStream } from './camera-ui.js';
import { compositePhotos } from './composite.js';
import { showFilterScreen } from './filter.js';
import { applyWatermarkIfNeeded } from './watermark.js';

export async function finishSession() {
  state.isCapturing = false;
  els.timerSelector.classList.remove('disabled');
  els.startBtn.disabled = false;
  els.retakeBtn.style.display = 'block';

  // Validate photos before processing
  const validPhotos = state.capturedPhotos.filter(p => p !== null && p !== undefined);

  if (validPhotos.length === 0) {
    console.error('❌ No valid photos captured - cannot create composite');
    alert('Error: No photos were captured successfully. Please try the session again.');
    location.reload();
    return;
  }

  if (validPhotos.length < state.capturedPhotos.length) {
    console.warn(`⚠️  Only ${validPhotos.length}/${state.capturedPhotos.length} photos captured successfully`);
    alert(`Warning: Only ${validPhotos.length} out of ${state.capturedPhotos.length} photos captured. Using available photos.`);
  }

  // Show results screen (processing overlay visible)
  els.sessionScreen.style.display = 'none';
  els.resultsScreen.style.display = 'block';

  // Stop webcam
  stopStream();

  // Composite with quality settings
  const compositeResult = await compositePhotos({
    format: state.exportFormat,
    jpegQuality: state.jpegQuality
  });
  const compositeImage = compositeResult.dataUrl;

  // ── Filter Selection Step ──
  els.resultsScreen.style.display = 'none';
  els.processingOverlay.style.display = 'flex';
  const filteredImage = await showFilterScreen(compositeImage);

  // ── Watermark Step (always applied in web app) ──
  const finalImage = await applyWatermarkIfNeeded(filteredImage);

  // ── Show final result immediately — no upload, no waiting ──
  state.finalImageDataUrl = finalImage;
  els.resultsScreen.style.display = 'block';
  els.processingOverlay.style.display = 'none';
  els.resultsContainer.style.display = 'flex';
  els.finalImage.src = finalImage;
}
