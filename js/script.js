const KoreanLearningApp = (function() {
    const state = {
        currentPage: 'home',
        words: [],
        levels: [],
        userProgress: {
            knownWords: [],
            difficultWords: [],
            completedLevels: []
        }
    };

    const DOM = {
        mainContent: null,
        gameContainer: null,
        defaultContent: null
    };

    function init() {
        cacheDOMElements();
        setupEventListeners();
        loadInitialData()
            .then(() => {
                renderHomePage();
            })
            .catch(error => {
                console.error('Ошибка инициализации:', error);
                showErrorPage('Не удалось загрузить данные');
            });
    }

    function cacheDOMElements() {
        DOM.mainContent = document.getElementById('mainContent');
        DOM.gameContainer = document.getElementById('gameContainer');
        DOM.defaultContent = document.getElementById('defaultContent');
        
        if (!DOM.mainContent || !DOM.gameContainer || !DOM.defaultContent) {
            console.error('Не найдены необходимые DOM элементы');
            return;
        }
    }

    async function loadInitialData() {
        try {
            // Загрузка слов
            const wordsResponse = await fetch('data/words.json');
            state.words = await wordsResponse.json();
            
            // Загрузка уровней
            const levelsResponse = await fetch('data/levels.json');
            state.levels = await levelsResponse.json();
            
            // Переименовываем уровни
            state.levels = state.levels.map((level, index) => ({
                ...level,
                title: `${index + 1} уровень`
            }));

            // Загрузка прогресса
            const savedProgress = localStorage.getItem('koreanProgress');
            if (savedProgress) {
                state.userProgress = JSON.parse(savedProgress);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw error;
        }
    }

    function setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                navigateTo(page);
            });
        });

        // Профиль
        document.getElementById('profileBtn')?.addEventListener('click', () => {
            navigateTo('profile');
        });
    }

    function navigateTo(page) {
        if (state.currentPage === page) return;

        state.currentPage = page;
        updateActiveNav();

        switch(page) {
            case 'home':
                renderHomePage();
                break;
            case 'levels':
                renderLevelsPage();
                break;
            case 'cards':
                startCardGame(state.words);
                break;
            case 'profile':
                renderProfilePage();
                break;
            default:
                renderHomePage();
        }
    }

    function updateActiveNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === state.currentPage);
        });
    }

    function renderHomePage() {
        DOM.defaultContent.innerHTML = `
            <div class="modules-grid">
                <div class="module-card" data-page="levels">
                    <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                    <h2>Уровни</h2>
                    <p>Пошаговое изучение</p>
                </div>
                <div class="module-card" data-page="cards">
                    <div class="card-icon cards"><i class="far fa-sticky-note"></i></div>
                    <h2>Карточки</h2>
                    <p>Запоминание слов</p>
                </div>
                <div class="module-card" data-page="grammar">
                    <div class="card-icon grammar"><i class="fas fa-book-open"></i></div>
                    <h2>Грамматика</h2>
                    <p>Изучение правил</p>
                </div>
                <div class="module-card" data-page="texts">
                    <div class="card-icon text"><i class="fas fa-align-left"></i></div>
                    <h2>Тексты</h2>
                    <p>Чтение и перевод</p>
                </div>
            </div>
            <div class="repetition-section">
                <h2>Повторение</h2>
                <p>Повторяйте изученный материал</p>
                <button class="card-btn" id="repeatBtn">
                    <i class="fas fa-redo"></i> Начать повторение
                </button>
            </div>
        `;

        // Добавляем обработчики для карточек модулей
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                navigateTo(card.dataset.page);
            });
        });

        document.getElementById('repeatBtn')?.addEventListener('click', () => {
            startCardGame(state.words);
        });

        showDefaultContent();
    }

    function renderLevelsPage() {
        const levelsHtml = state.levels.map(level => `
            <div class="level-card" data-level="${level.id}">
                <h3>${level.title}</h3>
                <button class="start-level-btn" data-level="${level.id}">Начать</button>
            </div>
        `).join('');

        DOM.defaultContent.innerHTML = `
            <div class="section-title">
                <h2>Уровни изучения</h2>
                <button class="back-btn" id="backBtn">На главную</button>
            </div>
            <div class="levels-container">
                ${levelsHtml}
            </div>
        `;

        // Обработчики для уровней
        document.querySelectorAll('.start-level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const levelId = parseInt(btn.dataset.level);
                startLevel(levelId);
            });
        });

        document.getElementById('backBtn')?.addEventListener('click', () => {
            navigateTo('home');
        });

        showDefaultContent();
    }

    function startLevel(levelId) {
        const level = state.levels.find(l => l.id === levelId);
        if (!level) return;

        const levelWords = state.words.filter(word => level.words.includes(word.id));
        startCardGame(levelWords);
    }

    function startCardGame(words) {
        if (!words || words.length === 0) {
            showErrorPage('Нет слов для изучения');
            return;
        }

        if (!window.games || !games.startCardGame) {
            showErrorPage('Игровой модуль не загружен');
            console.error('Games module not loaded');
            return;
        }

        try {
            DOM.defaultContent.style.display = 'none';
            DOM.gameContainer.style.display = 'block';
            games.startCardGame(words);
        } catch (error) {
            console.error('Ошибка запуска игры:', error);
            showErrorPage('Ошибка запуска игры');
            showDefaultContent();
        }
    }

    function renderProfilePage() {
        DOM.defaultContent.innerHTML = `
            <div class="section-title">
                <h2>Профиль</h2>
                <button class="back-btn" id="profileBackBtn">На главную</button>
            </div>
            <div class="profile-card">
                <h3>Данные пользователя</h3>
                <p>Изучено слов: ${state.userProgress.knownWords.length}</p>
            </div>
        `;

        document.getElementById('profileBackBtn')?.addEventListener('click', () => {
            navigateTo('home');
        });

        showDefaultContent();
    }

    function showDefaultContent() {
        if (DOM.gameContainer) DOM.gameContainer.style.display = 'none';
        if (DOM.defaultContent) DOM.defaultContent.style.display = 'block';
    }

    function showErrorPage(message) {
        if (DOM.mainContent) {
            DOM.mainContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${message}</h3>
                    <button onclick="location.reload()">Перезагрузить</button>
                </div>
            `;
        }
    }

    return {
        init: init,
        showHomePage: () => navigateTo('home'),
        showLevelsPage: () => navigateTo('levels'),
        showCardsPage: () => navigateTo('cards'),
        showProfilePage: () => navigateTo('profile')
    };
})();

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    KoreanLearningApp.init();
});

// Глобальные методы
window.showHomePage = KoreanLearningApp.showHomePage;
window.showLevelsPage = KoreanLearningApp.showLevelsPage;
window.showCardsPage = KoreanLearningApp.showCardsPage;
window.showProfilePage = KoreanLearningApp.showProfilePage;
window.startCardGame = (words) => {
    if (window.games && games.startCardGame) {
        document.getElementById('defaultContent').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        games.startCardGame(words);
    } else {
        console.error('Games module not loaded');
    }
};
