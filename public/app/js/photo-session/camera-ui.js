import { els } from './ui.js';
import { state } from './state.js';

export function showCameraModeIndicator() {
  if (!els.cameraModeIndicator) return;

  const name = state.cameraDisplayName;

  if (state.cameraType === 'dslr') {
    els.cameraModeIndicator.innerHTML = `📷 <strong>${name || 'DSLR'}</strong>`;
    els.cameraModeIndicator.style.background = 'rgba(40, 167, 69, 0.9)';
    els.cameraModeIndicator.style.display = 'block';
  } else if (state.cameraType === 'webcam') {
    els.cameraModeIndicator.innerHTML = `📹 <strong>${name || 'Webcam'}</strong>`;
    els.cameraModeIndicator.style.background = 'rgba(102, 126, 234, 0.9)';
    els.cameraModeIndicator.style.display = 'block';
  } else {
    els.cameraModeIndicator.innerHTML = '⚠️ <strong>No Camera</strong> — connect one in Camera Settings';
    els.cameraModeIndicator.style.background = 'rgba(239, 68, 68, 0.85)';
    els.cameraModeIndicator.style.display = 'block';
  }

  setTimeout(() => { els.cameraModeIndicator.style.display = 'none'; }, 5000);
}

// ─────────────────────────────────────────────────────────────────
// DSLR Live Preview — streams EVF frames via WebSocket
// Server grabs JPEG frames from EdsDownloadEvfImage() and pushes
// them as binary WebSocket messages.  We render each frame on a
// <canvas> so crop-guide calculations keep working.
// ─────────────────────────────────────────────────────────────────

const DSLR_PREVIEW_WIDTH  = 960;   // EVF typical width  (EOS M50)
const DSLR_PREVIEW_HEIGHT = 640;   // EVF typical height (EOS M50)

export function showDslrPlaceholder() {
  // no-op – placeholder managed by startDslrLivePreview
}

/**
 * Ensure the DSLR preview canvas exists inside .camera-container.
 * Returns the canvas element.
 */
