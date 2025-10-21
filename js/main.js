'use strict';

/*
  main.js
  - Loads kids from SHEET_URL (your existing Google Apps script URL)
  - Populates #kidsGrid with cards
  - Keeps initial collapsed grid (first row visible)
  - Toggles with single Show All button (#toggleKids)
  - Opens contact modal (#contactModal) for all Donate/Contact triggers
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

  // --- Toggle show all ---
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

  // --- Escape HTML helper ---
  function escapeHtml(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // --- Load kids from SHEET_URL ---
  async function loadKids() {
    kidsGrid.innerHTML = '<p>Loading...</p>';
    try {
      const res = await fetch(SHEET_URL);
      if (!res.ok) throw new Error('Network error: ' + res.status);
      const data = await res.json();

      // data might be array or object with kids property
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

        // Build card content using the fields you expect
        const fields = ['Initials','Interests','Age','Needs','Wishes','Notes'];
        const inner = fields.map(f => {
          const val = escapeHtml(k[f] || '—');
          return `<p><strong>${escapeHtml(f)}:</strong> ${val}</p>`;
        }).join('');

        // Append donate button (we will handle clicks via delegation)
        card.innerHTML = inner + `<div class="button-wrapper"><button class="donate-btn" type="button">Donate</button></div>`;

        kidsGrid.appendChild(card);
      });

      // Ensure initial collapsed state and toggle text
      if (!kidsGrid.classList.contains('collapsed')) kidsGrid.classList.add('collapsed');
      updateToggleText();

    } catch (err) {
      console.error(err);
      kidsGrid.innerHTML = '<p>Could not load the kids list.</p>';
    }
  }

  // --- Open contact modal; optional prefill object { name, wishlist, reason } ---
  function openContactModal(prefill = {}) {
    if (!contactModal || !contactFormModal) return;
    // reset status
    if (contactStatus) contactStatus.textContent = '';

    // prefill fields if present (don't overwrite if undefined)
    try {
      if (prefill.name !== undefined && contactFormModal.name) contactFormModal.name.value = prefill.name;
      if (prefill.phone !== undefined && contactFormModal.phone) contactFormModal.phone.value = prefill.phone;
      if (prefill.email !== undefined && contactFormModal.email) contactFormModal.email.value = prefill.email;
      if (prefill.reason !== undefined && contactFormModal.reason) contactFormModal.reason.value = prefill.reason;
    } catch (e) {
      // ignore
    }

    contactModal.classList.add('show');
    // focus first input
    const first = contactFormModal.querySelector('input, textarea');
    if (first) setTimeout(() => first.focus(), 60);
  }

  function closeContactModal() {
    if (!contactModal) return;
    contactModal.classList.remove('show');
  }

  // --- Delegated click handling for Donate / Contact triggers ---
  document.body.addEventListener('click', (e) => {
    // 1) If a kid-card donate button was clicked
    const donateBtn = e.target.closest('.kid-card .donate-btn, .kid-card button.donate-btn');
    if (donateBtn) {
      e.preventDefault();
      const card = donateBtn.closest('.kid-card');
      // Extract useful info: Initials and Wishes if present
      const paragraphs = Array.from(card.querySelectorAll('p'));
      const initialsP = paragraphs.find(p => p.textContent.trim().startsWith('Initials:'));
      const wishesP = paragraphs.find(p => p.textContent.trim().startsWith('Wishes:'));
      const initials = initialsP ? initialsP.textContent.replace('Initials:','').trim() : '';
      const wishes = wishesP ? wishesP.textContent.replace('Wishes:','').trim() : '';
      const reason = `I would like to donate for ${initials || 'this child'}.\n\nWishlist: ${wishes || '—'}`;
      openContactModal({ reason });
      return;
    }

    // 2) If hero/nav donate or donate-nav clicked
    const navDonate = e.target.closest('.donate-nav, a.nav-link[href="#donate"], a.nav-link:contains("Donate")');
    if (navDonate) {
      e.preventDefault();
      openContactModal();
      return;
    }

    // 3) If contact nav clicked (open modal)
    const navContact = e.target.closest('.contact-nav, a.nav-link[href="#contact"]');
    if (navContact) {
      e.preventDefault();
      openContactModal();
      return;
    }

    // 4) Close button inside modal
    if (e.target === contactClose || e.target.closest && e.target.closest('#contactClose')) {
      e.preventDefault();
      closeContactModal();
      return;
    }
  });

  // Close modal when clicking outside content
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) closeContactModal();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeContactModal();
  });

  // --- Submit modal form to Formspree ---
  if (contactFormModal) {
    contactFormModal.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (contactStatus) contactStatus.textContent = 'Submitting...';

      // Using FormData (Formspree accepts formdata and will respond with JSON if Accept: application/json)
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
          setTimeout(() => closeContactModal(), 1400);
        } else {
          let json;
          try { json = await res.json(); } catch(_) { json = null; }
          console.error('Formspree error', json);
          if (contactStatus) contactStatus.textContent = 'Submission failed. Please try again later.';
        }
      } catch (err) {
        console.error('Submit error', err);
        if (contactStatus) contactStatus.textContent = 'An error occurred. Please try again later.';
      }
    });
  }

  // --- Bottom contact form submits to Formspree (without modal) ---
  if (bottomContactForm) {
    bottomContactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // add inline status element if not present
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

  // --- Initialize: load kids ---
  loadKids();
});
