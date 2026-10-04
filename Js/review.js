const API_KEY = 'a3ce13daa9974764926de77336692c0b'; 

function getGameIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id ? parseInt(id, 10) : null;
}

async function loadGameDetails() {
    const gameId = getGameIdFromUrl();

    if (!gameId) {
        document.getElementById('game-title').textContent = 'Juego no encontrado';
        document.getElementById('game-description').innerHTML = '<p>Por favor, vuelve a la página principal y selecciona un juego válido.</p>';
        return;
    }
    loadGameReviews(gameId);
    const url = `https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener los datos del juego');
        
        const game = await response.json();

        // Actualizar Textos y Metadatos
        document.getElementById('page-title').textContent = `${game.name} — GameVault`;
        document.getElementById('game-title').textContent = game.name;
        document.getElementById('game-year').textContent = game.released ? game.released.substring(0, 4) : 'Fecha desconocida';
        
        document.getElementById('game-description').innerHTML = game.description || 'No hay descripción disponible para este título.';

        // Actualizar Imágenes
        if (game.background_image) {
            const banner = document.getElementById('game-banner');
            banner.style.backgroundImage = `url('${game.background_image}')`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'top center';

            const cover = document.getElementById('game-cover');
            cover.style.backgroundImage = `url('${game.background_image}')`;
            cover.style.backgroundSize = 'cover';
            cover.style.backgroundPosition = 'center';
        }

        // Actualizar Plataformas
        const platformsContainer = document.getElementById('game-platforms');
        platformsContainer.innerHTML = ''; 
        
        if (game.parent_platforms && game.parent_platforms.length > 0) {
            game.parent_platforms.forEach(item => {
                const platformDiv = document.createElement('div');
                platformDiv.className = 'platform-item';
                platformDiv.innerHTML = `<span class="platform-dot"></span>${item.platform.name}`;
                platformsContainer.appendChild(platformDiv);
            });
        } else {
            platformsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Plataformas no especificadas</p>';
        }

        // Actualizar Ratings
        document.getElementById('game-rating').textContent = game.rating;
        document.getElementById('game-rating-count').textContent = `${game.ratings_count} ratings`;
        
        const starCount = Math.round(game.rating);
        const emptyStars = 5 - starCount;
        document.getElementById('game-stars').textContent = '★'.repeat(starCount) + '☆'.repeat(emptyStars);

        if (game.ratings && game.ratings.length > 0) {
            const getPercent = (title) => {
                const r = game.ratings.find(x => x.title === title);
                return r ? r.percent : 0;
            };
            
            document.getElementById('bar-5').style.width = `${getPercent('exceptional')}%`;
            document.getElementById('bar-4').style.width = `${getPercent('recommended')}%`;
            document.getElementById('bar-3').style.width = `${getPercent('meh')}%`;
            document.getElementById('bar-2').style.width = `0%`; // RAWG no maneja un equivalente a 2 estrellas
            document.getElementById('bar-1').style.width = `${getPercent('skip')}%`;
        }

        // EVENT LISTENER: Conectar el botón con la base de datos y verificar estado
        const btnAddVault = document.getElementById('btn-add-vault');
        if (btnAddVault) {
            const session = await window.gvGetSession();
            
            if (session) {
                // 1. Verificar si el juego ya existe en la base de datos para este usuario
                const { data: existingGame } = await window.gvSupabase
                    .from('vault_games')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('game_id', game.id)
                    .maybeSingle();

                let inVault = !!existingGame;

                // 2. Función para actualizar el estado visual y funcional del botón
                const updateButtonState = () => {
                    if (inVault) {
                        btnAddVault.textContent = 'Remove from Vault';
                        btnAddVault.style.backgroundColor = '#4a1f7d'; // Color oscuro para diferenciar
                        btnAddVault.onclick = async () => {
                            btnAddVault.disabled = true;
                            await removeFromVault(game.id, session.user.id);
                            inVault = false;
                            updateButtonState();
                            btnAddVault.disabled = false;
                        };
                    } else {
                        btnAddVault.textContent = 'Add to Vault';
                        btnAddVault.style.backgroundColor = ''; // Restaura color original
                        btnAddVault.onclick = async () => {
                            btnAddVault.disabled = true;
                            await addToVault(game, session.user.id);
                            inVault = true;
                            updateButtonState();
                            btnAddVault.disabled = false;
                        };
                    }
                };

                updateButtonState();
            } else {
                btnAddVault.onclick = () => {
                    alert("Debes iniciar sesión para guardar juegos.");
                    window.location.href = 'login.html';
                };
            }
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('game-title').textContent = 'Error de conexión';
        document.getElementById('game-description').innerHTML = '<p>No se pudo conectar con la base de datos.</p>';
    }
}

// Funciones de inserción y borrado
async function addToVault(gameData, userId) {
    const { error } = await window.gvSupabase.from('vault_games').insert([{
        user_id: userId,
        game_id: gameData.id,
        game_name: gameData.name,
        background_image: gameData.background_image
    }]);

    if (error && error.code !== '23505') {
        console.error('Error:', error);
        alert("Error al guardar el juego.");
    }
}

async function removeFromVault(gameId, userId) {
    const { error } = await window.gvSupabase
        .from('vault_games')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId);

    if (error) {
        console.error('Error:', error);
        alert("Error al remover el juego.");
    }
}

function renderReview(review) {
  const card = document.createElement('div');
  card.className = 'review-card';
  card.style.marginBottom = '15px';

  const head = document.createElement('div');
  head.className = 'review-head';

  const avatar = document.createElement('div');
  avatar.className = 'review-avatar';
  if (/^(https:\/\/|assets\/)/.test(review.avatar || '')) {
    avatar.style.backgroundImage = `url("${review.avatar}")`;
    avatar.style.backgroundSize = 'cover';
  }

  const user = document.createElement('span');
  user.className = 'review-user';
  user.textContent = review.username;            // textContent: no interpreta HTML

  const rating = Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0)));
  const stars = document.createElement('span');
  stars.className = 'stars';
  stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  head.append(avatar, user, stars);

  const text = document.createElement('p');
  text.className = 'review-text';
  text.textContent = review.comment;

  card.append(head, text);
  return card;
}

async function loadGameReviews(gameId) {
  const list = document.getElementById('reviewsList');
  const formContainer = document.getElementById('reviewFormContainer');
  const session = await window.gvGetSession();

  if (formContainer) formContainer.style.display = session ? 'block' : 'none';

  // 1. Reseñas de la comunidad (Supabase)
  const { data: dbReviews, error: dbError } = await window.gvSupabase
    .from('game_reviews')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false });

  if (dbError) console.error('Error leyendo reseñas:', dbError);

  // 2. Reseñas de RAWG (respaldo)
  let rawgReviews = [];
  try {
    const response = await fetch(`https://api.rawg.io/api/games/${gameId}/reviews?key=${API_KEY}`);
    if (response.ok) {
      const json = await response.json();
      const spam = ['casino', 'bet', '1xbet', 'slot', 'promo', 'bonus', 'free spins', 'gamble', 'crypto', 'binance', 'invest', 'http', 'www.'];
      rawgReviews = (json.results || [])
        .filter(r => r.text && r.text.length >= 20 && !spam.some(k => r.text.toLowerCase().includes(k)))
        .map(r => ({
          username: r.user.username,
          rating: r.rating,
          comment: r.text,
          avatar: r.user.avatar || 'assets/default-avatar.png'
        }));
    }
  } catch (e) {
    console.error('Error al buscar en RAWG:', e);
  }

  const combined = [
    ...(dbReviews || []).map(r => ({
      username: r.username || 'Usuario de GameVault',
      rating: r.rating,
      comment: r.comment,
      avatar: 'assets/default-avatar.png'
    })),
    ...rawgReviews
  ];

  list.replaceChildren();   // solo se vacía la lista, el formulario no se toca

  if (combined.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'review-card';
    empty.innerHTML = '<p class="review-text" style="text-align:center;">Aún no hay reseñas. ¡Sé el primero en escribir una!</p>';
    list.appendChild(empty);
    return;
  }

  combined.forEach(r => list.appendChild(renderReview(r)));
}

