// Pagină principală: efect de hover pentru descriere la butoane (fallback pt. mobile)
document.querySelectorAll('.big-btn[data-hover]').forEach(btn => {
  btn.addEventListener('touchstart', function() {
    const tip = document.createElement('div');
    tip.className = 'btn-tip';
    tip.textContent = this.getAttribute('data-hover');
    tip.style.position = 'absolute';
    tip.style.left = '50%';
    tip.style.top = '110%';
    tip.style.transform = 'translate(-50%, 0)';
    tip.style.background = '#f6f8fa';
    tip.style.color = '#1756e9';
    tip.style.padding = '8px 13px';
    tip.style.borderRadius = '7px';
    tip.style.fontSize = '1rem';
    tip.style.boxShadow = '0 2px 12px rgba(23,86,233,0.08)';
    tip.style.zIndex = '2';
    this.appendChild(tip);
    setTimeout(() => { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 1300);
  });
});