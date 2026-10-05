const SEARCH_API_KEY = 'a3ce13daa9974764926de77336692c0b';

document.addEventListener('DOMContentLoaded', () => {
    const searchBoxes = document.querySelectorAll('.search-box');

    searchBoxes.forEach(box => {
        const input = box.querySelector('input');
        if (!input) return;

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        box.appendChild(resultsContainer);

        let timeoutId;

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(timeoutId); 

            if (query.length < 3) {
                resultsContainer.classList.remove('active');
                resultsContainer.innerHTML = '';
                return;
            }

            resultsContainer.classList.add('active');
            resultsContainer.innerHTML = '<div class="search-loading">Buscando...</div>';

            timeoutId = setTimeout(async () => {
                try {
                    const response = await fetch(`https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${SEARCH_API_KEY}&page_size=5`);
                    if (!response.ok) throw new Error('Error en la petición a RAWG');
                    
                    const data = await response.json();
                    resultsContainer.innerHTML = '';

                    if (data.results.length === 0) {
                        resultsContainer.innerHTML = '<div class="search-loading">No se encontraron juegos</div>';
                        return;
                    }

                    data.results.forEach(game => {
                        const item = document.createElement('a');
                        item.className = 'search-result-item';
                        item.href = `review.html?id=${game.id}`; // Redirección directa

                        const bgImage = game.background_image ? game.background_image : 'assets/placeholder.jpg';
                        const year = game.released ? game.released.substring(0, 4) : 'N/A';

                        item.innerHTML = `
                            <img src="${bgImage}" alt="${game.name}">
                            <div class="search-result-info">
                                <span class="search-result-title">${game.name}</span>
                                <span class="search-result-year">${year} ⭐ ${game.rating}</span>
                            </div>
                        `;
                        resultsContainer.appendChild(item);
                    });
                } catch (error) {
                    console.error(error);
                    resultsContainer.innerHTML = '<div class="search-loading">Error de conexión</div>';
                }
            }, 150);
        });

        document.addEventListener('click', (e) => {
            if (!box.contains(e.target)) {
                resultsContainer.classList.remove('active');
            }
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 3) {
                resultsContainer.classList.add('active');
            }
        });
    });
});