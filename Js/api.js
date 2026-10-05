const API_KEY = 'a3ce13daa9974764926de77336692c0b'; 
const BASE_URL = 'https://api.rawg.io/api/games';

async function loadGameCategory(endpointParams, gridId) {
    const url = `${BASE_URL}?key=${API_KEY}&page_size=15&${endpointParams}`;
    const grid = document.getElementById(gridId);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error en la petición: ${response.status}`);
        
        const data = await response.json();
        grid.innerHTML = ''; 

        data.results.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-cover';
            
            const bgImage = game.background_image ? game.background_image : 'assets/placeholder.jpg';
            card.style.backgroundImage = `url('${bgImage}')`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';

            const overlay = document.createElement('div');
            overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)';
            overlay.style.height = '100%';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.justifyContent = 'flex-end';
            overlay.style.padding = '15px';

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
            const year = game.released ? game.released.substring(0, 4) : 'N/A';
            metaInfo.innerHTML = `<span style="color: var(--color-star);">⭐ ${game.rating}</span> <span style="color: var(--text-muted); margin-left: 8px;">${year}</span>`;

            overlay.appendChild(title);
            overlay.appendChild(metaInfo);
            card.appendChild(overlay);

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

function getRecentDatesRange() {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setMonth(today.getMonth() - 3);
    const format = (date) => date.toISOString().split('T')[0];
    return `${format(pastDate)},${format(today)}`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadGameCategory('ordering=-added', 'trending-grid');
    loadGameCategory(`dates=${getRecentDatesRange()}&ordering=-released`, 'new-releases-grid');
    loadGameCategory('publishers=sony-computer-entertainment,playstation-studios&ordering=-added', 'playstation-grid');
    loadGameCategory('publishers=microsoft-studios,xbox-game-studios&ordering=-added', 'xbox-grid');
    loadGameCategory('publishers=nintendo&ordering=-added', 'nintendo-grid');
});