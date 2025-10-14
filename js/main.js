'use strict';

/*
  main.js - Drop-in replacement that works with the original index.html you provided.
  - Loads kids from SHEET_URL and populates #kidsGrid
  - Collapses grid initially and toggles with existing Show All button(s)
  - Uses the existing #contactModal and #contactFormModal as the single modal
    for both generic contact/donate and kid-specific donations (prefills message)
  - Submits forms to Formspree (https://formspree.io/f/movklbol)
*/

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzukjCUcoICp2ZfGAjEeQ7u3PxsZa2JUSsJXbxcnuIBZ48usjP6GdP_VCRTrUb3g--TaA/exec';
const FORMSPREE_URL = 'https://formspree.io/f/movklbol';

// DOM refs (based on your original index.html)
const kidsGrid = document.getElementById('kidsGrid');
const toggleBtns = document.querySelectorAll('#toggleKids'); // covers duplicate IDs
const contactModal = document.getElementById('contactModal'); // your existing modal
const contactClose = document.getElementById('contactClose'); // existing close button
const contactFormModal = document.getElementById('contactFormModal'); // modal form
const contactStatus = document.getElementById('contactStatus'); // status <p>
const bottomContactForm = document.querySelector('.contact-form'); // bottom page form

// Helper to escape HTML
function escapeHtml(s){
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

// Put the grid into collapsed state initially
function ensureCollapsed() {
  if (kidsGrid && !kidsGrid.classList.contains('collapsed')) {
    kidsGrid.classList.add('collapsed');
  }
}

// Toggle text for Show All buttons (keeps all toggle elements in sync)
function updateToggleButtons() {
  const collapsed = kidsGrid && kidsGrid.classList.contains('collapsed');
  toggleBtns.forEach(btn => {
    if (btn) btn.textContent = collapsed ? 'Show All' : 'Show Less';
  });
}

// Attach toggle handlers to any toggle button nodes
function setupToggleButtons() {
  if (!toggleBtns || !toggleBtns.length) return;
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      if (!kidsGrid) return;
      kidsGrid.classList.toggle('collapsed');
      updateToggleButtons();
    });
  });
}

// Open the contact modal (generic)
function openContactModal(prefill = {}) {
  if (!contactModal || !contactFormModal) return;
  // prefill fields if provided
  if (prefill.name !== undefined && contactFormModal.name) contactFormModal.name.value = prefill.name;
  if (prefill.phone !== undefined && contactFormModal.phone) contactFormModal.phone.value = prefill.phone;
  if (prefill.email !== undefined && contactFormModal.email) contactFormModal.email.value = prefill.email;
  if (prefill.reason !== undefined && contactFormModal.reason) contactFormModal.reason.value = prefill.reason;

  contactStatus.textContent = '';
  contactModal.style.display = 'flex';

  // focus first input inside modal
  const firstInput = contactFormModal.querySelector('input, textarea');
  if (firstInput) firstInput.focus();
}

// Close contact modal
function closeContactModal() {
  if (!contactModal) return;
  contactModal.style.display = 'none';
}

// Submit helper that posts JSON to Formspree and returns a result object
async function submitToFormspree(data) {
  try {
    const res = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    // Formspree often returns 200 with JSON; treat ok as success
    if (res.ok) {
      try {
        const json = await res.json();
        return { ok: true, json };
      } catch(_) {
        return { ok: true };
      }
    } else {
      let err;
      try { err = await res.json(); } catch(e){ err = { error: 'Unknown' }; }
      return { ok: false, error: err };
    }
  } catch(err) {
    return { ok: false, error: err };
  }
}

// Attach behavior to the modal's submit (the modal form in your HTML: contactFormModal)
function setupModalForm() {
  if (!contactFormModal) return;
  contactFormModal.addEventListener('submit', async (e) => {
    e.preventDefault();
    contactStatus.textContent = 'Submitting...';

    // gather data
    const formData = new FormData(contactFormModal);
    // convert to object
    const data = {};
    formData.forEach((v,k) => data[k] = v.trim());

    const result = await submitToFormspree(data);
    if (result.ok) {
      contactStatus.textContent = 'Thank you — submission received.';
      contactFormModal.reset();
      setTimeout(closeContactModal, 1400);
    } else {
      console.error('Formspree error', result.error);
      contactStatus.textContent = 'Submission failed. Please try again later.';
    }
  });
}

// Setup bottom-page contact form to also post to Formspree
function setupBottomContactForm() {
  if (!bottomContactForm) return;
  // Add an inline status element if none
  let bottomStatus = bottomContactForm.querySelector('.bottom-form-status');
  if (!bottomStatus) {
    bottomStatus = document.createElement('p');
    bottomStatus.className = 'bottom-form-status';
    bottomContactForm.appendChild(bottomStatus);
  }

  bottomContactForm.addEventListener('submit', async e => {
    e.preventDefault();
    bottomStatus.textContent = 'Submitting...';

    const formData = new FormData(bottomContactForm);
    const data = {};
    formData.forEach((v,k) => data[k] = v.trim());

    const result = await submitToFormspree(data);
    if (result.ok) {
      bottomStatus.textContent = 'Thank you — submission received.';
      bottomContactForm.reset();
    } else {
      console.error('Bottom form error', result.error);
      bottomStatus.textContent = 'Submission failed. Please try again later.';
    }
  });
}

