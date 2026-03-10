import { state } from './state.js';
import { dataURLtoBlob } from './utils.js';

/**
 * Wire up the Download button.
 * Creates a blob URL, triggers a download, then frees the blob.
 */
export function initDownload() {
  const btn = document.getElementById('downloadBtn');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.finalImageDataUrl) return;

    const blob = dataURLtoBlob(state.finalImageDataUrl);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'photobooth.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Free memory after a short delay (browser needs time to start download)
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
}

/**
 * Wire up the Print button.
 * Opens the final image in a new window and triggers the browser print dialog.
 */
export function initBrowserPrint() {
  const btn = document.getElementById('printBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!state.finalImageDataUrl) return;

    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow pop-ups to print your photo.');
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Photo</title>
        <style>
          * { margin: 0; padding: 0; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
          img { max-width: 100%; max-height: 100vh; }
          @media print { body { background: #fff; } img { max-width: 100%; } }
        </style>
      </head>
      <body>
        <img src="${state.finalImageDataUrl}" onload="window.print(); window.close();">
      </body>
      </html>
    `);
    win.document.close();
  });
}
