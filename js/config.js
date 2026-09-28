// js/config.js
// Pegá acá los datos de tu proyecto de Supabase
// (Project Settings -> API).
//
// La clave "anon" / "publishable" es PÚBLICA por diseño: va a viajar
// al navegador. Lo que protege los datos no es esconderla, sino las
// reglas de acceso (Row Level Security) que vamos a configurar en las
// tablas. Lo que NUNCA hay que poner acá es la clave "service_role".
window.GAMEVAULT_CONFIG = {
  SUPABASE_URL: 'https://cqzfxlbcewobzrrhqgfy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxemZ4bGJjZXdvYnpycmhxZ2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1ODkxODcsImV4cCI6MjEwNjE2NTE4N30.AsyDtvWY_UhyXZdgW_3ceRwEwZuw9xfyJmceXiLq2ns',
};
