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
        try {
            cacheDOMElements();
            setupEventListeners();
            loadInitialData()
                .then(() => renderHomePage())
                .catch(error => {
                    console.error('Ошибка загрузки данных:', error);
                    showErrorPage('Не удалось загрузить данные');
                });
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            showErrorPage('Ошибка инициализации приложения');
        }
    }

    // Кэширование DOM элементов
    function cacheDOMElements() {
        DOM.mainContent = document.getElementById('mainContent');
        if (!DOM.mainContent) {
            throw new Error('Основной контейнер не найден');
        }

        // Создаем контейнер для игр если его нет
        if (!document.getElementById('gameContainer')) {
            const gameContainer = document.createElement('div');
            gameContainer.id = 'gameContainer';
            gameContainer.style.display = 'none';
            DOM.mainContent.appendChild(gameContainer);
        }
        DOM.gameContainer = document.getElementById('gameContainer');

        // Создаем контейнер для основного контента если его нет
        if (!document.getElementById('defaultContent')) {
            const defaultContent = document.createElement('div');
            defaultContent.id = 'defaultContent';
            DOM.mainContent.appendChild(defaultContent);
        }
        DOM.defaultContent = document.getElementById('defaultContent');
    }

    // Загрузка начальных данных
    async function loadInitialData() {
        // Загрузка слов (заглушка)
        state.words = [
            {id: 1, korean: "안녕하세요", romanization: "annyeonghaseyo", translation: "Здравствуйте"},
            {id: 2, korean: "감사합니다", romanization: "gamsahamnida", translation: "Спасибо"},
            {id: 3, korean: "미안합니다", romanization: "mianhamnida", translation: "Извините"}
        ];

        // Загрузка уровней (переименованы как 1 уровень, 2 уровень и т.д.)
        state.levels = [
            {id: 1, title: "1 уровень", words: [1, 2]},
            {id: 2, title: "2 уровень", words: [2, 3]},
            {id: 3, title: "3 уровень", words: [1, 2, 3]}
        ];
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        document.addEventListener('click', function(e) {
            // Обработка навигации
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                navigateTo(navItem.dataset.page);
                return;
            }

            // Обработка кнопки "Назад"
            const backBtn = e.target.closest('.back-btn');
            if (backBtn) {
                e.preventDefault();
                navigateTo(backBtn.dataset.page || 'home');
                return;
            }

            // Обработка карточек модулей
            const moduleCard = e.target.closest('.module-card');
            if (moduleCard) {
                e.preventDefault();
                navigateTo(moduleCard.dataset.page);
                return;
            }

            // Обработка кнопки "Начать" в уровнях
            const startLevelBtn = e.target.closest('.start-level-btn');
            if (startLevelBtn) {
                e.preventDefault();
                const levelId = parseInt(startLevelBtn.dataset.level);
                startLevel(levelId);
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

    // Обновление активного состояния навигации
    function updateActiveNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
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
        showDefaultContent();
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
        showDefaultContent();
    }

    // Показ основного контента
    function showDefaultContent() {
        if (DOM.gameContainer && DOM.defaultContent) {
            DOM.gameContainer.style.display = 'none';
            DOM.defaultContent.style.display = 'block';
        } else {
            console.error('DOM элементы не найдены');
        }
    }

    // Запуск уровня
    function startLevel(levelId) {
        const level = state.levels.find(l => l.id === levelId);
        if (!level) return;

        const levelWords = state.words.filter(word => level.words.includes(word.id));
        startCardGame(levelWords);
    }

    // Запуск игры с карточками
    function startCardGame(words) {
        if (!words || words.length === 0) {
            console.error('Нет слов для изучения');
            return;
        }

        if (!DOM.gameContainer || !DOM.defaultContent) {
            console.error('DOM элементы для игры не найдены');
            return;
        }

        try {
            DOM.defaultContent.style.display = 'none';
            DOM.gameContainer.style.display = 'block';
            
            // Проверяем, что games объект существует
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

    // Обработка ошибок
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

// Инициализация при загрузке
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
