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
                    <div class="module-card" data-page="levels">
                        <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                        <h2>Уровни</h2>
                        <p>Пошаговое изучение</p>
                    </div>
                    <!-- Другие кнопки -->
                </div>
            `;
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
                    <button class="back-btn" data-page="home">На главную</button>
                </div>
                <div class="levels-container">
                    ${levelsHtml}
                </div>
            `;
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

// Глобальный экспорт только необходимых функций
window.showLevelsPage = () => KoreanLearningApp.showLevelsPage();
window.showHomePage = () => KoreanLearningApp.showHomePage();
