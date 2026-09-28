const API_KEY = 'a3ce13daa9974764926de77336692c0b'; 
const BASE_URL = 'https://api.rawg.io/api/games';

/**
 * Función central para consultar la API e inyectar las tarjetas en el DOM
 * @param {string} endpointParams - Filtros específicos para la categoría (ej: orden, plataformas)
 * @param {string} gridId - El ID del div contenedor en el HTML
 */
async function loadGameCategory(endpointParams, gridId) {
    // Solicitamos 15 juegos por categoría
    const url = `${BASE_URL}?key=${API_KEY}&page_size=15&${endpointParams}`;
    const grid = document.getElementById(gridId);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error en la petición: ${response.status}`);
        
        const data = await response.json();
        grid.innerHTML = ''; // Limpiamos el contenedor antes de inyectar

        data.results.forEach(game => {
            // 1. Crear el contenedor principal de la tarjeta
            const card = document.createElement('div');
            card.className = 'game-cover';
            
            // Asignar la imagen de portada y manejar casos donde la API no devuelva imagen
            const bgImage = game.background_image ? game.background_image : 'assets/placeholder.jpg';
            card.style.backgroundImage = `url('${bgImage}')`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';

            // 2. Crear un overlay oscuro para asegurar que el texto sea siempre legible
            const overlay = document.createElement('div');
            overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)';
            overlay.style.height = '100%';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.justifyContent = 'flex-end';
            overlay.style.padding = '15px';

            // 3. Crear los elementos de texto (Título y Rating/Año)
            const title = document.createElement('h3');
            title.style.color = '#ffffff';
            title.style.margin = '0 0 5px 0';
            title.style.fontSize = '15px';
            title.style.fontWeight = '600';
            title.textContent = game.name;

            const metaInfo = document.createElement('p');
            metaInfo.style.margin = '0';
            metaInfo.style.fontSize = '12px';
            metaInfo.style.fontWeight = '500';
            // Extraer el año de lanzamiento si existe
            const year = game.released ? game.released.substring(0, 4) : 'N/A';
            metaInfo.innerHTML = `<span style="color: var(--color-star);">⭐ ${game.rating}</span> <span style="color: var(--text-muted); margin-left: 8px;">${year}</span>`;

            // 4. Ensamblar la tarjeta
            overlay.appendChild(title);
            overlay.appendChild(metaInfo);
            card.appendChild(overlay);

            // 5. Hacer que la tarjeta sea clickeable para ir a la reseña
            card.onclick = () => {
                window.location.href = `review.html?id=${game.id}`;
            };

            grid.appendChild(card);
        });
    } catch (error) {
        console.error(`Error cargando la categoría ${gridId}:`, error);
        grid.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">No se pudo cargar el catálogo.</p>';
    }
}

/**
 * Genera un rango de fechas dinámico (Últimos 3 meses) para la sección "New Releases"
 */
function getRecentDatesRange() {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setMonth(today.getMonth() - 3);
    
    const format = (date) => date.toISOString().split('T')[0];
    return `${format(pastDate)},${format(today)}`;
}

// Inicializar todas las peticiones cuando el HTML esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Trending Games: Ordenados por cantidad de veces añadidos a colecciones
    loadGameCategory('ordering=-added', 'trending-grid');

    // 2. New Releases: Rango de fechas reciente, ordenado por fecha de lanzamiento
    const recentDates = getRecentDatesRange();
    loadGameCategory(`dates=${recentDates}&ordering=-released`, 'new-releases-grid');

    // 3. PlayStation Exclusives: IDs de PS5 (187) y PS4 (18), ordenados por rating
    loadGameCategory('platforms=187,18&ordering=-rating', 'playstation-grid');

    // 4. Xbox Exclusives: IDs de Xbox Series X/S (186) y Xbox One (1)
    loadGameCategory('platforms=186,1&ordering=-rating', 'xbox-grid');

});