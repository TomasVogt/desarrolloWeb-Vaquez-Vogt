// js/supabase-client.js
// Requiere cargar antes: js/config.js y el CDN de supabase-js.
(function () {
  const cfg = window.GAMEVAULT_CONFIG || {};
  const REMEMBER_KEY = 'gv:remember';

  window.gvIsConfigured = Boolean(
    cfg.SUPABASE_URL &&
      cfg.SUPABASE_ANON_KEY &&
      !cfg.SUPABASE_URL.includes('TU-PROYECTO') &&
      cfg.SUPABASE_ANON_KEY !== 'TU_CLAVE_PUBLICA'
  );

  // "Recordarme": si está tildado la sesión se guarda en localStorage
  // (sobrevive al cerrar el navegador); si no, en sessionStorage
  // (se pierde al cerrar la pestaña). El flag se guarda en el login.
  function remembered() {
    return localStorage.getItem(REMEMBER_KEY) !== 'false';
  }

  const storage = {
    getItem(key) {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    },
    setItem(key, value) {
      const [use, other] = remembered()
        ? [localStorage, sessionStorage]
        : [sessionStorage, localStorage];
      use.setItem(key, value);
      other.removeItem(key); // evita que quede una sesión vieja en el otro storage
    },
    removeItem(key) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    },
  };

  window.GV_REMEMBER_KEY = REMEMBER_KEY;

  // Estado para diagnosticar (lo usa login.js para mostrar mensajes claros)
  window.gvStatus = {
    placeholders: !window.gvIsConfigured, // config.js sin completar
    libLoaded: Boolean(window.supabase), // ¿cargó el CDN de supabase-js?
  };

  if (window.gvIsConfigured && window.supabase) {
    const url = cfg.SUPABASE_URL.trim().replace(/\/+$/, '');
    window.gvSupabase = window.supabase.createClient(url, cfg.SUPABASE_ANON_KEY.trim(), {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
})();