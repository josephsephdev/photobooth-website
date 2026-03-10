import { els } from './ui.js';
import { state } from './state.js';

export function initTimerUI() {
  renderTimer();

  els.timerMinus.addEventListener('click', () => {
    state.countdownSeconds = Math.max(state.MIN_TIMER, state.countdownSeconds - 1);
    renderTimer();
  });

  els.timerPlus.addEventListener('click', () => {
    state.countdownSeconds = Math.min(state.MAX_TIMER, state.countdownSeconds + 1);
    renderTimer();
  });
}

export function renderTimer() {
  els.timerValueEl.textContent = state.countdownSeconds;
}
