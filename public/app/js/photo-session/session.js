import { els } from './ui.js';
import { state } from './state.js';
import { api } from './api.js';
import { updateProgressDots, initProgressDots } from './progress.js';
import { startWebcamIfNeeded, showCameraModeIndicator, showDslrPlaceholder, stopStream } from './camera-ui.js';
import { captureNextPhoto } from './capture.js';
import { finishSession } from './finish.js';

export function initSessionControls() {
  els.startBtn.addEventListener('click', async () => {
    if (state.isCapturing) return;

    els.startBtn.disabled = true;
    els.retakeBtn.style.display = 'none';

    state.isCapturing = true;
    els.timerSelector.classList.add('disabled');

    state.currentPhotoIndex = 0;
    state.capturedPhotos = [];
    els.previewGrid.innerHTML = '';

    await captureNextPhoto();
  });

  els.retakeBtn.addEventListener('click', () => {
    if (state.capturedPhotos.length === 0) return;

    state.capturedPhotos.pop();
    state.currentPhotoIndex--;
    if (els.previewGrid.lastChild) els.previewGrid.removeChild(els.previewGrid.lastChild);

    els.retakeBtn.style.display = 'none';
    els.startBtn.disabled = false;
  });

  els.cancelBtn.addEventListener('click', () => {
    if (confirm('Cancel this session?')) {
      stopStream();
      els.timerSelector.classList.remove('disabled');
      location.reload();
    }
  });
}

export async function selectTemplate(templateSummary) {
  // Use the template data already loaded from the list endpoint
  state.selectedTemplate = templateSummary;

  // ⭐ Load DPI from template (for preserving in output)
  state.backgroundImageDPI = templateSummary.backgroundImageDPI || 96;

  // Reset auto print flag for new session
  state.autoPrinted = false;

  els.templateSelectScreen.style.display = 'none';
  els.sessionScreen.style.display = 'block';

  // Count only primary photo boxes (those without linkedToId)
  const primaryBoxCount = state.selectedTemplate.photoBoxes.filter(box => !box.linkedToId).length;
  initProgressDots(primaryBoxCount);
  els.progressText.textContent = `Photo 1 of ${primaryBoxCount}`;

  showCameraModeIndicator();
  await startWebcamIfNeeded();
}
