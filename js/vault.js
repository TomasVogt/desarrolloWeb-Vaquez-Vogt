async function loadMyVault() {
    const grid = document.getElementById('vaultGrid');
    if (!grid) return;


    const session = await window.gvGetSession();
    if (!session) return; 

    grid.innerHTML = '<p style="color: var(--text-muted);">Cargando tu colección...</p>';


    const { data, error } = await window.gvSupabase
        .from('vault_games')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando Vault:", error);
        grid.innerHTML = '<p style="color: #ef2d63;">Ocurrió un error al cargar la base de datos.</p>';
        return;
    }

    if (!data || data.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1;">Tu Vault está vacía. Ve al Home y añade algunos juegos.</p>';
        return;
    }

    grid.innerHTML = ''; // Limpiar el mensaje de carga


    data.forEach(game => {

        const item = document.createElement('div');
        item.className = 'vault-item';


        const title = document.createElement('div');
        title.className = 'title-label';
        title.textContent = game.game_name;

        const cover = document.createElement('div');
        cover.className = 'cover';
        const bgImage = game.background_image ? game.background_image : 'assets/placeholder.jpg';
        cover.style.backgroundImage = `url('${bgImage}')`;
        cover.style.backgroundSize = 'cover';
        cover.style.backgroundPosition = 'center';
        cover.style.cursor = 'pointer';
        

        cover.onclick = () => {
            window.location.href = `review.html?id=${game.game_id}`;
        };


        const removeBar = document.createElement('div');
        removeBar.className = 'remove-bar';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '✕'; // Símbolo de cruz
        removeBtn.title = 'Quitar de la Vault';


        removeBtn.onclick = async (e) => {
            e.stopPropagation();
            
            if (confirm(`¿Seguro que deseas eliminar "${game.game_name}" de tu Vault?`)) {
                const { error } = await window.gvSupabase
                    .from('vault_games')
                    .delete()
                    .eq('user_id', session.user.id)
                    .eq('game_id', game.game_id);

                if (!error) {
                    item.remove();
                } else {
                    console.error("Error al eliminar:", error);
                    alert("Ocurrió un error al quitar el juego.");
                }
            }
        };

        removeBar.appendChild(removeBtn);
        cover.appendChild(removeBar);
        item.appendChild(title);
        item.appendChild(cover);
        grid.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', loadMyVault);