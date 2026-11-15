/**
 * TopographyWave: 3D interactive topographic contour wave background
 * Inspired by reactbits.dev/backgrounds/topography
 * Renders undulating glowing contour mesh lines responding to time and cursor.
 */

export class TopographyWave {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId = 0;
  private isDestroyed = false;
  private time = 0;
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'topography-wave-canvas';
    this.canvas.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;height:220px;pointer-events:none;z-index:1;';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    this.resize();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);

    this.animate();
  }

  private onResize = () => {
    this.resize();
  };

  private resize() {
    if (!this.canvas) return;
    const w = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const h = 220;
    this.canvas.width = w * (window.devicePixelRatio || 1);
    this.canvas.height = h * (window.devicePixelRatio || 1);
    this.ctx?.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.targetMouseX = e.clientX - rect.left;
    this.targetMouseY = e.clientY - rect.top;
  };

  private animate = () => {
    if (this.isDestroyed) return;
    this.time += 0.018;

    // Smooth mouse follow
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    if (this.ctx) {
      const w = this.canvas.width / (window.devicePixelRatio || 1);
      const h = 220;
      this.ctx.clearRect(0, 0, w, h);

      // Render 14 undulating contour lines
      const lineCount = 14;
      const stepX = 14;
      const numCols = Math.ceil(w / stepX) + 1;

      for (let i = 0; i < lineCount; i++) {
        const lineProgress = i / lineCount; // 0 (back) to 1 (front)
        const baseY = h * 0.35 + lineProgress * (h * 0.6);
        const alpha = 0.12 + lineProgress * 0.45;
        const color = `rgba(107, 225, 208, ${alpha})`;

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1 + lineProgress * 0.8;

        for (let col = 0; col <= numCols; col++) {
          const x = col * stepX;
          const nx = x * 0.0035;

          // Multi-frequency wave formula
          const wave1 = Math.sin(nx * 4 + this.time + i * 0.4) * (18 * (1 - lineProgress * 0.3));
          const wave2 = Math.cos(nx * 7 - this.time * 0.7 + i * 0.3) * 10;
          const wave3 = Math.sin(nx * 12 + this.time * 1.2) * 5;

          // Cursor interactive elevation
          const distToMouse = Math.hypot(x - this.mouseX, baseY - this.mouseY);
          const mouseElevation = Math.max(0, 1 - distToMouse / 220) * -28;

          const y = baseY + wave1 + wave2 + wave3 + mouseElevation;

          if (col === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }

        // Draw dotted or glowing line
        if (i % 2 === 0) {
          this.ctx.setLineDash([2, 5]);
        } else {
          this.ctx.setLineDash([]);
        }

        this.ctx.shadowColor = 'rgba(107, 225, 208, 0.4)';
        this.ctx.shadowBlur = 6 * lineProgress;
        this.ctx.stroke();
      }
    }

    if (typeof requestAnimationFrame === 'function') {
      this.animId = requestAnimationFrame(this.animate);
    }
  };

  public destroy() {
    this.isDestroyed = true;
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.remove();
  }
}
