function drawDragonBody() {
  const svg = document.getElementById('dragon-svg');
  const path = document.getElementById('dragon-path');
  const pageHeight = document.documentElement.scrollHeight;
  const windowHeight = window.innerHeight;
  const dragonHeight = Math.max(windowHeight, pageHeight);

  svg.setAttribute('height', dragonHeight);

  // Generate undulating S-curve path
  let d = `M40,0 `;
  const numCurves = Math.max(5, Math.floor(dragonHeight / 200));
  for (let i = 1; i <= numCurves; i++) {
    const y = (dragonHeight / numCurves) * i;
    const x = i % 2 === 0 ? 60 : 20;
    d += `Q${x},${y - (dragonHeight/numCurves)/2} 40,${y} `;
  }
  path.setAttribute('d', d);
}

function updateDragonScroll() {
  const scrollY = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const dragonScrollbar = document.getElementById('dragon-scrollbar');
  const dragonHead = document.getElementById('dragon-head');

  // Scrolled effect (shimmer)
  if (scrollY > 10) dragonScrollbar.classList.add('scrolled');
  else dragonScrollbar.classList.remove('scrolled');

  // Show dragon head at bottom
  if (scrollY >= docHeight - 5) {
    dragonHead.classList.add('visible');
  } else {
    dragonHead.classList.remove('visible');
  }

  // Position dragon head at bottom
  dragonHead.style.bottom = '0px';
  dragonHead.style.right = '0px';
}

window.addEventListener('resize', drawDragonBody);
window.addEventListener('scroll', updateDragonScroll);
document.addEventListener('DOMContentLoaded', () => {
  drawDragonBody();
  updateDragonScroll();
});