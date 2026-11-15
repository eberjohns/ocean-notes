# Earth Information Jukebox: Phase 5 Specification

Nov 15, 2026 · @Indra

## 1. Decisions locked and Brief Ledger

The five open decisions from the review are closed with the recommended defaults, so every spec below builds on them. Change any row and the dependent sections get revised.

| # | Decision | Locked choice | Why |
| --- | --- | --- | --- |
| 1 | Typography | Sora for UI, headings and big numbers; Inter for body text; IBM Plex Mono for coordinates and values; no serif | Two families plus one mono; the mockup's serif headings get regenerated in Sora |
| 2 | Research theme | Light "warm paper and ink" theme, logged as a deliberate break | Marks analytical mode; same tokens, one theme switch |
| 3 | Earth Synthesizer | Not a page in the MVP; becomes a "Free listening" panel inside the Explorer, driven by the same data | A standalone synth has no data link and breaks the guiding principle |
| 4 | Timeline | The month is one piece; each day is 4 bars at 110 BPM (about 8.7 s), so 31 days run about 4:30; the slider is the playhead | Matches the 4:30 in the mockup and turns the October build-up into a crescendo |
| 5 | Visual data | Finer grid (0.25° source, quantized) for map and particles; 8×8 grid for audio only | 8×8 is a musical choice, not a performance limit; it would look blocky as particles |

**Brief Ledger (final)**

- One-liner: an interactive globe that turns real ocean-current data into an evolving orchestral piece you can see and hear.
- Site type: music and science microsite with an experiential core.
- Audiences: general public first (phone and laptop, curious, not technical); researchers and educators second; blind and low-vision users as a first-class audience, not an add-on.
- Primary goal: press Play on a region and understand what you hear.
- Feeling: immersive, precise, calm.
- Sound: opt-in only, off by default, never the sole carrier of information.
- Novelty appetite: 3 of 5. Signature moment: the globe dives into the Indian Ocean and the music and current particles start together.
- Scope: Indian Ocean, 10°S to 10°N and 60°E to 90°E, October 2026, NASA OSCAR L4 near-real-time v2.0, static site, no backend.
- Cut from the MVP: Earth Sounds (rain, wind), other Earth systems, global coverage, reactive weather effects, ink-spread transition (kept as a stretch item).

## 2. Strategy

**Goals, in priority order**

1. A first-time visitor presses Play on the Indian Ocean within 20 seconds and can say what the music is doing within a minute.
2. Every sound has a visible and a written counterpart, so the project works with sound off and for blind and low-vision users.
3. A researcher can verify any note back to a cell, a date and a value.

**Audiences and what each needs**

| Audience | Context | Needs | Served by |
| --- | --- | --- | --- |
| Curious public | Phone or laptop, headphones maybe | Instant wonder, one-sentence explanation | Home, Explorer in dark mode |
| Educators and students | Classroom, projector | Clear legend, a story they can narrate | How It Works, guided tour |
| Researchers and judges | Desktop | Provenance, exact values, method | Research Lab, data drawer |
| Blind and low-vision users | Screen reader, keyboard | Live narration, cell-by-cell readout | Accessibility spec (section 8) |

**Success criteria (checked in section 10)**

- Home to first sound in 3 interactions or fewer, and sound never starts without a click.
- Explorer reaches interactive in under 3 s on a mid-range phone over 4G; data payload for the month stays small (see section 9).
- Every data-bearing view has a text equivalent; WCAG 2.2 AA on both themes.
- A judge can answer "where does this note come from?" in two clicks.

**Novelty budget (3 of 5)**

Spend it in two places only: the globe-to-region dive and the synchronized particles and music. Everything else stays conventional: standard navigation, standard sliders, standard focus rings. Novelty that costs usability is cut.

**Signature moment**

On Play, the globe turns to the Indian Ocean and settles into a flat regional relief map. Current particles begin to flow and the first bar sounds in the same beat. Over 4:30 the flow strengthens through October and so does the music, ending on the strongest current day. This follows the peak-end rule: the audience remembers the build and the finish.

**Honesty guardrails**