function ensurePreviewCanvas() {
  let canvas = document.getElementById('dslrPreviewCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'dslrPreviewCanvas';
    canvas.width  = DSLR_PREVIEW_WIDTH;
    canvas.height = DSLR_PREVIEW_HEIGHT;
    canvas.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      background: #000;
      display: block;
    `;
    const container = document.querySelector('.camera-container');
    if (container) {
      container.appendChild(canvas);
    } else {
      document.body.appendChild(canvas);
    }
  } else {
    canvas.style.display = 'block';
  }
  return canvas;
}

/**
 * Draw a static "Connecting…" screen while we wait for the first
 * EVF frame to arrive.
 */
function drawConnectingScreen(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const name = state.cameraDisplayName || 'DSLR';
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#28a745';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`📷  ${name}`, canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillStyle = '#999';
  ctx.font = '16px sans-serif';
  ctx.fillText('Connecting live preview…', canvas.width / 2, canvas.height / 2 + 15);
}

/**
 * Start streaming DSLR EVF frames via WebSocket.
 * The server pushes binary JPEG blobs at ~15 fps.
 */
export async function startDslrLivePreview() {
  if (state.cameraType !== 'dslr') return;

  // Don't re-open if already streaming
  if (state._evfActive && state._evfWebSocket && state._evfWebSocket.readyState === WebSocket.OPEN) {
    console.log('ℹ️  EVF already active');
    return;
  }

  const previewCanvas = ensurePreviewCanvas();
  drawConnectingScreen(previewCanvas);

  // Hide <video> (used for webcam) and patch virtual dimensions
  if (els.video) {
    els.video.style.display = 'none';
    Object.defineProperty(els.video, 'videoWidth', {
      configurable: true,
      get: () => previewCanvas.width,
    });
    Object.defineProperty(els.video, 'videoHeight', {
      configurable: true,
      get: () => previewCanvas.height,
    });
  }

  // Open WebSocket to the EVF endpoint
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}/ws/evf`);
  ws.binaryType = 'arraybuffer';

  const ctx = previewCanvas.getContext('2d');
  let frameCount = 0;

  ws.onopen = () => {
    console.log('🔌 EVF WebSocket connected — requesting stream');
    ws.send('start-evf');
    state._evfActive = true;
  };

  ws.onmessage = (event) => {
    // Each message is a raw JPEG ArrayBuffer
    const blob = new Blob([event.data], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      // Adapt canvas to actual EVF resolution on first frame
      if (frameCount === 0) {
        previewCanvas.width = img.width;
        previewCanvas.height = img.height;
        // Update virtual video dimensions for crop-guide
        if (els.video) {
          Object.defineProperty(els.video, 'videoWidth', {
            configurable: true, get: () => img.width,
          });
          Object.defineProperty(els.video, 'videoHeight', {
            configurable: true, get: () => img.height,
          });
        }
        console.log(`📷 EVF resolution: ${img.width}×${img.height}`);
      }
      if (ctx) ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      frameCount++;
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  ws.onclose = () => {
    console.log('🔌 EVF WebSocket closed');
    state._evfActive = false;
    state._evfWebSocket = null;
  };

  ws.onerror = (err) => {
    console.error('❌ EVF WebSocket error:', err);
    state._evfActive = false;
  };

  state._evfWebSocket = ws;
  console.log('📷 DSLR live preview starting via WebSocket');
}

/**
 * Freeze the DSLR preview — stops the EVF WebSocket stream but keeps
 * the last rendered frame visible on the canvas.  This gives the user
 * a clear "capture moment" snapshot without the screen going black.
 */
export function freezeDslrPreview() {
  if (state._evfWebSocket) {
    try {
      const ws = state._evfWebSocket;
      // Suppress error/close handlers — this is an intentional close
      ws.onerror = () => {};
      ws.onclose = () => {};
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('stop-evf');
      }
      ws.close();
    } catch (_) { /* ignore */ }
    state._evfWebSocket = null;
  }
  state._evfActive = false;
  // Canvas stays visible with the last frame — intentionally NOT hidden
  console.log('🧊 DSLR preview frozen (last frame visible)');
}

/**
 * Stop EVF streaming and hide the preview canvas entirely.
 * Use this when leaving the photo session or switching cameras.
 */
export function stopDslrLivePreview() {
  freezeDslrPreview();
  const canvas = document.getElementById('dslrPreviewCanvas');
  if (canvas) canvas.style.display = 'none';
}

export async function startWebcamIfNeeded() {
  if (state.cameraType === 'dslr') {
    // DSLR mode: no webcam, hide video + show placeholder + start live preview
    els.video.style.display = 'none';
    showDslrPlaceholder();
    els.progressText.innerHTML = `Ready to start<br><small style="color: #28a745;">✓ ${state.cameraDisplayName || 'DSLR'} Connected</small>`;
    console.log('✅ DSLR mode ready - initializing live preview');
    
    // Start live preview via WebSocket EVF streaming
    await startDslrLivePreview();
    return;
  }

  if (state.cameraType === 'webcam') {
    console.log('📹 Webcam Mode: Requesting camera access...');
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      els.video.srcObject = state.stream;
      els.video.style.display = 'block';
      console.log('✅ Webcam active');
    } catch (error) {
      alert('Error accessing webcam: ' + error.message + '\n\nPlease allow camera access.');
    }
    return;
  }

  // No camera connected
  console.warn('⚠️ No camera connected — go to Camera Settings');
  els.progressText.innerHTML = `<span style="color: #ef4444;">⚠️ No camera connected</span><br><small>Go to Camera Settings to connect one</small>`;
}

export function stopStream() {
  if (state.cameraType === 'dslr') {
    stopDslrLivePreview();
  } else {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      state.stream = null;
    }
  }
}
