import { els } from './ui.js';
import { state } from './state.js';

/**
 * Capture a photo from the webcam.
 * (DSLR capture removed — web app is webcam-only)
 */
export function captureWebcamPhoto() {
  console.log('📹 Capturing webcam photo...');

  if (!els.video) {
    console.error('❌ Webcam not ready - video element missing');
    return null;
  }

  if (!els.video.srcObject) {
    console.error('❌ Webcam not ready - no stream attached');
    return null;
  }

  if (els.video.videoWidth === 0 || els.video.videoHeight === 0) {
    console.warn('⏳ Waiting for video dimensions...');
    return null;
  }

  try {
    els.canvas.width = els.video.videoWidth;
    els.canvas.height = els.video.videoHeight;

    els.ctx.save();
    els.ctx.scale(-1, 1);
    els.ctx.drawImage(els.video, -els.canvas.width, 0, els.canvas.width, els.canvas.height);
    els.ctx.restore();

    const photoData = els.canvas.toDataURL('image/jpeg', 0.85);
    console.log('✅ Webcam photo captured');
    return photoData;
  } catch (error) {
    console.error('❌ Webcam capture error:', error.message);
    return null;
  }
}

// Keep the named export that capture.js imports
export async function captureDslrPhoto() {
  // Not available in web app — always returns null
  console.warn('⚠️ DSLR not available in web app');
  return null;
}