- OSCAR is model-derived from satellite and in situ inputs, not a direct measurement; say so in the provenance drawer and on About.
- Sound is an interpretation: the data encoding (what is fixed by the numbers) is labeled separately from the arrangement (instrument and style choices).

## 3. Sitemap and user flows

**Sitemap (MVP)**

| Route | Page | Mode | Purpose |
| --- | --- | --- | --- |
| `/` | Home | Public (dark) | Hook, one-line promise, Play and Explore calls to action |
| `/explore` | Regional Explorer | Public (dark) | Globe dive, map, particles, timeline, music, free listening panel |
| `/how-it-works` | How It Works | Public (dark) | Data to sound in four steps, with live mini-demos |
| `/lab` | Research Lab | Research (light) | Exact values, charts, mapping controls, export |
| `/about` | About | Public (dark) | Team, challenge, honest limits, credits and data citations |

Data and Methodology is not a separate page: it is a provenance drawer reachable from Explorer and Lab, and a section on About. Research and Publications is deferred to after the MVP. Earth Synthesizer is the Free listening panel inside Explorer.

**Flow A: first-time visitor (primary)**

1. Home: read the promise, press Explore.
2. Explorer: globe dives to the Indian Ocean; a sound opt-in banner appears ("Turn on sound" or "Continue silent").
3. Press Play: particles flow, the playhead moves, a live caption says what is sounding.
4. Click a cell or use arrow keys: the readout shows its values and the cell solos for a moment.
5. Open How It Works from the caption link, or finish the month and see the end card.

**Flow B: researcher**

1. Home or nav: open Research Lab.
2. Pick a date and cell; the table, time series and vector plot update.
3. Open the provenance drawer for source file and processing notes.
4. Export the cell or date range as CSV or JSON.

**Flow C: keyboard and screen reader**

1. Skip link to the main region on every page.
2. Explorer: map is a focusable grid; arrows move between the 64 cells; Enter plays that cell; the live region announces values.
3. Transport controls (Play, Pause, step day) are standard buttons with visible focus.

**Edge states**

- No WebGL: static relief image with the same grid, readouts and audio.
- Data fails to load: message with a retry button; the page shell stays usable.
- Audio blocked by the browser: the Play button explains it and offers a silent run.

## 4. Global design system

All values are CSS custom properties on `:root`. The Research theme is the same token names redefined under `[data-theme="research"]`.

**Typography**

| Token | Family | Size / line height | Weight | Use |
| --- | --- | --- | --- | --- |
| `--t-display` | Sora | clamp(40px, 6vw, 72px) / 1.05 | 600 | Home headline |
| `--t-h1` | Sora | clamp(32px, 4vw, 48px) / 1.1 | 600 | Page titles |
| `--t-h2` | Sora | 28 / 1.2 | 600 | Section titles |
| `--t-h3` | Sora | 20 / 1.3 | 600 | Panel titles |
| `--t-body` | Inter | 17 / 1.6 | 400 | Paragraphs (never below 16 on mobile) |
| `--t-small` | Inter | 14 / 1.5 | 400 | Captions, helper text |
| `--t-data` | IBM Plex Mono | 14 / 1.4 | 500 | Coordinates, u, v, speed |
| `--t-data-lg` | Sora | 32 / 1.1 | 500, tabular figures | Big readout numbers |

Smallest permitted text is 12 px, used only for tick labels at full contrast. Fonts are self-hosted, subset to Latin, `font-display: swap`.

**Spacing and layout**

Scale: 4, 8, 12, 16, 24, 32, 48, 64 px. Page gutter 16 (mobile), 32 (tablet), 48 (desktop). Max content width 1200 px for text pages; Explorer is full-bleed. Breakpoints: 640, 1024, 1440.

**Color: two themes**

| Role | Public (dark) | Research (light) |
| --- | --- | --- |
| `--bg` | #06131F (Abyss) | #F6F1E7 (paper) |
| `--surface` | #103C4A (Deep teal) at 70% | #FFFFFF |
| `--surface-2` | #176D78 (Ocean) | #EAE3D3 |
| `--text` | #E7F1ED (Pearl) | #14212B (ink) |
| `--text-muted` | #9FB8B3 | #4A5963 |
| `--accent` | #6BE1D0 (Current) | #B4541A (warm rust) |
| `--border` | rgba(231,241,237,.16) | rgba(20,33,43,.18) |
| `--focus` | #FFD166 | #0B5FFF |

