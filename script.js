// Generate barcodes
function generateBarcode(svg) {
  const width = svg.getAttribute('width');
  const height = svg.getAttribute('height');
  const barCount = 50;
  const barWidth = width / barCount;

  svg.innerHTML = '';

  for (let i = 0; i < barCount; i++) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', i * barWidth);
    rect.setAttribute('y', '0');
    rect.setAttribute('width', Math.random() > 0.5 ? 2 : 4);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', '#e5e5e5');
    svg.appendChild(rect);
  }
}

// Initialize barcodes
document.addEventListener('DOMContentLoaded', function() {
  const barcodes = document.querySelectorAll('.barcode');
  barcodes.forEach(barcode => {
    generateBarcode(barcode);
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Add scroll animations (optional)
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe sections for fade-in effect
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(section);
  });
});
