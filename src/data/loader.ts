/**
 * Dataset Loader & Validator for Ocean Notes
 * Handles loading and decoding of:
 * - 8x8 Acoustic & Readout Grid (grid8.json)
 * - 0.25° Fine Current Grid (fine-uv.bin & fine-meta.json)
 * - Provenance Metadata (meta.json)
 *
 * Requirements:
 * - Little-endian Int16 decoding for fine-uv.bin with scale factor 1000
 * - Sentinel missing value -32768 preserved (no silent substitution)
 * - Strict structural and range validation (31 days x 64 cells)
 */

export interface Grid8Cell {
  row: number;            // 0-based: 0 (South -8.75°) to 7 (North +8.875°)
  column: number;         // 0-based: 0 (West 61.875°) to 7 (East 88.25°)
  row_ui: number;         // 1-based: 1 (South) to 8 (North)
  column_ui: number;      // 1-based: 1 (West) to 8 (East)
  lat: number;            // Cell center latitude in degrees
  lon: number;            // Cell center longitude in degrees
  valid_samples: number;  // Number of valid 0.25° marine grid points in cell
  total_samples: number;  // Total potential grid points in cell
  u_m_s: number;          // Eastward velocity mean in m/s
  v_m_s: number;          // Northward velocity mean in m/s
  vector_speed_m_s: number; // |vector mean| in m/s
  mean_speed_m_s: number;   // Mean of point speeds in m/s (scalar energy)
  direction_deg: number;    // Compass heading in degrees (-180° to +180°)
  coherence: number;        // Directional coherence (|vector mean| / mean point speed, 0..1)
  speed_rank: number;       // Daily speed rank (1 = fastest of 64 cells, 64 = slowest)
}

export interface Grid8Day {
  date: string;           // "2026-10-01" to "2026-10-31"
  day_index: number;      // 1 to 31
  source_file: string;
  mean_grid_speed_m_s: number;
  max_grid_speed_m_s: number;
  min_grid_speed_m_s: number;
  cells: Grid8Cell[];
}

export interface Grid8Dataset {
  dataset: string;
  product_title: string;
  period: { start: string; end: string };
  region: { lat_range: [number, number]; lon_range: [number, number] };
  grid_shape: [number, number];
  days: Grid8Day[];
}

export interface FineGridMeta {
  source: string;
  dates: string[];
  source_files: string[];
  layout: string;
  shape: [number, number, number, number]; // [31, 2, 81, 121]
  scale: number;                           // 1000
  units_after_division: string;            // "m/s"
  missing_value: number;                   // -32768
  lat: number[];                           // 81 values: -10.0 to 10.0
  lon: number[];                           // 121 values: 60.0 to 90.0
}

export interface FineGridDayData {
  date: string;
  dayIndex: number; // 0 to 30
  u: Float32Array;  // shape: 81 * 121 (flat, row-major lat south->north, lon west->east)
  v: Float32Array;
  speed: Float32Array;
  isMissing: Uint8Array; // 1 if missing (-32768 / land), 0 if valid
  validCount: number;
  missingCount: number;
}

let cachedGrid8: Grid8Dataset | null = null;
let cachedFineBuffer: ArrayBuffer | null = null;
let cachedFineMeta: FineGridMeta | null = null;

/**
 * Loads and validates grid8.json
 */
export async function loadGrid8(baseUrl: string = '/data/grid8.json'): Promise<Grid8Dataset> {
  if (cachedGrid8) return cachedGrid8;

  const res = await fetch(baseUrl);
  if (!res.ok) {
    throw new Error(`Failed to load grid8 data from ${baseUrl}: HTTP ${res.status}`);
  }

  const data: Grid8Dataset = await res.json();

  // Strict Validation
  if (!data.days || data.days.length !== 31) {
    throw new Error(`Validation Error: Expected exactly 31 days in grid8.json, got ${data.days?.length}`);
  }

  for (let d = 0; d < 31; d++) {
    const day = data.days[d];
    if (day.day_index !== d + 1) {
      throw new Error(`Validation Error: Invalid day_index at index ${d}: ${day.day_index}`);
    }
    if (!day.cells || day.cells.length !== 64) {
      throw new Error(`Validation Error: Day ${day.date} has ${day.cells?.length} cells, expected 64`);
    }

    // Check cells integrity
    const ranks = new Set<number>();
    for (const cell of day.cells) {
      if (Number.isNaN(cell.u_m_s) || Number.isNaN(cell.v_m_s) || Number.isNaN(cell.mean_speed_m_s)) {
        throw new Error(`Validation Error: NaN detected in cell ${cell.row},${cell.column} on ${day.date}`);
      }
      if (cell.row < 0 || cell.row > 7 || cell.column < 0 || cell.column > 7) {
        throw new Error(`Validation Error: Cell row/col out of 0..7 range`);
      }
      if (cell.row_ui !== cell.row + 1 || cell.column_ui !== cell.column + 1) {
        throw new Error(`Validation Error: Inconsistent 1-based UI indexing`);
      }
      if (cell.speed_rank < 1 || cell.speed_rank > 64) {
        throw new Error(`Validation Error: Invalid speed rank ${cell.speed_rank}`);
      }
      ranks.add(cell.speed_rank);
    }
    if (ranks.size !== 64) {
      throw new Error(`Validation Error: Duplicate speed ranks on day ${day.date}`);
    }
  }

  cachedGrid8 = data;
  return data;
}