Contrast to be verified by script before build: all text pairs at 4.5:1 or better (3:1 for large text and UI borders). Muted text on surface is the pair most likely to fail; adjust `--text-muted` first.

**Data colormap**

Speed uses one perceptually uniform sequential ramp (cmocean "speed"-style, dark blue to warm yellow), fixed 0 to 1.0 m/s on a square-root curve in both themes. No rainbow. Direction is shown by particle heading and arrow glyphs, never by hue alone. The colorbar shows the fixed range and marks values above 1.0 as clipped.

**Shape, elevation, motion**

- Radius: 8 (controls), 16 (panels), 999 (pills). Borders over shadows; one soft glow token (`--glow`) reserved for the active cell and Play button.
- Motion tokens: `--dur-fast` 120 ms, `--dur-base` 240 ms, `--dur-slow` 600 ms, `--dur-dive` 2400 ms; easing `cubic-bezier(.2,.8,.2,1)`.
- `prefers-reduced-motion`: the dive becomes a 240 ms crossfade, particles become static arrows with a speed-scaled length, the playhead still advances.

**Sound palette (UI sounds only; data music is in section 5)**

UI sounds are off unless sound is on, under 150 ms, quiet (peak about -18 dBFS): a soft tick on cell selection, a rising two-note on Play, a falling one on Pause. No sound on hover.

**Components and states**

| Component | States to design |
| --- | --- |
| Button (primary, secondary, icon) | default, hover, focus-visible, active, disabled, loading |
| Transport (play, pause, step, speed) | stopped, playing, buffering, ended |
| Timeline slider | idle, hover scrub, dragging, keyboard step; shows date and day number |
| Cell (map grid) | default, hover, focused, selected, sounding, no-data |
| Readout card | empty, selected, loading, error |
| Sound opt-in banner | prompt, on, off, blocked |
| Layer toggle (particles, grid, bathymetry) | on, off, focus |
| Provenance drawer | closed, open, scroll |
| Legend and colorbar | default, compact (mobile) |

Every interactive state has a visible focus ring (2 px `--focus`, 2 px offset) and a hit area of 44 by 44 px or larger.

## 5. Sonification specification

Principle: the numbers decide what is played; the arrangement decides how it sounds. The two are labeled separately in the UI and in the provenance drawer, so no one mistakes a musical choice for a measurement.

**Data encoding (fixed by the data)**

| Data | Sound parameter | Rule |
| --- | --- | --- |
| Direction (atan2(v, u)) | Pitch class | 16 sectors of 22.5° mapped to scale degrees (a 7-note scale spans two octaves, extra sectors fold to passing tones); 8 sectors repeat notes too often because 33% of cells flow west |
| Latitude | Register | Southern rows low, northern rows high, across 3 octaves |
| Speed | Loudness and note density | Fixed scale 0 to 1.0 m/s, square-root curve; 0 maps to silence, 1.0 to the loudest note; values above 1.0 clip and are flagged |
| Longitude | Stereo pan | 61.9°E full left to 88.3°E full right |
| Spatial order | Scan order | Columns west to east within each beat, so the ear sweeps the ocean |
| Coherence of the 8 rows in a column | Chord thickness | High coherence gives a clean interval; low gives a cluster |

Speed per cell is the mean speed, not the vector mean, because vector averaging cancels opposing flow and understates the strip. Coherence is |vector mean| divided by mean speed, between 0 and 1.

**Time mapping**

- Tempo 110 BPM, 4/4. One day is 4 bars (about 8.7 s). 31 days run about 4:30.
- Each day, the 8 columns play as an arpeggiated sweep across bars 1 to 3, bar 4 holds the day's mean chord and a short breath.
- Between days, values interpolate over the last beat so the music flows instead of stepping.
- The slider is the playhead. Scrubbing jumps to the day's first bar; the map updates at once.
- Because the month builds from a mean speed of about 0.157 to 0.242 m/s and a maximum from 0.35 to 0.93 m/s, the dynamics rise naturally. Do not add an artificial crescendo.

