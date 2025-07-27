// Главный объект приложения
const KoreanLearningApp = (function() {
    // Состояние приложения
    const state = {
        currentPage: 'home',
        gameActive: false,
        words: [],
        levels: [],
        userProgress: {
            knownWords: [],
            difficultWords: [],
            completedLevels: []
        }
    };

    // DOM элементы
    const DOM = {
        mainContent: null,
        gameContainer: null,
        defaultContent: null
    };

    // Инициализация приложения
    function init() {
        cacheDOMElements();
        setupEventListeners();
        loadInitialData()
            .then(() => renderHomePage())
            .catch(error => showErrorPage(error.message));
    }

    // Кэширование DOM элементов
    function cacheDOMElements() {
        DOM.mainContent = document.getElementById('mainContent');
        if (!DOM.mainContent) {
            throw new Error('Основной контейнер не найден');
        }

        // Создаем необходимые контейнеры, если их нет
        if (!document.getElementById('gameContainer')) {
            const gameContainer = document.createElement('div');
            gameContainer.id = 'gameContainer';
            gameContainer.style.display = 'none';
            DOM.mainContent.appendChild(gameContainer);
        }
        DOM.gameContainer = document.getElementById('gameContainer');

        if (!document.getElementById('defaultContent')) {
            const defaultContent = document.createElement('div');
            defaultContent.id = 'defaultContent';
            DOM.mainContent.appendChild(defaultContent);
        }
        DOM.defaultContent = document.getElementById('defaultContent');
    }

    // Загрузка начальных данных
    async function loadInitialData() {
        try {
            // Загрузка слов (заглушка)
            state.words = [
                {id: 1, korean: "안녕하세요", romanization: "annyeonghaseyo", translation: "Здравствуйте"},
                {id: 2, korean: "감사합니다", romanization: "gamsahamnida", translation: "Спасибо"}
            ];

            // Загрузка уровней (заглушка)
            state.levels = [
                {id: 1, title: "Начальный уровень", words: [1, 2]}
            ];

            // Загрузка прогресса
            const savedProgress = localStorage.getItem('koreanProgress');
            if (savedProgress) {
                state.userProgress = JSON.parse(savedProgress);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw new Error('Не удалось загрузить данные');
        }
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        // Обработка навигации
        document.addEventListener('click', function(e) {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const page = navItem.dataset.page;
                navigateTo(page);
                return;
            }

            const moduleCard = e.target.closest('.module-card');
            if (moduleCard) {
                e.preventDefault();
                const page = moduleCard.dataset.page;
                navigateTo(page);
            }
        });
    }

    // Навигация между страницами
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
                renderCardsPage();
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

    // Обновление активного состояния навигации
    function updateActiveNav() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === state.currentPage);
        });
    }

    // Рендер страниц
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
            </div>
        `;
        DOM.gameContainer.style.display = 'none';
        DOM.defaultContent.style.display = 'block';
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
                <button class="back-btn" data-page="home">На главную</button>
            </div>
            <div class="levels-container">
                ${levelsHtml}
            </div>
        `;
    }

    function renderCardsPage() {
        startCardGame(state.words);
    }

    function renderProgressPage() {
        DOM.defaultContent.innerHTML = `
            <div class="section-title">
                <h2>Ваш прогресс</h2>
                <button class="back-btn" data-page="home">На главную</button>
            </div>
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value">${state.userProgress.knownWords.length}</div>
                    <div class="stat-label">Изученных слов</div>
                </div>
            </div>
        `;
    }

    function renderProfilePage() {
        DOM.defaultContent.innerHTML = `
            <div class="section-title">
                <h2>Ваш профиль</h2>
                <button class="back-btn" data-page="home">На главную</button>
            </div>
            <div class="profile-card">
                <h3>Ученик корейского</h3>
            </div>
        `;
    }

    // Игровая логика
    function startCardGame(words) {
        DOM.defaultContent.style.display = 'none';
        DOM.gameContainer.style.display = 'block';
        games.startCardGame(words);
    }

    // Обработка ошибок
    function showErrorPage(message) {
        DOM.mainContent.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
                <button onclick="location.reload()">Перезагрузить</button>
            </div>
        `;
    }

    // Публичный API
    return {
        init: init,
        showHomePage: function() { navigateTo('home'); },
        showLevelsPage: function() { navigateTo('levels'); },
        showCardsPage: function() { navigateTo('cards'); },
        showProgressPage: function() { navigateTo('progress'); },
        showProfilePage: function() { navigateTo('profile'); },
        startCardGame: startCardGame
    };
})();

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    try {
        KoreanLearningApp.init();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        document.body.innerHTML = `
            <div class="error-state">
                <h3>Критическая ошибка</h3>
                <p>${error.message}</p>
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
