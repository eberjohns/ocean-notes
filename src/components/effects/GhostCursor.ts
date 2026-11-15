/**
 * GhostCursor: Interactive ethereal cursor trail inspired by reactbits.dev/animations/ghost-cursor
 * Renders bioluminescent glowing particles trailing the cursor with velocity-based dissipation.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export class GhostCursor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private lastX = 0;
  private lastY = 0;
  private animId = 0;
  private isDestroyed = false;

  private colors = [
    'rgba(107, 225, 208, ', // Vibrant teal
    'rgba(184, 230, 223, ', // Mint
    'rgba(77, 182, 172, ',  // Mid sea-green
    'rgba(142, 215, 235, '  // Glacial cyan
  ];

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ghost-cursor-canvas';
    this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    this.resize();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });

    this.animate();
  }

  private onResize = () => {
    this.resize();
  };

  private resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
    this.ctx?.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  private emit(x: number, y: number, vx: number, vy: number) {
    if (this.particles.length > 120) return;
    const speed = Math.hypot(vx, vy);
    const count = Math.min(4, Math.max(1, Math.floor(speed * 0.2)));

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spread = Math.random() * 8;
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const maxLife = 35 + Math.random() * 25;

      this.particles.push({
        x: x + Math.cos(angle) * spread,
        y: y + Math.sin(angle) * spread,
        vx: (vx * 0.15) + (Math.random() - 0.5) * 1.5,
        vy: (vy * 0.15) + (Math.random() - 0.5) * 1.5 - 0.3, // Slight upward curl
        size: 2 + Math.random() * 3.5,
        alpha: 0.75 + Math.random() * 0.25,
        life: 0,
        maxLife,
        color
      });
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.lastX !== 0 || this.lastY !== 0) {
      const vx = x - this.lastX;
      const vy = y - this.lastY;
      this.emit(x, y, vx, vy);
    }

    this.lastX = x;
    this.lastY = y;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!e.touches[0]) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    if (this.lastX !== 0 || this.lastY !== 0) {
      const vx = x - this.lastX;
      const vy = y - this.lastY;
      this.emit(x, y, vx, vy);
    }

    this.lastX = x;
    this.lastY = y;
  };

  private animate = () => {
    if (this.isDestroyed) return;

    if (this.ctx) {
      const w = this.canvas.width / (window.devicePixelRatio || 1);
      const h = this.canvas.height / (window.devicePixelRatio || 1);
      this.ctx.clearRect(0, 0, w, h);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;

        const progress = p.life / p.maxLife;
        const currentAlpha = p.alpha * (1 - progress);

        if (progress >= 1 || currentAlpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        const currentSize = p.size * (1 - progress * 0.4);

        // Soft glowing particle with radial bloom
        const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 2.5);
        grad.addColorStop(0, `${p.color}${currentAlpha})`);
        grad.addColorStop(0.4, `${p.color}${currentAlpha * 0.5})`);
        grad.addColorStop(1, `${p.color}0)`);

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, currentSize * 2.5, 0, Math.PI * 2);
        this.ctx.fill();
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
    window.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.remove();
  }
}
