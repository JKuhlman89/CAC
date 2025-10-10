'use strict';

// === CONFIG ===
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzukjCUcoICp2ZfGAjEeQ7u3PxsZa2JUSsJXbxcnuIBZ48usjP6GdP_VCRTrUb3g--TaA/exec';
const FORMSPREE_URL = 'https://formspree.io/f/movklbol';

// DOM Elements
const kidsGrid = document.getElementById('kidsGrid');
const toggleBtn = document.getElementById('toggleKids');

// Global modal (for page Contact/Donate buttons)
const globalModal = document.getElementById('globalModal');
const globalModalClose = document.getElementById('globalModalClose');
const globalModalForm = document.getElementById('globalModalForm');
const globalModalStatus = document.getElementById('globalModalStatus');

// Kid-specific modal
const kidModal = document.getElementById('kidModal');
const kidModalClose = document.getElementById('kidModalClose');
const kidModalForm = document.getElementById('kidModalForm');
const kidModalStatus = document.getElementById('kidModalStatus');
const kidNameSpan = document.getElementById('kidName');
const kidWishlistSpan = document.getElementById('kidWishlist');

document.addEventListener('DOMContentLoaded', () => {
  if (!kidsGrid) return;

  // Load kids
  loadKids();

  // Setup Show All toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      kidsGrid.classList.toggle('collapsed');
      toggleBtn.textContent = kidsGrid.classList.contains('collapsed') ? 'Show All' : 'Show Less';
    });
  }

  // Setup modals
  setupGlobalModal();
  setupKidModal();

  // Smooth scroll for nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetID = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetID);
      if (target) target.scrollIntoView({behavior:'smooth'});
    });
  });

  // Bottom contact form submission
  const bottomForm = document.querySelector('.contact-form');
  if(bottomForm){
    bottomForm.addEventListener('submit', async e => {
      e.preventDefault();
      await submitForm(bottomForm, FORMSPREE_URL);
      bottomForm.reset();
    });
  }
});

// --- Load kids from JSON ---
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
      const fields = ['Initials','Interests','Age','Needs','Wishes','Notes'];
      card.innerHTML = fields.map(f => `<p><strong>${f}:</strong> ${escapeHtml(k[f] || '—')}</p>`).join('');

      // Kid Donate button
      const donateBtn = document.createElement('a');
      donateBtn.href = '#';
      donateBtn.className = 'donate-btn';
      donateBtn.textContent = 'Donate';
      donateBtn.addEventListener('click', e => {
        e.preventDefault();
        openKidModal(k);
      });

      const btnWrapper = document.createElement('div');
      btnWrapper.className = 'button-wrapper';
      btnWrapper.appendChild(donateBtn);
      card.appendChild(btnWrapper);

      kidsGrid.appendChild(card);
    });

    // Initially collapse to show only top row
    kidsGrid.classList.add('collapsed');

  } catch(err) {
    console.error(err);
    kidsGrid.innerHTML = '<p>Could not load the kids list.</p>';
  }
}

// --- Escape HTML ---
function escapeHtml(s) {
  return String(s===undefined||s===null?'':s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

// --- Global modal ---
function setupGlobalModal() {
  const pageButtons = document.querySelectorAll('.open-contact, .nav-donate');
  pageButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      globalModal.style.display = 'flex';
      globalModalForm.reset();
      globalModalStatus.textContent = '';
    });
  });

  globalModalClose.addEventListener('click', () => globalModal.style.display='none');
  globalModal.addEventListener('click', e => { if(e.target === globalModal) globalModal.style.display='none'; });

  globalModalForm.addEventListener('submit', async e => {
    e.preventDefault();
    globalModalStatus.textContent = 'Submitting...';
    await submitForm(globalModalForm, FORMSPREE_URL, globalModalStatus);
    globalModalForm.reset();
    setTimeout(()=> globalModal.style.display='none', 1500);
  });
}

// --- Kid modal ---
function setupKidModal() {
  kidModalClose.addEventListener('click', () => kidModal.style.display='none');
  kidModal.addEventListener('click', e => { if(e.target === kidModal) kidModal.style.display='none'; });

  kidModalForm.addEventListener('submit', async e => {
    e.preventDefault();
    kidModalStatus.textContent = 'Submitting...';

    await submitForm(kidModalForm, FORMSPREE_URL, kidModalStatus);
    kidModalForm.reset();
    setTimeout(()=> kidModal.style.display='none', 1500);
  });
}

function openKidModal(kid) {
  kidNameSpan.textContent = escapeHtml(kid.Initials || '—');
  kidWishlistSpan.textContent = escapeHtml(kid.Wishes || '—');
  kidModal.style.display = 'flex';
  kidModalStatus.textContent = '';
}

// --- Form submission helper ---
async function submitForm(formEl, url, statusEl){
  const data = {};
  Array.from(formEl.elements).forEach(el => {
    if(el.name) data[el.name] = el.value.trim();
  });
  try{
    const res = await fetch(url, {
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if(json.ok || json.result==='success'){
      if(statusEl) statusEl.textContent = 'Thank you! Submission received.';
    } else {
      if(statusEl) statusEl.textContent = 'Submission failed: ' + (json.message||'Unknown error');
    }
  }catch(err){
    console.error(err);
    if(statusEl) statusEl.textContent = 'An error occurred. Please try again later.';
  }
}
