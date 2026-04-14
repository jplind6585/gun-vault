// ── NAV SCROLL ────────────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── APP SELECTOR TABS ─────────────────────────────────────────────────
const tabs = document.querySelectorAll('.selector-tab');
const panels = document.querySelectorAll('.selector-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.selector-panel[data-panel="${target}"]`)?.classList.add('active');
  });
});

// ── EMAIL FORMS ────────────────────────────────────────────────────────
function handleEmailSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const input = form.querySelector('.email-input');
  const btn = form.querySelector('.btn-primary');
  const email = input.value.trim();

  if (!email) return;

  btn.textContent = 'Submitting...';
  btn.disabled = true;

  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(new FormData(form)).toString(),
  })
    .then(() => {
      btn.textContent = "You're on the list!";
      btn.style.background = '#2ecc71';
      btn.style.color = '#fff';
      input.disabled = true;
      input.value = '';
      input.placeholder = '✓ ' + email;
    })
    .catch(() => {
      btn.textContent = 'Try again';
      btn.disabled = false;
    });
}

document.getElementById('hero-email-form')?.addEventListener('submit', handleEmailSubmit);
document.getElementById('footer-email-form')?.addEventListener('submit', handleEmailSubmit);

// ── SMOOTH SCROLL FOR NAV ANCHORS ─────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
