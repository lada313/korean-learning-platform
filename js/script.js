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
            .then(() => renderHomePage())
            .catch(error => showErrorPage(error.message));
    }

    function cacheDOMElements() {
        DOM.mainContent = document.getElementById('mainContent');
        DOM.gameContainer = document.getElementById('gameContainer');
        DOM.defaultContent = document.getElementById('defaultContent');
        
        if (!DOM.mainContent || !DOM.gameContainer || !DOM.defaultContent) {
            throw new Error('Не удалось найти необходимые DOM элементы');
        }
    }

    async function loadInitialData() {
        try {
            // Загрузка слов
            const wordsResponse = await fetch('data/words.json');
            state.words = await wordsResponse.json();
            
            // Загрузка уровней (переименованы)
            const levelsResponse = await fetch('data/levels.json');
            state.levels = (await levelsResponse.json()).map(level => ({
                ...level,
                title: level.title.replace('Топонимы', '1 уровень')
                                  .replace('Основные глаголы', '2 уровень')
                                  .replace('Счётные слова', '3 уровень')
            }));
            
            // Загрузка прогресса
            const savedProgress = localStorage.getItem('koreanProgress');
            if (savedProgress) state.userProgress = JSON.parse(savedProgress);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw new Error('Не удалось загрузить данные');
        }
    }

    function setupEventListeners() {
        document.addEventListener('click', function(e) {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                navigateTo(navItem.dataset.page);
                return;
            }

            const backBtn = e.target.closest('.back-btn');
            if (backBtn) {
                e.preventDefault();
                navigateTo(backBtn.dataset.page || 'home');
                return;
            }

            const moduleCard = e.target.closest('.module-card');
            if (moduleCard) {
                e.preventDefault();
                navigateTo(moduleCard.dataset.page);
                return;
            }

            const startLevelBtn = e.target.closest('.start-level-btn');
            if (startLevelBtn) {
                e.preventDefault();
                const levelId = parseInt(startLevelBtn.dataset.level);
                startLevel(levelId);
            }
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
            case 'progress':
                renderProgressPage();
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
                <button class="card-btn" data-page="cards">
                    <i class="fas fa-redo"></i> Начать повторение
                </button>
            </div>
        `;
        showDefaultContent();
    }

    function renderLevelsPage() {
        const levelsHtml = state.levels.map(level => `
            <div class="level-card">
                <h3>${level.title}</h3>
                <button class="start-level-btn" data-level="${level.id}">Начать</button>
            </div>
        `).join('');

        DOM.defaultContent.innerHTML = `
            <div class="section-title">
                <h2>Уровни изучения</h2>
                <button class="back-btn" data-page="home">На главную</button>
            </div>
            <div class="levels-container">
                ${levelsHtml}
            </div>
        `;
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

        try {
            DOM.defaultContent.style.display = 'none';
            DOM.gameContainer.style.display = 'block';
            
            if (window.games && typeof games.startCardGame === 'function') {
                games.startCardGame(words);
            } else {
                throw new Error('Игровой модуль не загружен');
            }
        } catch (error) {
            console.error('Ошибка запуска игры:', error);
            showErrorPage('Ошибка запуска игры');
            showDefaultContent();
        }
    }

    function showDefaultContent() {
        DOM.gameContainer.style.display = 'none';
        DOM.defaultContent.style.display = 'block';
    }

    function showErrorPage(message) {
        DOM.mainContent.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
                <button onclick="location.reload()">Перезагрузить</button>
            </div>
        `;
    }

    // Остальные функции рендеринга страниц...

    return {
        init: init,
        showHomePage: function() { navigateTo('home'); },
        showLevelsPage: function() { navigateTo('levels'); },
        showCardsPage: function() { navigateTo('cards'); },
        showProgressPage: function() { navigateTo('progress'); },
        showProfilePage: function() { navigateTo('profile'); }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    try {
        KoreanLearningApp.init();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        document.body.innerHTML = `
            <div class="error-state">
                <h3>Критическая ошибка</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()">Перезагрузить</button>
            </div>
        `;
    }
});

// Глобальные методы
window.showHomePage = () => KoreanLearningApp.showHomePage();
window.showLevelsPage = () => KoreanLearningApp.showLevelsPage();
window.showCardsPage = () => KoreanLearningApp.showCardsPage();
window.showProgressPage = () => KoreanLearningApp.showProgressPage();
window.showProfilePage = () => KoreanLearningApp.showProfilePage();
window.startCardGame = (words) => KoreanLearningApp.startCardGame(words);
