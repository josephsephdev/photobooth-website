import { els } from './ui.js';
import { state } from './state.js';

export function initProgressDots(total) {
  els.progressDots.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    if (i === 0) dot.classList.add('current');
    els.progressDots.appendChild(dot);
  }
}

export function updateProgressDots() {
  const dots = els.progressDots.querySelectorAll('.progress-dot');
  dots.forEach((dot, index) => {
    dot.classList.remove('current', 'completed');
    if (index < state.currentPhotoIndex) dot.classList.add('completed');
    else if (index === state.currentPhotoIndex) dot.classList.add('current');
  });
}
