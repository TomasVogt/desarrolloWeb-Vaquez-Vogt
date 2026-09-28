// js/auth.js
// Helpers compartidos. Se usan así en cualquier página:
//   <body data-require-auth>   -> exige sesión; si no hay, manda a login.html
//   <a id="navAuthLink" ...>   -> se convierte en "Login" o "Logout" según la sesión
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

async function gvInitPage() {
  const session = await gvGetSession();

  if (document.body.hasAttribute('data-require-auth')) {
    if (!session) {
      const current = window.location.pathname.split('/').pop() || 'homepage.html';
      window.location.replace(`login.html?next=${encodeURIComponent(current)}`);
      return;
    }
    document.body.style.visibility = 'visible';
  }

  const link = document.getElementById('navAuthLink');
  if (link) {
    if (session) {
      link.textContent = 'Logout';
      link.setAttribute('href', '#');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        gvSignOut();
      });
    } else {
      link.textContent = 'Login';
      link.setAttribute('href', 'login.html');
    }
  }
}

document.addEventListener('DOMContentLoaded', gvInitPage);
