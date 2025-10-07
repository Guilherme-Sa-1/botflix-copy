// DOM Elements
const moodInput = document.getElementById('mood-input');
const searchButton = document.getElementById('search-button');
const resultsDiv = document.getElementById('results');
const moviesGrid = document.getElementById('movies-grid');

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    updateSearchButton();
    addTypingEffect(); // Ativando o efeito de digitação
});

// Event Listeners
function setupEventListeners() {
    // Listener para o campo de texto
    moodInput.addEventListener('input', updateSearchButton);

    // Listener para a tecla Enter
    moodInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!searchButton.disabled) {
                handleSearch();
            }
        }
    });

    // Listener para o botão de busca
    searchButton.addEventListener('click', handleSearch);

    // Listener para os exemplos clicáveis
    document.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            moodInput.value = tag.textContent.trim();
            updateSearchButton();
            moodInput.focus();
        });
    });
}

// Habilita/desabilita o botão de busca
function updateSearchButton() {
    const hasText = moodInput.value.trim().length > 0;
    searchButton.disabled = !hasText;
}

// Lida com a busca dos filmes
async function handleSearch() {
    const mood = moodInput.value.trim();

    if (!mood) {
        // Embora o botão esteja desabilitado, é uma boa prática manter a verificação
        return;
    }

    // 1. Mostrar estado de carregamento
    const originalButtonText = searchButton.innerHTML;
    searchButton.innerHTML = '<span style="animation: pulse 1.5s infinite;">🔍 Buscando...</span>';
    searchButton.disabled = true;
    resultsDiv.style.display = 'block';
    moviesGrid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth' });


    const prompt = JSON.stringify({ userPrompt: mood });

    try {
        // Fazer POST para o webhook do N8N
        const response = await fetch('https://guilhermecgsa8.app.n8n.cloud/webhook/8c37930f-9dfd-4120-b448-c773aeefa36f', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: prompt
        });

        const data = await response.json();

        // Limpa a área de resultados antes de adicionar os novos
        moviesGrid.innerHTML = '';

        // 2. Exibir os resultados ou a mensagem de "nenhum encontrado"
        if (data && Array.isArray(data.results) && data.results.length > 0) {
            data.results.forEach(movie => {
                const posterUrl = movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : '';

                const movieCardHTML = `
                    <div class="movie-card">
                        <div class="movie-poster">
                            ${posterUrl ? `<img src="${posterUrl}" alt="Pôster de ${movie.title}">` : '<div class="no-poster">Pôster não disponível</div>'}
                        </div>
                        <div class="movie-info">
                            <h4 class="movie-title">${movie.title}</h4>
                            <p class="movie-overview">${movie.overview || 'Sem descrição disponível.'}</p>
                            <p class="movie-rating">⭐ ${typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'N/A'} / 10</p>
                        </div>
                    </div>
                `;
                moviesGrid.innerHTML += movieCardHTML;
            });
        } else {
            moviesGrid.innerHTML = `<p class="error-message">Nenhum filme encontrado para sua busca. Tente ser mais descritivo!</p>`;
        }
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error);
        // 3. Exibir mensagem de erro na tela
        moviesGrid.innerHTML = `<p class="error-message">Ops! Algo deu errado ao buscar os filmes. Verifique sua conexão e tente novamente.</p>`;
    } finally {
        // 4. Restaurar o botão ao estado original
        searchButton.innerHTML = originalButtonText;
        updateSearchButton();
    }
}

// Efeito de digitação para o placeholder
function addTypingEffect() {
    const placeholders = [
        "Descreva como você está se sentindo...",
        "Que tipo de filme você quer assistir?",
        "Procurando algo para uma noite de sexta?",
        "O que combina com seu dia hoje?"
    ];

    let currentIndex = 0;
    const typingSpeed = 100; // ms
    const erasingSpeed = 50; // ms
    const delayBetween = 2000; // ms

    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentPlaceholder = placeholders[currentIndex];

        if (moodInput.value) return; // Pausa se o usuário estiver digitando

        if (isDeleting) {
            moodInput.placeholder = currentPlaceholder.substring(0, charIndex - 1);
            charIndex--;
        } else {
            moodInput.placeholder = currentPlaceholder.substring(0, charIndex + 1);
            charIndex++;
        }

        if (!isDeleting && charIndex === currentPlaceholder.length) {
            isDeleting = true;
            setTimeout(type, delayBetween);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            currentIndex = (currentIndex + 1) % placeholders.length;
            setTimeout(type, 500);
        } else {
            setTimeout(type, isDeleting ? erasingSpeed : typingSpeed);
        }
    }

    setTimeout(type, 500);
}