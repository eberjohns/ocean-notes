import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Grid8Cell } from '../../data/loader.ts';
import { assetUrl } from '../../utils/assets.ts';

export interface ReliefMapOptions {
  container: HTMLElement;
  initialRow?: number; // 0..7
  initialCol?: number; // 0..7
  onCellSelect?: (row: number, col: number) => void;
}

export type ViewCameraMode = 'perspective3d' | 'topdown2d' | 'focusCell';

export class ReliefMap {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls | null = null;

  private terrainMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private gridGroup: THREE.Group;
  private coastGroup: THREE.Group;
  private currentsGroup: THREE.Group;
  private selectionBox: THREE.LineSegments | null = null;

  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private pointerDownPos: { x: number; y: number } = { x: 0, y: 0 };
  private pointerDownTime = 0;

  private animationFrameId: number | null = null;

  // Selected cell state (0-based)
  private selectedRow: number;
  private selectedCol: number;
  private onCellSelect?: (row: number, col: number) => void;

  // Camera presets
  private currentViewMode: ViewCameraMode = 'perspective3d';
  private targetCameraPos = new THREE.Vector3(0, -18, 16);
  private targetControlsTarget = new THREE.Vector3(0, 0, 0);
  private isPresetTransitionActive = false;

  // Non-uniform 8x8 bin bounds matching the OSCAR 81x121 fine grid partition
  private latBounds = [-10.0, -7.375, -4.875, -2.375, 0.125, 2.625, 5.125, 7.625, 10.0];
  private lonBounds = [60.0, 63.875, 67.625, 71.375, 75.125, 78.875, 82.625, 86.375, 90.0];

  private currentCells: Grid8Cell[] | null = null;
  private isReducedMotion: boolean = false;
  private isDisposed: boolean = false;

  public getCurrentCells(): Grid8Cell[] | null {
    return this.currentCells;
  }

  constructor(options: ReliefMapOptions) {
    this.container = options.container;
    this.selectedRow = options.initialRow ?? 3;
    this.selectedCol = options.initialCol ?? 4;
    this.onCellSelect = options.onCellSelect;

    this.isReducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    // 1. Scene setup with deep ocean background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06131f);

    // 2. Camera setup: 3D perspective angle with Z as UP
    const aspect = this.container.clientWidth / (this.container.clientHeight || 480);
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.up.set(0, 0, 1); // Z is vertical (sky/elevation), XY is geographic map
    this.camera.position.set(0, -18, 16);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight || 480);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls for interactive 3D map exploration (pan, zoom, tilt)
    try {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.screenSpacePanning = true;
      this.controls.minDistance = 5.0;
      this.controls.maxDistance = 42.0;

      // Bound tilting angle: from top-down down to near-horizon (cannot flip beneath seabed)
      this.controls.minPolarAngle = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.12;

      // Map navigation: Left-drag pans X/Y across all regions, Right-drag tilts & rotates
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
      };
      this.controls.touches = {
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_ROTATE
      };

      this.controls.target.set(0, 0, 0);
      this.controls.update();

      // Bounding box for map movement: prevents losing the Indian Ocean
      const maxPanX = 14.5;
      const maxPanY = 9.5;
      this.controls.addEventListener('change', () => {
        if (!this.controls) return;
        if (this.controls.target.x < -maxPanX) this.controls.target.x = -maxPanX;
        if (this.controls.target.x > maxPanX) this.controls.target.x = maxPanX;
        if (this.controls.target.y < -maxPanY) this.controls.target.y = -maxPanY;
        if (this.controls.target.y > maxPanY) this.controls.target.y = maxPanY;
        this.controls.target.z = 0;
      });

