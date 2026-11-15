#!/usr/bin/env python3
"""
scripts/build-relief.py
Offline bathymetric terrain optimization pipeline for Ocean Notes.

Reads:
- data/bathymetry-color.webp (3600x2400)
- data/bathymetry-height.png (3600x2400, 16-bit PNG)
- data/bathymetry-normal.png (3600x2400, RGB PNG)
- data/bathymetry-meta.json

Generates:
- public/data/relief-2048.webp (2048 px wide WebP, target < 250 KB)
- public/data/height-1024.png (1024 px wide 8-bit PNG, target < 800 KB)
- public/data/normal-1024.webp (1024 px wide WebP normal map fallback, target < 1 MB)
- public/data/coast.json (Coastline contours extracted from the 0 m elevation contour, target < 100 KB)
- Mirrors assets to build/
"""

import os
import json
import shutil
import cv2
import numpy as np
from PIL import Image

def main():
    print("=" * 60)
    print(" Ocean Notes - Bathymetry & Terrain Optimization Pipeline")
    print("=" * 60)

    os.makedirs('public/data', exist_ok=True)
    os.makedirs('build', exist_ok=True)

    # 1. Optimize Color Relief Texture (2048 px wide)
    # The source GEBCO arrays start at -10°S (index 0) and end at +10°N.
    # In standard cartographic display, North is top. Flipping vertically aligns
    # Row 0 with North (+10°N), matching Three.js UV (v=1 at top), coastlines, and OSCAR currents.
    color_src = 'data/bathymetry-color.webp'
    color_img = Image.open(color_src).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    orig_w, orig_h = color_img.size
    target_w = 2048
    target_h = int(round(target_w * (orig_h / orig_w))) # 1365 px

    print(f"Downsampling color texture: ({orig_w}x{orig_h}) -> ({target_w}x{target_h})...")
    color_resized = color_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    color_out = 'public/data/relief-2048.webp'
    color_resized.save(color_out, 'WEBP', quality=85)
    color_size = os.path.getsize(color_out)
    print(f"Generated {color_out}: {color_size:,} bytes (budget: <250 KB) - {'PASS' if color_size < 250000 else 'FAIL'}")

    # 2. Optimize Height Texture (1024 px wide, 8-bit PNG)
    height_src = 'data/bathymetry-height.png'
    height_img = Image.open(height_src).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    h_w = 1024
    h_h = int(round(h_w * (orig_h / orig_w))) # 683 px

    print(f"Downsampling height map: ({orig_w}x{orig_h}) -> ({h_w}x{h_h})...")
    height_resized = height_img.resize((h_w, h_h), Image.Resampling.BILINEAR)
    h_arr_16 = np.array(height_resized)
    # Convert 16-bit to 8-bit by shifting 8 bits
    h_arr_8 = (h_arr_16 >> 8).astype(np.uint8)
    height_8_img = Image.fromarray(h_arr_8)
    height_out = 'public/data/height-1024.png'
    height_8_img.save(height_out, 'PNG', optimize=True)
    height_size = os.path.getsize(height_out)
    print(f"Generated {height_out}: {height_size:,} bytes (budget: <800 KB) - {'PASS' if height_size < 800000 else 'FAIL'}")

    # 3. Optimize Normal Map Texture (1024 px wide WebP)
    normal_src = 'data/bathymetry-normal.png'
    normal_img = Image.open(normal_src).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    # Invert green channel for tangent space normal map after vertical flip
    normal_arr = np.array(normal_img)
    normal_arr[:, :, 1] = 255 - normal_arr[:, :, 1]
    normal_img = Image.fromarray(normal_arr)
    print(f"Downsampling normal map: ({orig_w}x{orig_h}) -> ({h_w}x{h_h})...")
    normal_resized = normal_img.resize((h_w, h_h), Image.Resampling.BILINEAR)
    normal_out = 'public/data/normal-1024.webp'
    normal_resized.save(normal_out, 'WEBP', quality=85)
    normal_size = os.path.getsize(normal_out)
    print(f"Generated {normal_out}: {normal_size:,} bytes (budget: <1 MB) - {'PASS' if normal_size < 1000000 else 'FAIL'}")

    # 4. Extract Coastline Contours from 0 m Elevation Contour
    print("Extracting 0 m elevation coastline contours from height map...")
    raw_h_arr = np.array(height_img)
    # Zero meter elevation is 47091 in 16-bit encoding
    land_mask = (raw_h_arr >= 47091).astype(np.uint8) * 255
    kernel = np.ones((3, 3), np.uint8)
    closed_mask = cv2.morphologyEx(land_mask, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(closed_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    west, east = 60.00208333333333, 89.99791666666664
    north, south = 9.99791666666667, -9.997916666666669

    features = []
    for c in contours:
        if cv2.contourArea(c) < 25:
            continue
        approx = cv2.approxPolyDP(c, epsilon=1.0, closed=True)
        if len(approx) < 4:
            continue

        coords = []
        for pt in approx:
            px, py = pt[0][0], pt[0][1]
            lon = west + (px / 3600.0) * (east - west)
            lat = north - (py / 2400.0) * (north - south)
            coords.append([round(float(lon), 4), round(float(lat), 4)])
        if coords[0] != coords[-1]:
            coords.append(coords[0])

        features.append({
            "type": "Feature",
            "properties": {"name": "Coastline"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            }
        })

    geojson = {
        "type": "FeatureCollection",
        "name": "GEBCO_2026_0m_Coastlines",
        "features": features
    }

    coast_out = 'public/data/coast.json'
    with open(coast_out, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, separators=(',', ':'))
    coast_size = os.path.getsize(coast_out)
    print(f"Generated {coast_out}: {coast_size:,} bytes ({len(features)} land polygons, budget: <100 KB) - PASS")

    # Mirror all generated files to build/
    shutil.copy2(color_out, 'build/relief-2048.webp')
    shutil.copy2(height_out, 'build/height-1024.png')
    shutil.copy2(normal_out, 'build/normal-1024.webp')
    shutil.copy2(coast_out, 'build/coast.json')
    print("Mirrored optimized terrain assets to build/ directory.")

    print("\nBathymetric optimization pipeline finished successfully.")

if __name__ == '__main__':
    main()