**Scales (user choice, default first)**

| Name | Notes | Feel |
| --- | --- | --- |
| Dorian (default) | D E F G A B C | Open, flowing |
| Pentatonic | C D E G A | Safe, bright |
| Whole tone | C D E F♯ G♯ A♯ | Dreamy, ambiguous |

Changing scale changes pitch names only; speed, pan and timing stay data-driven.

**Instrument layers (arrangement, not data)**

| Layer | Voice | Driven by | Build |
| --- | --- | --- | --- |
| Pad | Detuned saw pair with slow low-pass filter | Mean speed of the whole grid | Web Audio oscillators |
| Lead | Soft sine with light vibrato | Cell under the sweep | Oscillator and gain envelope |
| Pulse | Filtered noise or plucked triangle | Speed above the 75th percentile | Short envelope |
| Bass | Sine | Southernmost rows | Root note drone |

First milestone uses synthesized voices only. Sampled orchestral instruments (strings, harp) are a stretch goal; if added, choose compact, openly licensed samples and record the license on About.

**Technical rules**

- One `AudioContext`, created only after the user clicks.
- Schedule notes ahead using the audio clock, not timers, to avoid drift.
- Master gain starts at -12 dB; a limiter prevents clipping when many cells peak.
- Total polyphony cap of 16 voices.
- Data size: the 8×8 JSON is about 0.3 MB for the month, so all of it loads up front and no streaming is needed.

**Traceability**

Every sounding note carries its cell id, date, u, v, speed and mapped pitch. The live caption and the readout show it, so any note can be checked against the Lab table.

## 6. Page specs

Each page lists its sections as goal, content, layout, interaction, sound, accessibility and performance. Shared header: logo, nav (Home, Explore, How It Works, Lab, About), sound toggle, theme is fixed per page (Public dark, Lab light).

### 6.1 Home

| Section | Goal | Content and layout | Interaction and sound | Accessibility and performance |
| --- | --- | --- | --- | --- |
| Hero | Hook in one line | Headline "Hear the ocean move", one-sentence promise, primary button Explore, secondary Listen (opens Explorer and starts the opt-in). Background: slow particle flow on a dark globe, 60 fps cap, paused off-screen | No autoplay sound. Hover on the globe nudges the particles | Static poster image if reduced motion or no WebGL; headline is real text, not an image; hero image under 200 KB |
| How it sounds | Explain in 3 cards | Currents become notes: direction is pitch, speed is loudness, longitude is stereo position. Each card has a 2 s play-sample button | Sample buttons need a click; each shows a caption of what it plays | Cards are lists with real headings; samples have transcripts |
| The Indian Ocean in October | Build curiosity | One large number ("max current 0.35 to 0.93 m/s over the month") with a mini sparkline and one sentence of context | None | Sparkline has a text alternative stating start and end values |
| Call to action | Convert | "Explore the Indian Ocean" button and a link to How It Works | Button leads to the dive | Single clear primary action |
| Footer | Trust | NASA OSCAR credit, Space Apps team, data and methodology link, license | Links only | Visible focus, 44 px targets |

### 6.2 Regional Explorer (the core)

**Layout (desktop):** map fills the viewport; left rail holds the readout and layers; bottom bar holds transport and timeline; right drawer holds the Free listening panel and provenance. Mobile: map on top, transport sticky above a bottom sheet with tabs (Readout, Listen, Layers, About data).

