// Главный объект приложения
const KoreanLearningApp = (function() {
    // Приватные переменные
    const userProgress = {
        knownWords: [],
        difficultWords: [],
        completedLevels: [],
        currentLevel: 1,
        cardIntervals: {}
    };
    
    let allWords = [];
    let allLevels = [];
    let allGrammar = [];
    let allTexts = [];
    let currentCardIndex = 0;
    let flashcards = [];

    // Публичные методы
    return {
        init: function() {
            this.loadUserProgress();
            this.loadData().then(() => {
                this.bindEvents();
                this.showHomePage();
            }).catch(error => {
                console.error("App initialization failed:", error);
                this.showErrorPage();
            });
        },

        loadData: async function() {
            try {
                // Основные данные
                const wordsResponse = await fetch('data/words.json');
                allWords = await wordsResponse.json();
                
                const levelsResponse = await fetch('data/levels.json');
                allLevels = await levelsResponse.json();

                // Дополнительные данные (не критично)
                try {
                    const grammarResponse = await fetch('data/grammar.json');
                    allGrammar = await grammarResponse.json();
                } catch (e) {
                    console.warn("Grammar load warning:", e);
                }

                try {
                    const textsResponse = await fetch('data/texts.json');
                    allTexts = await textsResponse.json();
                } catch (e) {
                    console.warn("Texts load warning:", e);
                }

            } catch (error) {
                console.error("Data load error:", error);
                // Fallback данные
                allWords = allWords.length ? allWords : [{
                    id: 1,
                    korean: "안녕하세요",
                    romanization: "annyeonghaseyo",
                    translation: "Здравствуйте"
                }];
                
                allLevels = allLevels.length ? allLevels : [{
                    id: 1,
                    title: "1 Уровень",
                    words: [1],
                    locked: false
                }];
                
                throw error;
            }
        },

        loadUserProgress: function() {
            const saved = localStorage.getItem('koreanProgress');
            if (saved) {
                try {
                    Object.assign(userProgress, JSON.parse(saved));
                } catch (e) {
                    console.error("Progress load error:", e);
                }
            }
        },

        saveUserProgress: function() {
            localStorage.setItem('koreanProgress', JSON.stringify(userProgress));
        },

        showHomePage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="modules-grid">
                    <a href="javascript:void(0)" onclick="KoreanApp.showLevelsPage()" class="module-card">
                        <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                        <h2>Уровни</h2>
                        <p>Пошаговое изучение от начального до продвинутого</p>
                    </a>

                    <a href="javascript:void(0)" onclick="showCardsPage()" class="module-card">
                        <div class="card-icon cards"><i class="far fa-sticky-note"></i></div>
                        <h2>Карточки</h2>
                        <p>Запоминание слов с интервальным повторением</p>
                    </a>

                    <a href="javascript:void(0)" onclick="showGrammarPage()" class="module-card">
                        <div class="card-icon grammar"><i class="fas fa-book-open"></i></div>
                        <h2>Грамматика</h2>
                        <p>Изучение правил и языковых конструкций</p>
                    </a>

                    <a href="javascript:void(0)" onclick="showTextsPage()" class="module-card">
                        <div class="card-icon text"><i class="fas fa-align-left"></i></div>
                        <h2>Текст и перевод</h2>
                        <p>Чтение и анализ текстов с переводом</p>
                    </a>
                </div>

                <div class="repetition-section">
                    <h2>Повторение</h2>
                    <p>Повторяйте изученный материал для закрепления знаний</p>
                    <button class="card-btn" onclick="showCardsPage()">
                        <i class="fas fa-redo"></i> Начать повторение
                    </button>
                </div>
            `;
            this.updateNavActiveState('home');
        },

        showLevelsPage: function() {
            const levelsHtml = allLevels.map(level => `
                <div class="level-card" data-level="${level.id}">
                    <h3>${level.title}</h3>
                    ${level.description ? `<p>${level.description}</p>` : ''}
                </div>
            `).join('');

            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Уровни изучения</h2>
                </div>
                <div class="levels-container">
                    ${levelsHtml}
                </div>
            `;
        },

        showCardsPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Карточки слов</h2>
                </div>
                <div class="word-card">
                    <!-- Контент карточек будет генерироваться динамически -->
                </div>
            `;
            this.updateNavActiveState('cards');
        },

        showGrammarPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Грамматика</h2>
                </div>
                <div class="grammar-container">
                    <!-- Контент грамматики будет генерироваться динамически -->
                </div>
            `;
            this.updateNavActiveState('grammar');
        },

        showTextsPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Тексты для чтения</h2>
                </div>
                <div class="texts-container">
                    <!-- Контент текстов будет генерироваться динамически -->
                </div>
            `;
            this.updateNavActiveState('texts');
        },

        showProgressPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Ваш прогресс</h2>
                </div>
                <div class="stats-container">
                    <!-- Статистика будет генерироваться динамически -->
                </div>
            `;
            this.updateNavActiveState('progress');
        },

        showProfilePage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="profile-container">
                    <div class="profile-card">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="profile-info">
                            <p><strong>Уровень:</strong> ${userProgress.currentLevel}</p>
                            <p><strong>Изучено слов:</strong> ${userProgress.knownWords.length}</p>
                        </div>
                    </div>
                </div>
            `;
            this.updateNavActiveState('profile');
        },

        showSettingsPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="settings-container">
                    <h2>Настройки</h2>
                    <div class="setting-item">
                        <span>Тёмная тема</span>
                        <label class="switch">
                            <input type="checkbox">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            `;
            this.updateNavActiveState('settings');
        },

        updateNavActiveState: function(activePage) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const activeNavItem = document.querySelector(`.nav-item[onclick*="${activePage}"]`);
            if (activeNavItem) {
                activeNavItem.classList.add('active');
            }
        },

        bindEvents: function() {
            // Делегирование событий
            document.addEventListener('click', (e) => {
                const card = e.target.closest('[data-page]');
                if (card) {
                    const page = card.dataset.page;
                    this[`show${page.charAt(0).toUpperCase() + page.slice(1)}Page`]();
                }

                const levelCard = e.target.closest('.level-card');
                if (levelCard) {
                    this.startLevel(parseInt(levelCard.dataset.level));
                }
            });
        },

        showErrorPage: function(message = "Произошла ошибка") {
            document.getElementById('mainContent').innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${message}</h3>
                    <button onclick="location.reload()">Перезагрузить</button>
                </div>
            `;
        }
    };
})();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    KoreanLearningApp.init();
});

// Глобальный экспорт функций для нижнего меню
window.showHomePage = () => KoreanLearningApp.showHomePage();
window.showLevelsPage = () => KoreanLearningApp.showLevelsPage();
window.showCardsPage = () => KoreanLearningApp.showCardsPage();
window.showGrammarPage = () => KoreanLearningApp.showGrammarPage();
window.showTextsPage = () => KoreanLearningApp.showTextsPage();
window.showProgressPage = () => KoreanLearningApp.showProgressPage();
window.showProfilePage = () => KoreanLearningApp.showProfilePage();
window.showSettingsPage = () => KoreanLearningApp.showSettingsPage();
