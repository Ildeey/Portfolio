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
let currentProjects = [];
let currentProjectsById = new Map();
let currentProjectIndex = -1;

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

function updateRequestForm(user) {
  const emailWrapper = document.getElementById('requestEmailWrapper');
  const phoneWrapper = document.getElementById('requestPhoneWrapper');
  const emailInput = document.getElementById('requestEmail');
  const phoneInput = document.getElementById('requestPhone');

  if (!emailWrapper || !phoneWrapper || !emailInput || !phoneInput) {
    return;
  }

  if (user && user.role !== 'admin') {
    emailWrapper.style.display = 'none';
    phoneWrapper.style.display = 'none';
    emailInput.value = user.email || '';
    phoneInput.value = user.phone || '';
    emailInput.required = false;
    phoneInput.required = false;
    emailInput.disabled = true;
    phoneInput.disabled = true;
  } else {
    emailWrapper.style.display = '';
    phoneWrapper.style.display = '';
    emailInput.disabled = false;
    phoneInput.disabled = false;
    emailInput.required = true;
    phoneInput.required = true;
    if (!user) {
      emailInput.value = '';
      phoneInput.value = '';
    }
  }
}

function updateHeader(user) {
  const loginBtn = document.getElementById('loginBtn');
  const accountBtn = document.getElementById('accountBtn');
  const accountBtnText = document.getElementById('accountBtnText');
  const ctaAction = document.getElementById('ctaAction');

  if (!loginBtn || !accountBtn || !ctaAction) {
    return;
  }

  currentUser = user;

  if (user) {
    loginBtn.style.display = 'inline-flex';
    accountBtn.style.display = 'inline-flex';
    const loginBtnText = document.getElementById('loginBtnText');
    if (loginBtnText) {
      loginBtnText.textContent = 'Выйти';
    }
    if (accountBtnText) {
      accountBtnText.textContent = user.username || 'Личный кабинет';
    }
    ctaAction.innerHTML = user.role === 'admin' 
      ? '<span>Добавить проект</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8H15M15 8L8 1M15 8L8 15" stroke="currentColor" stroke-width="2"/></svg>'
      : '<span>Отправить заявку</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8H15M15 8L8 1M15 8L8 15" stroke="currentColor" stroke-width="2"/></svg>';
  } else {
    loginBtn.style.display = 'inline-flex';
    accountBtn.style.display = 'none';
    const loginBtnText = document.getElementById('loginBtnText');
    if (loginBtnText) {
      loginBtnText.textContent = 'Войти';
    }
    ctaAction.innerHTML = '<span>Отправить заявку</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8H15M15 8L8 1M15 8L8 15" stroke="currentColor" stroke-width="2"/></svg>';
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

  // Fixed categories as requested
  const CATS = [
    { key: 'Графический дизайн', title: 'ДИЗАЙН' },
    { key: 'Фотография', title: 'ФОТОГРАФИЯ' },
    { key: 'Видеоконтент', title: 'ВИДЕОКОНТЕНТ' },
  ];

  // Group projects by exact category match
  const grouped = CATS.map(c => ({
    meta: c,
    items: projects.filter(p => (p.category || '').trim() === c.key)
  }));

  // Build HTML for three blocks
  const html = grouped.map(group => {
    const items = group.items;
    const teaserImage = items.length > 0 ? items[0].image : 'images/placeholder.jpg';
    return `
      <div class="category-block" data-category="${escapeAttr(group.meta.key)}" style="background-image: none;">
        <div class="category-teaser" style="background-image: url('${teaserImage}');">
          <div class="cat-title">${escapeHtml(group.meta.title)}</div>
          <div class="cat-count">${items.length} проект${items.length === 1 ? '' : 'а'}</div>
        </div>
        <div class="category-expanded">
          <div class="category-expanded-header">
            <div class="cat-title">${escapeHtml(group.meta.title)}</div>
            <div class="cat-count">${items.length} проект${items.length === 1 ? '' : 'а'}</div>
          </div>
          <div class="mini-project-row">
            ${items.map(p => `
              <div class="mini-project" data-project-id="${p.id}">
                <img src="${p.image || 'images/placeholder.jpg'}" alt="${escapeAttr(p.title)}">
                <div class="mini-title">${escapeHtml(p.title)}</div>
                <div class="mini-date">${escapeHtml(p.project_date || formatDateString(p.created_at || ''))}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;

  // Save current projects mapping for modal lookup
  currentProjects = projects || [];
  currentProjectsById = new Map(currentProjects.map((project, index) => [String(project.id), { ...project, index }]));

  // Attach hover/click listeners
  document.querySelectorAll('.category-block').forEach(block => {
    block.addEventListener('mouseenter', () => block.classList.add('is-open'));
    block.addEventListener('mouseleave', () => block.classList.remove('is-open'));
    block.addEventListener('click', (e) => {
      // If clicked on teaser, open; if clicked on mini project, open modal
      const target = e.target.closest('.mini-project');
      if (target) {
        const id = target.getAttribute('data-project-id');
        const entry = currentProjectsById.get(String(id));
        if (entry) showProjectDetail(entry.index);
        e.stopPropagation();
        return;
      }
      // Toggle on click for touch devices
      block.classList.toggle('is-open');
    });
  });
}

function attachProjectCardListeners(projects) {
  currentProjects = projects || [];
  currentProjectsById = new Map(currentProjects.map((project, index) => [String(project.id), { ...project, index }]));

  document.querySelectorAll('.cat-project-item, .simple-project-card').forEach(card => {
    const id = card.getAttribute('data-project-id');
    if (!id) return;

    card.addEventListener('click', () => {
      const project = currentProjectsById.get(id);
      if (project) {
        showProjectDetail(project.index);
      }
    });
  });
}

let modalImages = [];
let modalImageIndex = 0;

function updateModalImage() {
  const modalImage = document.getElementById('modalImage');
  if (!modalImage) return;
  modalImage.src = modalImages[modalImageIndex] || 'images/placeholder.jpg';
}

function showProjectDetail(index) {
  const project = currentProjects[index];
  if (!project) return;
  currentProjectIndex = index;

  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');

  // Prepare images array (support project.images if present)
  if (Array.isArray(project.images) && project.images.length > 0) {
    modalImages = project.images.slice(0, 3);
  } else if (project.image) {
    modalImages = [project.image];
  } else {
    modalImages = ['images/placeholder.jpg'];
  }
  modalImageIndex = 0;

  updateModalImage();

  if (modalTitle) {
    modalTitle.textContent = project.title || '';
  }

  if (modalDescription) {
    modalDescription.textContent = project.description || '';
  }

  showModal('imageModal');
}

function imageNext() {
  if (!modalImages || modalImages.length === 0) return;
  modalImageIndex = (modalImageIndex + 1) % modalImages.length;
  updateModalImage();
}

function imagePrevious() {
  if (!modalImages || modalImages.length === 0) return;
  modalImageIndex = (modalImageIndex - 1 + modalImages.length) % modalImages.length;
  updateModalImage();
}

function showNextProject() {
  if (currentProjects.length === 0) return;
  currentProjectIndex = (currentProjectIndex + 1) % currentProjects.length;
  showProjectDetail(currentProjectIndex);
}

function showPreviousProject() {
  if (currentProjects.length === 0) return;
  currentProjectIndex = (currentProjectIndex - 1 + currentProjects.length) % currentProjects.length;
  showProjectDetail(currentProjectIndex);
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

async function loadKeyProjects() {
  try {
    const data = await apiFetch(`${API_BASE}/projects.php?featured=true`);
    const projects = data.projects || [];
    renderKeyProjects(projects);
  } catch (error) {
    const container = document.getElementById('keyProjectsGrid');
    if (container) {
      container.innerHTML = `<div class="admin-note" style="grid-column: 1/-1; text-align: center;">Не удалось загрузить проекты</div>`;
    }
  }
}

function renderKeyProjects(projects) {
  const container = document.getElementById('keyProjectsGrid');
  if (!container) return;

  if (!projects || projects.length === 0) {
    container.innerHTML = '<div class="admin-note" style="grid-column: 1/-1; text-align: center;">Избранные проекты не найдены</div>';
    return;
  }

  container.innerHTML = projects.slice(0, 2).map(project => {
    const year = project.project_date 
      ? new Date(project.project_date).getFullYear()
      : new Date(project.created_at).getFullYear();
    
    return `
      <a href="#" class="kp-card" data-project-id="${project.id}">
        <div class="kp-image-wrap">
          <img src="${project.image || 'images/placeholder.jpg'}" alt="${escapeHtml(project.title)}" class="kp-image">
        </div>
        <div class="kp-body">
          <div class="kp-meta">
            <span class="kp-year">${year}</span>
            <span class="kp-tag">${escapeHtml(project.category)}</span>
          </div>
          <h3 class="kp-title">${escapeHtml(project.title)}</h3>
          <p class="kp-desc">${escapeHtml(project.description.substring(0, 120))}${project.description.length > 120 ? '...' : ''}</p>
          <span class="kp-view">[ View ]</span>
        </div>
      </a>
    `;
  }).join('');

  // Add click handlers to open project detail modal
  container.querySelectorAll('[data-project-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const projectId = card.getAttribute('data-project-id');
      // Find the project index in the full projects list
      loadProjects().then(() => {
        const allCards = document.querySelectorAll('[data-project-id]');
        const index = Array.from(allCards).indexOf(card);
        if (index >= 0) {
          showProjectDetail(index);
        }
      });
    });
  });
}

async function submitRequest(event) {
  event.preventDefault();
  const name = document.getElementById('requestName').value.trim();
  const emailInput = document.getElementById('requestEmail');
  const phoneInput = document.getElementById('requestPhone');
  const email = emailInput ? emailInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const message = document.getElementById('requestMessage').value.trim();

  const isAuthorizedUser = currentUser && currentUser.role !== 'admin';

  if (!name) {
    showToast('Заполните имя', 'error');
    return;
  }

  if (!isAuthorizedUser && (!email || !phone)) {
    showToast('Заполните Email и телефон', 'error');
    return;
  }

  if (!isAuthorizedUser && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    showToast('Укажите корректный Email', 'error');
    return;
  }

  if (!isAuthorizedUser && !/^\+?\d{7,15}$/.test(phone)) {
    showToast('Телефон должен содержать только цифры и возможно +', 'error');
    return;
  }

  try {
    await apiFetch(`${API_BASE}/request.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email: isAuthorizedUser ? currentUser.email : email,
        phone: isAuthorizedUser ? currentUser.phone : phone,
        message,
      }),
    });

    closeModal();
    document.getElementById('requestForm').reset();
    showToast('Заявка отправлена', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function formatProjectDateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function setupProjectDateMask() {
  const projectDateInput = document.getElementById('projectDate');
  if (!projectDateInput) {
    return;
  }

  projectDateInput.addEventListener('input', () => {
    projectDateInput.value = formatProjectDateInput(projectDateInput.value);
  });
}

function setupProjectImagePreview() {
  const imageInput = document.getElementById('projectImage');
  const previewContainer = document.getElementById('projectImagePreview');
  const previewImg = document.getElementById('projectImagePreviewImg');
  const clearBtn = document.getElementById('projectImageClearBtn');

  if (!imageInput || !previewContainer || !previewImg || !clearBtn) {
    return;
  }

  imageInput.addEventListener('change', () => {
    if (!imageInput.files || imageInput.files.length === 0) {
      previewContainer.classList.add('hidden');
      previewImg.src = '';
      return;
    }

    const file = imageInput.files[0];
    previewImg.src = URL.createObjectURL(file);
    previewContainer.classList.remove('hidden');
  });

  clearBtn.addEventListener('click', () => {
    imageInput.value = '';
    previewContainer.classList.add('hidden');
    previewImg.src = '';
  });
}

async function submitProject(event) {
  event.preventDefault();
  const title = document.getElementById('projectTitle').value.trim();
  const category = document.getElementById('projectCategory').value.trim();
  const description = document.getElementById('projectDescription').value.trim();
  const projectDate = document.getElementById('projectDate').value.trim();
  const imageInput = document.getElementById('projectImage');

  if (!title || !category || !description || !projectDate) {
    showToast('Заполните название, категорию, дату и описание проекта', 'error');
    return;
  }

  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(projectDate)) {
    showToast('Дата проекта должна быть в формате dd.mm.yyyy', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('description', description);
  formData.append('project_date', projectDate);

  if (imageInput && imageInput.files.length > 0) {
    formData.append('image', imageInput.files[0]);
  }

  try {
    const response = await fetch(`${API_BASE}/projects.php`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || 'Ошибка при сохранении проекта');
    }

    closeModal();
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
      projectForm.reset();
    }
    const previewContainer = document.getElementById('projectImagePreview');
    const previewImg = document.getElementById('projectImagePreviewImg');
    if (previewContainer && previewImg) {
      previewContainer.classList.add('hidden');
      previewImg.src = '';
    }

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
  document.querySelectorAll('[data-modal-close], .modal-close').forEach(button => {
    button.addEventListener('click', closeModal);
  });

  const prevButton = document.querySelector('.modal-prev');
  const nextButton = document.querySelector('.modal-next');

  if (prevButton) {
    prevButton.addEventListener('click', event => {
      event.preventDefault();
      imagePrevious();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', event => {
      event.preventDefault();
      imageNext();
    });
  }

  // CTA "Оставить заявку" button in footer
  const leaveRequestBtn = document.getElementById('leaveRequestBtn');
  if (leaveRequestBtn) {
    leaveRequestBtn.addEventListener('click', () => showModal('requestModal'));
  }

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
    setupProjectDateMask();
    setupProjectImagePreview();
  }
}

function setupHeroDistortion() {
  const heroSection = document.getElementById('hero');
  const heroImage = document.querySelector('.hero-center-image');
  
  if (!heroSection || !heroImage) return;
  
  const maxOffset = 25; // Maximum pixel offset in any direction
  let targetOffsetX = 0;
  let targetOffsetY = 0;
  let currentOffsetX = 0;
  let currentOffsetY = 0;
  let animationId = null;
  
  function animate() {
    // Smooth interpolation towards target position
    currentOffsetX += (targetOffsetX - currentOffsetX) * 0.1;
    currentOffsetY += (targetOffsetY - currentOffsetY) * 0.1;
    
    // Apply the transform to the image
    heroImage.style.transform = `translate(calc(-50% + ${currentOffsetX}px), calc(-50% + ${currentOffsetY}px))`;
    
    animationId = requestAnimationFrame(animate);
  }
  
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate position relative to center (-1 to 1)
    const relX = (e.clientX - rect.left - centerX) / centerX;
    const relY = (e.clientY - rect.top - centerY) / centerY;
    
    // Clamp values between -1 and 1
    const clampedX = Math.max(-1, Math.min(1, relX));
    const clampedY = Math.max(-1, Math.min(1, relY));
    
    // Calculate offset
    targetOffsetX = clampedX * maxOffset;
    targetOffsetY = clampedY * maxOffset;
    
    if (!animationId) {
      animationId = requestAnimationFrame(animate);
    }
  });
  
  heroSection.addEventListener('mouseleave', () => {
    targetOffsetX = 0;
    targetOffsetY = 0;
  });
}

async function initSite() {
  const user = await getCurrentUser();
  updateHeader(user);
  updateRequestForm(user);
  setupModalButtons();
  setupProjectForm();
  setupHeroDistortion();
  await loadProjects();
  await loadKeyProjects();
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

// Visitor counter and time tracking removed per design