| Region | Content | Interaction | Sound | Accessibility and performance |
| --- | --- | --- | --- | --- |
| Globe dive | Globe with the region outlined; on first entry it dives to the regional map in 2.4 s | Skip link and a "Skip animation" button; reduced motion gives a crossfade | Silent until opt-in | Dive runs on GPU transforms only; interactive within 3 s |
| Regional map | Bathymetry relief, coastlines, 8×8 grid outline, particles from the fine grid colored by the speed ramp | Click or tap a cell; arrow keys move between cells; hover shows a tooltip with value | Selected cell sounds for one note and the sweep highlights columns as it plays | Map is a focusable grid with role and labels; particle count adapts to device (about 4,000 desktop, 1,500 phone) |
| Selected-cell readout | Lat, lon, u, v, speed, direction, valid samples, date | Always shows the snapped cell (center coordinates), never an arbitrary point; a clicked location snaps to its 8×8 cell | Plays the cell on selection | Values in a live region (polite); copy button |
| Transport and timeline | Play, pause, step day, speed (0.5x, 1x, 2x), slider with 31 ticks, date label | Space toggles play; left and right arrows step a day when the slider is focused | The piece plays at the chosen speed | Slider has value text such as "October 12, day 12 of 31" |
| Live caption | One line, updated each day: what is sounding and why ("Strongest current today: 1.4°N, 65.8°E, 0.62 m/s eastward, high pitch, loud, left channel") | Tap to expand the full day summary | Mirrors the sound | Live region (polite), rate limited to once per day change |
| Layers | Particles, grid, bathymetry, arrows toggles | Toggle buttons | None | Defaults chosen so the map is readable with only particles |
| Free listening panel | Choose scale, instrument mix, solo a column, loop a day | Sliders and selects | Immediate audio feedback | Fully keyboard operable; labeled as arrangement choices |
| Provenance drawer | Source, product, version, processing, limitations, citation, download links | Open from a Data link; focus moves into it and returns on close | None | Drawer is a dialog; Escape closes it |
| Sound opt-in | Banner after the dive: "Turn on sound" or "Continue silent" | Choice saved in `localStorage` with a try/catch fallback | Starts the audio context on click only | Both choices equally prominent |
| End card | After day 31: summary of the month and a link to the Lab | Replay or Lab buttons | Fade out | Focus moves to the card heading |

### 6.3 Research Lab (light theme, deliberate rule break)

Goal: let a researcher check any value and the mapping. Layout: three columns on desktop (controls, plots, table), stacked on mobile.

- Controls: date picker, cell picker (row, column), mapping parameters (scale, sector count, speed scale), compare two dates.
- Plots: time series of u, v and speed for the selected cell; vector map for the selected date; speed distribution histogram; each has a data table toggle and a text summary.
- Table: all 64 cells for the date with sort and filter; export CSV and JSON for a cell or range.
- Sound: small preview button for the selected cell only, labeled as a preview.
- Accessibility and performance: charts carry titles, axis labels, and a text summary; tables are real tables; the whole page works without WebGL.

### 6.4 How It Works

Four stages, each a scrolled section with a small live demo: 1 the data (OSCAR, what u and v are), 2 the grid (from 0.25° to 8×8, with the reason it is a musical choice), 3 the mapping (direction, speed, longitude, with the fixed scale), 4 the music (arrangement and instruments). Each ends with a "hear it" button and a transcript. Contains the data-versus-arrangement table from section 5.

### 6.5 About

Team, challenge statement, what the data is and is not (model-derived), limits (one region, one month, 8×8), credits (NASA, OSCAR, bathymetry source, fonts, any samples), accessibility statement, contact and repository link.

### 6.6 Mobile rules (all pages)

- Single column, 16 px gutter, 44 px targets, transport pinned to the bottom with safe-area inset.
- Explorer uses a bottom sheet with a drag handle and a visible Close button; the map never loses the playhead.
- Hover is replaced by tap; tooltips become the readout card.
- Particle count and map resolution drop by device; target 30 fps minimum on a mid-range phone.

## 7. Interaction inventory

