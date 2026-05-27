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

const API_BASE = './api';
let currentUser = null;

async function apiFetch(url, options = {}) {
  const config = {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data && data.error ? data.error : response.statusText;
    throw new Error(message || 'Request failed');
  }

  return data;
}

async function getCurrentUser() {
  try {
    const data = await apiFetch(`${API_BASE}/auth.php?action=current`);
    return data.user || null;
  } catch {
    return null;
  }
}

function updateHeader(user) {
  const loginBtn = document.getElementById('loginBtn');
  const accountBtn = document.getElementById('accountBtn');
  const ctaAction = document.getElementById('ctaAction');

  if (!loginBtn || !accountBtn || !ctaAction) {
    return;
  }

  currentUser = user;

  if (user) {
    loginBtn.textContent = 'Выйти';
    accountBtn.style.display = 'inline-flex';
    accountBtn.textContent = 'Личный кабинет';
    ctaAction.textContent = 'Добавить проект';
  } else {
    loginBtn.textContent = 'Войти';
    accountBtn.style.display = 'none';
    ctaAction.textContent = 'Доступен к работе';
  }

  loginBtn.onclick = () => {
    if (currentUser) {
      logout();
    } else {
      window.location.href = 'admin.html';
    }
  };

  accountBtn.onclick = () => {
    window.location.href = 'admin.html';
  };

  ctaAction.onclick = () => {
    if (currentUser && currentUser.role === 'admin') {
      showModal('projectModal');
    } else {
      showModal('requestModal');
    }
  };
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');
  modal.classList.remove('modal-hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
    modal.classList.add('modal-hidden');
    modal.setAttribute('aria-hidden', 'true');
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\"/g, '&quot;');
}

function attachCategoryAccordion() {
  const accordion = document.querySelector('.cat-accordion');
  if (!accordion) return;

  const cols = accordion.querySelectorAll('.cat-col');

  cols.forEach(col => {
    col.addEventListener('click', function (e) {
      const expanded = col.querySelector('.cat-expanded');
      const isCloseBtn = e.target.closest('.cat-close');
      const isExpandedArea = expanded && expanded.contains(e.target);

      if (isInsideExpanded(e, expanded) && !isCloseBtn) {
        return;
      }

      if (col.classList.contains('is-active') || isCloseBtn) {
        collapseAll();
      } else {
        expandCol(col);
      }
    });
  });
}

function isInsideExpanded(event, expanded) {
  return expanded && expanded.contains(event.target);
}

function collapseAll() {
  document.querySelectorAll('.cat-col').forEach(col => {
    col.classList.remove('is-active', 'is-shrunk');
  });
  document.querySelector('.cat-accordion')?.classList.remove('has-active');
}

function expandCol(targetCol) {
  document.querySelectorAll('.cat-col').forEach(col => {
    col.classList.remove('is-active', 'is-shrunk');
    if (col !== targetCol) {
      col.classList.add('is-shrunk');
    }
  });

  targetCol.classList.add('is-active');
  document.querySelector('.cat-accordion')?.classList.add('has-active');
}

function renderCategories(projects) {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;

  if (!projects || projects.length === 0) {
    container.innerHTML = '<div class="empty-state">Проекты отсутствуют.</div>';
    return;
  }

  const grouped = projects.reduce((acc, project) => {
    const category = project.category ? project.category.trim() : 'Без категории';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(project);
    return acc;
  }, {});

  const categoriesHtml = Object.entries(grouped)
    .map(([category, items], index) => `
      <div class="cat-col${index === 0 ? ' is-active' : ''}" data-category="${escapeAttr(category)}">
        <div class="cat-col-inner">
          <div class="cat-teaser">
            <div class="cat-teaser-image-wrap">
              <img src="${items[0].image || 'images/kartinka.jpg'}" class="cat-teaser-image" alt="${escapeAttr(category)}">
            </div>
            <div class="cat-teaser-info">
              <h3 class="cat-title">${escapeHtml(category)}</h3>
              <span class="cat-count">${items.length} проект${items.length === 1 ? '' : 'а'}</span>
            </div>
          </div>
          <div class="cat-expanded">
            <div class="cat-expanded-header">
              <h3 class="cat-title">${escapeHtml(category)}</h3>
              <button class="cat-close" aria-label="Закрыть">✕</button>
            </div>
            <div class="cat-project-list">
              ${items
                .map(project => `
                  <div class="cat-project-item" data-project-id="${project.id}" data-category="${escapeAttr(category)}">
                    <img src="${project.image || 'images/kartinka.jpg'}" class="cat-project-thumb" alt="${escapeAttr(project.title)}">
                    <div class="cat-project-info">
                      <span class="cat-project-year">${formatDateString(project.created_at || '')}</span>
                      <h4 class="cat-project-title">${escapeHtml(project.title)}</h4>
                      <p class="cat-project-desc">${escapeHtml(project.description)}</p>
                    </div>
                    <span class="cat-project-view">[ View ]</span>
                  </div>
                `)
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `)
    .join('');

  container.innerHTML = `<div class="cat-accordion">${categoriesHtml}</div>`;
  attachCategoryAccordion();
}

function formatDateString(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

async function loadProjects() {
  try {
    const data = await apiFetch(`${API_BASE}/projects.php`);
    renderCategories(data.projects || []);
  } catch (error) {
    const container = document.getElementById('categoriesContainer');
    if (container) {
      container.innerHTML = `<div class="empty-state">Не удалось загрузить проекты: ${escapeHtml(error.message)}</div>`;
    }
  }
}

async function submitRequest(event) {
  event.preventDefault();
  const name = document.getElementById('requestName').value.trim();
  const email = document.getElementById('requestEmail').value.trim();
  const phone = document.getElementById('requestPhone').value.trim();
  const message = document.getElementById('requestMessage').value.trim();

  if (!name || !email || !phone) {
    showToast('Заполните имя, Email и телефон', 'error');
    return;
  }

  try {
    await apiFetch(`${API_BASE}/request.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phone, message }),
    });

    closeModal();
    document.getElementById('requestForm').reset();
    showToast('Заявка отправлена', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function submitProject(event) {
  event.preventDefault();
  const title = document.getElementById('projectTitle').value.trim();
  const category = document.getElementById('projectCategory').value.trim();
  const description = document.getElementById('projectDescription').value.trim();
  const imageInput = document.getElementById('projectImage');

  if (!title || !category || !description) {
    showToast('Заполните название, категорию и описание проекта', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('description', description);

  if (imageInput.files.length > 0) {
    formData.append('image', imageInput.files[0]);
  }

  try {
    await fetch(`${API_BASE}/projects.php`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    }).then(async response => {
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Ошибка при сохранении проекта');
      }
    });

    closeModal();
    document.getElementById('projectForm').reset();
    showToast('Проект добавлен', 'success');
    loadProjects();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function logout() {
  try {
    await apiFetch(`${API_BASE}/auth.php?action=logout`, { method: 'POST' });
  } catch {
    // ignore
  }

  currentUser = null;
  updateHeader(null);
  showToast('Выход выполнен', 'success');
  loadProjects();
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `show ${type}`;
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.className = '';
  }, 3000);
}

function setupModalButtons() {
  document.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

function setupProjectForm() {
  const requestForm = document.getElementById('requestForm');
  const projectForm = document.getElementById('projectForm');

  if (requestForm) {
    requestForm.addEventListener('submit', submitRequest);
  }

  if (projectForm) {
    projectForm.addEventListener('submit', submitProject);
  }
}

async function initSite() {
  const user = await getCurrentUser();
  updateHeader(user);
  setupModalButtons();
  setupProjectForm();
  await loadProjects();
}

/* ============================================
   SMOOTH SCROLLING & PAGE INITIALIZATION
   ============================================ */
document.addEventListener('DOMContentLoaded', function () {
  const barcodes = document.querySelectorAll('.barcode');
  barcodes.forEach(barcode => {
    generateBarcode(barcode);
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

    const observer = new IntersectionObserver(entries => {
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

    const staggerObserver = new IntersectionObserver(entries => {
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

  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const heroSection = document.getElementById('hero');

  if (scrollToTopBtn && heroSection) {
    const heroObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          scrollToTopBtn.classList.remove('show');
        } else {
          scrollToTopBtn.classList.add('show');
        }
      });
    }, { threshold: 0 });

    heroObserver.observe(heroSection);

    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  initSite();
});

/* ============================================
   VISITOR COUNTER & TIME TRACKING
   ============================================ */
let visits = parseInt(localStorage.getItem('portfolio_visits')) || 0;
visits++;
localStorage.setItem('portfolio_visits', visits);
let totalTime = parseInt(localStorage.getItem('portfolio_total_time')) || 0;
const visitStatsElement = document.getElementById('visit-stats');
if (visitStatsElement) visitStatsElement.textContent = `Визитов: ${visits}`;

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}/${minutes}/${secs}`;
  if (minutes > 0) return `${minutes}/${secs}`;
  return `${secs}`;
}

const timeSpentElement = document.getElementById('time-spent');
if (timeSpentElement) timeSpentElement.textContent = formatTime(totalTime);

const sessionStart = Date.now();
const timeInterval = setInterval(() => {
  totalTime++;
  localStorage.setItem('portfolio_total_time', totalTime);
  if (timeSpentElement) timeSpentElement.textContent = formatTime(totalTime);
}, 1000);

window.addEventListener('beforeunload', () => {
  clearInterval(timeInterval);
  const finalTime = Math.floor((Date.now() - sessionStart) / 1000);
  const currentTotal = parseInt(localStorage.getItem('portfolio_total_time')) || 0;
  localStorage.setItem('portfolio_total_time', currentTotal + finalTime);
});
