export const state = {
  selectedTemplate: null,
  capturedPhotos: [],
  currentPhotoIndex: 0,
  isCapturing: false,
  stream: null,
  printQuantity: 1,
  currentSessionId: null,
  cameraType: null, // null | 'webcam' | 'dslr' — set via Camera Settings
  cameraDisplayName: null, // e.g. 'Canon EOS M50', 'Webcam' — from server
  countdownSeconds: 3,
  MIN_TIMER: 1,
  MAX_TIMER: 10,
  
  // DSLR preview crop metadata
  // Stores the crop coordinates from 320x240 preview for scaling to actual image
  previewCropMetadata: null, // { cropWidth, cropHeight, previewWidth: 320, previewHeight: 240 }
  
  // Export quality settings (loaded from printer settings)
  exportFormat: 'png',      // 'png' (lossless) | 'jpeg' (lossy)
  jpegQuality: 0.95,        // JPEG quality 0.0-1.0 (0.95 = 95% for high quality)
  
  // Auto print setting (loaded from printer settings)
  autoPrint: false,         // Whether to automatically print after session
  autoPrinted: false,       // Flag to prevent duplicate prints per session
  
  // DPI from background template (for preserving metadata in output)
  backgroundImageDPI: 96,   // DPI from template background image

  // Filter selection
  selectedFilter: 'none',   // Currently selected filter key

  // DSLR live preview (EVF) state
  _evfWebSocket: null,      // WebSocket connection for EVF streaming
  _evfActive: false,        // Whether EVF streaming is currently running
};
