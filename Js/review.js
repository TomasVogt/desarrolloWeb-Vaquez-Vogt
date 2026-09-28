const API_KEY = 'a3ce13daa9974764926de77336692c0b'; 

/**
 * Función para extraer el ID de la URL
 * Extrae el valor "id" de ?id=XXXX
 */
function getGameIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Función para cargar los detalles del juego desde la API
 */
async function loadGameDetails() {
    const gameId = getGameIdFromUrl();

    if (!gameId) {
        document.getElementById('game-title').textContent = 'Juego no encontrado';
        document.getElementById('game-description').innerHTML = '<p>Por favor, vuelve a la página principal y selecciona un juego válido.</p>';
        return;
    }
    loadGameReviews(gameId);
    const url = `https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`;

    console.log("ID detectado:", gameId);
console.log("URL final:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener los datos del juego');
        
        const game = await response.json();

        // 1. Actualizar Textos y Metadatos
        document.getElementById('page-title').textContent = `${game.name} — GameVault`;
        document.getElementById('game-title').textContent = game.name;
        document.getElementById('game-year').textContent = game.released ? game.released.substring(0, 4) : 'Fecha desconocida';
        
        // RAWG devuelve la descripción con etiquetas HTML (<p>, <br>), ideal para inyectar directamente
        document.getElementById('game-description').innerHTML = game.description || 'No hay descripción disponible para este título.';

        // 2. Actualizar Imágenes
        if (game.background_image) {
            // Aplicar imagen de fondo al banner usando la sintaxis de tu base.css
            const banner = document.getElementById('game-banner');
            banner.style.backgroundImage = `url('${game.background_image}')`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'top center';

            // Usar la misma imagen (o game.background_image_additional si lo prefieres) para la carátula pequeña
            const cover = document.getElementById('game-cover');
            cover.style.backgroundImage = `url('${game.background_image}')`;
            cover.style.backgroundSize = 'cover';
            cover.style.backgroundPosition = 'center';
        }

        // 3. Actualizar Plataformas
        const platformsContainer = document.getElementById('game-platforms');
        platformsContainer.innerHTML = ''; // Limpiar lista inicial
        
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

        // 4. Actualizar Ratings de RAWG
        document.getElementById('game-rating').textContent = game.rating;
        document.getElementById('game-rating-count').textContent = `${game.ratings_count} ratings`;
        
        // Generar estrellas visuales según el rating (de 0 a 5)
        const starCount = Math.round(game.rating);
        const emptyStars = 5 - starCount;
        document.getElementById('game-stars').textContent = '★'.repeat(starCount) + '☆'.repeat(emptyStars);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('game-title').textContent = 'Error de conexión';
        document.getElementById('game-description').innerHTML = '<p>No se pudo conectar con la base de datos de videojuegos.</p>';
    }
}

/**
 * Función adicional para cargar reseñas comunitarias desde RAWG
 */
async function loadGameReviews(gameId) {
    // RAWG expone las reseñas de los usuarios en este endpoint
    const url = `https://api.rawg.io/api/games/${gameId}/reviews?key=${API_KEY}`;
    const reviewsContainer = document.querySelector('.popular-reviews');

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error obteniendo reseñas');
        
        const data = await response.json();
        const reviews = data.results;

        if (reviews && reviews.length > 0) {
            // Limpiamos el título y el contenido "en desarrollo"
            reviewsContainer.innerHTML = '<h2>Popular Reviews</h2>';

            // Tomamos las primeras 3 reseñas para no sobrecargar la página
            const topReviews = reviews.slice(0, 3);

            topReviews.forEach(review => {
                // Si el usuario no tiene avatar, usamos un placeholder genérico
                const avatar = review.user.avatar || 'assets/default-avatar.png';
                
                // Creamos la estructura HTML de la reseña
                const reviewHTML = `
                    <div class="review-card" style="margin-bottom: 15px;">
                        <div class="review-head">
                            <!-- Como no podemos cargar imágenes externas sin problemas a veces, usamos un div coloreado como fallback visual -->
                            <div class="review-avatar" style="background-image: url('${avatar}'); background-size: cover;"></div>
                            <span class="review-user">${review.user.username}</span>
                            <span class="stars" style="color: var(--color-star);">
                                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                            </span>
                        </div>
                        <p class="review-text">${review.text}</p>
                    </div>
                `;
                reviewsContainer.innerHTML += reviewHTML;
            });
        } else {
            // Si el juego no tiene reseñas en la API
            reviewsContainer.innerHTML = `
                <h2>Popular Reviews</h2>
                <div class="review-card">
                    <p class="review-text" style="text-align: center;">Aún no hay reseñas comunitarias para este juego.</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error cargando las reseñas:', error);
        // Fallback en caso de error
        reviewsContainer.innerHTML = `
            <h2>Popular Reviews</h2>
            <div class="review-card">
                <p class="review-text" style="color: rgba(255,100,100,0.8);">No se pudieron cargar las reseñas en este momento.</p>
            </div>
        `;
    }
}

// Ejecutar cuando cargue la página
document.addEventListener('DOMContentLoaded', loadGameDetails);
