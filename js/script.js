// Главный объект приложения
const KoreanLearningApp = (function() {
    // Состояние приложения
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
            .then(() => {
                renderHomePage();
                console.log('Приложение инициализировано');
            })
            .catch(error => {
                console.error('Ошибка инициализации:', error);
                showErrorPage('Не удалось загрузить данные');
            });
    }

    // Кэширование DOM элементов
    function cacheDOMElements() {
        DOM.mainContent = document.getElementById('mainContent');
        DOM.gameContainer = document.getElementById('gameContainer');
        DOM.defaultContent = document.getElementById('defaultContent');
        
        if (!DOM.mainContent || !DOM.gameContainer || !DOM.defaultContent) {
            console.error('Не найдены необходимые DOM элементы');
            throw new Error('Не удалось найти элементы интерфейса');
        }
    }

    // Загрузка начальных данных
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

    // Настройка обработчиков событий
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
                startCardGame(state.words)
                    .catch(error => console.error('Ошибка запуска карточек:', error));
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

    // Рендер главной страницы
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
            startCardGame(state.words)
                .catch(error => console.error('Ошибка повторения:', error));
        });

        showDefaultContent();
    }

    // Рендер страницы уровней
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

    // Запуск уровня
    function startLevel(levelId) {
        const level = state.levels.find(l => l.id === levelId);
        if (!level) {
            console.error('Уровень не найден');
            return;
        }

        const levelWords = state.words.filter(word => level.words.includes(word.id));
        startCardGame(levelWords)
            .catch(error => console.error('Ошибка запуска уровня:', error));
    }

    // Запуск игры с карточками
    function startCardGame(words) {
        return new Promise((resolve, reject) => {
            if (!words || words.length === 0) {
                const error = new Error('Нет слов для изучения');
                showErrorPage(error.message);
                return reject(error);
            }

            function checkGamesModule() {
                if (window.games && typeof games.startCardGame === 'function') {
                    try {
                        DOM.defaultContent.style.display = 'none';
                        DOM.gameContainer.style.display = 'block';
                        games.startCardGame(words);
                        resolve();
                    } catch (error) {
                        console.error('Ошибка запуска игры:', error);
                        showErrorPage('Ошибка запуска игры');
                        showDefaultContent();
                        reject(error);
                    }
                } else if (window.appReady?.gamesLoaded) {
                    // Модуль games.js загружен, но объект не создан
                    const error = new Error('Игровой модуль не инициализирован');
                    console.error(error);
                    showErrorPage(error.message);
                    reject(error);
                } else {
                    // Повторная проверка через 100мс
                    setTimeout(checkGamesModule, 100);
                }
            }

            // Начальная проверка
            checkGamesModule();
        });
    }

    // Рендер страницы профиля
    function renderProfilePage() {
        DOM.defaultContent.innerHTML = `
            <div class="section-title">
                <h2>Профиль</h2>
                <button class="back-btn" id="profileBackBtn">На главную</button>
            </div>
            <div class="profile-card">
                <h3>Данные пользователя</h3>
                <p>Изучено слов: ${state.userProgress.knownWords.length}</p>
                <p>Пройдено уровней: ${state.userProgress.completedLevels.length}</p>
            </div>
        `;

        document.getElementById('profileBackBtn')?.addEventListener('click', () => {
            navigateTo('home');
        });

        showDefaultContent();
    }

    // Показ основного контента
    function showDefaultContent() {
        if (DOM.gameContainer) DOM.gameContainer.style.display = 'none';
        if (DOM.defaultContent) DOM.defaultContent.style.display = 'block';
    }

    // Показать страницу ошибки
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
        showHomePage: () => navigateTo('home'),
        showLevelsPage: () => navigateTo('levels'),
        showCardsPage: () => navigateTo('cards'),
        showProfilePage: () => navigateTo('profile')
    };
})();

// Проверка готовности и инициализация приложения
function checkAppReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (window.appReady?.gamesLoaded) {
            KoreanLearningApp.init();
        } else {
            setTimeout(checkAppReady, 100);
        }
    } else {
        document.addEventListener('DOMContentLoaded', checkAppReady);
    }
}

// Запуск проверки готовности
checkAppReady();

// Глобальные методы
window.startCardGame = (words) => {
    if (window.games && games.startCardGame) {
        document.getElementById('defaultContent').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        games.startCardGame(words);
    } else {
        console.error('Games module not loaded');
        alert('Игровой модуль не загружен. Пожалуйста, обновите страницу.');
    }
};
