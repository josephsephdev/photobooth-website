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
  try {
    const result = await api(`/api/templates/${templateSummary.id}`);
    if (!result.success) {
      alert('Error loading template: ' + result.error);
      return;
    }
    state.selectedTemplate = result.template;
    
    // ⭐ Load DPI from template (for preserving in output)
    state.backgroundImageDPI = result.template.backgroundImageDPI || 96;
    console.log(`📐 Template DPI: ${state.backgroundImageDPI}`);
  } catch (error) {
    alert('Error loading template: ' + error.message);
    return;
  }

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
