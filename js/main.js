'use strict';

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzukjCUcoICp2ZfGAjEeQ7u3PxsZa2JUSsJXbxcnuIBZ48usjP6GdP_VCRTrUb3g--TaA/exec';

const kidsGrid = document.getElementById('kidsGrid');
const toggleBtn = document.getElementById('toggleKids');

// Modals
const globalModal = document.getElementById('globalModal');
const globalModalClose = document.getElementById('globalModalClose');

const kidModal = document.getElementById('kidModal');
const kidModalClose = document.getElementById('kidModalClose');

document.addEventListener('DOMContentLoaded', () => {
  if (!kidsGrid) return;

  // Toggle kids grid
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      kidsGrid.classList.toggle('collapsed');
      toggleBtn.textContent = kidsGrid.classList.contains('collapsed') ? 'Show All' : 'Show Less';
    });
  }

  loadKids();

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
      const fields = ['Initials','Interests','Age','Needs','Wishes','Notes'];
      card.innerHTML = fields.map(f => `<p><strong>${f}:</strong> ${escapeHtml(k[f] || '—')}</p>`).join('');

      // Add donate button to card
      const donateWrapper = document.createElement('div');
      donateWrapper.className = 'button-wrapper';
      const donateBtn = document.createElement('button');
      donateBtn.className = 'donate-btn';
      donateBtn.textContent = 'Donate';
      donateBtn.addEventListener('click', () => openKidModal(k));
      donateWrapper.appendChild(donateBtn);
      card.appendChild(donateWrapper);

      kidsGrid.appendChild(card);
    });
  } catch(err) {
    console.error(err);
    kidsGrid.innerHTML = '<p>Could not load the kids list.</p>';
  }
}

function escapeHtml(s) {
  return String(s===undefined||s===null?'':s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

// --- Global modal ---
function setupGlobalModal() {
  document.body.addEventListener('click', e => {
    if (e.target.matches('.open-contact, .donate-btn, .nav-donate, .contact-btn')) {
      e.preventDefault();
      globalModal.style.display = 'flex';
      document.getElementById('globalModalForm').reset();
    }
  });
  globalModalClose.addEventListener('click', () => globalModal.style.display='none');
  globalModal.addEventListener('click', e => { if(e.target === globalModal) globalModal.style.display='none'; });
}

// --- Kid modal ---
function setupKidModal() {
  kidModalClose.addEventListener('click', () => kidModal.style.display='none');
  kidModal.addEventListener('click', e => { if(e.target === kidModal) kidModal.style.display='none'; });
}

function openKidModal(kid) {
  kidModal.style.display = 'flex';
  const msg = `I would like to donate to ${kid.Initials || 'this child'}.\n\nWishlist:\n${kid.Wishes || '—'}\nNeeds:\n${kid.Needs || '—'}`;
  document.getElementById('kidModalForm').reset();
  document.getElementById('kid-message').value = msg;
}
