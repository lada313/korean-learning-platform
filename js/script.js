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
        this.currentWords = [];
        this.currentCardIndex = 0;
        this.currentSessionWords = [];
        this.wordsToRepeat = [];
        this.synth = window.speechSynthesis;
        this.voices = [];

        this.init();
    }

    async init() {
        await this.loadData();
        this.loadVoices();
        this.bindEvents();
        this.showHomePage();
    }

    loadVoices() {
        this.voices = this.synth.getVoices().filter(voice => voice.lang.includes('ko'));
        if (this.voices.length === 0) {
            console.warn('No Korean voices available');
        }
    }

    async loadData() {
        try {
            const [wordsResponse, levelsResponse, grammarResponse] = await Promise.all([
                fetch('./data/words.json'),
                fetch('./data/levels.json'),
                fetch('./data/grammar.json')
            ]);
            
            this.allWords = await wordsResponse.json();
            this.allLevels = await levelsResponse.json();
            this.grammarRules = await grammarResponse.json();
            
            console.log("Данные успешно загружены");
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            this.showErrorPage("Ошибка загрузки данных");
        }
    }

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.showPage(page);
            });
        });

        document.getElementById('profileBtn')?.addEventListener('click', () => {
            this.showPage('profile');
        });
    }

    showPage(page) {
        this[`show${page.charAt(0).toUpperCase() + page.slice(1)}Page`]();
    }

    updateNavActiveState(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === activePage);
        });
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

        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(card.dataset.page);
            });
        });

        document.getElementById('startRepetitionBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showCardsPage();
        });

        this.updateNavActiveState('home');
    }

    showLevelsPage() {
        const levelsHtml = this.allLevels.map(level => `
            <div class="level-card" data-level="${level.id}">
                <h3>${level.title}</h3>
                <p>Слов: ${level.words.length}</p>
                <div class="level-progress">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
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

        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const levelId = parseInt(card.dataset.level);
                this.startLevel(levelId);
            });
        });

        this.updateNavActiveState('levels');
    }

    startLevel(levelId) {
        const level = this.allLevels.find(l => l.id === levelId);
        if (!level) return;

        this.currentWords = level.words.map(wordId => 
            this.allWords.find(word => word.id === wordId)
        ).filter(Boolean);

        if (this.currentWords.length > 0) {
            games.startCardGame(this.currentWords);
        } else {
            alert('Нет слов для этого уровня');
        }
    }

    showCardsPage(fromLevel = false) {
        const words = fromLevel ? this.currentWords : 
            [...this.allWords].sort(() => 0.5 - Math.random()).slice(0, 10);

        if (words.length === 0) {
            document.getElementById('defaultContent').innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Нет доступных слов</h3>
                    <p>Попробуйте выбрать другой уровень</p>
                </div>
            `;
            return;
        }

        games.startCardGame(words);
    }

    playSound(event, text) {
        event.stopPropagation();
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        if (this.voices.length > 0) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.voices[0];
            utterance.lang = 'ko-KR';
            this.synth.speak(utterance);
            
            // Анимация кнопки звука
            const soundBtn = event.target.closest('.sound-btn');
            if (soundBtn) {
                soundBtn.classList.add('playing');
                setTimeout(() => {
                    soundBtn.classList.remove('playing');
                }, 1000);
            }
        } else {
            alert('Корейский голос не доступен. Пожалуйста, добавьте корейский голос в настройках вашего браузера.');
        }
    }

    showProgressPage() {
        document.getElementById('defaultContent').innerHTML = `
            <div class="section-title">
                <h2>Ваш прогресс</h2>
            </div>
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value">${this.userProgress.knownWords.length}</div>
                    <div class="stat-label">Изучено слов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.userProgress.completedLevels.length}</div>
                    <div class="stat-label">Пройдено уровней</div>
                </div>
            </div>
        `;
        this.updateNavActiveState('progress');
    }

    showProfilePage() {
        document.getElementById('defaultContent').innerHTML = `
            <div class="profile-container">
                <div class="profile-card">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="profile-info">
                        <p><strong>Уровень:</strong> ${this.userProgress.currentLevel}</p>
                        <p><strong>Изучено слов:</strong> ${this.userProgress.knownWords.length}</p>
                    </div>
                </div>
            </div>
        `;
        this.updateNavActiveState('profile');
    }

    showSettingsPage() {
        document.getElementById('defaultContent').innerHTML = `
            <div class="settings-container">
                <h2>Настройки</h2>
                <div class="setting-item">
                    <span>Тёмная тема</span>
                    <label class="switch">
                        <input type="checkbox" id="darkThemeToggle">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
        `;
        this.updateNavActiveState('settings');
    }

    showErrorPage(message) {
        document.getElementById('defaultContent').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
                <button class="card-btn" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Перезагрузить
                </button>
            </div>
        `;
    }
}
