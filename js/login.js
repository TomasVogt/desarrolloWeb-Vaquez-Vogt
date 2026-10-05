(function () {
  const form = document.getElementById('authForm');
  const titleEl = document.getElementById('authTitle');
  const hintEl = document.getElementById('authHint');
  const submitBtn = document.getElementById('submitBtn');
  const messageEl = document.getElementById('formMessage');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const confirmEl = document.getElementById('confirmPassword');
  const rememberEl = document.getElementById('remember');

  const MIN_PASSWORD = 8;

  const MODES = {
    login: {
      title: 'Inicia sesión con tu cuenta de<br>GameVault',
      submit: 'Continuar',
      hint: '',
      passwordAutocomplete: 'current-password',
    },
    register: {
      title: 'Creá tu cuenta de<br>GameVault',
      submit: 'Crear cuenta',
      hint: '¿Ya tenés cuenta? <a href="#" data-goto="login">Iniciá sesión</a>',
      passwordAutocomplete: 'new-password',
    },
    forgot: {
      title: 'Recuperá tu contraseña',
      submit: 'Enviar enlace',
      hint: '<a href="#" data-goto="login">Volver a iniciar sesión</a>',
      passwordAutocomplete: 'new-password',
    },
    reset: {
      title: 'Elegí una nueva contraseña',
      submit: 'Guardar contraseña',
      hint: '',
      passwordAutocomplete: 'new-password',
    },
  };

  let mode = 'login';

  function setMode(next) {
    mode = next;
    const cfg = MODES[mode];

    titleEl.innerHTML = cfg.title;
    hintEl.innerHTML = cfg.hint;
    hintEl.classList.toggle('is-hidden', !cfg.hint);
    submitBtn.textContent = cfg.submit;
    passwordEl.setAttribute('autocomplete', cfg.passwordAutocomplete);
    form.querySelectorAll('[data-modes]').forEach((el) => {
      const visible = el.dataset.modes.split(' ').includes(mode);
      el.classList.toggle('is-hidden', !visible);
      el.querySelectorAll('input').forEach((input) => (input.disabled = !visible));
      if (el.tagName === 'INPUT') el.disabled = !visible;
    });

    clearMessage();
  }

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `form-message form-message--${type}`;
  }
  const showError = (text) => showMessage(text, 'error');
  const showSuccess = (text) => showMessage(text, 'success');

  function clearMessage() {
    messageEl.textContent = '';
    messageEl.className = 'form-message is-hidden';
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Un momento…' : MODES[mode].submit;
  }

  let projectSettings = null;


  function setupProblem() {
    if (window.gvStatus && window.gvStatus.placeholders) {
      return 'Falta configurar Supabase: completá js/config.js con la URL y la clave pública de tu proyecto.';
    }
    if (window.gvStatus && !window.gvStatus.libLoaded) {
      return 'No se pudo cargar la librería de Supabase (CDN). Revisá tu conexión a internet o si algo la está bloqueando.';
    }
    if (!window.gvSupabase) return 'No se pudo iniciar el cliente de Supabase.';
    return null;
  }


  async function checkConnection() {
    const cfg = window.GAMEVAULT_CONFIG;
    const base = cfg.SUPABASE_URL.trim().replace(/\/+$/, '');
    try {
      const res = await fetch(`${base}/auth/v1/settings`, {
        headers: { apikey: cfg.SUPABASE_ANON_KEY.trim() },
      });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, msg: 'Supabase rechazó la clave pública. Revisá que en js/config.js hayas copiado la clave "anon" o "publishable" completa (no la service_role).' };
      }
      if (res.status === 404) {
        return { ok: false, msg: 'Esa URL no parece ser la de un proyecto de Supabase. Tiene que verse como https://xxxx.supabase.co (sin /rest/v1 ni nada al final).' };
      }
      if (!res.ok) return { ok: false, msg: `Supabase respondió con el error ${res.status}.` };
      return { ok: true, settings: await res.json() };
    } catch (err) {
      console.error('Fallo la conexión con Supabase:', err);
      return { ok: false, msg: 'No pude conectarme con esa URL de Supabase. Revisá que esté bien escrita en js/config.js y que tengas internet.' };
    }
  }

  function translateError(err) {
    const code = err.code || '';
    const msg = (err.message || '').toLowerCase();

    if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
      return 'Todavía no confirmaste tu correo. Revisá tu bandeja de entrada.';
    }
    if (code === 'user_already_exists' || msg.includes('already registered')) {
      return 'Ya existe una cuenta con ese correo.';
    }
    if (code === 'weak_password' || msg.includes('password should')) {
      return `La contraseña es muy débil. Usá al menos ${MIN_PASSWORD} caracteres.`;
    }
    if (code === 'same_password' || msg.includes('different from the old')) {
      return 'La nueva contraseña tiene que ser distinta a la anterior.';
    }
    if (code.includes('rate_limit') || msg.includes('rate limit')) {
      return 'Demasiados intentos. Esperá unos minutos y volvé a probar.';
    }
    if (err.name === 'AuthRetryableFetchError' || msg.includes('failed to fetch')) {
      return 'No pude conectarme al servidor. Revisá tu conexión.';
    }
    return 'Ocurrió un error inesperado. Intentá de nuevo.';
  }

  function redirectAfterAuth() {
  const params = new URLSearchParams(window.location.search);
  const next = gvSafeNext(params.get('next'));
  window.location.replace(next || 'homepage.html');
}

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    const problem = setupProblem();
    if (problem) {
      showError(problem);
      return;
    }

    if (mode === 'register' && projectSettings && projectSettings.disable_signup) {
      showError('El registro de nuevas cuentas está deshabilitado en tu proyecto de Supabase (Authentication → Sign In / Providers).');
      return;
    }

    const sb = window.gvSupabase;
    const email = emailEl.value.trim();
    const password = passwordEl.value;

    if ((mode === 'register' || mode === 'reset') && password.length < MIN_PASSWORD) {
      showError(`La contraseña tiene que tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if ((mode === 'register' || mode === 'reset') && password !== confirmEl.value) {
      showError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const backHere = window.location.origin + window.location.pathname;

      if (mode === 'login') {
        localStorage.setItem(window.GV_REMEMBER_KEY, String(rememberEl.checked));
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        redirectAfterAuth();
        return;
      }

      if (mode === 'register') {
        localStorage.setItem(window.GV_REMEMBER_KEY, 'true');
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: backHere },
        });
        if (error) throw error;
        if (data.session) {
          redirectAfterAuth(); 
        } else {
          showSuccess('Listo. Si el correo es válido, te enviamos un enlace para confirmar tu cuenta.');
        }
        return;
      }

      if (mode === 'forgot') {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: backHere });
        if (error) throw error;
        showSuccess('Si existe una cuenta con ese correo, te enviamos un enlace para cambiar la contraseña.');
        return;
      }

      if (mode === 'reset') {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        showSuccess('Contraseña actualizada. Te llevamos a tu Vault…');
        setTimeout(redirectAfterAuth, 1200);
      }
    } catch (err) {
      console.error(err);
      showError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  async function init() {
    form.addEventListener('submit', handleSubmit);

    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-goto]');
      if (!target) return;
      e.preventDefault();
      setMode(target.dataset.goto);
    });

    setMode('login');

    if (window.location.protocol === 'file:') {
      const notice = document.getElementById('envNotice');
      notice.textContent = 'Estás abriendo la página como archivo (file://). Iniciar sesión puede andar, pero los enlaces de los correos no van a volver acá. Usá Live Server o "npx serve".';
      notice.classList.remove('is-hidden');
    }

    const problem = setupProblem();
    if (problem) {
      showError(problem);
      return;
    }

    const hash = window.location.hash;

    if (hash.includes('error_code=')) {
      showError('El enlace expiró o ya fue usado. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".');
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return;
    }

    window.gvSupabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('reset');
    });
    if (hash.includes('type=recovery')) {
      setMode('reset');
      return;
    }

    const session = await gvGetSession();
    if (session) {
      redirectAfterAuth();
      return;
    }

    const conn = await checkConnection();
    if (!conn.ok) {
      showError(conn.msg);
      return;
    }
    projectSettings = conn.settings;
  }

  init();
})();