| Interaction | Trigger | Result | Duration and easing | Keyboard | Reduced motion |
| --- | --- | --- | --- | --- | --- |
| Globe dive | First entry to Explorer, or Explore button | Camera flies from globe to regional map | 2400 ms, `cubic-bezier(.2,.8,.2,1)` | Enter on the button; Skip animation button | 240 ms crossfade |
| Sound opt-in | Banner buttons | Audio context created, preference saved | Instant | Tab and Enter | Same |
| Play and pause | Button, Space | Playhead moves, music and particles run | Fade in or out 200 ms | Space (global when map or transport focused) | Same; particles become arrows |
| Scrub timeline | Drag or arrow keys on slider | Day jumps, map and readout update, music restarts at the day's bar 1 | 120 ms map crossfade | Left and right step 1 day, Page keys 7 days, Home and End | No crossfade |
| Select cell | Click, tap, arrow keys, Enter | Cell highlight, readout update, one note plays | 120 ms | Arrows move, Enter selects and plays | No glow animation |
| Hover cell | Pointer over a cell | Tooltip with value | 120 ms | Same as focus | Same |
| Toggle layer | Layer toggle | Layer fades in or out | 240 ms | Space or Enter | Instant |
| Change scale or mix | Free listening controls | Arrangement updates on the next bar | Instant | Standard select and slider keys | Same |
| Open provenance drawer | Data link | Dialog slides in, focus trapped | 240 ms | Escape closes, focus returns to the trigger | Instant |
| Change speed | Speed select | Tempo scales 0.5x, 1x, 2x, pitch unchanged | Instant | Select keys | Same |
| Lab: pick date or cell | Controls | Plots and table update | 240 ms | Standard form keys | Instant |
| Lab: export | Export buttons | Downloads CSV or JSON | Instant | Enter | Same |
| Theme boundary | Navigating from Explorer to Lab | Page changes theme with a brief crossfade | 240 ms | Link activation | Instant |

**Global rules**

- No interaction depends on hover alone; no information appears only through sound.
- No autoplay audio, no autoplay motion longer than 5 s without a pause control.
- Every animation is 400 ms or shorter except the dive and decorative background flow, both of which have a skip or pause.

## 8. Accessibility and non-visual experience

This is the project's biggest strategic gap against the challenge and the biggest chance to stand out: a sound-and-map project should work for people who cannot see the map, and for people who cannot or do not want to hear it. Target: WCAG 2.2 AA on both themes.

**Non-visual path (screen reader and keyboard)**

- The 8×8 grid is exposed as a labeled grid (rows by columns). Arrow keys move between cells; each cell has an accessible name such as "Row 4, column 2: 1.4 degrees north, 65.8 degrees east, 0.62 meters per second toward the east".
- The selected-cell readout and live caption are `aria-live="polite"` regions. Updates are rate limited so a screen reader is not flooded while the piece plays.
- A "Describe this day" button gives a three-sentence plain-language summary (strongest area, overall direction, change from yesterday), generated from the data by template, not by a model.
- Every chart and the map have a text summary and a data table alternative.
- Sound is not required for any task; the Lab covers everything numerically.

**Hearing and sound sensitivity**

- Sound is off by default and starts only after an explicit click.
- Volume control is always visible; a Mute button is in the header on every page.
- Every audio sample has a transcript or caption describing what it plays.
- No sudden loud onsets: master fade-in of 200 ms, limiter on the output.

**Vision and perception**

- Text contrast 4.5:1 or better, UI components and focus indicators 3:1 or better, in both themes, verified by script before build.
- The speed ramp is perceptually uniform and readable by people with common color-vision deficiencies; direction is never encoded by hue alone.
- Page text scales to 200% without loss; the Explorer reflows to a single column.
- Small labels in the mockup (below 12 px or low-contrast gray on dark teal) are replaced with the `--t-small` and `--text-muted` tokens.

**Motion and cognition**

- `prefers-reduced-motion` handled as in section 7; an in-page "Reduce motion" toggle mirrors it.
- Nothing flashes more than 3 times per second.
- Plain-language copy at about a grade 8 reading level on public pages; terms such as u and v are explained at first use.
- Consistent navigation and predictable focus order; focus is moved only into dialogs and the end card, and is returned on close.

**Motor**

- Every action is possible with keyboard only; targets are 44 by 44 px; the timeline slider has a keyboard step and does not require dragging.

**Test plan**

- Automated: axe or Lighthouse in CI on all pages and both themes.
- Manual: keyboard-only run of Flows A, B and C; NVDA with Firefox and VoiceOver with Safari on the Explorer; 200% zoom and 320 px width checks.
- Include one blind or low-vision tester before submission if the team can arrange it, and record the feedback in the accessibility statement.

