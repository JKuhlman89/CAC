'use strict';

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzukjCUcoICp2ZfGAjEeQ7u3PxsZa2JUSsJXbxcnuIBZ48usjP6GdP_VCRTrUb3g--TaA/exec';
const FORMSPREE_URL = 'https://formspree.io/f/movklbol';

const kidsGrid = document.getElementById('kidsGrid');
const toggleBtn = document.getElementById('toggleKids');

// --- MODAL ELEMENTS ---
const globalModal = document.getElementById('globalModal');
const globalClose = document.getElementById('globalModalClose');
const globalForm = document.getElementById('globalModalForm');
const globalStatus = document.getElementById('globalModalStatus');

const kidModal = document.getElementById('kidModal');
const kidClose = document.getElementById('kidModalClose');
const kidForm = document.getElementById('kidModalForm');
const kidStatus = document.getElementById('kidModalStatus');
const kidNameEl = document.getElementById('kidName');
const kidWishlistEl = document.getElementById('kidWishlist');

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  if (!kidsGrid) return;

  // --- Show All toggle ---
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      kidsGrid.classList.toggle('collapsed');
      toggleBtn.textContent = kidsGrid.classList.contains('collapsed') ? 'Show All' : 'Show Less';
    });
  }

  // --- Load kids ---
  loadKids();

  // --- All buttons open modal ---
  document.body.addEventListener('click', e => {
    // Nav bar Donate button
    if (e.target.matches('.nav-donate, .nav-link[href="#donate"]')) {
      e.preventDefault();
      openGlobalModal();
    }

    // Top/Bottom Contact buttons or page Contact buttons
    if (e.target.matches('.btn.contact-btn, .nav-link[href="#contact"]')) {
      e.preventDefault();
      openGlobalModal();
    }

    // Kid card Donate buttons
    if (e.target.matches('.kid-card .donate-btn')) {
      e.preventDefault();
      const card = e.target.closest('.kid-card');
      const name = card.querySelector('p strong')?.nextSibling?.textContent || 'Child';
      const wishlistField = Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('Wishes:'));
      const wishlist = wishlistField ? wishlistField.textContent.replace('Wishes:', '').trim() : '—';
      openKidModal(name, wishlist);
    }
  });

  // --- Close modals ---
  globalClose.addEventListener('click', () => closeModal(globalModal));
  kidClose.addEventListener('click', () => closeModal(kidModal));
  [globalModal, kidModal].forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
  });

  // --- Submit forms ---
  setupFormSubmit(globalForm, globalStatus);
  setupFormSubmit(kidForm, kidStatus);

  // --- Bottom page contact form ---
  const bottomContactForm = document.querySelector('#get-involved form.contact-form');
  if (bottomContactForm) setupFormSubmit(bottomContactForm, null); // no status element
});

// --- Load kids ---
async function loadKids() {
  kidsGrid.innerHTML = '<p>Loading...</p>';

  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error(`Network error: ${res.status}`);
    const data = await res.json();

    const kids = Array.isArray(data) ? data : (data.kids || []);
    const visible = kids.filter(k => !k.status || String(k.status).toLowerCase() === 'active');

    kidsGrid.innerHTML = '';
    if (!visible.length) {
      kidsGrid.innerHTML = '<p>No entries are live right now.</p>';
      return;
    }

    visible.forEach(k => {
      const card = document.createElement('div');
      card.className = 'kid-card';
      const fields = ['Initials', 'Interests', 'Age', 'Needs', 'Wishes', 'Notes'];
      card.innerHTML = fields.map(f => `<p><strong>${f}:</strong> ${escapeHtml(k[f] || '—')}</p>`).join('');
      card.innerHTML += `<div class="button-wrapper"><a href="#" class="donate-btn">Donate</a></div>`;
      kidsGrid.appendChild(card);
    });

  } catch(err) {
    console.error(err);
    kidsGrid.innerHTML = '<p>Could not load the kids list.</p>';
  }
}

// --- Escape HTML ---
function escapeHtml(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Modals ---
function openGlobalModal() {
  globalModal.style.display = 'flex';
  globalStatus.textContent = '';
  globalForm.reset();
  globalForm.querySelector('input').focus();
}

function openKidModal(name, wishlist) {
  kidNameEl.textContent = name;
  kidWishlistEl.textContent = wishlist;
  kidModal.style.display = 'flex';
  kidStatus.textContent = '';
  kidForm.reset();
  kidForm.querySelector('input').focus();
}

function closeModal(modal) {
  modal.style.display = 'none';
}

// --- Form submission ---
function setupFormSubmit(formEl, statusEl) {
  if (!formEl) return;

  formEl.addEventListener('submit', async e => {
    e.preventDefault();
    if (statusEl) statusEl.textContent = 'Submitting...';

    const data = Object.fromEntries(new FormData(formEl).entries());

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        if (statusEl) statusEl.textContent = 'Thank you! Submission received.';
        formEl.reset();
        if (statusEl) setTimeout(() => closeModal(formEl.closest('.contact-modal')), 1500);
      } else {
        const json = await res.json();
        if (statusEl) statusEl.textContent = 'Submission failed: ' + (json.error || 'Unknown error');
      }
    } catch(err) {
      console.error(err);
      if (statusEl) statusEl.textContent = 'An error occurred. Please try again later.';
    }
  });
}
