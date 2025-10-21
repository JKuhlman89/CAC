'use strict';

/*
  main.js
  - Populates kids from SHEET_URL
  - Keeps initial collapsed grid
  - Toggles with single Show All button (#toggleKids)
  - Opens the contact modal for all Donate/Contact triggers
  - Prefills modal reason with kid info when opened from a kid card
  - Submits modal form and bottom contact form to Formspree
*/

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzukjCUcoICp2ZfGAjEeQ7u3PxsZa2JUSsJXbxcnuIBZ48usjP6GdP_VCRTrUb3g--TaA/exec';
const FORMSPREE_URL = 'https://formspree.io/f/movklbol';

document.addEventListener('DOMContentLoaded', () => {
  const kidsGrid = document.getElementById('kidsGrid');
  const toggleBtn = document.getElementById('toggleKids');
  const contactModal = document.getElementById('contactModal');
  const contactClose = document.getElementById('contactClose');
  const contactFormModal = document.getElementById('contactFormModal');
  const contactStatus = document.getElementById('contactStatus');
  const bottomContactForm = document.getElementById('bottomContactForm');

  if (!kidsGrid) {
    console.error('Missing #kidsGrid element.');
    return;
  }

  // helper
  function escapeHtml(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Toggle button
  function updateToggleText() {
    if (!toggleBtn) return;
    const collapsed = kidsGrid.classList.contains('collapsed');
    toggleBtn.textContent = collapsed ? 'Show All' : 'Show Less';
  }
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      kidsGrid.classList.toggle('collapsed');
      updateToggleText();
    });
  }

  // Load kids data
  async function loadKids() {
    kidsGrid.innerHTML = '<p>Loading...</p>';
    try {
      const res = await fetch(SHEET_URL);
      if (!res.ok) throw new Error('Network error: ' + res.status);
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

        const fields = ['Initials','Interests','Age','Needs','Wishes','Notes'];
        const inner = fields.map(f => {
          const val = escapeHtml(k[f] || '—');
          return `<p><strong>${escapeHtml(f)}:</strong> ${val}</p>`;
        }).join('');

        card.innerHTML = inner + `<div class="button-wrapper"><button class="donate-btn" type="button">Donate</button></div>`;
        kidsGrid.appendChild(card);
      });

      // ensure collapsed initial state
      if (!kidsGrid.classList.contains('collapsed')) kidsGrid.classList.add('collapsed');
      updateToggleText();
    } catch (err) {
      console.error(err);
      kidsGrid.innerHTML = '<p>Could not load the kids list.</p>';
    }
  }

  // Open/close modal
  function openContactModal(prefill = {}) {
    if (!contactModal || !contactFormModal) return;
    if (contactStatus) contactStatus.textContent = '';

    try {
      if (prefill.name !== undefined && contactFormModal.name) contactFormModal.name.value = prefill.name;
      if (prefill.phone !== undefined && contactFormModal.phone) contactFormModal.phone.value = prefill.phone;
      if (prefill.email !== undefined && contactFormModal.email) contactFormModal.email.value = prefill.email;
      if (prefill.reason !== undefined && contactFormModal.reason) contactFormModal.reason.value = prefill.reason;
    } catch (e) {}

    contactModal.classList.add('show');
    contactModal.setAttribute('aria-hidden', 'false');
    const first = contactFormModal.querySelector('input, textarea');
    if (first) setTimeout(() => first.focus(), 60);
  }

  function closeContactModal() {
    if (!contactModal) return;
    contactModal.classList.remove('show');
    contactModal.setAttribute('aria-hidden', 'true');
  }

  // Delegated clicks
  document.body.addEventListener('click', (e) => {
    // kid-card donate
    const kidDonate = e.target.closest('.kid-card .donate-btn, .kid-card button.donate-btn');
    if (kidDonate) {
      e.preventDefault();
      const card = kidDonate.closest('.kid-card');
      const paragraphs = Array.from(card.querySelectorAll('p'));
      const initialsP = paragraphs.find(p => p.textContent.trim().startsWith('Initials:'));
      const wishesP = paragraphs.find(p => p.textContent.trim().startsWith('Wishes:'));
      const initials = initialsP ? initialsP.textContent.replace('Initials:','').trim() : '';
      const wishes = wishesP ? wishesP.textContent.replace('Wishes:','').trim() : '';
      const reason = `I would like to donate for ${initials || 'this child'}.\n\nWishlist: ${wishes || '—'}`;
      openContactModal({ reason });
      return;
    }

    // nav/hero donate
    const navDonate = e.target.closest('.donate-nav, a.nav-link[href="#donate"]');
    if (navDonate) {
      e.preventDefault();
      openContactModal();
      return;
    }

    // nav contact
    const navContact = e.target.closest('.contact-nav, a.nav-link[href="#contact"]');
    if (navContact) {
      e.preventDefault();
      openContactModal();
      return;
    }

    // close button
    if (e.target === contactClose || (e.target.closest && e.target.closest('#contactClose'))) {
      e.preventDefault();
      closeContactModal();
      return;
    }
  });

  // close on outside click
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) closeContactModal();
    });
  }
  // close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeContactModal();
  });

  // submit modal form to Formspree
  if (contactFormModal) {
    contactFormModal.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (contactStatus) contactStatus.textContent = 'Submitting...';

      const fd = new FormData(contactFormModal);

      try {
        const res = await fetch(FORMSPREE_URL, {
          method: 'POST',
          body: fd,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          if (contactStatus) contactStatus.textContent = 'Thank you! Submission received.';
          contactFormModal.reset();
          setTimeout(() => closeContactModal(), 1200);
        } else {
          console.error('Formspree response not ok');
          if (contactStatus) contactStatus.textContent = 'Submission failed. Please try again later.';
        }
      } catch (err) {
        console.error('Submit error', err);
        if (contactStatus) contactStatus.textContent = 'An error occurred. Please try again later.';
      }
    });
  }

  // bottom form submit to Formspree
  if (bottomContactForm) {
    bottomContactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let statusEl = bottomContactForm.querySelector('.bottom-form-status');
      if (!statusEl) {
        statusEl = document.createElement('p');
        statusEl.className = 'bottom-form-status';
        bottomContactForm.appendChild(statusEl);
      }
      statusEl.textContent = 'Submitting...';
      try {
        const fd = new FormData(bottomContactForm);
        const res = await fetch(FORMSPREE_URL, {
          method: 'POST',
          body: fd,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          statusEl.textContent = 'Thank you — submission received.';
          bottomContactForm.reset();
        } else {
          statusEl.textContent = 'Submission failed. Please try again later.';
        }
      } catch (err) {
        console.error(err);
        statusEl.textContent = 'An error occurred. Please try again later.';
      }
    });
  }

  // initial load
  loadKids();
});
