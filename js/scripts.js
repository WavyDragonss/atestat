// Scroll lin la click pe "Despre mine"
document.getElementById('btn-despre-mine').onclick = function() {
  document.getElementById('despre-mine').scrollIntoView({ behavior: 'smooth' });
};

// Pop animation când secțiunea „Despre mine” intră în viewport
const aboutSection = document.getElementById('despre-mine');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      aboutSection.classList.add('visible');
    }
  });
}, { threshold: 0.25 });

observer.observe(aboutSection);