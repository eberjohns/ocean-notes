/**
 * src/audio/transport.ts
 * Audio-Clock-Driven Transport & Playback Scheduler for Ocean Notes.
 *
 * Implements:
 * - Authoritative AudioContext.currentTime clock synchronization
 * - Lookahead scheduling to eliminate timing drift
 * - 31-day timeline scrubbing restarting cleanly at the day's Bar 1
 * - Voice cancellation on seek to prevent overlapping audio
 * - Playback speeds: 0.5x, 1x, 2x
 * - Synchronized live captions & telemetry updated once per day
 * - Boundary handling (Day 1 start, Day 31 end)
 */

import type { Grid8Dataset, Grid8Day, Grid8Cell } from '../data/loader.ts';
import type {
  PlaybackSpeed,
  TransportState,
  TransportSnapshot,
  LiveCaptionData,
  ScaleName
} from './types.ts';
import { audioEngine, AudioEngine } from './engine.ts';
import { mapCellToAudio } from './mapping.ts';

export const BPM = 110;
export const BEATS_PER_BAR = 4;
export const BARS_PER_DAY = 4;
export const BEATS_PER_DAY = BEATS_PER_BAR * BARS_PER_DAY; // 16 beats per day
export const TOTAL_DAYS = 31;

export const BEAT_SEC = 60 / BPM; // ~0.5454545 s
export const BAR_SEC = BEATS_PER_BAR * BEAT_SEC; // ~2.181818 s
export const DAY_SEC = BEATS_PER_DAY * BEAT_SEC; // ~8.7272727 s
export const TOTAL_DURATION = TOTAL_DAYS * DAY_SEC; // ~270.54545 s (~4:30.5)

export function findDominantCell(day: Grid8Day): Grid8Cell {
  return day.cells.find(c => c.speed_rank === 1) || day.cells[0];
}

export function createLiveCaption(day: Grid8Day, scale: ScaleName = 'dorian'): LiveCaptionData {
  const dominant = findDominantCell(day);
  const mapping = mapCellToAudio(dominant, scale);
  const heading = dominant.u_m_s >= 0 ? 'eastward' : 'westward';
  const panDesc = mapping.pan < -0.2 ? 'left' : mapping.pan > 0.2 ? 'right' : 'center';

  const text = `Peak current at Row ${dominant.row_ui}, Col ${dominant.column_ui} (${dominant.lat.toFixed(3)}°N, ${dominant.lon.toFixed(3)}°E) flowing ${heading} at ${dominant.mean_speed_m_s.toFixed(3)} m/s (Sound: ${mapping.pitchName}, pan ${panDesc}).`;

  return {
    dayIndex: day.day_index - 1,
    dayUi: day.day_index,
    date: day.date,
    dominantCell: {
      row: dominant.row,
      column: dominant.column,
      rowUi: dominant.row_ui,
      colUi: dominant.column_ui,
      lat: dominant.lat,
      lon: dominant.lon,
      meanSpeed: dominant.mean_speed_m_s,
      u: dominant.u_m_s,
      v: dominant.v_m_s,
      directionDeg: dominant.direction_deg,
      coherence: dominant.coherence
    },
    pitchName: mapping.pitchName,
    frequency: mapping.frequency,
    pan: mapping.pan,
    text
  };
}

export class Transport {
  private engine: AudioEngine;
  private dataset: Grid8Dataset | null = null;

  private state: TransportState = 'stopped';
  private speed: PlaybackSpeed = 1;

  // Clock references: audio clock is the single source of truth
  private anchorAudioTime: number = 0;
  private anchorCompTime: number = 0; // Nominal composition seconds [0, TOTAL_DURATION]
  private compTime: number = 0;
  private currentDayIndex: number = 0; // 0..30
  private scheduledUntilDayIndex: number = -1;

  private loopIntervalId: ReturnType<typeof setInterval> | null = null;
  private rafId: number | null = null;

  private snapshotListeners: Array<(snap: TransportSnapshot) => void> = [];
  private dayChangeListeners: Array<(day: Grid8Day, dominantCell: Grid8Cell, caption: LiveCaptionData) => void> = [];
  private endedListeners: Array<() => void> = [];

  constructor(engine: AudioEngine = audioEngine) {
    this.engine = engine;
  }

  public setDataset(dataset: Grid8Dataset): void {
    this.dataset = dataset;
  }

  public getState(): TransportState {
    return this.state;
  }

  public getSpeed(): PlaybackSpeed {
    return this.speed;
  }

  public getCurrentDayIndex(): number {
    return this.currentDayIndex;
  }

  public getCompTime(): number {
    return this.compTime;
  }

  public getTotalDuration(): number {
    return TOTAL_DURATION;
  }