      // User interaction immediately ends automated camera lerping so the view stays locked
      this.controls.addEventListener('start', () => {
        this.isPresetTransitionActive = false;
      });
    } catch {
      // In headless or mock test environments without DOM events, controls stay null
    }

    // 5. Lighting setup: Directional sunlight casting 3D relief shadows
    const ambientLight = new THREE.AmbientLight(0x103c4a, 1.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.6);
    sunLight.position.set(-18, -12, 24);
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x6be1d0, 0.9);
    fillLight.position.set(16, 20, 18);
    this.scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x6be1d0, 0x06131f, 0.7);
    this.scene.add(hemiLight);

    // 6. Layer Groups
    this.gridGroup = new THREE.Group();
    this.scene.add(this.gridGroup);

    this.coastGroup = new THREE.Group();
    this.scene.add(this.coastGroup);

    this.currentsGroup = new THREE.Group();
    this.scene.add(this.currentsGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // 7. Initialize 3D terrain, ocean water overlay, grid, and coastlines
    this.initTerrain();
    this.initOceanWater();
    this.buildGridOverlay();
    this.loadCoastlines();
    this.updateSelectionBox();

    this.bindEvents();
    this.startLoop();
  }

  /**
   * Shaders to feather outer boundaries seamlessly into #06131F
   */
  private applyBoundaryFeather(material: THREE.Material): void {
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying vec2 vLocalPos;`
      ).replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vLocalPos = position.xy;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         varying vec2 vLocalPos;`
      ).replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         float edgeX = smoothstep(15.0, 11.5, abs(vLocalPos.x));
         float edgeY = smoothstep(10.0, 7.0, abs(vLocalPos.y));
         float edgeFactor = edgeX * edgeY;
         gl_FragColor.rgb = mix(vec3(0.0235, 0.0745, 0.1215), gl_FragColor.rgb, edgeFactor);`
      );
    };
  }

  private initTerrain(): void {
    const textureLoader = new THREE.TextureLoader();

    // Load web-optimized assets
    const colorTex = textureLoader.load(assetUrl('data/relief-2048.webp'));
    colorTex.colorSpace = THREE.SRGBColorSpace;

    const heightTex = textureLoader.load(assetUrl('data/height-1024.png'));
    const normalTex = textureLoader.load(assetUrl('data/normal-1024.webp'));

    // Plane geometry: 30 wide (60E to 90E) by 20 high (10S to 10N)
    // High tessellation for realistic bathymetric 3D displacement
    const geometry = new THREE.PlaneGeometry(30, 20, 240, 160);

    const material = new THREE.MeshStandardMaterial({
      map: colorTex,
      displacementMap: heightTex,
      displacementScale: 2.2, // Enhanced 3D displacement for visible seabed relief
      displacementBias: -1.3,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(1.8, 1.8),
      roughness: 0.65,
      metalness: 0.12
    });

    this.applyBoundaryFeather(material);

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.terrainMesh);
  }

  /**
   * Ocean Water Surface Overlay
   * Semi-translucent glistening water layer with physical depth shading and reflection
   */
  private initOceanWater(): void {
    const waterGeo = new THREE.PlaneGeometry(30, 20, 60, 40);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x063a52,
      transparent: true,
      opacity: 0.58,
      roughness: 0.12,
      metalness: 0.18,
      transmission: 0.35,
      ior: 1.333,
      reflectivity: 0.82,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      depthWrite: false
    });

    this.applyBoundaryFeather(waterMat);

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.z = 0.08; // Positioned right at sea level
    this.scene.add(this.waterMesh);
  }

  /**
   * 8x8 Non-Uniform Grid Overlay
   */
  private buildGridOverlay(): void {
    const points: THREE.Vector3[] = [];
    const z = 0.42; // Above water and seabed

    // Vertical boundary lines (Longitudes)
    for (const lon of this.lonBounds) {
      const x = ((lon - 60.0) / 30.0) * 30.0 - 15.0;
      points.push(new THREE.Vector3(x, -10, z));
      points.push(new THREE.Vector3(x, 10, z));
    }

    // Horizontal boundary lines (Latitudes)
    for (const lat of this.latBounds) {
      const y = ((lat - (-10.0)) / 20.0) * 20.0 - 10.0;
      points.push(new THREE.Vector3(-15, y, z));
      points.push(new THREE.Vector3(15, y, z));
    }

    const gridGeo = new THREE.BufferGeometry().setFromPoints(points);
    const gridMat = new THREE.LineBasicMaterial({
      color: 0xe7f1ed,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    });

    const gridLines = new THREE.LineSegments(gridGeo, gridMat);
    this.gridGroup.add(gridLines);
  }

  /**
   * Draw currents as luminous curved contour flow lines (streamlines)
   * Traces the tropical Indian Ocean currents with directional curves
   */
  public updateCurrents(cells: Grid8Cell[]): void {
    this.currentCells = cells;

    // Clear old streamlines
    while (this.currentsGroup.children.length > 0) {
      const obj = this.currentsGroup.children[0] as THREE.Line;
      this.currentsGroup.remove(obj);
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }

    if (!cells || cells.length === 0) return;

    // Continuous bilinear velocity interpolation across the 8x8 grid cell centers
    // Eliminates piecewise-constant staircasing and creates smooth hydrodynamic streamlines
    const getFlowAt = (x: number, y: number): { u: number; v: number; speed: number } => {
      const lon = ((x + 15.0) / 30.0) * 30.0 + 60.0;
      const lat = ((y + 10.0) / 20.0) * 20.0 - 10.0;

      // Approximate grid coordinates [0..7] based on bounds
      const cFrac = Math.max(0, Math.min(6.99, ((lon - 61.875) / (88.25 - 61.875)) * 7));
      const rFrac = Math.max(0, Math.min(6.99, ((lat - (-8.75)) / (8.875 - (-8.75))) * 7));

      const c0 = Math.floor(cFrac);
      const c1 = Math.min(7, c0 + 1);
      const r0 = Math.floor(rFrac);
      const r1 = Math.min(7, r0 + 1);

      const sf = cFrac - c0;
      const tf = rFrac - r0;

      const getCellUV = (r: number, c: number) => {
        const found = cells.find(cell => cell.row === r && cell.column === c);
        if (!found || found.valid_samples === 0) return { u: 0.12, v: 0.02, speed: 0.12 };
        return { u: found.u_m_s, v: found.v_m_s, speed: found.mean_speed_m_s };
      };

      const c00 = getCellUV(r0, c0);
      const c01 = getCellUV(r0, c1);
      const c10 = getCellUV(r1, c0);
      const c11 = getCellUV(r1, c1);

      const u = (1 - sf) * (1 - tf) * c00.u + sf * (1 - tf) * c01.u + (1 - sf) * tf * c10.u + sf * tf * c11.u;
      const v = (1 - sf) * (1 - tf) * c00.v + sf * (1 - tf) * c01.v + (1 - sf) * tf * c10.v + sf * tf * c11.v;
      const speed = (1 - sf) * (1 - tf) * c00.speed + sf * (1 - tf) * c01.speed + (1 - sf) * tf * c10.speed + sf * tf * c11.speed;

      return { u, v, speed };
    };

    // Seed 64 streamline trajectories across the oceanic basin
    const seedPoints: [number, number][] = [];
    for (let gx = -13.5; gx <= 13.5; gx += 3.2) {
      for (let gy = -8.5; gy <= 8.5; gy += 2.4) {
        seedPoints.push([gx + (Math.sin(gx * 2 + gy) * 0.4), gy + (Math.cos(gy * 2 - gx) * 0.4)]);
      }
    }

    const zBase = 0.20; // Floating gracefully over water surface

    for (const [sx, sy] of seedPoints) {
      let cx = sx;
      let cy = sy;
      const pts: THREE.Vector3[] = [];

      for (let step = 0; step < 28; step++) {
        if (cx < -14.5 || cx > 14.5 || cy < -9.5 || cy > 9.5) break;

        pts.push(new THREE.Vector3(cx, cy, zBase));

        const flow = getFlowAt(cx, cy);
        const vLen = Math.hypot(flow.u, flow.v);

        if (vLen < 0.04) {
          cx += 0.22; // gentle eastward tropical drift
        } else {
          // Midpoint RK2 integration for smooth curved flow
          const dt = 0.38;
          const k1u = flow.u / vLen;
          const k1v = flow.v / vLen;
          const midFlow = getFlowAt(cx + k1u * dt * 0.5, cy + k1v * dt * 0.5);
          const midLen = Math.hypot(midFlow.u, midFlow.v) || 0.1;
          cx += (midFlow.u / midLen) * dt;
          cy += (midFlow.v / midLen) * dt;
        }
      }

      if (pts.length >= 4) {
        // Generate silky-smooth Catmull-Rom spline contour
        const curve = new THREE.CatmullRomCurve3(pts);
        const smoothPoints = curve.getPoints(Math.min(60, pts.length * 4));

        const colors: number[] = [];
        const count = smoothPoints.length;
        for (let i = 0; i < count; i++) {
          const t = i / (count - 1);
          // Soft fade-in at head, bright body, fade-out at tail
          const alphaFade = Math.sin(t * Math.PI);
          const r = 0.24 * alphaFade;
          const g = 0.88 * alphaFade;
          const b = 0.82 * alphaFade;
          colors.push(r, g, b);
        }

        const streamGeo = new THREE.BufferGeometry().setFromPoints(smoothPoints);
        streamGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const streamMat = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.72,
          linewidth: 1.5,
          depthWrite: false
        });

        const line = new THREE.Line(streamGeo, streamMat);
        this.currentsGroup.add(line);
      }
    }
  }

  private updateSelectionBox(): void {
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox.geometry.dispose();
      (this.selectionBox.material as THREE.Material).dispose();
      this.selectionBox = null;
    }

    const x0 = ((this.lonBounds[this.selectedCol] - 60.0) / 30.0) * 30.0 - 15.0;
    const x1 = ((this.lonBounds[this.selectedCol + 1] - 60.0) / 30.0) * 30.0 - 15.0;
    const y0 = ((this.latBounds[this.selectedRow] - (-10.0)) / 20.0) * 20.0 - 10.0;
    const y1 = ((this.latBounds[this.selectedRow + 1] - (-10.0)) / 20.0) * 20.0 - 10.0;
    const z = 0.45;

    // Reticle brackets box
    const bracketLenX = (x1 - x0) * 0.25;
    const bracketLenY = (y1 - y0) * 0.25;

    const points: THREE.Vector3[] = [
      // Bottom-left
      new THREE.Vector3(x0, y0 + bracketLenY, z), new THREE.Vector3(x0, y0, z),
      new THREE.Vector3(x0, y0, z), new THREE.Vector3(x0 + bracketLenX, y0, z),
      // Bottom-right
      new THREE.Vector3(x1 - bracketLenX, y0, z), new THREE.Vector3(x1, y0, z),
      new THREE.Vector3(x1, y0, z), new THREE.Vector3(x1, y0 + bracketLenY, z),
      // Top-right
      new THREE.Vector3(x1, y1 - bracketLenY, z), new THREE.Vector3(x1, y1, z),
      new THREE.Vector3(x1, y1, z), new THREE.Vector3(x1 - bracketLenX, y1, z),
      // Top-left
      new THREE.Vector3(x0 + bracketLenX, y1, z), new THREE.Vector3(x0, y1, z),
      new THREE.Vector3(x0, y1, z), new THREE.Vector3(x0, y1 - bracketLenY, z),
      // Full subtle border outline
      new THREE.Vector3(x0, y0, z), new THREE.Vector3(x1, y0, z),
      new THREE.Vector3(x1, y0, z), new THREE.Vector3(x1, y1, z),
      new THREE.Vector3(x1, y1, z), new THREE.Vector3(x0, y1, z),
      new THREE.Vector3(x0, y1, z), new THREE.Vector3(x0, y0, z),
    ];

    const boxGeo = new THREE.BufferGeometry().setFromPoints(points);
    const boxMat = new THREE.LineBasicMaterial({
      color: 0x6be1d0,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });

    this.selectionBox = new THREE.LineSegments(boxGeo, boxMat);
    this.scene.add(this.selectionBox);
  }

  private loadCoastlines(): void {
    fetch(assetUrl('data/coast.json'))
      .then(res => res.json())
      .then(geojson => {
        if (!geojson.features || this.isDisposed) return;
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x6be1d0,
          transparent: true,
          opacity: 0.65,
          depthWrite: false
        });

        for (const feat of geojson.features) {
          const coords: number[][] = feat.geometry.coordinates[0];
          const pts: THREE.Vector3[] = [];
          for (const [lon, lat] of coords) {
            const x = ((lon - 60.0) / 30.0) * 30.0 - 15.0;
            const y = ((lat - (-10.0)) / 20.0) * 20.0 - 10.0;
            pts.push(new THREE.Vector3(x, y, 0.40));
          }
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const line = new THREE.LineLoop(geo, lineMat);
          this.coastGroup.add(line);
        }
      })
      .catch(() => {
        // Coastline failure does not block terrain
      });
  }

  public selectCell(row: number, col: number): void {
    if (row < 0 || row > 7 || col < 0 || col > 7) return;
    this.selectedRow = row;
    this.selectedCol = col;
    this.updateSelectionBox();
    this.onCellSelect?.(row, col);
  }

  public getSelectedCell(): { row: number; col: number; rowUi: number; colUi: number } {
    return {
      row: this.selectedRow,
      col: this.selectedCol,
      rowUi: this.selectedRow + 1,
      colUi: this.selectedCol + 1
    };
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
      this.pointerDownTime = performance.now();
    });

    // Raycast on pointer up ONLY if intentional click (movement < 5px)
    canvas.addEventListener('pointerup', (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - this.pointerDownPos.x);
      const dy = Math.abs(e.clientY - this.pointerDownPos.y);
      const elapsed = performance.now() - this.pointerDownTime;

      // If user dragged/rotated the map, do not treat as cell selection click
      if (dx > 5 || dy > 5 || elapsed > 450) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.terrainMesh) {
        const intersects = this.raycaster.intersectObject(this.terrainMesh);
        if (intersects.length > 0) {
          const pt = intersects[0].point;
          const lon = ((pt.x + 15.0) / 30.0) * 30.0 + 60.0;
          const lat = ((pt.y + 10.0) / 20.0) * 20.0 - 10.0;

          const { row, col } = this.snapCoordinatesToCell(lat, lon);
          this.selectCell(row, col);
        }
      }
    });

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (this.isDisposed) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight || 480;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
    resizeObserver.observe(this.container);
  }

  public snapCoordinatesToCell(lat: number, lon: number): { row: number; col: number } {
    let row = 0;
    for (let r = 0; r < 8; r++) {
      if (lat >= this.latBounds[r] && lat <= this.latBounds[r + 1]) {
        row = r;
        break;
      }
    }
    if (lat > 10.0) row = 7;
    if (lat < -10.0) row = 0;

    let col = 0;
    for (let c = 0; c < 8; c++) {
      if (lon >= this.lonBounds[c] && lon <= this.lonBounds[c + 1]) {
        col = c;
        break;
      }
    }
    if (lon > 90.0) col = 7;
    if (lon < 60.0) col = 0;

    return { row, col };
  }

  public setLayerVisibility(layer: 'grid' | 'bathymetry' | 'coastlines' | 'currents' | 'water', visible: boolean): void {
    if (layer === 'grid') this.gridGroup.visible = visible;
    if (layer === 'coastlines') this.coastGroup.visible = visible;
    if (layer === 'currents') this.currentsGroup.visible = visible;
    if (layer === 'bathymetry' && this.terrainMesh) this.terrainMesh.visible = visible;
    if (layer === 'water' && this.waterMesh) this.waterMesh.visible = visible;
  }

  /**
   * Reset View: Back to 3D perspective angle
   */
  public resetView(): void {
    this.setViewMode('perspective3d');
  }

  /**
   * Cycle View Mode: 3D Perspective Tilt <-> Top-Down 2D <-> Focus Cell
   */
  public cycleViewMode(): string {
    if (this.currentViewMode === 'perspective3d') {
      this.setViewMode('topdown2d');
      return 'Top-Down';
    } else if (this.currentViewMode === 'topdown2d') {
      this.setViewMode('focusCell');
      return 'Focus Cell';
    } else {
      this.setViewMode('perspective3d');
      return '3D Angle';
    }
  }

  public setViewMode(mode: ViewCameraMode): void {
    this.currentViewMode = mode;
    this.isPresetTransitionActive = true;

    if (mode === 'topdown2d') {
      this.targetCameraPos.set(0, 0.01, 32);
      this.targetControlsTarget.set(0, 0, 0);
    } else if (mode === 'focusCell') {
      const cx = ((this.lonBounds[this.selectedCol] + this.lonBounds[this.selectedCol + 1]) / 2 - 60.0) / 30.0 * 30.0 - 15.0;
      const cy = ((this.latBounds[this.selectedRow] + this.latBounds[this.selectedRow + 1]) / 2 - (-10.0)) / 20.0 * 20.0 - 10.0;
      this.targetCameraPos.set(cx, cy - 8, 12);
      this.targetControlsTarget.set(cx, cy, 0);
    } else {
      // 'perspective3d'
      this.targetCameraPos.set(0, -18, 16);
      this.targetControlsTarget.set(0, 0, 0);
    }

    if (this.isReducedMotion) {
      this.isPresetTransitionActive = false;
      this.camera.position.copy(this.targetCameraPos);
      this.controls?.target.copy(this.targetControlsTarget);
      this.controls?.update();
    }
  }

  private startLoop(): void {
    const animate = () => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(animate);

      // Smooth camera transition toward target preset ONLY while transition is active
      if (this.isPresetTransitionActive && !this.isReducedMotion) {
        this.camera.position.lerp(this.targetCameraPos, 0.06);
        if (this.controls) {
          this.controls.target.lerp(this.targetControlsTarget, 0.06);
        }
        if (
          this.camera.position.distanceTo(this.targetCameraPos) < 0.06 &&
          (!this.controls || this.controls.target.distanceTo(this.targetControlsTarget) < 0.06)
        ) {
          this.isPresetTransitionActive = false;
        }
      }

      this.controls?.update();

      // Subtle pulse on selection reticle
      if (this.selectionBox && !this.isReducedMotion) {
        const time = performance.now() * 0.002;
        const opacity = 0.75 + Math.sin(time) * 0.2;
        (this.selectionBox.material as THREE.LineBasicMaterial).opacity = opacity;
      }

      // Gentle water ripple shimmer
      if (this.waterMesh && !this.isReducedMotion) {
        const t = performance.now() * 0.001;
        this.waterMesh.position.z = 0.08 + Math.sin(t * 1.5) * 0.015;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.controls?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
