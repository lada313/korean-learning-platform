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

    // Вспомогательные функции
    function updateNavActiveState(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`.nav-item[onclick*="${activePage}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }

    // Публичные методы
    return {
        init: function() {
            this.loadUserProgress();
            this.loadData().then(() => {
                this.showHomePage();
            }).catch(error => {
                console.error("Ошибка загрузки данных:", error);
                this.showErrorPage("Ошибка загрузки данных");
            });
        },

        loadData: async function() {
            try {
                // Загрузка слов
                const wordsResponse = await fetch('./data/words.json');
                if (!wordsResponse.ok) throw new Error("Не удалось загрузить слова");
                allWords = await wordsResponse.json();
                console.log("Слова загружены");

                // Загрузка уровней
                const levelsResponse = await fetch('./data/levels.json');
                if (!levelsResponse.ok) throw new Error("Не удалось загрузить уровни");
                allLevels = await levelsResponse.json();
                console.log("Уровни загружены");

                // Загрузка грамматики (не обязательно)
                try {
                    const grammarResponse = await fetch('./data/grammar.json');
                    if (grammarResponse.ok) {
                        allGrammar = await grammarResponse.json();
                        console.log("Грамматика загружена");
                    }
                } catch (e) {
                    console.warn("Ошибка загрузки грамматики:", e);
                }

                // Загрузка текстов (не обязательно)
                try {
                    const textsResponse = await fetch('./data/texts.json');
                    if (textsResponse.ok) {
                        allTexts = await textsResponse.json();
                        console.log("Тексты загружены");
                    }
                } catch (e) {
                    console.warn("Ошибка загрузки текстов:", e);
                }

            } catch (error) {
                console.error("Ошибка загрузки данных:", error);
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
                    console.log("Прогресс загружен");
                } catch (e) {
                    console.error("Ошибка загрузки прогресса:", e);
                }
            }
        },

        saveUserProgress: function() {
            localStorage.setItem('koreanProgress', JSON.stringify(userProgress));
        },

        showHomePage: function() {
            document.getElementById('defaultContent').innerHTML = `
                <div class="modules-grid">
                    <a href="javascript:void(0)" onclick="KoreanLearningApp.showLevelsPage()" class="module-card">
                        <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                        <h2>Уровни</h2>
                        <p>Пошаговое изучение от начального до продвинутого</p>
                    </a>

                    <a href="javascript:void(0)" onclick="KoreanLearningApp.showCardsPage()" class="module-card">
                        <div class="card-icon cards"><i class="far fa-sticky-note"></i></div>
                        <h2>Карточки</h2>
                        <p>Запоминание слов с интервальным повторением</p>
                    </a>

                    <a href="javascript:void(0)" onclick="KoreanLearningApp.showGrammarPage()" class="module-card">
                        <div class="card-icon grammar"><i class="fas fa-book-open"></i></div>
                        <h2>Грамматика</h2>
                        <p>Изучение правил и языковых конструкций</p>
                    </a>

                    <a href="javascript:void(0)" onclick="KoreanLearningApp.showTextsPage()" class="module-card">
                        <div class="card-icon text"><i class="fas fa-align-left"></i></div>
                        <h2>Текст и перевод</h2>
                        <p>Чтение и анализ текстов с переводом</p>
                    </a>
                </div>

                <div class="repetition-section">
                    <h2>Повторение</h2>
                    <p>Повторяйте изученный материал для закрепления знаний</p>
                    <button class="card-btn" onclick="KoreanLearningApp.showCardsPage()">
                        <i class="fas fa-redo"></i> Начать повторение
                    </button>
                </div>
            `;
            updateNavActiveState('home');
        },

        showLevelsPage: function() {
            const levelsHtml = allLevels.map(level => `
                <div class="level-card" onclick="KoreanLearningApp.startLevel(${level.id})">
                    <h3>${level.title}</h3>
                    ${level.description ? `<p>${level.description}</p>` : ''}
                </div>
            `).join('');

            document.getElementById('defaultContent').innerHTML = `
                <div class="section-title">
                    <h2>Уровни изучения</h2>
                </div>
                <div class="levels-container">
                    ${levelsHtml}
                </div>
            `;
            updateNavActiveState('levels');
        },

        startLevel: function(levelId) {
            console.log("Запуск уровня", levelId);
            // Здесь будет логика запуска уровня
            alert(`Запуск уровня ${levelId}`);
        },

        showCardsPage: function() {
            document.getElementById('defaultContent').innerHTML = `
                <div class="section-title">
                    <h2>Карточки слов</h2>
                </div>
                <div class="word-card">
                    <p>Здесь будут карточки для изучения слов</p>
                </div>
            `;
            updateNavActiveState('cards');
        },

        showGrammarPage: function() {
            document.getElementById('defaultContent').innerHTML = `
                <div class="section-title">
                    <h2>Грамматика</h2>
                </div>
                <div class="grammar-container">
                    <p>Здесь будут материалы по грамматике</p>
                </div>
            `;
            updateNavActiveState('grammar');
        },

        showTextsPage: function() {
            document.getElementById('defaultContent').innerHTML = `
                <div class="section-title">
                    <h2>Тексты для чтения</h2>
                </div>
                <div class="texts-container">
                    <p>Здесь будут тексты для чтения</p>
                </div>
            `;
            updateNavActiveState('texts');
        },

        showProgressPage: function() {
            document.getElementById('defaultContent').innerHTML = `
                <div class="section-title">
                    <h2>Ваш прогресс</h2>
                </div>
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-value">${userProgress.knownWords.length}</div>
                        <div class="stat-label">Изучено слов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${userProgress.completedLevels.length}</div>
                        <div class="stat-label">Пройдено уровней</div>
                    </div>
                </div>
            `;
            updateNavActiveState('progress');
        },

        showProfilePage: function() {
            document.getElementById('defaultContent').innerHTML = `
                <div class="profile-container">
                    <div class="profile-card">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="profile-info">
                            <p><strong>Уровень:</strong> ${userProgress.currentLevel}</p>
                            <p><strong>Изучено слов:</strong> ${userProgress.knownWords.length}</p>
                            <p><strong>Пройдено уровней:</strong> ${userProgress.completedLevels.length}</p>
                        </div>
                    </div>
                </div>
            `;
            updateNavActiveState('profile');
        },

        showSettingsPage: function() {
            document.getElementById('defaultContent').innerHTML = `
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
            updateNavActiveState('settings');
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