  /**
   * Starts or resumes playback driven by the Web Audio clock.
   */
  public async play(): Promise<void> {
    if (this.state === 'playing') return;

    if (!this.engine.isInitialized()) {
      await this.engine.init();
    }
    if (this.engine.isMuted()) {
      this.engine.setMuted(false);
    }

    const audioNow = this.engine.getCurrentTime();

    // If at or past the end of the month, rewind to Day 1 Bar 1
    if (this.compTime >= TOTAL_DURATION - 0.05) {
      this.compTime = 0;
      this.currentDayIndex = 0;
    }

    this.state = 'playing';
    this.anchorAudioTime = audioNow + 0.02; // 20 ms lead time for glitch-free scheduling
    this.anchorCompTime = this.compTime;
    this.scheduledUntilDayIndex = -1;

    this.startScheduler();
    this.emitSnapshot();

    // Fire initial day caption if not already fired
    if (this.dataset) {
      const day = this.dataset.days[this.currentDayIndex];
      const dominant = findDominantCell(day);
      const caption = createLiveCaption(day, this.engine.getScale());
      this.notifyDayChange(day, dominant, caption);
    }
  }

  /**
   * Pauses playback, stopping all active voices smoothly without click.
   */
  public pause(): void {
    if (this.state !== 'playing') return;

    this.updateNominalTime();
    this.state = 'paused';
    this.engine.stopAll(0.04);
    this.stopScheduler();
    this.emitSnapshot();
  }

  public togglePlay(): Promise<void> | void {
    if (this.state === 'playing') {
      this.pause();
    } else {
      return this.play();
    }
  }

  /**
   * Seeks to a specific day (0-based index 0..30).
   * Restarts cleanly at the target day's Bar 1.
   * Cancels and stops any scheduled/sounding voices to prevent overlaps.
   */
  public seekToDay(targetDayIdx: number): void {
    const clampedDay = Math.max(0, Math.min(TOTAL_DAYS - 1, targetDayIdx));
    const targetCompTime = clampedDay * DAY_SEC; // Day clampedDay, Bar 1, Beat 1

    // Immediately stop active and queued voices to prevent audio overlap
    this.engine.stopAll(0.02);

    this.currentDayIndex = clampedDay;
    this.compTime = targetCompTime;
    this.scheduledUntilDayIndex = -1;

    if (this.state === 'playing') {
      const audioNow = this.engine.getCurrentTime();
      this.anchorAudioTime = audioNow + 0.03; // Allow 20 ms fade-out to finish cleanly
      this.anchorCompTime = targetCompTime;
      // Scheduler will pick up target day immediately in the next tick
    } else {
      this.anchorCompTime = targetCompTime;
    }

    this.emitSnapshot();

    if (this.dataset) {
      const day = this.dataset.days[clampedDay];
      const dominant = findDominantCell(day);
      const caption = createLiveCaption(day, this.engine.getScale());
      this.notifyDayChange(day, dominant, caption);
    }
  }

  /**
   * Steps day backward (-1) or forward (+1), clamped at day 0 and 30.
   */
  public stepDay(direction: -1 | 1): void {
    const nextDay = Math.max(0, Math.min(TOTAL_DAYS - 1, this.currentDayIndex + direction));
    if (nextDay !== this.currentDayIndex) {
      this.seekToDay(nextDay);
    }
  }

  /**
   * Sets playback speed multiplier (0.5x, 1x, 2x).
   * Verifies that the audio scheduling and visual playhead scale consistently.
   */
  public setSpeed(newSpeed: PlaybackSpeed): void {
    if (newSpeed === this.speed) return;

    if (this.state === 'playing') {
      this.updateNominalTime();
      this.engine.stopAll(0.02);
      this.speed = newSpeed;
      const audioNow = this.engine.getCurrentTime();
      this.anchorAudioTime = audioNow + 0.025;
      this.anchorCompTime = this.compTime;
      this.scheduledUntilDayIndex = -1;
    } else {
      this.speed = newSpeed;
    }

    this.emitSnapshot();
  }

  public subscribeSnapshot(cb: (snap: TransportSnapshot) => void): () => void {
    this.snapshotListeners.push(cb);
    cb(this.getSnapshot());
    return () => {
      this.snapshotListeners = this.snapshotListeners.filter(l => l !== cb);
    };
  }

  public subscribeDayChange(
    cb: (day: Grid8Day, dominantCell: Grid8Cell, caption: LiveCaptionData) => void
  ): () => void {
    this.dayChangeListeners.push(cb);
    return () => {
      this.dayChangeListeners = this.dayChangeListeners.filter(l => l !== cb);
    };
  }

  public subscribeEnded(cb: () => void): () => void {
    this.endedListeners.push(cb);
    return () => {
      this.endedListeners = this.endedListeners.filter(l => l !== cb);
    };
  }

