/* global fetch */
'use strict';

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzT1l3tR6njxBzSXkm0ugvnpFv9gieC78L0RkFwpWxiYsuF6g3UTWN-inr1fF-hdsS_KQ/exec';
const FORMSPREE_URL = 'https://formspree.io/f/movyqakv';

document.addEventListener('DOMContentLoaded', () => {
  const kidsGrid = document.getElementById('kidsGrid');
  const toggleBtn = document.getElementById('toggleKids');
  const modal = document.getElementById('contactModal');
  const closeBtn = document.getElementById('contactClose');
  const modalForm = document.getElementById('contactFormModal');
  const status = document.getElementById('contactStatus');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const reasonLabel = document.getElementById('reasonLabel');

  const nav = document.getElementById('primaryNav');
  const navToggle = document.getElementById('navToggle');

  // NAV TOGGLE (mobile)
  navToggle.addEventListener('click', () => {
    const isOpen = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', String(!isOpen));
    navToggle.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close mobile nav when a link is clicked (small screens)
  nav.addEventListener('click', (e) => {
    const el = e.target.closest('a,button');
    if (!el) return;
    if (window.innerWidth < 700) {
      nav.setAttribute('data-open', 'false');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Smooth scroll for internal nav links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Collapse kids grid by default (first 4 visible)
  if (kidsGrid) {
    kidsGrid.classList.add('collapsed');
    loadKids(kidsGrid);
  }

  // Toggle show all / show less
  if (toggleBtn && kidsGrid) {
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = kidsGrid.classList.toggle('collapsed');
      toggleBtn.textContent = isCollapsed ? 'Show All' : 'Show Less';
      toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    });
  }

  // Modal open/close handlers using event delegation
  document.body.addEventListener('click', (e) => {
    const openBtn = e.target.closest('[data-open-contact]');
    const donateBtn = e.target.closest('.kid-card .donate-btn');
    if (openBtn || donateBtn) {
      e.preventDefault();
      // If donate from a kid card, prefill title/subtitle
      if (donateBtn) {
        const kid = donateBtn.dataset.kid || '';
        const wishlist = donateBtn.dataset.wishlist || '';
        modalTitle.textContent = kid ? `Donate for ${kid}` : 'Donate';
        modalSubtitle.textContent = wishlist ? `Wishlist: ${wishlist}` : 'Please fill out the form below to support a child.';
        reasonLabel.querySelector('textarea').placeholder = kid ? 'Optional message to the child' : 'Your message...';
      } else {
        modalTitle.textContent = 'Contact / Donate';
        modalSubtitle.textContent = 'Please fill out the form below to support a child.';
        reasonLabel.querySelector('textarea').placeholder = 'Your message...';
      }
      openModal(modal);
    }
  });

  closeBtn.addEventListener('click', () => closeModal(modal));
  document.getElementById('modalCancel').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(modal); });

  // Bottom contact form submission
  const bottomForm = document.getElementById('bottomContactForm');
  const bottomStatus = document.getElementById('bottomContactStatus');
  if (bottomForm) {
    bottomForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      bottomStatus.textContent = 'Submitting...';
      const fd = new FormData(bottomForm);
      try {
        const res = await fetch(FORMSPREE_URL, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          bottomStatus.textContent = 'Thank you! Submission received.';
          bottomForm.reset();
        } else {
          bottomStatus.textContent = 'Submission failed: ' + (json?.errors?.[0]?.message || 'Unknown error');
        }
      } catch (err) {
        console.error(err);
        bottomStatus.textContent = 'An error occurred. Please try again later.';
      }
    });
  }

  // Modal form submission
  if (modalForm) {
    modalForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      status.textContent = 'Submitting...';
      const fd = new FormData(modalForm);
      try {
        const res = await fetch(FORMSPREE_URL, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          status.textContent = 'Thank you! Submission received.';
          modalForm.reset();
          setTimeout(() => closeModal(modal), 1200);
        } else {
          status.textContent = 'Submission failed: ' + (json?.errors?.[0]?.message || 'Unknown error');
        }
      } catch (err) {
        console.error(err);
        status.textContent = 'An error occurred. Please try again later.';
      }
    });
  }

  // Helpers
  function openModal(el) {
    if (!el) return;
    el.classList.add('show');
    el.setAttribute('aria-hidden', 'false');
    // trap focus loosely by moving focus to the first input
    const first = el.querySelector('input, textarea, button');
    if (first) first.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeModal(el) {
    if (!el) return;
    el.classList.remove('show');
    el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
});

/* ---------- Load kids from sheet and build cards ---------- */
async function loadKids(kidsGrid) {
  if (!kidsGrid) return;
  kidsGrid.setAttribute('aria-busy', 'true');
  kidsGrid.innerHTML = `<p class="muted">Loading...</p>`;

  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error(`Network ${res.status}`);
    const data = await res.json();
    const kids = Array.isArray(data) ? data : (data.kids || []);
    const visible = kids.filter(k => !k.status || String(k.status).toLowerCase() === 'active');
    kidsGrid.innerHTML = '';

    if (!visible.length) {
      kidsGrid.innerHTML = `<p class="muted">No entries are live right now.</p>`;
      kidsGrid.setAttribute('aria-busy', 'false');
      return;
    }

    visible.forEach(k => {
      const card = document.createElement('article');
      card.className = 'kid-card';
      // sanitize fields
      const initials = escapeHtml(k.Initials || '—');
      const age = escapeHtml(k.Age || '—');
      const interests = escapeHtml(k.Interests || '—');
      const needs = escapeHtml(k.Needs || '—');
      const wishes = escapeHtml(k.Wishes || '—');

      card.innerHTML = `
        <div>
          <h3>${initials}</h3>
          <p><strong>Age:</strong> ${age}</p>
          <p><strong>Interests:</strong> ${interests}</p>
          <p><strong>Needs:</strong> ${needs}</p>
        </div>
        <div>
          <p><strong>Wishes:</strong> ${wishes}</p>
          <div class="card-actions" style="margin-top:10px">
            <button class="donate-btn" data-kid="${initials}" data-wishlist="${wishes}">Donate</button>
          </div>
        </div>
      `;
      kidsGrid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    kidsGrid.innerHTML = `<p class="muted">Could not load the kids list.</p>`;
  } finally {
    kidsGrid.setAttribute('aria-busy', 'false');
  }
}

/* Small HTML escape to avoid injection */
function escapeHtml(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
