/**
 * EarthHaze: Atmospheric mist & luminous planetary corona around the Earth limb.
 * Generates an ethereal, breathing atmospheric glow with organic procedural noise
 * along the rim of the Earth element, completely free of surface lines or particles.
 */

export class EarthHaze {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId = 0;
  private isDestroyed = false;
  private time = 0;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'earth-haze-canvas';
    this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    this.resize();

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private onResize = () => {
    this.resize();
  };

  private resize() {
    if (!this.canvas) return;
    const w = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const h = this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.canvas.width = w * (window.devicePixelRatio || 1);
    this.canvas.height = h * (window.devicePixelRatio || 1);
    this.ctx?.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  // Smooth pseudo-noise function based on multiple sine harmonics
  private noise(theta: number, t: number): number {
    return (
      Math.sin(theta * 3 + t * 0.8) * 0.45 +
      Math.sin(theta * 7 - t * 1.2) * 0.3 +
      Math.sin(theta * 13 + t * 1.6) * 0.15 +
      Math.cos(theta * 5 - t * 0.5) * 0.1
    );
  }

  private animate = () => {
    if (this.isDestroyed) return;
    this.time += 0.012;

    if (this.ctx) {
      const w = this.canvas.width / (window.devicePixelRatio || 1);
      const h = this.canvas.height / (window.devicePixelRatio || 1);

      this.ctx.clearRect(0, 0, w, h);

      // Estimate Earth center and radius based on viewport to align with Indian Ocean Earth Horizon
      const isMobile = w <= 768;
      const centerX = isMobile ? w * 0.5 : w * 0.58;
      const centerY = isMobile ? h * 1.4 : h * 1.65;
      const baseRadius = isMobile ? Math.max(w * 0.9, h * 0.95) : Math.max(w * 0.95, h * 1.48);

      // 1. Broad outer atmospheric back-glow (large ambient halo along horizon)
      const ambientGlow = this.ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.85,
        centerX,
        centerY,
        baseRadius * 1.25
      );
      ambientGlow.addColorStop(0, 'rgba(107, 225, 208, 0.10)');
      ambientGlow.addColorStop(0.3, 'rgba(16, 60, 74, 0.14)');
      ambientGlow.addColorStop(0.65, 'rgba(10, 40, 60, 0.07)');
      ambientGlow.addColorStop(1, 'rgba(6, 19, 31, 0)');

      this.ctx.fillStyle = ambientGlow;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, baseRadius * 1.25, 0, Math.PI * 2);
      this.ctx.fill();

      // 2. Animated undulating mist bands along the planetary horizon
      // Horizon arc sweeps across top of sphere (from roughly -155 deg to -25 deg)
      const startAngle = -Math.PI * 0.86;
      const endAngle = -Math.PI * 0.14;
      const angleSpan = endAngle - startAngle;
      const steps = 60;

      // Draw 3 layers of soft glowing atmospheric mist
      const layers = [
        { offset: 0, amp: 14, alpha: 0.16, color: '107, 225, 208', blur: 28 },
        { offset: 10, amp: 20, alpha: 0.11, color: '142, 215, 235', blur: 44 },
        { offset: 22, amp: 28, alpha: 0.07, color: '77, 182, 172', blur: 60 }
      ];

      this.ctx.save();
      for (const layer of layers) {
        this.ctx.beginPath();

        // Calculate outer noise curve
        for (let i = 0; i <= steps; i++) {
          const theta = startAngle + (i / steps) * angleSpan;
          const n = this.noise(theta * 2.5, this.time + layer.offset * 0.1);
          const r = baseRadius + layer.offset + n * layer.amp;

          const px = centerX + Math.cos(theta) * r;
          const py = centerY + Math.sin(theta) * r;

          if (i === 0) {
            this.ctx.moveTo(px, py);
          } else {
            this.ctx.lineTo(px, py);
          }
        }

        // Return along base radius to create closed mist polygon
        for (let i = steps; i >= 0; i--) {
          const theta = startAngle + (i / steps) * angleSpan;
          const r = baseRadius - 6;
          const px = centerX + Math.cos(theta) * r;
          const py = centerY + Math.sin(theta) * r;
          this.ctx.lineTo(px, py);
        }

        this.ctx.closePath();

        this.ctx.fillStyle = `rgba(${layer.color}, ${layer.alpha})`;
        this.ctx.shadowColor = `rgba(${layer.color}, ${layer.alpha * 1.5})`;
        this.ctx.shadowBlur = layer.blur;
        this.ctx.fill();
      }
      this.ctx.restore();

      // 3. Subtle rim specular edge
      this.ctx.save();
      this.ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const theta = startAngle + (i / steps) * angleSpan;
        const n = this.noise(theta * 4, this.time * 1.4);
        const r = baseRadius + n * 4;

        const px = centerX + Math.cos(theta) * r;
        const py = centerY + Math.sin(theta) * r;

        if (i === 0) {
          this.ctx.moveTo(px, py);
        } else {
          this.ctx.lineTo(px, py);
        }
      }
      this.ctx.strokeStyle = 'rgba(184, 230, 223, 0.22)';
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowColor = 'rgba(107, 225, 208, 0.4)';
      this.ctx.shadowBlur = 14;
      this.ctx.stroke();
      this.ctx.restore();
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
    this.canvas.remove();
  }
}
