#!/usr/bin/env python3
"""
scripts/build-data.py
Offline data processing pipeline for Ocean Notes (NASA Space Apps Challenge 2026).

Reads:
- data/indian_ocean_october_2026.json (supplied 8x8 OSCAR grid)
- data/fine-uv.bin (0.25° fine grid, Int16 little-endian, scaled x1000)
- data/fine-meta.json (fine grid metadata)
- data/bathymetry-meta.json (GEBCO bathymetry metadata)

Generates:
- public/data/grid8.json: 31 days x 64 cells with derived mean point speed, vector means, coherence, and daily rank (rounded to 3 decimals).
- public/data/meta.json: complete provenance, checksums, formulas, 8x8 grid definition, and GEBCO attribution.
- public/data/fine-uv.bin & public/data/fine-meta.json: copied to web public directory.
"""

import os
import json
import hashlib
import shutil
import numpy as np
from datetime import datetime, timezone

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    print("=" * 60)
    print(" Ocean Notes - Offline Data Processing Pipeline")
    print("=" * 60)

    os.makedirs('public/data', exist_ok=True)
    os.makedirs('build', exist_ok=True)

    # 1. Load fine-meta.json
    with open('data/fine-meta.json', 'r') as f:
        fine_meta = json.load(f)
    print(f"Loaded fine-meta.json: shape {fine_meta['shape']}")

    # 2. Load fine-uv.bin
    fine_bin_path = 'data/fine-uv.bin'
    fine_sha = sha256_file(fine_bin_path)
    raw_fine = np.fromfile(fine_bin_path, dtype='<i2').reshape((31, 2, 81, 121))
    print(f"Loaded fine-uv.bin: {raw_fine.shape}, SHA-256: {fine_sha[:12]}...")

    # Validate missing values
    missing_mask = (raw_fine == -32768)
    daily_missing = missing_mask.sum(axis=(2, 3))
    print(f"Missing points per day: u={daily_missing[0,0]}, v={daily_missing[0,1]} (constant 160 land points)")
    assert np.all(daily_missing == 160), "Unexpected missing point count"

    # Convert to physical m/s with NaN for missing
    u_fine = raw_fine[:, 0, :, :].astype(np.float64) / 1000.0
    v_fine = raw_fine[:, 1, :, :].astype(np.float64) / 1000.0
    u_fine[missing_mask[:, 0, :, :]] = np.nan
    v_fine[missing_mask[:, 1, :, :]] = np.nan
    pt_speed_fine = np.sqrt(u_fine**2 + v_fine**2)

    # 3. Load supplied 8x8 JSON
    supplied_json_path = 'data/indian_ocean_october_2026.json'
    supplied_sha = sha256_file(supplied_json_path)
    with open(supplied_json_path, 'r') as f:
        supplied_data = json.load(f)
    print(f"Loaded supplied 8x8 JSON: {len(supplied_data['days'])} days, SHA-256: {supplied_sha[:12]}...")

    # Define uneven bin slices:
    # Row 0: 11 points (indices 0:11), Rows 1..7: 10 points each
    row_slices = [(0, 11)] + [(11 + i * 10, 11 + (i + 1) * 10) for i in range(7)]
    # Col 0: 16 points (indices 0:16), Cols 1..7: 15 points each
    col_slices = [(0, 16)] + [(16 + j * 15, 16 + (j + 1) * 15) for j in range(7)]

    # Expected published centers
    expected_lat_centers = [-8.75, -6.125, -3.625, -1.125, 1.375, 3.875, 6.375, 8.875]
    expected_lon_centers = [61.875, 65.75, 69.5, 73.25, 77.0, 80.75, 84.5, 88.25]

    lats = np.array(fine_meta['lat'])
    lons = np.array(fine_meta['lon'])

    for r, (r0, r1) in enumerate(row_slices):
        calc_lat = float(np.mean(lats[r0:r1]))
        assert abs(calc_lat - expected_lat_centers[r]) < 1e-4, f"Lat center mismatch row {r}"

    for c, (c0, c1) in enumerate(col_slices):
        calc_lon = float(np.mean(lons[c0:c1]))
        assert abs(calc_lon - expected_lon_centers[c]) < 1e-4, f"Lon center mismatch col {c}"
    print("Verified 8x8 bin boundaries and center coordinates.")

    # 4. Derive grid8 dataset
    grid8_days = []
    max_diff_u = 0.0
    max_diff_v = 0.0

    for d in range(31):
        day_date = fine_meta['dates'][d]
        supplied_day_cells = supplied_data['days'][d]['cells']
        cells_out = []

        for cell_idx, orig_cell in enumerate(supplied_day_cells):
            r = orig_cell['row']
            c = orig_cell['column']
            r0, r1 = row_slices[r]
            c0, c1 = col_slices[c]

            u_slice = u_fine[d, r0:r1, c0:c1]
            v_slice = v_fine[d, r0:r1, c0:c1]
            s_slice = pt_speed_fine[d, r0:r1, c0:c1]

            valid_samples = int(np.count_nonzero(~np.isnan(u_slice)))
            assert valid_samples == orig_cell['valid_samples'], f"Sample count mismatch at day {d}, row {r}, col {c}"

            # Vector means
            u_bar = float(np.nanmean(u_slice))
            v_bar = float(np.nanmean(v_slice))

            # Check difference against supplied JSON
            diff_u = abs(u_bar - orig_cell['u_m_s'])
            diff_v = abs(v_bar - orig_cell['v_m_s'])
            if diff_u > max_diff_u: max_diff_u = diff_u
            if diff_v > max_diff_v: max_diff_v = diff_v

            # Vector speed & direction
            vector_speed = float(np.sqrt(u_bar**2 + v_bar**2))
            direction_deg = float(np.degrees(np.arctan2(v_bar, u_bar)))

            # Mean point speed (scalar energy, avoids opposing flow cancellation)
            mean_point_speed = float(np.nanmean(s_slice))

            # Directional Coherence = |vector mean| / mean point speed
            coherence = float(vector_speed / mean_point_speed) if mean_point_speed > 0 else 0.0
            coherence = min(1.0, max(0.0, coherence))

            cells_out.append({
                "row": r,                     # 0-based index (0=south, 7=north)
                "column": c,                  # 0-based index (0=west, 7=east)
                "row_ui": r + 1,              # 1-based index (1=south, 8=north)
                "column_ui": c + 1,           # 1-based index (1=west, 8=east)
                "lat": round(expected_lat_centers[r], 3),
                "lon": round(expected_lon_centers[c], 3),
                "valid_samples": valid_samples,
                "total_samples": (r1 - r0) * (c1 - c0),
                "u_m_s": round(u_bar, 3),
                "v_m_s": round(v_bar, 3),
                "vector_speed_m_s": round(vector_speed, 3),
                "mean_speed_m_s": round(mean_point_speed, 3),
                "direction_deg": round(direction_deg, 1),
                "coherence": round(coherence, 3),
                # Temporary placeholder for rank
                "speed_rank": 0
            })

        # Calculate daily speed rank (1 = fastest, 64 = slowest based on mean_speed_m_s)
        sorted_indices = sorted(range(len(cells_out)), key=lambda i: cells_out[i]['mean_speed_m_s'], reverse=True)
        for rank, idx in enumerate(sorted_indices, start=1):
            cells_out[idx]['speed_rank'] = rank

        # Day statistics
        day_mean_speeds = [c['mean_speed_m_s'] for c in cells_out]
        day_stat = {
            "date": day_date,
            "day_index": d + 1, # 1 to 31
            "source_file": fine_meta['source_files'][d],
            "mean_grid_speed_m_s": round(float(np.mean(day_mean_speeds)), 3),
            "max_grid_speed_m_s": round(float(np.max(day_mean_speeds)), 3),
            "min_grid_speed_m_s": round(float(np.min(day_mean_speeds)), 3),
            "cells": cells_out
        }
        grid8_days.append(day_stat)

    print(f"Max difference from supplied JSON: U = {max_diff_u:.6f} m/s, V = {max_diff_v:.6f} m/s (tolerance < 0.0001)")
    assert max_diff_u < 0.0001 and max_diff_v < 0.0001, "Derived U/V exceeds tolerance"

    # Write grid8.json
    grid8_payload = {
        "dataset": "OSCAR_L4_OC_NRT_V2.0",
        "product_title": "Ocean Notes - 8x8 Acoustic & Readout Grid",
        "period": {"start": fine_meta['dates'][0], "end": fine_meta['dates'][-1]},
        "region": {"lat_range": [-10.0, 10.0], "lon_range": [60.0, 90.0]},
        "grid_shape": [8, 8],
        "days": grid8_days
    }

    grid8_out_path = 'public/data/grid8.json'
    with open(grid8_out_path, 'w', encoding='utf-8') as f:
        json.dump(grid8_payload, f, separators=(',', ':'))
    grid8_sha = sha256_file(grid8_out_path)
    print(f"Generated {grid8_out_path} ({os.path.getsize(grid8_out_path)} bytes, SHA-256: {grid8_sha[:12]}...)")

    # 5. Load bathymetry-meta.json
    with open('data/bathymetry-meta.json', 'r') as f:
        bathy_meta = json.load(f)

    # 6. Generate meta.json with full provenance, checksums, and GEBCO citation
    meta_payload = {
        "project": "Ocean Notes",
        "challenge": "NASA Space Apps Challenge 2026",
        "generation_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "region": {
            "name": "Tropical Indian Ocean",
            "lat_bounds": [-10.0, 10.0],
            "lon_bounds": [60.0, 90.0]
        },
        "period": {
            "start": "2026-10-01",
            "end": "2026-10-31",
            "days_count": 31
        },
        "datasets": {
            "ocean_currents": {
                "source": "NASA OSCAR L4 Ocean Currents NRT v2.0 (PO.DAAC)",
                "doi": "10.5067/OSCAR-25N20",
                "doi_url": "https://doi.org/10.5067/OSCAR-25N20",
                "nature": "Model-derived from satellite altimetry, scatterometer wind fields, and drifters (0-30m layer average)",
                "fine_grid": {
                    "file": "fine-uv.bin",
                    "shape": [31, 2, 81, 121],
                    "dtype": "int16 little-endian",
                    "scale": 1000,
                    "units": "m/s",
                    "missing_value": -32768,
                    "valid_points_per_day": 9641,
                    "missing_points_per_day": 160,
                    "sha256": fine_sha
                },
                "audio_grid": {
                    "file": "grid8.json",
                    "shape": [8, 8],
                    "total_cells": 64,
                    "row_indexing": "1-based in UI, row 1 at South (-8.75°), row 8 at North (+8.875°)",
                    "column_indexing": "1-based in UI, column 1 at West (61.875°), column 8 at East (88.25°)",
                    "lat_centers": expected_lat_centers,
                    "lon_centers": expected_lon_centers,
                    "row_slices_025deg": row_slices,
                    "col_slices_025deg": col_slices,
                    "sha256": grid8_sha
                }
            },
            "bathymetry": {
                "source": "GEBCO Bathymetric Compilation Group 2026 (2026). The GEBCO_2026 Grid - a continuous terrain model for oceans and land at 15 arc-second intervals. doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa",
                "doi": "10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa",
                "doi_url": "https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa",
                "gebco_metadata": bathy_meta
            }
        },
        "formulas": {
            "point_speed": "sqrt(u^2 + v^2)",
            "vector_mean_u": "mean(valid u points within cell)",
            "vector_mean_v": "mean(valid v points within cell)",
            "vector_speed": "sqrt(u_mean^2 + v_mean^2)",
            "direction_deg": "atan2(v_mean, u_mean) * (180 / pi)",
            "mean_cell_speed": "mean(point_speed for all valid points within cell)",
            "directional_coherence": "vector_speed / mean_cell_speed",
            "height_decode_elevation_m": "minimum + (pixel / 65535) * (maximum - minimum)"
        },
        "source_checksums": {
            "indian_ocean_october_2026.json": supplied_sha,
            "fine-uv.bin": fine_sha
        }
    }

    meta_out_path = 'public/data/meta.json'
    with open(meta_out_path, 'w', encoding='utf-8') as f:
        json.dump(meta_payload, f, indent=2)
    print(f"Generated {meta_out_path} ({os.path.getsize(meta_out_path)} bytes)")

    # Copy fine-uv.bin and fine-meta.json to public/data/
    shutil.copy2('data/fine-uv.bin', 'public/data/fine-uv.bin')
    shutil.copy2('data/fine-meta.json', 'public/data/fine-meta.json')
    print("Copied fine-uv.bin and fine-meta.json to public/data/")

    # Also mirror into build/
    shutil.copy2(grid8_out_path, 'build/grid8.json')
    shutil.copy2(meta_out_path, 'build/meta.json')
    print("Mirrored outputs into build/ directory.")

    print("\nData processing completed successfully with 100% mathematical integrity.")

if __name__ == '__main__':
    main()

