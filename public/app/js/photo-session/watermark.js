/**
 * Client-side watermark overlay module (Web App version).
 *
 * HARDWIRED: Watermark is ALWAYS applied — no subscription check,
 * no server API call. This is the "try before you buy" version.
 *
 * 100% code-generated text watermark — no external PNG assets.
 */

const WATERMARK_TEXT = 'LUIS&CO PHOTOBOOTH'

// ── State (hardwired) ──────────────────────────────────────────────
const _watermarkConfig = { opacity: 0.5 }
const _shouldWatermark = true

// ── Public API ─────────────────────────────────────────────────────

/**
 * No-op init — watermark is always on, no server call needed.
 */
export function initWatermark() {
  return Promise.resolve()
}

/**
 * Always applies watermark (web app = free/try mode).
 */
export async function applyWatermarkIfNeeded(dataUrl) {
  console.log('🔖 [WM-CLIENT] applyWatermarkIfNeeded: always on (web app)')
  return await overlayTextWatermark(dataUrl)
}

/**
 * Always returns true in the web app.
 */
export function willApplyWatermark() {
  return true
}

// ── Internal ───────────────────────────────────────────────────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => {
      console.warn('⚠️ [WM-CLIENT] Failed to load image:', src?.substring(0, 60))
      reject(e)
    }
    img.src = src
  })
}

/**
 * Overlay a single text watermark at the bottom-right of the image.
 */
async function overlayTextWatermark(dataUrl) {
  const cfg = _watermarkConfig
  const img = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')

  // Draw original image
  ctx.drawImage(img, 0, 0)

  const text = WATERMARK_TEXT
  const opacity = cfg.opacity || 0.5

  const fontSize = Math.round(canvas.width * 0.05)
  const margin = Math.round(canvas.width * 0.03)

  ctx.globalAlpha = opacity
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1

  const x = canvas.width - margin
  const y = canvas.height - margin

  ctx.strokeText(text, x, y)
  ctx.fillText(text, x, y)

  ctx.globalAlpha = 1.0

  console.log(`🔖 [WM-CLIENT] Watermark applied: bottom-right, fontSize=${fontSize}`)

  if (dataUrl.startsWith('data:image/png')) {
    return canvas.toDataURL('image/png')
  } else {
    return canvas.toDataURL('image/jpeg', 0.95)
  }
}
