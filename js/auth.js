// js/auth.js
// Helpers compartidos. Se usan así en cualquier página:
//   <body data-require-auth>   -> exige sesión; si no hay, manda a login.html
//   #userMenu (topbar)         -> avatar con menú: Mi perfil / Logout (sin sesión, lleva al login)
// Requiere cargar antes: config.js, CDN de supabase-js y supabase-client.js.

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

// Solo aceptamos nombres de archivo .html simples como destino, para
// que un link armado a mano no pueda mandar al usuario a otro sitio.
function gvSafeNext(value) {
  return /^[\w-]+\.html$/i.test(value || '') ? value : null;
}

function gvInitUserMenu(session) {
  const menu = document.getElementById('userMenu');
  if (!menu) return;
  const btn = document.getElementById('userMenuBtn');

  btn.addEventListener('click', (e) => {
    // Sin sesión, el avatar lleva al login
    if (!session) {
      window.location.href = 'login.html';
      return;
    }
    e.stopPropagation();
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  // Cerrar al clickear afuera o con Escape
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
  // Evita que se ejecute dos veces (doble listener = menú que abre y cierra)
  if (window.__gvPageInit) return;
  window.__gvPageInit = true;

  const session = await gvGetSession();

  // Protección de rutas privadas
  if (document.body.hasAttribute('data-require-auth')) {
    if (!session) {
      const current = window.location.pathname.split('/').pop() || 'homepage.html';
      window.location.replace(`login.html?next=${encodeURIComponent(current)}`);
      return;
    }
    document.body.style.visibility = 'visible';
  }

  // Botón del hero en la homepage
  const heroCtaContainer = document.getElementById('heroCtaContainer');
  if (heroCtaContainer) {
    heroCtaContainer.innerHTML = session
      ? '<a href="vault.html" class="btn-primary">Go to My Vault</a>'
      : '<a href="login.html" class="btn-primary">Create Account</a>';
  }

  gvInitUserMenu(session);
}

document.addEventListener('DOMContentLoaded', gvInitPage);