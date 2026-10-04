// js/profile.js
// Requiere: config.js, supabase-js, supabase-client.js y auth.js cargados antes.

const PROFILE_API_KEY = 'a3ce13daa9974764926de77336692c0b';
const MAX_FEATURED = 4;

let vaultGames = [];
let currentUserId = null;

// ---------- Utilidades ----------
function placeholderImage(game) {
  return game.background_image || 'assets/placeholder.jpg';
}

function setBackground(el, url) {
  // Se usa JSON.stringify para escapar comillas dentro de la URL
  el.style.backgroundImage = `url(${JSON.stringify(url)})`;
}

// ---------- Cabecera ----------
function renderHeader(user) {
  const email = user.email || '';
  const username = email.split('@')[0] || 'Usuario';

  document.getElementById('profileName').textContent = username;
  document.getElementById('profileEmail').textContent = email;
  document.getElementById('profileAvatar').textContent = username.charAt(0);
  document.title = `${username} — GameVault`;
}

// ---------- Expositor ----------
function renderShowcase() {
  const showcase = document.getElementById('showcase');
  showcase.replaceChildren();

  const featured = vaultGames.filter((g) => g.featured).slice(0, MAX_FEATURED);

  if (featured.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'empty-msg';
    msg.textContent = vaultGames.length === 0
      ? 'Tu Vault está vacía. Agregá juegos para poder destacarlos.'
      : 'Todavía no elegiste juegos destacados. Tocá "Editar destacados".';
    showcase.appendChild(msg);
    return;
  }

  featured.forEach((game) => {
    const item = document.createElement('a');
    item.className = 'showcase-item';
    item.href = `review.html?id=${encodeURIComponent(game.game_id)}`;
    setBackground(item, placeholderImage(game));

    const label = document.createElement('span');
    label.textContent = game.game_name;
    item.appendChild(label);

    showcase.appendChild(item);
  });
}

// ---------- Selector de destacados ----------
function renderPicker() {
  const grid = document.getElementById('pickerGrid');
  grid.replaceChildren();

  if (vaultGames.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'empty-msg';
    msg.textContent = 'No hay juegos en tu Vault todavía.';
    grid.appendChild(msg);
    return;
  }

  vaultGames.forEach((game) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'picker-item' + (game.featured ? ' picked' : '');
    tile.title = game.game_name;
    tile.setAttribute('aria-pressed', String(Boolean(game.featured)));
    setBackground(tile, placeholderImage(game));

    tile.addEventListener('click', () => toggleFeatured(game, tile));
    grid.appendChild(tile);
  });
}

async function toggleFeatured(game, tile) {
  const makeFeatured = !game.featured;

  if (makeFeatured && vaultGames.filter((g) => g.featured).length >= MAX_FEATURED) {
    alert(`Podés destacar hasta ${MAX_FEATURED} juegos. Quitá uno primero.`);
    return;
  }

  tile.disabled = true;
  const { error } = await window.gvSupabase
    .from('vault_games')
    .update({ featured: makeFeatured })
    .eq('user_id', currentUserId)
    .eq('game_id', game.game_id);
  tile.disabled = false;

  if (error) {
    console.error('Error actualizando destacado:', error);
    alert('No se pudo actualizar el juego destacado.');
    return;
  }

  game.featured = makeFeatured;
  renderPicker();
  renderShowcase();
}

// ---------- Reseñas ----------
async function getGameName(gameId, cache) {
  if (cache.has(gameId)) return cache.get(gameId);

  let name = `Juego #${gameId}`;
  try {
    const res = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${PROFILE_API_KEY}`);
    if (res.ok) {
      const data = await res.json();
      if (data.name) name = data.name;
    }
  } catch (e) {
    console.error('Error buscando el nombre del juego:', e);
  }
  cache.set(gameId, name);
  return name;
}

function renderReviewCard(review, gameName) {
  const card = document.createElement('div');
  card.className = 'my-review';

  const head = document.createElement('div');
  head.className = 'my-review-head';

  const game = document.createElement('a');
  game.className = 'my-review-game';
  game.href = `review.html?id=${encodeURIComponent(review.game_id)}`;
  game.textContent = gameName;

  const rating = Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0)));
  const stars = document.createElement('span');
  stars.className = 'stars';
  stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const date = document.createElement('span');
  date.className = 'my-review-date';
  date.textContent = review.created_at
    ? new Date(review.created_at).toLocaleDateString('es-AR')
    : '';

  head.append(game, stars, date);

  const text = document.createElement('p');
  text.className = 'my-review-text';
  text.textContent = review.comment;

  card.append(head, text);
  return card;
}

async function loadMyReviews() {
  const container = document.getElementById('myReviews');

  const { data, error } = await window.gvSupabase
    .from('game_reviews')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });

  container.replaceChildren();

  if (error) {
    console.error('Error cargando reseñas:', error);
    container.innerHTML = '<p class="empty-msg">No se pudieron cargar tus reseñas.</p>';
    return;
  }

  document.getElementById('statReviews').textContent = String((data || []).length);

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="empty-msg">Todavía no escribiste ninguna reseña.</p>';
    return;
  }

  // Los nombres de los juegos de la Vault ya los tenemos; el resto se pide a RAWG
  const cache = new Map(vaultGames.map((g) => [g.game_id, g.game_name]));
  const missing = [...new Set(data.map((r) => r.game_id))].filter((id) => !cache.has(id));
  await Promise.all(missing.map((id) => getGameName(id, cache)));

  data.forEach((review) => {
    container.appendChild(renderReviewCard(review, cache.get(review.game_id)));
  });
}

// ---------- Inicio ----------
async function initProfile() {
  const session = await window.gvGetSession();
  if (!session) return; // auth.js redirige al login

  currentUserId = session.user.id;
  renderHeader(session.user);

  const { data, error } = await window.gvSupabase
    .from('vault_games')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando la Vault:', error);
  } else {
    vaultGames = data || [];
  }

  document.getElementById('statGames').textContent = String(vaultGames.length);
  renderShowcase();
  renderPicker();

  document.getElementById('editFeaturedBtn').addEventListener('click', () => {
    const picker = document.getElementById('featuredPicker');
    const hidden = picker.classList.toggle('is-hidden');
    document.getElementById('editFeaturedBtn').textContent = hidden ? 'Editar destacados' : 'Listo';
  });

  await loadMyReviews();
}

document.addEventListener('DOMContentLoaded', initProfile);