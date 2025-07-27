class KoreanLearningApp {
    constructor() {
        this.userProgress = {
            knownWords: [],
            difficultWords: [],
            completedLevels: [],
            currentLevel: 1,
            cardIntervals: {}
        };
        
        this.allWords = [];
        this.allLevels = [];
        this.allGrammar = [];
        this.allTexts = [];

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.showHomePage();
    }

    async loadData() {
        try {
            // Загрузка слов
            const wordsResponse = await fetch('./data/words.json');
            if (!wordsResponse.ok) throw new Error("Не удалось загрузить слова");
            this.allWords = await wordsResponse.json();

            // Загрузка уровней
            const levelsResponse = await fetch('./data/levels.json');
            if (!levelsResponse.ok) throw new Error("Не удалось загрузить уровни");
            this.allLevels = await levelsResponse.json();

            console.log("Данные успешно загружены");
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            this.showErrorPage("Ошибка загрузки данных");
        }
    }

    bindEvents() {
        // Навигация в нижнем меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this[`show${page.charAt(0).toUpperCase() + page.slice(1)}Page`]();
            });
        });

        // Кнопка профиля
        document.getElementById('profileBtn').addEventListener('click', () => {
            this.showProfilePage();
        });
    }

    updateNavActiveState(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`.nav-item[data-page="${activePage}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }

    showHomePage() {
        document.getElementById('defaultContent').innerHTML = `
            <div class="modules-grid">
                <div class="module-card" data-page="levels">
                    <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                    <h2>Уровни</h2>
                    <p>Пошаговое изучение от начального до продвинутого</p>
                </div>

                <div class="module-card" data-page="cards">
                    <div class="card-icon cards"><i class="far fa-sticky-note"></i></div>
                    <h2>Карточки</h2>
                    <p>Запоминание слов с интервальным повторением</p>
                </div>

                <div class="module-card" data-page="grammar">
                    <div class="card-icon grammar"><i class="fas fa-book-open"></i></div>
                    <h2>Грамматика</h2>
                    <p>Изучение правил и языковых конструкций</p>
                </div>

                <div class="module-card" data-page="texts">
                    <div class="card-icon text"><i class="fas fa-align-left"></i></div>
                    <h2>Текст и перевод</h2>
                    <p>Чтение и анализ текстов с переводом</p>
                </div>
            </div>

            <div class="repetition-section">
                <h2>Повторение</h2>
                <p>Повторяйте изученный материал для закрепления знаний</p>
                <button class="card-btn" id="startRepetitionBtn">
                    <i class="fas fa-redo"></i> Начать повторение
                </button>
            </div>
        `;

        // Добавляем обработчики для карточек на главной
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                this[`show${page.charAt(0).toUpperCase() + page.slice(1)}Page`]();
            });
        });

        document.getElementById('startRepetitionBtn')?.addEventListener('click', () => {
            this.showCardsPage();
        });

        this.updateNavActiveState('home');
    }

    showLevelsPage() {
        const levelsHtml = this.allLevels.map(level => `
            <div class="level-card" data-level="${level.id}">
                <h3>${level.title}</h3>
                <p>Слов: ${level.words.length}</p>
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

        // Добавляем обработчики для уровней
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', () => {
                const levelId = parseInt(card.dataset.level);
                this.startLevel(levelId);
            });
        });

        this.updateNavActiveState('levels');
    }

    startLevel(levelId) {
        const level = this.allLevels.find(l => l.id === levelId);
        if (!level) return;

        const words = level.words.map(wordId => 
            this.allWords.find(word => word.id === wordId)
        ).filter(Boolean);

        if (words.length > 0) {
            document.getElementById('defaultContent').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            games.startCardGame(words);
        } else {
            alert('Нет слов для этого уровня');
        }
    }

    showCardsPage() {
        const randomWords = [...this.allWords]
            .sort(() => 0.5 - Math.random())
            .slice(0, 10);

        document.getElementById('defaultContent').innerHTML = `
            <div class="section-title">
                <h2>Карточки слов</h2>
            </div>
            <div class="word-card">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="word-korean">${randomWords[0]?.korean || 'Нет слов'}</div>
                        <div class="word-romanization">${randomWords[0]?.romanization || ''}</div>
                    </div>
                    <div class="card-back">
                        <div class="word-translation">${randomWords[0]?.translation || 'Нет перевода'}</div>
                    </div>
                </div>
                <div class="card-controls">
                    <button class="card-btn" id="nextCardBtn">
                        <i class="fas fa-arrow-right"></i> Следующая карточка
                    </button>
                </div>
            </div>
        `;

        this.updateNavActiveState('cards');
    }

    // Остальные методы (showGrammarPage, showTextsPage и т.д.) остаются аналогичными
    // ...
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KoreanLearningApp();
});
