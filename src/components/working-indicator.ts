import { Container, Spacer, Text } from '@mariozechner/pi-tui';
import type { WorkingState } from '../types.js';
import type { StreamMode } from '../agent/types.js';
import { getRandomThinkingVerb } from '../utils/thinking-verbs.js';
import { theme } from '../theme.js';
import { subscribeSpinner, currentSpinnerFrame } from '../utils/spinner.js';
import { formatTurnDuration, formatTokensCompact } from '../utils/format.js';

export interface TurnStats {
  turnStartMs: number;
  streamedChars: number;
  streamMode: StreamMode;
}

// Catch-up tuning for the live token estimate: tiny gaps move smoothly, medium
// gaps accelerate proportionally, and large gaps jump aggressively to avoid lag.
const SMALL_GAP_THRESHOLD = 70;
const MEDIUM_GAP_THRESHOLD = 200;
const SMALL_GAP_INCREMENT = 3;
const MEDIUM_GAP_MIN_INCREMENT = 8;
const MEDIUM_GAP_RATIO = 0.15;
const LARGE_GAP_INCREMENT = 50;

export class WorkingIndicatorComponent extends Container {
  private spacer: Spacer;
  private text: Text;
  private state: WorkingState = { status: 'idle' };
  private thinkingVerb = getRandomThinkingVerb();
  private prevStatus: WorkingState['status'] = 'idle';
  private unsubscribeSpinner: (() => void) | null = null;
  private turnStatsProvider: (() => TurnStats | null) | null = null;
  private displayedChars = 0;
  private lastTurnStartMs: number | null = null;

  constructor(_tui: unknown) {
    super();
    this.spacer = new Spacer(0);
    this.text = new Text('', 0, 0);
    this.addChild(this.spacer);
    this.addChild(this.text);
  }

  setState(state: WorkingState) {
    const isThinking =
      state.status === 'thinking' || state.status === 'tool' || state.status === 'approval';
    const wasThinking =
      this.prevStatus === 'thinking' ||
      this.prevStatus === 'tool' ||
      this.prevStatus === 'approval';
    if (isThinking && !wasThinking) {
      this.thinkingVerb = getRandomThinkingVerb();
    }
    this.prevStatus = state.status;
    this.state = state;

    if (state.status === 'idle') {
      this.stopSpinner();
      this.spacer.setLines(0);
      this.text.setText('');
      this.displayedChars = 0;
      this.lastTurnStartMs = null;
      return;
    }
    this.spacer.setLines(1);
    this.startSpinner();
    this.updateMessage(currentSpinnerFrame());
  }

  setTurnStatsProvider(provider: (() => TurnStats | null) | null) {
    this.turnStatsProvider = provider;
  }

  dispose() {
    this.stopSpinner();
  }

  private startSpinner() {
    if (this.unsubscribeSpinner) return;
    this.unsubscribeSpinner = subscribeSpinner((frame) => {
      this.updateMessage(frame);
    });
  }

  private stopSpinner() {
    if (this.unsubscribeSpinner) {
      this.unsubscribeSpinner();
      this.unsubscribeSpinner = null;
    }
  }

  private updateMessage(frame: string) {
    if (this.state.status === 'idle') {
      this.text.setText('');
      return;
    }
    const message = this.state.status === 'approval'
      ? 'Waiting for approval...'
      : `${this.thinkingVerb}...`;
    const suffix = this.computeStatsSuffix();
    const fullMessage = suffix ? `${message} ${suffix}` : message;
    this.text.setText(` ${theme.primary(frame)} ${theme.primary(fullMessage)}`);
  }

  private computeStatsSuffix(): string | null {
    const stats = this.turnStatsProvider?.() ?? null;
    if (!stats) return null;

    if (this.lastTurnStartMs !== stats.turnStartMs) {
      this.displayedChars = 0;
      this.lastTurnStartMs = stats.turnStartMs;
    }

    const elapsed = Date.now() - stats.turnStartMs;
    this.advanceDisplayedChars(stats.streamedChars);
    // Display-only heuristic inherited from upstream: ~4 chars/token keeps the
    // counter readable, but it is notably less accurate for Japanese text.
    const tokens = Math.round(this.displayedChars / 4);
    if (tokens <= 0) {
      return theme.muted(`(${formatTurnDuration(elapsed)})`);
    }
    const arrow = stats.streamMode === 'requesting' ? '↑' : '↓';
    return theme.muted(`(${formatTurnDuration(elapsed)} · ${arrow} ${formatTokensCompact(tokens)} tokens)`);
  }

  private advanceDisplayedChars(target: number) {
    const gap = target - this.displayedChars;
    if (gap <= 0) {
      this.displayedChars = target;
      return;
    }
    let increment: number;
    if (gap < SMALL_GAP_THRESHOLD) increment = SMALL_GAP_INCREMENT;
    else if (gap < MEDIUM_GAP_THRESHOLD) {
      increment = Math.max(MEDIUM_GAP_MIN_INCREMENT, Math.ceil(gap * MEDIUM_GAP_RATIO));
    } else {
      increment = LARGE_GAP_INCREMENT;
    }
    this.displayedChars = Math.min(this.displayedChars + increment, target);
  }
}
