import * as THREE from 'three';

export interface ReliefMapOptions {
  container: HTMLElement;
  initialRow?: number; // 0..7
  initialCol?: number; // 0..7
  onCellSelect?: (row: number, col: number) => void;
}

export class ReliefMap {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrainMesh: THREE.Mesh | null = null;
  private gridGroup: THREE.Group;
  private coastGroup: THREE.Group;
  private selectionBox: THREE.LineSegments | null = null;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private animationFrameId: number | null = null;

  // Selected cell state (0-based)
  private selectedRow: number;
  private selectedCol: number;
  private onCellSelect?: (row: number, col: number) => void;

  // Grid bounds
  private latBounds = [-10.0, -7.5, -5.0, -2.5, 0.0, 2.5, 5.0, 7.5, 10.0];
  private lonBounds = [60.0, 63.75, 67.5, 71.25, 75.0, 78.75, 82.5, 86.25, 90.0];

  private isReducedMotion: boolean = false;
  private isDisposed: boolean = false;

  constructor(options: ReliefMapOptions) {
    this.container = options.container;
    this.selectedRow = options.initialRow ?? 3;
    this.selectedCol = options.initialCol ?? 4;
    this.onCellSelect = options.onCellSelect;

    this.isReducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06131f);

    // 2. Camera setup
    const aspect = this.container.clientWidth / (this.container.clientHeight || 480);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    // Position camera looking down slightly tilted for dimensional relief
    this.camera.position.set(0, -6, 32);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight || 480);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting setup (optimized for GEBCO relief ridges)
    const ambientLight = new THREE.AmbientLight(0x103c4a, 1.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(-15, 20, 25);
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x6be1d0, 0x06131f, 0.8);
    this.scene.add(hemiLight);

    // Groups
    this.gridGroup = new THREE.Group();
    this.scene.add(this.gridGroup);

    this.coastGroup = new THREE.Group();
    this.scene.add(this.coastGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // Initialize terrain, grid, and event listeners
    this.initTerrain();
    this.buildGridOverlay();
    this.loadCoastlines();
    this.updateSelectionBox();

    this.bindEvents();
    this.startLoop();
  }

  private initTerrain(): void {
    const textureLoader = new THREE.TextureLoader();

    // Load web-optimized assets generated in build pipeline
    const colorTex = textureLoader.load('/data/relief-2048.webp');
    colorTex.colorSpace = THREE.SRGBColorSpace;

    const heightTex = textureLoader.load('/data/height-1024.png');
    const normalTex = textureLoader.load('/data/normal-1024.webp');

    // Plane geometry: 30 wide (60E to 90E) by 20 high (10S to 10N)
    const geometry = new THREE.PlaneGeometry(30, 20, 180, 120);

    const material = new THREE.MeshStandardMaterial({
      map: colorTex,
      displacementMap: heightTex,
      displacementScale: 0.9,
      displacementBias: -0.65,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.7,
      metalness: 0.1
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.terrainMesh);
  }

  private buildGridOverlay(): void {
    const points: THREE.Vector3[] = [];
    const z = 0.35; // Positioned slightly above displaced terrain

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
      opacity: 0.22,
      depthWrite: false
    });

    const gridLines = new THREE.LineSegments(gridGeo, gridMat);
    this.gridGroup.add(gridLines);
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
    const z = 0.38;

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
      linewidth: 2,
      depthWrite: false
    });

    this.selectionBox = new THREE.LineSegments(boxGeo, boxMat);
    this.scene.add(this.selectionBox);
  }

  private loadCoastlines(): void {
    fetch('/data/coast.json')
      .then(res => res.json())
      .then(geojson => {
        if (!geojson.features || this.isDisposed) return;
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x6be1d0,
          transparent: true,
          opacity: 0.55,
          depthWrite: false
        });

        for (const feat of geojson.features) {
          const coords: number[][] = feat.geometry.coordinates[0];
          const pts: THREE.Vector3[] = [];
          for (const [lon, lat] of coords) {
            const x = ((lon - 60.0) / 30.0) * 30.0 - 15.0;
            const y = ((lat - (-10.0)) / 20.0) * 20.0 - 10.0;
            pts.push(new THREE.Vector3(x, y, 0.36));
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

    // Click / Pointer Down for snapping
    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.terrainMesh) {
        const intersects = this.raycaster.intersectObject(this.terrainMesh);
        if (intersects.length > 0) {
          const pt = intersects[0].point;
          // Map x in [-15, 15] -> lon in [60, 90]
          const lon = ((pt.x + 15.0) / 30.0) * 30.0 + 60.0;
          // Map y in [-10, 10] -> lat in [-10, 10]
          const lat = ((pt.y + 10.0) / 20.0) * 20.0 - 10.0;

          const { row, col } = this.snapCoordinatesToCell(lat, lon);
          this.selectCell(row, col);
        }
      }
    });

    // Window Resize Observer
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

  private snapCoordinatesToCell(lat: number, lon: number): { row: number; col: number } {
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

  public setLayerVisibility(layer: 'grid' | 'bathymetry' | 'coastlines', visible: boolean): void {
    if (layer === 'grid') this.gridGroup.visible = visible;
    if (layer === 'coastlines') this.coastGroup.visible = visible;
    if (layer === 'bathymetry' && this.terrainMesh) this.terrainMesh.visible = visible;
  }

  private startLoop(): void {
    const animate = () => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(animate);

      // Subtle pulse on selection reticle unless reduced motion is active
      if (this.selectionBox && !this.isReducedMotion) {
        const time = performance.now() * 0.002;
        const opacity = 0.75 + Math.sin(time) * 0.2;
        (this.selectionBox.material as THREE.LineBasicMaterial).opacity = opacity;
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
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
