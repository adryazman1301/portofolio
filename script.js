document.addEventListener('DOMContentLoaded', () => {
  // Smooth navigation (links like "about" -> #about)
  const navLinks = Array.from(document.querySelectorAll('nav a'));
  const normalizeTarget = href => {
    if (!href) return null;
    if (href.startsWith('#')) return href.slice(1);
    // strip origin/leading slash, also handle plain "about" -> id "about"
    return href.replace(/^.*#/, '').replace(/^\//, '');
  };
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const id = normalizeTarget(a.getAttribute('href'));
      const target = id ? document.getElementById(id) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // update history (no reload)
        history.replaceState(null, '', `#${id}`);
      }
    });
  });

  // Active nav link based on intersection
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const linkById = id => navLinks.find(a => normalizeTarget(a.getAttribute('href')) === id);
  const io = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      const id = ent.target.id;
      const link = linkById(id);
      if (!link) return;
      if (ent.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { threshold: 0.45 });
  sections.forEach(s => io.observe(s));

  // Simple reveal on scroll
  const revealTargets = document.querySelectorAll('section, .project, form');
  const revIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(t => revIO.observe(t));

  // Lightbox for project images
  const images = document.querySelectorAll('#project img');
  let lightbox;
  function createLightbox() {
    lightbox = document.createElement('div');
    Object.assign(lightbox.style, {
      position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', zIndex: 9999, padding: '24px'
    });
    lightbox.addEventListener('click', () => closeLightbox());
    const imgWrap = document.createElement('div');
    Object.assign(imgWrap.style, { maxWidth: '90%', maxHeight: '90%' });
    const img = document.createElement('img');
    Object.assign(img.style, { width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 18px 60px rgba(0,0,0,0.6)' });
    imgWrap.appendChild(img);
    lightbox.appendChild(imgWrap);
    document.body.appendChild(lightbox);
    return lightbox;
  }
  function openLightbox(src, alt = '') {
    if (!lightbox) createLightbox();
    const img = lightbox.querySelector('img');
    img.src = src;
    img.alt = alt;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }
  images.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', e => {
      openLightbox(e.currentTarget.src, e.currentTarget.alt);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Improved contact submit (example Formspree)
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      // simple UI validation
      if (!name || !email || !message) { showToast('Lengkapi semua field', 'error'); return; }
      // optional honeypot (add <input name="bot-field" style="display:none"> in form)
      // submit
      try {
        showToast('Mengirim...', 'info');
        const data = new FormData(form);
        // replace endpoint with your Formspree endpoint or server URL
        const resp = await fetch('https://formspree.io/f/your-id', {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        const json = await resp.json();
        if (resp.ok) {
          showToast('Pesan terkirim. Terima kasih!', 'success');
          form.reset();
        } else {
          const error = json?.error || 'Gagal mengirim';
          showToast(error, 'error');
        }
      } catch (err) {
        showToast('Terjadi kesalahan. Coba lagi.', 'error');
      }
    });
  }

  // Small toast helper
  let toastTimer;
  function showToast(text, type = 'info') {
    clearTimeout(toastTimer);
    let t = document.getElementById('site-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'site-toast';
      Object.assign(t.style, {
        position: 'fixed', right: '20px', bottom: '80px', zIndex: 99999,
        padding: '12px 16px', borderRadius: '10px', color: '#fff', fontWeight: 600,
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
      });
      document.body.appendChild(t);
    }
    t.textContent = text;
    if (type === 'error') t.style.background = 'linear-gradient(90deg,#d9534f,#c63b3b)';
    else if (type === 'success') t.style.background = 'linear-gradient(90deg,#16c28b,#0ea86e)';
    else t.style.background = 'rgba(0,0,0,0.75)';
    t.style.opacity = '1';
    toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 3800);
  }

  // Improve links with "active" visual state (adds minimal inline style if no CSS)
  const cssActiveExists = !!document.querySelector('style[data-nav-active]');
  if (!cssActiveExists) {
    const style = document.createElement('style');
    style.setAttribute('data-nav-active', '1');
    style.textContent = `
      nav a.active{ background: rgba(255,255,255,0.14); transform: translateY(-1px); box-shadow: 0 8px 22px rgba(0,0,0,0.06); }
      section.in{ transform: translateY(0); opacity:1; transition: opacity .6s ease, transform .6s ease; }
      section{ opacity:0; transform: translateY(8px); }
    `;
    document.head.appendChild(style);
  }
  // Floating FAB menu toggle
const fabMain = document.getElementById('fab-main-btn');
const fabMenu = document.querySelector('.fab-menu');

if (fabMain) {
  fabMain.addEventListener('click', () => {
    fabMenu.classList.toggle('active');
  });
}

// Close menu when clicking a link
document.querySelectorAll('.fab-item').forEach(btn => {
  btn.addEventListener('click', () => {
    fabMenu.classList.remove('active');
  });
});



});