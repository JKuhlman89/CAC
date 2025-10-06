'use strict';

// === CONFIG ===
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzukjCUcoICp2ZfGAjEeQ7u3PxsZa2JUSsJXbxcnuIBZ48usjP6GdP_VCRTrUb3g--TaA/exec';
const CONTACT_URL = 'https://script.google.com/macros/s/AKfycbzoODUNkJn3ySmtn81NEKFnfSUfuU7wtR6AMwtz0LcrawDH-xJm7zsK-jCXi7baR8PkRg/exec';

// DOM elements
const kidsGrid = document.getElementById('kidsGrid');
const toggleBtn = document.getElementById('toggleKids');
const modal = document.getElementById('contactModal');
const closeBtn = document.getElementById('contactClose');
const form = document.getElementById('contactForm');
const status = document.getElementById('contactStatus');

document.addEventListener('DOMContentLoaded', () => {
  if (!kidsGrid) return;

  // Show all toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      kidsGrid.classList.toggle('collapsed');
      toggleBtn.textContent = kidsGrid.classList.contains('collapsed') ? 'Show All' : 'Show Less';
    });
  }

  // Load kids
  loadKids();

  // Modal open/close
  setupModal();

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
      card.innerHTML += `<div class="button-wrapper"><a href="#" class="donate-btn open-contact">Donate</a></div>`;
      kidsGrid.appendChild(card);
    });

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

// --- Modal ---
function setupModal() {
  // Open modal
  document.body.addEventListener('click', e => {
    if (e.target.matches('.open-contact, .donate-btn, .nav-donate')) {
      e.preventDefault();
      modal.style.display = 'flex';
      status.textContent = '';
    }
  });

  // Close modal
  closeBtn.addEventListener('click', () => modal.style.display='none');
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display='none'; });

  // Submit form
  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = 'Submitting...';

    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      reason: form.reason.value.trim()
    };

    try {
      const res = await fetch(CONTACT_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.result==='success') {
        status.textContent = 'Thank you! Submission received.';
        form.reset();
        setTimeout(()=>modal.style.display='none', 1500);
      } else {
        status.textContent = 'Submission failed: ' + (json.message||'Unknown error');
      }
    } catch(err) {
      console.error(err);
      status.textContent = 'An error occurred. Please try again later.';
    }
  });
}