// Manejar el envío del formulario de reseñas
// Manejar el envío del formulario de reseñas
document.addEventListener('DOMContentLoaded', () => {
    const submitForm = document.getElementById('submitReviewForm');
    if (submitForm) {
        submitForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Previene cualquier recarga o redirección nativa del formulario
            
            const session = await window.gvGetSession();
            if (!session) {
                alert("Debes iniciar sesión para publicar una reseña.");
                window.location.href = 'login.html';
                return;
            }

            const gameId = getGameIdFromUrl();
            if (!gameId || isNaN(gameId)) {
                alert("Error crítico: El ID del juego en la URL no es válido.");
                return;
            }

            const ratingInput = document.getElementById('reviewRating');
            const commentInput = document.getElementById('reviewComment');
            
            const rating = parseInt(ratingInput.value, 10);
            const comment = commentInput.value.trim();

            if (!comment) {
                alert("El comentario no puede estar vacío.");
                return;
            }

            const username = session.user.email ? session.user.email.split('@')[0] : 'Usuario';

            const btn = document.getElementById('sendReviewBtn');
            btn.disabled = true;
            btn.textContent = 'Publicando...';

            try {
                // Inserción directa en la base de datos de Supabase
                const { error } = await window.gvSupabase
                    .from('game_reviews')
                    .insert([{
                        user_id: session.user.id,
                        game_id: gameId,
                        username: username,
                        rating: rating,
                        comment: comment
                    }]);

                if (error) {
                    console.error("Error devuelto por Supabase:", error);
                    alert(`No se pudo guardar la reseña: ${error.message}`);
                } else {
                    commentInput.value = '';
                    // Recarga las reseñas sin alterar la URL actual
                    await loadGameReviews(gameId);
                }
            } catch (err) {
                console.error("Excepción en la red o en el cliente de Supabase:", err);
                alert("Ocurrió un error inesperado al conectar con la base de datos.");
            } finally {
                btn.disabled = false;
                btn.textContent = 'Publicar reseña';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', loadGameDetails);