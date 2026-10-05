async function gvGetSession() {
  if (!window.gvSupabase) return null;
  const { data, error } = await window.gvSupabase.auth.getSession();
  if (error) return null;
  return data.session;
}

async function gvSignOut() {
  if (window.gvSupabase) await window.gvSupabase.auth.signOut();
  window.location.replace('homepage.html');
}


function gvSafeNext(value) {
  return /^[\w-]+\.html$/i.test(value || '') ? value : null;
}

function gvInitUserMenu(session) {
  const menu = document.getElementById('userMenu');
  if (!menu) return;
  const btn = document.getElementById('userMenuBtn');

  btn.addEventListener('click', (e) => {
    if (!session) {
      window.location.href = 'login.html';
      return;
    }
    e.stopPropagation();
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    gvSignOut();
  });
}

async function gvInitPage() {
  if (window.__gvPageInit) return;
  window.__gvPageInit = true;

  const session = await gvGetSession();

  if (document.body.hasAttribute('data-require-auth')) {
    if (!session) {
      const current = window.location.pathname.split('/').pop() || 'homepage.html';
      window.location.replace(`login.html?next=${encodeURIComponent(current)}`);
      return;
    }
    document.body.style.visibility = 'visible';
  }

  const heroCtaContainer = document.getElementById('heroCtaContainer');
  if (heroCtaContainer) {
    heroCtaContainer.innerHTML = session
      ? '<a href="vault.html" class="btn-primary">Go to My Vault</a>'
      : '<a href="login.html" class="btn-primary">Create Account</a>';
  }

  gvInitUserMenu(session);
}

document.addEventListener('DOMContentLoaded', gvInitPage);