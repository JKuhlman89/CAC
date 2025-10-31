'use strict';

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzukjCUcoICp2ZfGAjEeQ7u3PxsZa2JUSsJXbxcnuIBZ48usjP6GdP_VCRTrUb3g--TaA/exec';
const FORMSPREE_URL = 'https://formspree.io/f/movklbol';

const kidsGrid = document.getElementById('kidsGrid');
const toggleBtn = document.getElementById('toggleKids');
const modal = document.getElementById('contactModal');
const closeBtn = document.getElementById('contactClose');
const modalForm = document.getElementById('contactFormModal');
const status = document.getElementById('contactStatus');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const reasonLabel = document.getElementById('reasonLabel');

document.addEventListener('DOMContentLoaded', () => {
  if (!kidsGrid) return;

  // Show only top row initially
  kidsGrid.classList.add('collapsed');

  // Toggle show all/less
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      kidsGrid.classList.toggle('collapsed');
      toggleBtn.textContent = kidsGrid.classList.contains('collapsed') ? 'Show All' : 'Show Less';
    });
  }

  // Load kids cards
  loadKids();

  // Setup modal open/close
  setupModal();

  // Smooth scroll for nav links (exclude modal buttons)
  document.querySelectorAll('.nav-link:not(.nav-donate)').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetID = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetID);
      if (target) target.scrollIntoView({behavior:'smooth'});
    });
  });

  // Bottom contact form submission
  const contactForm = document.querySelector('.contact-form');
  const bottomStatus = document.getElementById('bottomContactStatus');
  if(contactForm){
    contactForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const formData = new FormData(contactForm);
      bottomStatus.textContent = 'Submitting...';
      try{
        const res = await fetch(FORMSPREE_URL, {
          method:'POST',
          body: formData,
          headers: {'Accept':'application/json'}
        });
        const json = await res.json();
        if(res.ok){
          bottomStatus.textContent = 'Thank you! Submission received.';
          contactForm.reset();
        } else {
          bottomStatus.textContent = 'Submission failed: '+(json?.errors?.[0]?.message||'Unknown error');
        }
      }catch(err){
        console.error(err);
        bottomStatus.textContent = 'An error occurred. Please try again later.';
      }
    });
  }
});

// --- Load kids from Google Sheet ---
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
      card.innerHTML = fields.map(f => `<p><strong>${f}:</strong> ${escapeHtml(k[f]||'—')}</p>`).join('');
      card.innerHTML += `<div class="button-wrapper">
        <button class="donate-btn open-contact" data-kid="${escapeHtml(k.Initials)}" data-wishlist="${escapeHtml(k.Wishes||'')}">Donate</button>
      </div>`;
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

// --- Modal setup ---
function setupModal() {
  // Open modal for .open-contact and nav-donate buttons
  document.body.addEventListener('click', e => {
    if(e.target.matches('.open-contact, .nav-donate')){
      e.preventDefault();
      const kidName = e.target.dataset.kid;
      const wishlist = e.target.dataset.wishlist;

      if(kidName){
        modalTitle.textContent = `Donate for ${kidName}`;
        modalSubtitle.textContent = `Wishlist: ${wishlist || 'No wishlist provided.'}`;
        reasonLabel.style.display = 'none';
      } else {
        modalTitle.textContent = 'Contact / Donate';
        modalSubtitle.textContent = 'Please fill out the form below to support a child.';
        reasonLabel.style.display = 'block';
      }

      modal.classList.add('show');
      status.textContent = '';
      modalForm.reset();
    }
  });

  // Close modal
  closeBtn.addEventListener('click', ()=> modal.classList.remove('show'));
  modal.addEventListener('click', e=> { if(e.target === modal) modal.classList.remove('show'); });

  // Modal form submission
  modalForm.addEventListener('submit', async e=>{
    e.preventDefault();
    status.textContent = 'Submitting...';
    const formData = new FormData(modalForm);
    try{
      const res = await fetch(FORMSPREE_URL, {
        method:'POST',
        body: formData,
        headers: {'Accept':'application/json'}
      });
      const json = await res.json();
      if(res.ok){
        status.textContent = 'Thank you! Submission received.';
        modalForm.reset();
        setTimeout(()=> modal.classList.remove('show'), 1500);
      } else {
        status.textContent = 'Submission failed: '+(json?.errors?.[0]?.message||'Unknown error');
      }
    }catch(err){
      console.error(err);
      status.textContent = 'An error occurred. Please try again later.';
    }
  });
}