// Load kids from SHEET_URL and populate cards
async function loadKids() {
  if (!kidsGrid) return;
  kidsGrid.innerHTML = '<p>Loading...</p>';

  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error('Network error: ' + res.status);
    const data = await res.json();

    const kidsArray = Array.isArray(data) ? data : (data.kids || []);
    const visible = kidsArray.filter(k => !k.status || String(k.status).toLowerCase() === 'active');

    kidsGrid.innerHTML = '';
    if (!visible.length) {
      kidsGrid.innerHTML = '<p>No entries are live right now.</p>';
      return;
    }

    visible.forEach(k => {
      const card = document.createElement('div');
      card.className = 'kid-card';

      const fields = ['Initials','Interests','Age','Needs','Wishes','Notes'];
      card.innerHTML = fields.map(f => `<p><strong>${f}:</strong> ${escapeHtml(k[f] || '—')}</p>`).join('');

      // Add a donate button inside the card (same class as other donate buttons).
      // When clicked, we detect it's inside a .kid-card and prefills the modal accordingly.
      const btnWrapper = document.createElement('div');
      btnWrapper.className = 'button-wrapper';

      const donateEl = document.createElement('a');
      donateEl.href = '#';
      donateEl.className = 'donate-btn'; // matches your site style
      donateEl.textContent = 'Donate';

      // we'll rely on delegated click handling to detect donation clicks and
      // pick the nearest .kid-card to build a message.

      btnWrapper.appendChild(donateEl);
      card.appendChild(btnWrapper);
      kidsGrid.appendChild(card);
    });

    // Ensure grid starts collapsed
    ensureCollapsed();
    updateToggleButtons();

  } catch(err) {
    console.error(err);
    kidsGrid.innerHTML = '<p>Could not load the kids list.</p>';
  }
}

// Event delegation to catch all Donate/Contact clicks across the page
function setupGlobalClickHandlers() {
  document.body.addEventListener('click', (e) => {
    // If an element inside a kid-card donate button was clicked (or the donate button itself)
    const donateTarget = e.target.closest('a.donate-btn, button.donate-btn, .donate-btn');
    if (donateTarget) {
      // Is this donate button inside a kid-card?
      const parentCard = donateTarget.closest('.kid-card');
      if (parentCard) {
        e.preventDefault();
        // Pull child data from the card for a helpful prefill
        // We'll try to fetch the "Initials" and "Wishes" lines
        const paragraphs = Array.from(parentCard.querySelectorAll('p'));
        const initialsP = paragraphs.find(p => p.textContent.startsWith('Initials:'));
        const wishesP = paragraphs.find(p => p.textContent.startsWith('Wishes:') || p.textContent.includes('Wishes:'));
        const initials = initialsP ? initialsP.textContent.replace('Initials:', '').trim() : '';
        const wishes = wishesP ? wishesP.textContent.replace('Wishes:', '').trim() : '';

        const prefillReason = `I would like to donate for ${initials || 'this child'}.\n\nWishlist: ${wishes || '—'}`;
        openContactModal({ reason: prefillReason });
        return;
      }

      // If donate button is not in a kid card, fall through and handle below (generic donate)
    }

    // Nav Donate button(s) or hero Donate: detect nav link with href "#donate" or nav donate class
    const navDonate = e.target.closest('.nav-donate, a.nav-link[href="#donate"], a.nav-link[href="#donate"] *');
    if (navDonate) {
      e.preventDefault();
      openContactModal();
      return;
    }

    // Nav Contact links or any explicit contact buttons that link to #contact (top/bottom)
    const navContact = e.target.closest('a.nav-link[href="#contact"], .open-contact, .contact-btn');
    if (navContact) {
      e.preventDefault();
      openContactModal();
      return;
    }

    // If click was on the modal close '×' (your original contactClose id)
    if (e.target === contactClose || e.target.closest && e.target.closest('#contactClose')) {
      e.preventDefault();
      closeContactModal();
      return;
    }
  });
}

// Close modal when clicking background or pressing Escape
function setupModalCloseHandlers() {
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) closeContactModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeContactModal();
  });
}

// Initialize everything
function init() {
  // Keep original html intact — only touch styles and scripts
  if (!kidsGrid) {
    console.error('Missing #kidsGrid element in HTML — script cannot continue.');
    return;
  }

  setupToggleButtons();
  setupGlobalClickHandlers();
  setupModalForm();
  setupModalCloseHandlers();
  setupBottomContactForm();
  loadKids();
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  init();
});
