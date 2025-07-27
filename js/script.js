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
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('defaultContent').style.display = 'block';
            this.updateNavActiveState('home');
        },

        showLevelsPage: function() {
            const levelsHtml = allLevels.map(level => `
                <div class="level-card" data-level="${level.id}">
                    <h3>${level.title}</h3>
                    ${level.description ? `<p>${level.description}</p>` : ''}
                    <div class="level-progress">
                        <div class="progress-bar" style="width: ${this.getLevelProgress(level.id)}%"></div>
                    </div>
                </div>
            `).join('');

            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Уровни изучения</h2>
                    <button class="back-btn" onclick="KoreanLearningApp.showHomePage()">На главную</button>
                </div>
                <div class="levels-container">
                    ${levelsHtml}
                </div>
            `;
            this.updateNavActiveState('levels');
        },

        showCardsPage: function() {
            const wordsToStudy = this.getWordsForCurrentLevel();
            startCardGame(wordsToStudy);
        },

        showGrammarPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Грамматика</h2>
                    <button class="back-btn" onclick="KoreanLearningApp.showHomePage()">На главную</button>
                </div>
                <div class="grammar-container">
                    ${allGrammar.map(item => `
                        <div class="grammar-card">
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                            ${item.examples.map(ex => `
                                <div class="example-container">
                                    <div class="example-korean">${ex.korean}</div>
                                    <div class="example-translation">${ex.translation}</div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            `;
            this.updateNavActiveState('grammar');
        },

        showTextsPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Тексты для чтения</h2>
                    <button class="back-btn" onclick="KoreanLearningApp.showHomePage()">На главную</button>
                </div>
                <div class="texts-container">
                    ${allTexts.map(text => `
                        <div class="text-card">
                            <h3>${text.title}</h3>
                            <div class="text-content">
                                <div class="korean-text">${text.korean}</div>
                                <div class="translation">${text.translation}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            this.updateNavActiveState('texts');
        },

        showProgressPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Ваш прогресс</h2>
                    <button class="back-btn" onclick="KoreanLearningApp.showHomePage()">На главную</button>
                </div>
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-value">${userProgress.knownWords.length}</div>
                        <div class="stat-label">Изученных слов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${userProgress.completedLevels.length}</div>
                        <div class="stat-label">Пройденных уровней</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${userProgress.difficultWords.length}</div>
                        <div class="stat-label">Сложных слов</div>
                    </div>
                </div>
            `;
            this.updateNavActiveState('progress');
        },

        showProfilePage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Ваш профиль</h2>
                    <button class="back-btn" onclick="KoreanLearningApp.showHomePage()">На главную</button>
                </div>
                <div class="profile-container">
                    <div class="profile-card">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <h2>Ученик корейского</h2>
                        <div class="profile-info">
                            <p><strong>Текущий уровень:</strong> ${userProgress.currentLevel}</p>
                            <p><strong>Дата регистрации:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            `;
            this.updateNavActiveState('profile');
        },

        showSettingsPage: function() {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Настройки</h2>
                    <button class="back-btn" onclick="KoreanLearningApp.showHomePage()">На главную</button>
                </div>
                <div class="settings-container">
                    <div class="setting-item">
                        <span>Тёмная тема</span>
                        <label class="switch">
                            <input type="checkbox">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <span>Уведомления</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            `;
            this.updateNavActiveState('settings');
        },

        showErrorPage: function(message = "Произошла ошибка") {
            document.getElementById('mainContent').innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${message}</h3>
                    <button onclick="location.reload()">Перезагрузить</button>
                </div>
            `;
        },

        bindEvents: function() {
            document.addEventListener('click', (e) => {
                const levelCard = e.target.closest('.level-card');
                if (levelCard) {
                    this.startLevel(parseInt(levelCard.dataset.level));
                }
            });
        },

        startLevel: function(levelId) {
            const level = allLevels.find(l => l.id === levelId);
            if (!level) return;

            const levelWords = this.getWordsForLevel(levelId);
            this.showLevelStartScreen(level, levelWords);
        },

        showLevelStartScreen: function(level, words) {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>${level.title}</h2>
                    <button class="back-btn" onclick="KoreanLearningApp.showLevelsPage()">Назад</button>
                </div>
                <div class="level-description">
                    <p>Изучите ${words.length} слов и фраз для этого уровня</p>
                </div>
                <div class="level-tasks">
                    <div class="task-card" onclick="startCardGame(${JSON.stringify(words)})">
                        <i class="fas fa-sticky-note"></i>
                        <h3>Карточки</h3>
                        <p>Изучите слова с карточками</p>
                    </div>
                    <div class="task-card" onclick="games.startMatchGame(${JSON.stringify(words)})">
                        <i class="fas fa-gamepad"></i>
                        <h3>Игра на совпадение</h3>
                        <p>Проверьте свои знания</p>
                    </div>
                </div>
            `;
        },

        getWordsForLevel: function(levelId) {
            const level = allLevels.find(l => l.id === levelId);
            if (!level) return [];
            
            return allWords.filter(word => level.words.includes(word.id));
        },

        getWordsForCurrentLevel: function() {
            return this.getWordsForLevel(userProgress.currentLevel);
        },

        getLevelProgress: function(levelId) {
            const level = allLevels.find(l => l.id === levelId);
            if (!level) return 0;
            
            const levelWords = this.getWordsForLevel(levelId);
            const knownWords = levelWords.filter(word => 
                userProgress.knownWords.includes(word.id)
            ).length;
            
            return Math.round((knownWords / levelWords.length) * 100);
        },

        updateNavActiveState: function(activePage) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('onclick')?.includes(activePage)) {
                    item.classList.add('active');
                }
            });
        },

        addKnownWord: function(wordId) {
            if (!userProgress.knownWords.includes(wordId)) {
                userProgress.knownWords.push(wordId);
                this.saveUserProgress();
            }
        },

        addDifficultWord: function(wordId) {
            if (!userProgress.difficultWords.includes(wordId)) {
                userProgress.difficultWords.push(wordId);
                this.saveUserProgress();
            }
        }
    };
})();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    KoreanLearningApp.init();
});

// Глобальные экспорты функций
window.showHomePage = () => KoreanLearningApp.showHomePage();
window.showLevelsPage = () => KoreanLearningApp.showLevelsPage();
window.showCardsPage = () => KoreanLearningApp.showCardsPage();
window.showGrammarPage = () => KoreanLearningApp.showGrammarPage();
window.showTextsPage = () => KoreanLearningApp.showTextsPage();
window.showProgressPage = () => KoreanLearningApp.showProgressPage();
window.showProfilePage = () => KoreanLearningApp.showProfilePage();
window.showSettingsPage = () => KoreanLearningApp.showSettingsPage();
