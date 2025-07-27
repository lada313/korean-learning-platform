// ==================== ОСНОВНОЙ ОБЪЕКТ ПРИЛОЖЕНИЯ ====================
const KoreanApp = {
    // Глобальные переменные
    userProgress: {
        knownWords: [],
        difficultWords: [],
        completedLevels: [],
        currentLevel: 1,
        cardIntervals: {}
    },
    allWords: [],
    allLevels: [],
    allGrammar: [],
    allTexts: [],
    currentCardIndex: 0,
    flashcards: [],

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    init: function() {
        this.loadUserProgress();
        this.loadData().then(() => {
            this.showHomePage();
            this.setupEventListeners();
        }).catch(error => {
            console.error("Ошибка загрузки данных:", error);
            this.showErrorPage();
        });
    },

    // ==================== ЗАГРУЗКА ДАННЫХ ====================
    loadData: async function() {
        try {
            // Загрузка обязательных данных
            const wordsPromise = fetch('data/words.json')
                .then(response => {
                    if (!response.ok) throw new Error("Ошибка загрузки words.json");
                    return response.json();
                })
                .catch(() => {
                    return [{
                        id: 1,
                        korean: "안녕하세요",
                        romanization: "annyeonghaseyo",
                        translation: "Здравствуйте"
                    }];
                });

            const levelsPromise = fetch('data/levels.json')
                .then(response => {
                    if (!response.ok) throw new Error("Ошибка загрузки levels.json");
                    return response.json();
                })
                .catch(() => {
                    return [{
                        id: 1,
                        title: "1 Уровень",
                        words: [1],
                        locked: false
                    }];
                });

            const [words, levels] = await Promise.all([wordsPromise, levelsPromise]);
            this.allWords = words;
            this.allLevels = levels;

            // Загрузка дополнительных данных (не обязательно)
            try {
                const grammarResponse = await fetch('data/grammar.json');
                if (grammarResponse.ok) this.allGrammar = await grammarResponse.json();
            } catch (e) {
                console.warn("Не удалось загрузить grammar.json:", e);
            }

            try {
                const textsResponse = await fetch('data/texts.json');
                if (textsResponse.ok) this.allTexts = await textsResponse.json();
            } catch (e) {
                console.warn("Не удалось загрузить texts.json:", e);
            }

        } catch (error) {
            console.error("Критическая ошибка загрузки данных:", error);
            throw error;
        }
    },

    // ==================== УПРАВЛЕНИЕ ПРОГРЕССОМ ====================
    loadUserProgress: function() {
        const saved = localStorage.getItem('koreanProgress');
        if (saved) {
            try {
                this.userProgress = JSON.parse(saved);
            } catch (e) {
                console.error("Ошибка загрузки прогресса:", e);
            }
        }
    },

    saveUserProgress: function() {
        localStorage.setItem('koreanProgress', JSON.stringify(this.userProgress));
    },

    // ==================== ОСНОВНЫЕ СТРАНИЦЫ ====================
    showHomePage: function() {
        document.getElementById('mainContent').innerHTML = `
            <div class="modules-grid">
                <div class="module-card" id="levelsBtn">
                    <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                    <h2>Уровни</h2>
                    <p>Пошаговое изучение</p>
                </div>
                <!-- Другие кнопки -->
            </div>
        `;
    },

    showLevelsPage: function() {
        const levelsHtml = this.allLevels.map(level => `
            <div class="level-card" data-level="${level.id}">
                <h3>${level.title}</h3>
                <p>${level.description || ''}</p>
            </div>
        `).join('');

        document.getElementById('mainContent').innerHTML = `
            <div class="levels-container">
                ${levelsHtml}
            </div>
        `;
    },

    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
    setupEventListeners: function() {
        // Делегирование событий
        document.addEventListener('click', (e) => {
            if (e.target.closest('#levelsBtn')) {
                this.showLevelsPage();
            }
            
            if (e.target.closest('.level-card')) {
                const levelId = parseInt(e.target.closest('.level-card').dataset.level);
                this.startLevel(levelId);
            }
        });
    },

    // ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ====================
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

// Инициализация приложения после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    KoreanApp.init();
});

// Экспорт функций в глобальную область видимости
window.showLevelsPage = () => KoreanApp.showLevelsPage();
window.showHomePage = () => KoreanApp.showHomePage();
