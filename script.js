/* ============================================
   BARCODE GENERATION
   ============================================ */
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
/* ============================================
   SMOOTH SCROLLING & PAGE INITIALIZATION
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize barcodes
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

  // Section fade-in animation
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

  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(section);
  });
});

/* ============================================
   GALLERY DATA & MODAL SYSTEM
   ============================================ */
let currentProjectId = null;

const galleryData = {
  1: { title: 'Актёр суперсемейки', image: 'images/kartinka.jpg', description: 'Пару раз пролетал над Нью-Йорком' },
  2: { title: 'Тюльбан', image: 'images/2.jpg', description: 'ТЮЛЬБАН' },
  3: { title: '4D-проекция кота', image: 'images/kit.jpg', description: 'Создание 4-мерной мэппинг-проекции кота на здание Свердловской Екатеринбуржской фабрики заводов ЕАСИ' },
  4: { title: 'КТЯ', image: 'images/ktya.jpg', description: 'Требуется дополнительная информация...' },
  5: { title: 'Кот на планете', image: 'images/1.jpg', description: 'Первый проект для школьной выставки' }
};

/* ============================================
   MODAL FUNCTIONS
   ============================================ */
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

/* ============================================
   MODAL EVENT HANDLERS
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
  const galleryCards = document.querySelectorAll('.gallery-card:not(.empty)');
  const emptyCards = document.querySelectorAll('.gallery-card.empty');
  const modal = document.getElementById('imageModal');
  const closeBtn = document.querySelector('.modal-close');
  const prevBtn = document.querySelector('.modal-prev');
  const nextBtn = document.querySelector('.modal-next');

  // Gallery card click handlers for filled cards
  galleryCards.forEach(card => {
    card.addEventListener('click', function() {
      const projectId = parseInt(this.getAttribute('data-project-id'));
      openModal(projectId);
    });
  });

  // Empty card click handlers - scroll to form
  emptyCards.forEach(card => {
    card.addEventListener('click', function() {
      const formElement = document.getElementById('addProjectForm');
      if (formElement) {
        formElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Modal control handlers
  closeBtn.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', showPrevious);
  nextBtn.addEventListener('click', showNext);

  // Close modal on backdrop click
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

/* ============================================
   FORM HANDLING
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('projectForm');
  const formMessage = document.getElementById('formMessage');

  if (!form) return; // Form doesn't exist on this page

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

    // Re-bind empty cards since we removed one from the empty class
    const remainingEmptyCards = document.querySelectorAll('.gallery-card.empty');
    remainingEmptyCards.forEach(card => {
      card.onclick = function() {
        const formElement = document.getElementById('addProjectForm');
        if (formElement) {
          formElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      };
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
