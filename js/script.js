// Главный объект приложения
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

    function init() {
        try {
            cacheDOMElements();
            setupEventListeners();
            loadInitialData().then(() => {
                renderHomePage();
                updateActiveNav();
            }).catch(showError);
        } catch (error) {
            showError(error);
        }
    }

    function cacheDOMElements() {
        state.dom = {
            mainContent: document.getElementById('mainContent'),
            gameContainer: document.getElementById('gameContainer'),
            defaultContent: document.getElementById('defaultContent')
        };
        
        if (!state.dom.mainContent || !state.dom.gameContainer || !state.dom.defaultContent) {
            throw new Error('Не удалось найти элементы интерфейса');
        }
    }

    async function loadInitialData() {
        try {
            const [wordsResponse, levelsResponse] = await Promise.all([
                fetch('data/words.json'),
                fetch('data/levels.json')
            ]);
            
            state.words = await wordsResponse.json();
            state.levels = (await levelsResponse.json()).map((level, i) => ({
                ...level,
                title: level.title.includes('уровень') ? level.title : `${i+1} уровень`
            }));
            
            const savedProgress = localStorage.getItem('koreanProgress');
            if (savedProgress) state.userProgress = JSON.parse(savedProgress);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw error;
        }
    }

    function setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.back-btn')) {
                showHomePage();
            }
        });
    }

    function showHomePage() {
        state.currentPage = 'home';
        state.dom.defaultContent.innerHTML = `
            <div class="modules-grid">
                <div class="module-card" onclick="KoreanLearningApp.showLevelsPage()">
                    <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                    <h2>Уровни</h2>
                    <p>Пошаговое изучение</p>
                </div>
                <div class="module-card" onclick="KoreanLearningApp.showCardsPage()">
                    <div class="card-icon cards"><i class="far fa-sticky-note"></i></div>
                    <h2>Карточки</h2>
                    <p>Запоминание слов</p>
                </div>
                <div class="module-card" onclick="KoreanLearningApp.showGrammarPage()">
                    <div class="card-icon grammar"><i class="fas fa-book-open"></i></div>
                    <h2>Грамматика</h2>
                    <p>Изучение правил</p>
                </div>
                <div class="module-card" onclick="KoreanLearningApp.showTextsPage()">
                    <div class="card-icon text"><i class="fas fa-align-left"></i></div>
                    <h2>Тексты</h2>
                    <p>Чтение и перевод</p>
                </div>
            </div>
            <div class="repetition-section">
                <h2>Повторение</h2>
                <p>Повторяйте изученный материал</p>
                <button class="card-btn" onclick="KoreanLearningApp.showCardsPage()">
                    <i class="fas fa-redo"></i> Начать повторение
                </button>
            </div>
        `;
        showDefaultContent();
        updateActiveNav();
    }

    function showLevelsPage() {
        state.currentPage = 'levels';
        const levelsHtml = state.levels.map(level => `
            <div class="level-card" onclick="KoreanLearningApp.startLevel(${level.id})">
                <h3>${level.title}</h3>
                <button class="start-btn">Начать</button>
            </div>
        `).join('');

        state.dom.defaultContent.innerHTML = `
            <div class="section-title">
                <h2>Уровни изучения</h2>
                <button class="back-btn">На главную</button>
            </div>
            <div class="levels-container">
                ${levelsHtml}
            </div>
        `;
        showDefaultContent();
        updateActiveNav();
    }

    function showCardsPage() {
        if (!window.games || !games.startCardGame) {
            showError(new Error('Игровой модуль не загружен'));
            return;
        }
        
        state.dom.defaultContent.style.display = 'none';
        state.dom.gameContainer.style.display = 'block';
        games.startCardGame(state.words);
        state.currentPage = 'cards';
        updateActiveNav();
    }

    function startLevel(levelId) {
        const level = state.levels.find(l => l.id === levelId);
        if (!level) return;

        const levelWords = state.words.filter(word => level.words.includes(word.id));
        showCardsPage(levelWords);
    }

    function showDefaultContent() {
        state.dom.gameContainer.style.display = 'none';
        state.dom.defaultContent.style.display = 'block';
    }

    function updateActiveNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', 
                item.textContent.includes(
                    state.currentPage === 'home' ? 'Главная' :
                    state.currentPage === 'levels' ? 'Уровни' :
                    state.currentPage === 'cards' ? 'Карточки' : 'Профиль'
                )
            );
        });
    }

    function showError(error) {
        console.error(error);
        state.dom.mainContent.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${error.message}</h3>
                <button onclick="location.reload()">Перезагрузить</button>
            </div>
        `;
    }
    // Добавим новые страницы в KoreanLearningApp
KoreanLearningApp.showProgressPage = function() {
    state.currentPage = 'progress';
    state.dom.defaultContent.innerHTML = `
        <div class="section-title">
            <h2>Ваш прогресс</h2>
            <button class="back-btn">На главную</button>
        </div>
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-value">${state.userProgress.knownWords.length}</div>
                <div class="stat-label">Изученных слов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${state.userProgress.completedLevels.length}</div>
                <div class="stat-label">Пройденных уровней</div>
            </div>
        </div>
    `;
    showDefaultContent();
    updateActiveNav();
};
    function updateActiveNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        const page = item.textContent.trim();
        item.classList.toggle('active', 
            (page === 'Главная' && state.currentPage === 'home') ||
            (page === 'Прогресс' && state.currentPage === 'progress') ||
            (page === 'Профиль' && state.currentPage === 'profile') ||
            (page === 'Уровни' && state.currentPage === 'levels') ||
            (page === 'Карточки' && state.currentPage === 'cards')
        );
    });
}

KoreanLearningApp.showProfilePage = function() {
    state.currentPage = 'profile';
    state.dom.defaultContent.innerHTML = `
        <div class="section-title">
            <h2>Ваш профиль</h2>
            <button class="back-btn">На главную</button>
        </div>
        <div class="profile-card">
            <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <h3>Достижения</h3>
            <p>Изучено слов: ${state.userProgress.knownWords.length}</p>
            <p>Пройдено уровней: ${state.userProgress.completedLevels.length}</p>
        </div>
    `;
    showDefaultContent();
    updateActiveNav();
};

    // Публичные методы
    return {
        init,
        showHomePage,
        showLevelsPage,
        showCardsPage,
        showProfilePage: () => alert('Профиль в разработке'),
        showGrammarPage: () => alert('Грамматика в разработке'),
        showTextsPage: () => alert('Тексты в разработке'),
        startLevel
    };
})();

// Инициализация после загрузки
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем загрузку games.js
    function checkGamesLoaded() {
        if (window.games) {
            KoreanLearningApp.init();
        } else {
            setTimeout(checkGamesLoaded, 100);
        }
    }
    
    checkGamesLoaded();
});

// Глобальные экспорты всех функций
window.showHomePage = () => KoreanLearningApp.showHomePage();
window.showLevelsPage = () => KoreanLearningApp.showLevelsPage();
window.showCardsPage = () => KoreanLearningApp.showCardsPage();
window.showProgressPage = () => KoreanLearningApp.showProgressPage();
window.showProfilePage = () => KoreanLearningApp.showProfilePage();
window.showGrammarPage = () => KoreanLearningApp.showGrammarPage();
window.showTextsPage = () => KoreanLearningApp.showTextsPage();
window.startCardGame = (words) => {
    if (window.games?.startCardGame) {
        document.getElementById('defaultContent').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        games.startCardGame(words);
    } else {
        alert('Игровой модуль не загружен! Обновите страницу.');
    }
};
