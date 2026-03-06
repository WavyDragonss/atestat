// ========================
// Particle network animation
// ========================
(function () {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const NUM = 65;
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function make() {
    return {
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 1.8 + 0.5,
      dx: (Math.random() - 0.5) * 0.45,
      dy: (Math.random() - 0.5) * 0.45,
      a:  Math.random() * 0.45 + 0.1,
    };
  }

  function init() {
    particles = [];
    for (let i = 0; i < NUM; i++) particles.push(make());
  }

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(129,140,248,${p.a})`;
      ctx.fill();
    }

    // draw connection lines for nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(129,140,248,${0.18 * (1 - d / 130)})`;
          ctx.lineWidth = 0.7;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  resize();
  init();
  frame();
  window.addEventListener('resize', () => { resize(); init(); });
})();

// ========================
// Mobile touch tooltip
// ========================
document.querySelectorAll('.big-btn[data-hover]').forEach(btn => {
  btn.addEventListener('touchstart', function () {
    const tip = document.createElement('div');
    tip.className = 'btn-tip';
    tip.textContent = this.getAttribute('data-hover');
    tip.style.cssText = [
      'position:absolute',
      'left:50%',
      'bottom:calc(100% + 8px)',
      'transform:translateX(-50%)',
      'background:rgba(15,23,42,0.97)',
      'color:#94a3b8',
      'padding:9px 14px',
      'border-radius:9px',
      'font-size:0.85rem',
      'box-shadow:0 6px 20px rgba(0,0,0,0.4)',
      'z-index:20',
      'white-space:normal',
      'max-width:230px',
      'text-align:center',
      'border:1px solid rgba(79,70,229,0.3)',
      'pointer-events:none',
    ].join(';');
    this.appendChild(tip);
    setTimeout(() => { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 1800);
  }, { passive: true });
});