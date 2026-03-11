const _t = atob('TFVJUyZDTyBQSE9UT0JPT1RI')

function _load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function _render(dataUrl) {
  const img = await _load(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')

  ctx.drawImage(img, 0, 0)

  const fontSize = Math.round(canvas.width * 0.05)
  const margin = Math.round(canvas.width * 0.03)

  ctx.globalAlpha = 0.5
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1

  const x = canvas.width - margin
  const y = canvas.height - margin

  ctx.strokeText(_t, x, y)
  ctx.fillText(_t, x, y)

  ctx.globalAlpha = 1.0

  return dataUrl.startsWith('data:image/png')
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', 0.95)
}

export async function applyWatermarkIfNeeded(dataUrl) {
  return await _render(dataUrl)
}

