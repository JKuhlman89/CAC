'use strict';

const SHEET_URL = 'https://script.google.com/macros/s/.../exec';
const FORMSPREE_URL = 'https://formspree.io/f/movyqakv';

const kidsGrid = document.getElementById('kidsGrid');
const toggleBtn = document.getElementById('toggleKids');
const modal = document.getElementById('contactModal');
const closeBtn = document.getElementById('contactClose');
const modalForm = document.getElementById('contactFormModal');
const status = document.getElementById('contactStatus');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const reasonLabel = document.getElementById('reasonLabel');

const hamburgerBtn = document.getElementById('hamburgerBtn');
const topNav = document.getElementById('topNav');

document.addEventListener('DOMContentLoaded', () => {
  if(kidsGrid) kidsGrid.classList.add('collapsed');

  if(toggleBtn){
    toggleBtn.addEventListener('click', ()=>{
      kidsGrid.classList.toggle('collapsed');
      toggleBtn.textContent = kidsGrid.classList.contains('collapsed') ? 'Show All' : 'Show Less';
    });
  }

  loadKids();
  setupModal();
  setupNav();

  document.querySelectorAll('.nav-link:not(.nav-donate)').forEach(link => {
    link.addEventListener('click', e=>{
      e.preventDefault();
      const targetID = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetID);
      if(target) target.scrollIntoView({behavior:'smooth'});
    });
  });
});

function setupNav(){
  hamburgerBtn.addEventListener('click', ()=>{
    topNav.classList.toggle('active');
  });
}

async function loadKids(){
  kidsGrid.innerHTML = '<p>Loading...</p>';
  try{
    const res = await fetch(SHEET_URL);
    const data = await res.json();
    const kids = Array.isArray(data) ? data : (data.kids||[]);
    const visible = kids.filter(k => !k.status || String(k.status).toLowerCase()==='active');
    kidsGrid.innerHTML='';
    if(!visible.length){ kidsGrid.innerHTML='<p>No entries are live right now.</p>'; return; }
    visible.forEach(k=>{
      const card = document.createElement('div');
      card.className='kid-card';
      const fields=['Initials','Interests','Age','Needs','Wishes','Notes'];
      card.innerHTML = fields.map(f=>`<p><strong>${f}:</strong> ${escapeHtml(k[f]||'—')}</p>`).join('');
      card.innerHTML += `<button class="donate-btn open-contact" data-kid="${escapeHtml(k.Initials)}" data-wishlist="${escapeHtml(k.Wishes||'')}">Donate</button>`;
      kidsGrid.appendChild(card);
    });
  }catch(err){ kidsGrid.innerHTML='<p>Could not load the kids list.</p>'; console.error(err);}
}

function escapeHtml(s){ return String(s??'').replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function setupModal(){
  document.body.addEventListener('click', e=>{
    if(e.target.matches('.open-contact, .nav-donate')){
      e.preventDefault();
      const kidName = e.target.dataset.kid;
      const wishlist = e.target.dataset.wishlist;

      if(kidName){
        modalTitle.textContent = `Donate for ${kidName}`;
        modalSubtitle.textContent = `Wishlist: ${wishlist||'No wishlist provided.'}`;
        reasonLabel.querySelector('textarea').placeholder='Optional message to the child';
      }else{
        modalTitle.textContent='Contact / Donate';
        modalSubtitle.textContent='Please fill out the form below to support a child.';
        reasonLabel.querySelector('textarea').placeholder='Your message...';
      }

      modal.classList.add('show');
      status.textContent='';
      modalForm.reset();
    }
  });

  closeBtn.addEventListener('click', ()=>modal.classList.remove('show'));
  modal.addEventListener('click', e=>{ if(e.target===modal) modal.classList.remove('show'); });

  modalForm.addEventListener('submit', async e=>{
    e.preventDefault();
    status.textContent='Submitting...';
    const formData = new FormData(modalForm);
    try{
      const res = await fetch(FORMSPREE_URL,{method:'POST',body:formData,headers:{'Accept':'application/json'}});
      const json = await res.json();
      if(res.ok){
        status.textContent='Thank you! Submission received.';
        modalForm.reset();
        setTimeout(()=>modal.classList.remove('show'),1500);
      }else{
        status.textContent='Submission failed: '+(json?.errors?.[0]?.message||'Unknown error');
      }
    }catch(err){ console.error(err); status.textContent='An error occurred. Please try again later.'; }
  });
}