## 9. Data and asset pipeline

All processing happens offline in Python; the site only loads static files.

**Source and validated facts**

- NASA OSCAR L4 Ocean Currents, near-real-time v2.0: model-derived from satellite and in situ inputs. Fields u (eastward) and v (northward) in m/s.
- Region 10°S to 10°N, 60°E to 90°E, 0.25° grid of 81 rows by 121 columns (9,801 points, 9,641 valid). 31 daily steps for October 2026.
- Supplied 8×8 file: 31 days × 64 cells, about 295 KB. Speed = sqrt(u² + v²); direction = atan2(v, u) in degrees.
- The 8×8 bins are uneven (first row 11 source rows, first column 16 columns, others 10 and 15), so cell centers are not exactly evenly spaced. Keep the published centers (latitudes -8.75, -6.125, -3.625, -1.125, 1.375, 3.875, 6.375, 8.875) and state this in the Lab.

**Files the site loads**

| File | Purpose | Format | Target size |
| --- | --- | --- | --- |
| `grid8.json` | Audio and readouts, all 31 days × 64 cells with mean speed and coherence added | JSON, rounded to 3 decimals | 300 to 400 KB, gzip about 80 KB |
| `fine-uv.bin` | Particles and map colors at 0.25° | Int16 u and v per day, scaled by 1000, one file per month with an index | about 1.2 MB before gzip (9,801 × 2 × 2 bytes × 31) |
| `relief.webp` | Bathymetry shaded relief for the region | WebP, 2048 px wide | under 400 KB |
| `globe.webp` | Globe texture for Home and dive | WebP, 2048 by 1024 | under 400 KB |
| `coast.json` | Coastlines and labels | Simplified GeoJSON | under 100 KB |
| `meta.json` | Source, version, processing, citation, checksums | JSON | under 5 KB |

**Preprocessing steps**

1. Download the 31 daily OSCAR files (done by the team; keep the originals, never edit them).
2. Write the fine-grid binary: quantize u and v to Int16 with a stated scale and missing value code.
3. Recompute the 8×8 grid from the fine data and compare with the supplied file; log differences.
4. Add derived fields: mean speed per cell (average of per-point speeds), coherence, rank within the day.
5. Choose bathymetry (candidate: GEBCO; verify the current license and required credit), crop to the region, downsample, render a shaded relief image offline.
6. Write `meta.json` with source versions, date of processing, and the exact formulas.
7. Run a validation script: counts, ranges, no NaN, grid centers, checksum.

**Selected-point rule**

The app never displays values for an arbitrary clicked point. A click snaps to the containing 8×8 cell and shows that cell's center coordinates. The mockup's "5.00°N, 80.75°E" readout matches no cell and its numbers are internally inconsistent; it is replaced by this rule. A fine-grid hover mode may show the nearest 0.25° value and must label it as such.

**Licenses and credits**

OSCAR data credit and DOI, bathymetry credit, font licenses (Sora, Inter, IBM Plex Mono are open licenses; confirm), any sample licenses, all listed on About and in `meta.json`.

## 10. Tech recommendation, build order and acceptance

**Stack**

| Need | Recommendation | Notes |
| --- | --- | --- |
| Framework | Vite with vanilla TypeScript or a light framework (Svelte or React) | Static output, no backend |
| Map and globe | MapLibre GL JS with globe projection, or three.js with a custom globe | Verify the current MapLibre version supports globe projection and custom layers before committing; three.js is the fallback |
| Particles | Canvas 2D or WebGL layer reading `fine-uv.bin` | Particle count adapts to device |
| Audio | Web Audio API, hand-written synth (oscillators, filters, limiter) | No audio library needed for the MVP |
| Styling | CSS custom properties, one stylesheet per theme | Tokens from section 4 |
| Hosting | Any static host (GitHub Pages, Netlify, Cloudflare Pages) | Gzip or Brotli enabled |
| Testing | Playwright, axe, Lighthouse | Run on both themes |

**Build order (each step shippable)**

