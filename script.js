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

// ==================== Gallery Modal System ====================
let currentProjectId = null;
const galleryData = {
  1: { title: 'TB Auctions', image: 'images/kartinka.jpg', description: 'E-commerce platform design for auction management' },
  2: { title: 'Rovu', image: 'images/kartinka2.jpg', description: 'Brand identity and digital design system' },
  3: { title: 'TLD Records', image: 'images/kit.jpg', description: 'Music label branding and web design' },
  4: { title: 'Adaptia', image: 'images/ktya.jpg', description: 'Design and strategy consultancy brand' },
  5: { title: 'Conflux', image: 'images/kit.png', description: 'Tech startup UI/UX design' }
};

// Gallery card click handler
document.addEventListener('DOMContentLoaded', function() {
  const galleryCards = document.querySelectorAll('.gallery-card:not(.empty)');
  
  galleryCards.forEach(card => {
    card.addEventListener('click', function() {
      const projectId = parseInt(this.getAttribute('data-project-id'));
      openModal(projectId);
    });
  });

  // Modal control handlers
  const modal = document.getElementById('imageModal');
  const closeBtn = document.querySelector('.modal-close');
  const prevBtn = document.querySelector('.modal-prev');
  const nextBtn = document.querySelector('.modal-next');

  closeBtn.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', showPrevious);
  nextBtn.addEventListener('click', showNext);

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showPrevious();
    if (e.key === 'ArrowRight') showNext();
  });
});

function openModal(projectId) {
  const modal = document.getElementById('imageModal');
  const project = galleryData[projectId];
  
  if (!project) return;

  currentProjectId = projectId;
  
  document.getElementById('modalImage').src = project.image;
  document.getElementById('modalTitle').textContent = project.title;
  document.getElementById('modalDescription').textContent = project.description;

  updateNavigationButtons();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  currentProjectId = null;
}

function showPrevious() {
  if (!currentProjectId) return;
  const projectIds = Object.keys(galleryData).map(Number).sort((a, b) => a - b);
  const currentIndex = projectIds.indexOf(currentProjectId);
  const previousId = projectIds[currentIndex - 1];
  
  if (previousId) {
    openModal(previousId);
  }
}

function showNext() {
  if (!currentProjectId) return;
  const projectIds = Object.keys(galleryData).map(Number).sort((a, b) => a - b);
  const currentIndex = projectIds.indexOf(currentProjectId);
  const nextId = projectIds[currentIndex + 1];
  
  if (nextId) {
    openModal(nextId);
  }
}

function updateNavigationButtons() {
  const projectIds = Object.keys(galleryData).map(Number).sort((a, b) => a - b);
  const currentIndex = projectIds.indexOf(currentProjectId);
  
  const prevBtn = document.querySelector('.modal-prev');
  const nextBtn = document.querySelector('.modal-next');
  
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === projectIds.length - 1;
}

// ==================== Form Handling ====================
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('projectForm');
  const formMessage = document.getElementById('formMessage');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const projectName = document.getElementById('projectName').value.trim();
    const projectImage = document.getElementById('projectImage').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();

    if (!projectName || !projectImage) {
      showFormMessage('Please fill in all required fields', 'error');
      return;
    }

    // Find first empty gallery card
    const emptyCard = document.querySelector('.gallery-card.empty');
    if (!emptyCard) {
      showFormMessage('Gallery is full. Maximum 15 projects allowed.', 'error');
      return;
    }

    // Update empty card with new project
    const projectId = emptyCard.getAttribute('data-project-id');
    emptyCard.classList.remove('empty');
    
    const imageWrapper = emptyCard.querySelector('.gallery-image-wrapper');
    imageWrapper.innerHTML = `<img src="${projectImage}" alt="${projectName}" class="gallery-image"><div class="gallery-overlay"></div>`;
    
    const titleElement = emptyCard.querySelector('.gallery-title');
    titleElement.textContent = projectName;

    // Add to gallery data
    galleryData[parseInt(projectId)] = {
      title: projectName,
      image: projectImage,
      description: projectDescription
    };

    // Add click handler to new card
    emptyCard.addEventListener('click', function() {
      openModal(parseInt(projectId));
    });

    // Reset form
    form.reset();
    showFormMessage(`Project "${projectName}" added successfully!`, 'success');
  });

  function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    
    setTimeout(() => {
      formMessage.textContent = '';
      formMessage.className = 'form-message';
    }, 4000);
  }
});