/**
 * Loads fine-grid metadata and binary buffer
 */
export async function loadFineGrid(
  binUrl: string = '/data/fine-uv.bin',
  metaUrl: string = '/data/fine-meta.json'
): Promise<{ meta: FineGridMeta; buffer: ArrayBuffer }> {
  if (cachedFineMeta && cachedFineBuffer) {
    return { meta: cachedFineMeta, buffer: cachedFineBuffer };
  }

  const [metaRes, binRes] = await Promise.all([fetch(metaUrl), fetch(binUrl)]);
  if (!metaRes.ok) throw new Error(`Failed to load ${metaUrl}: HTTP ${metaRes.status}`);
  if (!binRes.ok) throw new Error(`Failed to load ${binUrl}: HTTP ${binRes.status}`);

  const meta: FineGridMeta = await metaRes.json();
  const buffer = await binRes.arrayBuffer();

  // Validate exact dimensions: 31 days * 2 components * 81 lat * 121 lon * 2 bytes = 1,215,324 bytes
  const expectedBytes = 31 * 2 * 81 * 121 * 2;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(
      `Validation Error: fine-uv.bin size mismatch: expected ${expectedBytes} bytes, got ${buffer.byteLength}`
    );
  }

  cachedFineMeta = meta;
  cachedFineBuffer = buffer;
  return { meta, buffer };
}

/**
 * Decodes a specific day (0..30) from the fine-uv.bin ArrayBuffer.
 * Strictly decodes little-endian Int16, divides by 1000.0, handles -32768 sentinel without substitution.
 */
export function decodeFineDay(
  buffer: ArrayBuffer,
  dayIndex: number,
  meta?: FineGridMeta
): FineGridDayData {
  if (dayIndex < 0 || dayIndex >= 31) {
    throw new RangeError(`dayIndex ${dayIndex} out of valid range (0..30)`);
  }

  const pointsPerDay = 81 * 121; // 9,801
  const elementsPerDay = 2 * pointsPerDay; // 19,602 int16 elements
  const dayByteOffset = dayIndex * elementsPerDay * 2;

  // View as little-endian Int16Array
  const int16View = new Int16Array(buffer, dayByteOffset, elementsPerDay);

  const u = new Float32Array(pointsPerDay);
  const v = new Float32Array(pointsPerDay);
  const speed = new Float32Array(pointsPerDay);
  const isMissing = new Uint8Array(pointsPerDay);

  let validCount = 0;
  let missingCount = 0;

  for (let i = 0; i < pointsPerDay; i++) {
    const rawU = int16View[i];
    const rawV = int16View[pointsPerDay + i];

    if (rawU === -32768 || rawV === -32768) {
      isMissing[i] = 1;
      u[i] = Number.NaN;
      v[i] = Number.NaN;
      speed[i] = Number.NaN;
      missingCount++;
    } else {
      isMissing[i] = 0;
      const uVal = rawU / 1000.0;
      const vVal = rawV / 1000.0;
      u[i] = uVal;
      v[i] = vVal;
      speed[i] = Math.sqrt(uVal * uVal + vVal * vVal);
      validCount++;
    }
  }

  // Validate missing count: exactly 160 missing points per day
  if (missingCount !== 160 || validCount !== 9641) {
    throw new Error(
      `Validation Error on day ${dayIndex}: expected 160 missing points and 9641 valid points, got missing=${missingCount}, valid=${validCount}`
    );
  }

  return {
    date: meta ? meta.dates[dayIndex] : `Day ${dayIndex + 1}`,
    dayIndex,
    u,
    v,
    speed,
    isMissing,
    validCount,
    missingCount
  };
}

/**
 * Loads project metadata
 */
export async function loadMetadata(metaUrl: string = '/data/meta.json'): Promise<any> {
  const res = await fetch(metaUrl);
  if (!res.ok) throw new Error(`Failed to load ${metaUrl}: HTTP ${res.status}`);
  return res.json();
}