  public getSnapshot(): TransportSnapshot {
    const dayUi = this.currentDayIndex + 1;
    const date = this.dataset?.days[this.currentDayIndex]?.date || `2026-10-${dayUi < 10 ? '0' : ''}${dayUi}`;
    const dayOffset = this.compTime - this.currentDayIndex * DAY_SEC;
    const barInDay = Math.max(0, Math.min(3, Math.floor(dayOffset / BAR_SEC)));
    const beatInBar = Math.max(0, Math.min(3, Math.floor((dayOffset % BAR_SEC) / BEAT_SEC)));
    const progress = Math.max(0, Math.min(1.0, this.compTime / TOTAL_DURATION));

    const totalSeconds = 270; // 4:30 standard composition duration
    const curSeconds = Math.min(totalSeconds, Math.round(this.compTime));
    const mCur = Math.floor(curSeconds / 60);
    const sCur = curSeconds % 60;
    const mTot = Math.floor(totalSeconds / 60);
    const sTot = totalSeconds % 60;
    const timeString = `${mCur}:${sCur < 10 ? '0' : ''}${sCur} / ${mTot}:${sTot < 10 ? '0' : ''}${sTot}`;

    return {
      state: this.state,
      compTime: this.compTime,
      duration: TOTAL_DURATION,
      dayIndex: this.currentDayIndex,
      dayUi,
      date,
      barInDay,
      beatInBar,
      speed: this.speed,
      progress,
      timeString
    };
  }

  private startScheduler(): void {
    this.stopScheduler();

    // Lookahead tick runs every 25 ms
    this.loopIntervalId = setInterval(() => {
      this.schedulerTick();
    }, 25);

    // Visual animation tick synced with display refresh rate in browser environments
    if (typeof requestAnimationFrame === 'function') {
      const onFrame = () => {
        if (this.state === 'playing') {
          this.updateNominalTime();
          this.emitSnapshot();
          this.rafId = requestAnimationFrame(onFrame);
        }
      };
      this.rafId = requestAnimationFrame(onFrame);
    }
  }

  private stopScheduler(): void {
    if (this.loopIntervalId !== null) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Evaluates AudioContext.currentTime and updates the nominal composition position.
   * Drift between audio clock and day counter is mathematically zero.
   */
  private updateNominalTime(): void {
    if (this.state !== 'playing') return;

    const audioNow = this.engine.getCurrentTime();
    const elapsedAudio = audioNow - this.anchorAudioTime;
    const newCompTime = this.anchorCompTime + elapsedAudio * this.speed;

    if (newCompTime >= TOTAL_DURATION) {
      this.compTime = TOTAL_DURATION;
      this.currentDayIndex = TOTAL_DAYS - 1;
      this.handleEnded();
      return;
    }

    this.compTime = Math.max(0, newCompTime);
    const newDayIdx = Math.min(TOTAL_DAYS - 1, Math.floor(this.compTime / DAY_SEC));

    if (newDayIdx !== this.currentDayIndex) {
      this.currentDayIndex = newDayIdx;
      if (this.dataset) {
        const day = this.dataset.days[newDayIdx];
        const dominant = findDominantCell(day);
        const caption = createLiveCaption(day, this.engine.getScale());
        this.notifyDayChange(day, dominant, caption);
      }
    }
  }

  /**
   * Lookahead scheduling tick: schedules upcoming musical days into the Web Audio graph.
   */
  private schedulerTick(): void {
    if (this.state !== 'playing' || !this.dataset) return;

    this.updateNominalTime();
    if (this.state !== 'playing') return;

    const audioNow = this.engine.getCurrentTime();
    const lookaheadSec = 0.5; // Look ahead 500 ms in real audio time
    const lookaheadCompTime = this.anchorCompTime + (audioNow + lookaheadSec - this.anchorAudioTime) * this.speed;
    const horizonDay = Math.min(TOTAL_DAYS - 1, Math.floor(lookaheadCompTime / DAY_SEC));

    // Schedule days that fall within the lookahead horizon
    while (this.scheduledUntilDayIndex < horizonDay) {
      const dayToSchedule = this.scheduledUntilDayIndex === -1 ? this.currentDayIndex : this.scheduledUntilDayIndex + 1;
      if (dayToSchedule > TOTAL_DAYS - 1) break;

      const dayStartComp = dayToSchedule * DAY_SEC;
      const audioStartTime = this.anchorAudioTime + (dayStartComp - this.anchorCompTime) / this.speed;

      // Schedule if it has not yet elapsed
      if (audioStartTime >= audioNow - 0.05) {
        this.engine.scheduleDay(this.dataset.days[dayToSchedule], audioStartTime, {
          speed: this.speed,
          scale: this.engine.getScale()
        });
      }

      this.scheduledUntilDayIndex = dayToSchedule;
    }
  }

  private handleEnded(): void {
    this.state = 'ended';
    this.engine.stopAll(0.05);
    this.stopScheduler();
    this.emitSnapshot();

    for (const cb of this.endedListeners) {
      try {
        cb();
      } catch {
        // Listener error
      }
    }
  }

  private emitSnapshot(): void {
    const snap = this.getSnapshot();
    for (const cb of this.snapshotListeners) {
      try {
        cb(snap);
      } catch {
        // Listener error
      }
    }
  }

  private notifyDayChange(day: Grid8Day, dominant: Grid8Cell, caption: LiveCaptionData): void {
    for (const cb of this.dayChangeListeners) {
      try {
        cb(day, dominant, caption);
      } catch {
        // Listener error
      }
    }
  }

  public dispose(): void {
    this.pause();
    this.snapshotListeners = [];
    this.dayChangeListeners = [];
    this.endedListeners = [];
  }
}

// Global transport singleton
export const transport = new Transport(audioEngine);
