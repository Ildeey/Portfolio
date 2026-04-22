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
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -80px 0px' });

    document.querySelectorAll('section').forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(12px)';
      section.style.transition = `opacity 0.38s ${EASE_OUT}, transform 0.38s ${EASE_OUT}`;
      observer.observe(section);
    });

    // Stagger observer for experience items and tech list
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.experience-item, .tech-list p').forEach(el => {
      staggerObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.experience-item, .tech-list p').forEach(el => {
      el.classList.add('is-visible');
    });
  }

  // Scroll to top button functionality
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const heroSection = document.getElementById('hero');

  if (scrollToTopBtn && heroSection) {
    // Show/hide button based on hero section visibility
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Hero is visible, hide the button
          scrollToTopBtn.classList.remove('show');
        } else {
          // Hero is not visible, show the button
          scrollToTopBtn.classList.add('show');
        }
      });
    }, { threshold: 0 });

    heroObserver.observe(heroSection);

    // Scroll to top on button click
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});

/* ============================================
   PROJECTS DATA
   ============================================ */
const projectsData = {
  featured: [
    {
      id: 'vremena',
      title: 'ВРЕМЕНА ГОДА 2025',
      year: '2025',
      category: 'Айдентика',
      image: 'images/vremena2.png',
      description: 'Дизайн айдентики и сайт для цифровой инсталляции "Четыре" в рамках премьеры спектакля в театре.',
      link: 'http://vremenagoda.4.tilda.ws/'
    },
    {
      id: 'ktya',
      title: 'КТЯ',
      year: '2024',
      category: 'Графический дизайн',
      image: 'images/ktya.jpg',
      description: 'Требуется дополнительная информация...',
      link: null
    }
  ],
  categories: {
    design: {
      label: 'Графический дизайн',
      teaserImage: 'images/kartinka.jpg',
      projects: [
        { id: 1, title: 'Актёр суперсемейки', year: '2023', image: 'images/kartinka.jpg', description: 'Пару раз пролетал над Нью-Йорком', link: null },
        { id: 4, title: 'КТЯ', year: '2024', image: 'images/ktya.jpg', description: 'Требуется дополнительная информация...', link: null }
      ]
    },
    photo: {
      label: 'Фотография',
      teaserImage: 'images/2.jpg',
      projects: [
        { id: 2, title: 'Тюльбан', year: '2022', image: 'images/2.jpg', description: 'ТЮЛЬБАН', link: null },
        { id: 5, title: 'Кот на планете', year: '2021', image: 'images/1.jpg', description: 'Первый проект для школьной выставки', link: null }
      ]
    },
    video: {
      label: 'Видеоконтент',
      teaserImage: 'images/kit.jpg',
      projects: [
        { id: 3, title: '4D-проекция кота', year: '2023', image: 'images/kit.jpg', description: 'Создание 4-мерной мэппинг-проекции кота на здание ЕАСИ', link: null }
      ]
    }
  }
};

/* ============================================
   CATEGORY ACCORDION
   ============================================ */
document.addEventListener('DOMContentLoaded', function () {
  const accordion = document.querySelector('.cat-accordion');
  if (!accordion) return;

  const cols = accordion.querySelectorAll('.cat-col');

  cols.forEach(col => {
    col.addEventListener('click', function (e) {
      const expanded = col.querySelector('.cat-expanded');
      const isInsideExpanded = expanded && expanded.contains(e.target);
      const isCloseBtn = e.target.closest('.cat-close');

      if (isInsideExpanded && !isCloseBtn) return;

      if (col.classList.contains('is-active')) {
        collapseAll();
      } else {
        expandCol(col);
      }
    });
  });

  function expandCol(targetCol) {
    cols.forEach(col => col.classList.remove('is-active', 'is-shrunk'));
    targetCol.classList.add('is-active');
    cols.forEach(col => { if (col !== targetCol) col.classList.add('is-shrunk'); });
    accordion.classList.add('has-active');
  }

  function collapseAll() {
    cols.forEach(col => col.classList.remove('is-active', 'is-shrunk'));
    accordion.classList.remove('has-active');
  }
});

/* ============================================
   MODAL SYSTEM
   ============================================ */
document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('imageModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  const prevBtn  = modal.querySelector('.modal-prev');
  const nextBtn  = modal.querySelector('.modal-next');
  let currentModal = { category: null, index: null };

  document.addEventListener('click', function (e) {
    const item = e.target.closest('.cat-project-item');
    if (!item) return;

    const category = item.dataset.category;
    const id = parseInt(item.dataset.projectId);
    const projects = projectsData.categories[category]?.projects || [];
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) return;
    openModal(category, index);
  });

  function openModal(category, index) {
    const projects = projectsData.categories[category].projects;
    const project  = projects[index];
    currentModal = { category, index };

    modal.querySelector('#modalImage').src = project.image;
    modal.querySelector('#modalTitle').textContent = project.title;
    modal.querySelector('#modalDescription').textContent = project.description;

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === projects.length - 1;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentModal = { category: null, index: null };
  }

  prevBtn.addEventListener('click', function () {
    if (currentModal.index > 0) openModal(currentModal.category, currentModal.index - 1);
  });

  nextBtn.addEventListener('click', function () {
    const projects = projectsData.categories[currentModal.category]?.projects || [];
    if (currentModal.index < projects.length - 1) openModal(currentModal.category, currentModal.index + 1);
  });

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape')     closeModal();
    if (e.key === 'ArrowLeft')  prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });
});

/* ============================================
   VISITOR COUNTER & TIME TRACKING
   ============================================ */
document.addEventListener('DOMContentLoaded', function () {
  const visitKey    = 'portfolio_visits';
  const totalTimeKey = 'portfolio_total_time';

  let visits = parseInt(localStorage.getItem(visitKey)) || 0;
  visits++;
  localStorage.setItem(visitKey, visits);

  let totalTime = parseInt(localStorage.getItem(totalTimeKey)) || 0;

  const visitStatsElement = document.getElementById('visit-stats');
  if (visitStatsElement) visitStatsElement.textContent = `Визитов: ${visits}`;

  function formatTime(seconds) {
    const hours   = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs    = seconds % 60;
    if (hours > 0)   return `${hours}/${minutes}/${secs}`;
    if (minutes > 0) return `${minutes}/${secs}`;
    return `${secs}`;
  }

  const timeSpentElement = document.getElementById('time-spent');
  if (timeSpentElement) timeSpentElement.textContent = formatTime(totalTime);

  const sessionStart = Date.now();

  const timeInterval = setInterval(() => {
    totalTime++;
    localStorage.setItem(totalTimeKey, totalTime);
    if (timeSpentElement) timeSpentElement.textContent = formatTime(totalTime);
  }, 1000);

  window.addEventListener('beforeunload', () => {
    clearInterval(timeInterval);
    const finalTime = Math.floor((Date.now() - sessionStart) / 1000);
    const currentTotal = parseInt(localStorage.getItem(totalTimeKey)) || 0;
    localStorage.setItem(totalTimeKey, currentTotal + finalTime);
  });
});
