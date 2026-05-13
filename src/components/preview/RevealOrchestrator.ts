/**
 * RevealOrchestrator
 *
 * Accepts a timeline map of { ms → callback } and fires each callback
 * at the specified offset from when start() is called.
 *
 * Uses individual setTimeout calls (not rAF, not chained) so every
 * callback fires at an absolute offset from t=0, giving timing precision
 * independent of frame rate.
 */

export type Timeline = Record<number, () => void>;

export class RevealOrchestrator {
  private readonly timeline: Timeline;
  private timers: ReturnType<typeof setTimeout>[];

  constructor(timeline: Timeline) {
    this.timeline = timeline;
    this.timers = [];
  }

  /**
   * Begin the sequence. Each callback fires at its ms offset from now.
   * Calling start() while already running first cancels all pending timers.
   */
  start(): void {
    this.cancel();

    const entries = (Object.entries(this.timeline) as [string, () => void][])
      .map(([ms, cb]) => [Number(ms), cb] as [number, () => void])
      .sort(([a], [b]) => a - b);

    for (const [ms, cb] of entries) {
      this.timers.push(setTimeout(cb, ms));
    }
  }

  /**
   * Clear all pending timeouts. Callbacks that have already fired
   * are not rolled back — this only prevents future ones.
   */
  cancel(): void {
    for (const id of this.timers) clearTimeout(id);
    this.timers = [];
  }

  /**
   * Alias for cancel(). Prepares the orchestrator to be started again.
   */
  reset(): void {
    this.cancel();
  }
}
