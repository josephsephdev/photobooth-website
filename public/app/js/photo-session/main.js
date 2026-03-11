import { els } from './ui.js';
import { state } from './state.js';
import { initTimerUI } from './timer.js';
import { loadTemplates } from './templates.js';
import { initSessionControls } from './session.js';
import { initFilterScreen } from './filter.js';
import { initWatermark } from './watermark.js';
import { initDownload, initBrowserPrint } from './download.js';
import { initializeReviewListeners } from './review.js';

async function boot() {
  els.cache();

  // Webcam is always the camera in the web app
  state.cameraType = 'webcam';

  // Start Session button on the home screen
  els.startSessionBtn.addEventListener('click', () => {
    els.homeScreen.style.display = 'none';
    els.pageHeader.style.display = 'flex';
    els.templateSelectScreen.style.display = '';
  });

  // Back button on template selection
  els.templateBackBtn.addEventListener('click', () => {
    els.templateSelectScreen.style.display = 'none';
    els.pageHeader.style.display = 'none';
    els.homeScreen.style.display = '';
  });

  initTimerUI();
  initFilterScreen();
  initSessionControls();
  initDownload();
  initBrowserPrint();
  initializeReviewListeners();

  // New session button
  els.newSessionBtn.addEventListener('click', () => location.reload());

  // Pre-load watermark (resolves instantly — hardwired ON)
  initWatermark();

  // Load template cards
  loadTemplates();
}

boot();
