(function () {
  const cfg = window.GAMEVAULT_CONFIG || {};
  const REMEMBER_KEY = 'gv:remember';

  window.gvIsConfigured = Boolean(
    cfg.SUPABASE_URL &&
      cfg.SUPABASE_ANON_KEY &&
      !cfg.SUPABASE_URL.includes('TU-PROYECTO') &&
      cfg.SUPABASE_ANON_KEY !== 'TU_CLAVE_PUBLICA'
  );

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
      other.removeItem(key); 
    },
    removeItem(key) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    },
  };

  window.GV_REMEMBER_KEY = REMEMBER_KEY;


  window.gvStatus = {
    placeholders: !window.gvIsConfigured, 
    libLoaded: Boolean(window.supabase), 
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