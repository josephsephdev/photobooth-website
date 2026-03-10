import { els } from './ui.js';
import { state } from './state.js';

/**
 * Built-in CSS filter presets for the photobooth app.
 * Each key maps to a CSS filter string.
 */
export const FILTER_PRESETS = {
  none:   { label: 'No Filter', css: 'none' },
  bw:     { label: 'Black & White', css: 'grayscale(100%)' },
  sepia:  { label: 'Sepia', css: 'sepia(100%)' },
  vivid:  { label: 'Vivid', css: 'saturate(140%) contrast(110%)' },
  bright: { label: 'Bright', css: 'brightness(110%) contrast(105%)' },
  warm:   { label: 'Warm', css: 'sepia(20%) saturate(120%) brightness(105%)' },
  cool:   { label: 'Cool', css: 'hue-rotate(15deg) saturate(110%)' },
};

/**
 * Initialize the filter selection screen.
 * Populates the filter option buttons and wires up event handlers.
 */
export function initFilterScreen() {
  const grid = els.filterOptionsGrid;
  if (!grid) return;

  grid.innerHTML = '';

  for (const [key, preset] of Object.entries(FILTER_PRESETS)) {
    const btn = document.createElement('button');
    btn.className = 'filter-option-btn' + (key === 'none' ? ' active' : '');
    btn.dataset.filterKey = key;
    btn.innerHTML = `
      <div class="filter-thumb-wrapper">
        <img class="filter-thumb" style="filter: ${preset.css === 'none' ? 'none' : preset.css};" alt="${preset.label}">
      </div>
      <span class="filter-option-label">${preset.label}</span>
    `;
    btn.addEventListener('click', () => selectFilter(key));
    grid.appendChild(btn);
  }

  // Done button
  els.filterDoneBtn.addEventListener('click', onFilterDone);
}

/**
 * Show the filter selection screen with the given composite image.
 * Returns a Promise that resolves with the finalized (possibly filtered) data URL.
 */
export function showFilterScreen(compositeDataUrl) {
  return new Promise((resolve) => {
    state._filterResolve = resolve;
    state.selectedFilter = 'none';
    state._compositeDataUrl = compositeDataUrl;

    // Set main preview
    els.filterPreviewImg.src = compositeDataUrl;
    els.filterPreviewImg.style.filter = 'none';

    // Set thumbnails
    const thumbs = els.filterOptionsGrid.querySelectorAll('.filter-thumb');
    thumbs.forEach(img => { img.src = compositeDataUrl; });

    // Reset active state
    els.filterOptionsGrid.querySelectorAll('.filter-option-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filterKey === 'none');
    });

    // Show filter screen, hide others
    els.sessionScreen.style.display = 'none';
    els.resultsScreen.style.display = 'none';
    els.filterScreen.style.display = 'flex';
  });
}

/**
 * Handle filter option click — update CSS preview immediately.
 */
function selectFilter(key) {
  state.selectedFilter = key;
  const preset = FILTER_PRESETS[key];
  els.filterPreviewImg.style.filter = preset.css === 'none' ? 'none' : preset.css;

  // Update active state on buttons
  els.filterOptionsGrid.querySelectorAll('.filter-option-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filterKey === key);
  });
}

/**
 * Handle Done button — render the filtered image to canvas and resolve.
 */
async function onFilterDone() {
  const filterCss = FILTER_PRESETS[state.selectedFilter].css;
  const compositeDataUrl = state._compositeDataUrl;
  const resolve = state._filterResolve;

  // If no filter selected, resolve with the original composite
  if (state.selectedFilter === 'none' || filterCss === 'none') {
    cleanup();
    resolve(compositeDataUrl);
    return;
  }

  // Show a brief "applying filter" indicator
  els.filterDoneBtn.disabled = true;
  els.filterDoneBtn.textContent = 'Applying...';

  try {
    const finalDataUrl = await applyFilterToCanvas(compositeDataUrl, filterCss);
    cleanup();
    resolve(finalDataUrl);
  } catch (err) {
    console.error('Error applying filter:', err);
    // Fall back to unfiltered image
    cleanup();
    resolve(compositeDataUrl);
  }
}

/**
 * Apply a CSS filter string to an image by rendering to an offscreen canvas.
 * Returns a data URL of the filtered result in the current export format.
 */
function applyFilterToCanvas(dataUrl, filterCss) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // Apply the CSS filter before drawing
      ctx.filter = filterCss;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Export with the same format/quality settings as the composite
      let result;
      if (state.exportFormat === 'png') {
        result = canvas.toDataURL('image/png');
      } else {
        const quality = Math.min(1, Math.max(0, state.jpegQuality || 0.95));
        result = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(result);
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

/**
 * Hide the filter screen and reset transient state.
 */
function cleanup() {
  els.filterScreen.style.display = 'none';
  els.filterDoneBtn.disabled = false;
  els.filterDoneBtn.innerHTML = `
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Done
  `;
  delete state._filterResolve;
  delete state._compositeDataUrl;
}