1. Tokens, fonts, layout shell, nav, both themes, contrast script.
2. Data loader and validation; Lab table and time series for one cell (proves the data end to end).
3. Regional map with the grid, cell selection, readout and keyboard grid navigation.
4. Audio engine: one cell, then a day, then the month; sound opt-in and mute.
5. Timeline, transport and live caption, synchronized with the audio clock.
6. Particles from the fine grid and the speed colormap.
7. Globe dive and Home hero.
8. How It Works and About; provenance drawer.
9. Free listening panel.
10. Accessibility pass, performance pass, device tests, copy edit.

If time runs short, stop after step 8: that is a complete, honest product. Steps 7 and 9 are the first to simplify (a crossfade replaces the dive, the panel becomes two controls).

**Acceptance criteria (quality gates)**

| Area | Pass condition |
| --- | --- |
| Function | Flows A, B and C complete with no console errors on current Chrome, Firefox and Safari |
| Data | Every readout matches the source file for 20 sampled cell-day pairs; no readout for non-cell points |
| Sound | Off by default; starts only after click; no clipping at peak day; a note can be traced to its cell in two clicks |
| Accessibility | axe has zero serious or critical issues; keyboard-only run passes; screen reader reads cell values; contrast script passes on both themes |
| Performance | Largest contentful paint under 2.5 s on a throttled mid-range phone profile; Explorer interactive under 3 s; 30 fps or better during play on that profile; total first-load transfer under 2.5 MB |
| Responsive | Works at 320, 375, 768, 1024, 1440 px; no horizontal scroll |
| Visual | Both themes use only tokens; colorbar range matches the fixed 0 to 1.0 m/s scale; no rainbow ramp |
| Honesty | Provenance drawer and About state that OSCAR is model-derived and that sound is an interpretation |
| Content | No placeholder text; every claim about currents (for example the autumn equatorial eastward jet) is verified against a cited source before it appears in the app |

## 11. Open questions, risks and rule breaks

**Open questions (need the team)**

1. Bathymetry source and license: GEBCO or another? Confirm credit text. A) we can credit
2. Orchestral samples or synthesized voices only? Samples raise quality but add file size and license work. A)synthesized only
3. Hosting and domain, and whether a public repository link is required for submission. A) repo link is required, thinking of hosting with github pages, the website link will also be given
4. Is the October 2026 file the final month, or should the pipeline handle more months later? (The design allows it; the sonification time mapping assumes 31 days.) A) more months can be implemented later
5. Who verifies the oceanography wording (equatorial jet, monsoon context) before it appears in the app? A) manual
6. Can a blind or low-vision tester review before submission? A) possibly no

**Risks**

| Risk | Likelihood | Effect | Mitigation |
| --- | --- | --- | --- |
| Globe projection or custom layers behave badly on low-end phones | Medium | Slow or broken Explorer | Static relief fallback; test on a real device in step 3 |
| Audio timing drifts or stutters | Medium | Music feels broken | Schedule on the audio clock; cap polyphony; test on phones early |
| Mapping sounds repetitive or noisy | Medium | Weak first impression | 16 sectors, latitude register, a tuning pass with a listener who did not build it |
| Scope creep (Earth Sounds, more regions) | High | Unfinished core | Cut list in section 1; stop after build step 8 if needed |
| Claims about currents are wrong or unsupported | Low to medium | Credibility loss | Verify and cite before publishing; say model-derived |
| Autoplay or loud onset | Low | Visitor leaves | Sound off by default, limiter, fade-in |

**Rule breaks (deliberate)**

| Break | Why | Guard |
| --- | --- | --- |
| Light Research theme beside a dark Public theme | Signals a different mode (analysis versus exploration) and suits dense tables and printing | Same tokens and components, switched by `data-theme`; contrast verified for both; the transition is explicit |
| Auto-playing background motion on Home and the dive | The project's first impression is movement | Silent, 5 s or shorter or pausable, reduced-motion fallback, no flashing |
| Full-bleed map with floating panels | Immersion on the core page | Panels remain keyboard reachable; mobile uses a bottom sheet; text contrast on panel backgrounds is verified |
