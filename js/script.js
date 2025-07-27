class KoreanLearningApp {
    playSound(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        speechSynthesis.speak(utterance);
    } else {
        alert('Ваш браузер не поддерживает синтез речи');
    }
}
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

        this.init();
    }

    async init() {
        await this.loadData();
        this.bindEvents();
        this.showHomePage();
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
        // Навигация в нижнем меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.showPage(page);
            });
        });

        // Кнопка профиля
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

        // Обработчики для карточек на главной
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

        // Обработчики для уровней
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
            this.showCardsPage(true);
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

    this.currentCardIndex = 0;
    this.currentSessionWords = [...words];
    this.wordsToRepeat = [];

    const currentWord = words[0];
    const example = currentWord.examples ? currentWord.examples[0] : null;

    document.getElementById('defaultContent').innerHTML = `
        <div class="section-title">
            <h2>Карточки слов</h2>
            <button class="card-btn" id="exitCardsBtn">
                <i class="fas fa-times"></i> Выйти
            </button>
        </div>
        <div class="word-card" id="wordCard">
            <div class="card-inner">
                <div class="card-front">
                    <div class="word-header">
                        <div class="word-korean">${currentWord.korean}</div>
                        <button class="sound-btn" onclick="app.playSound('${currentWord.korean}')">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                    <div class="word-romanization">${currentWord.romanization}</div>
                </div>
                <div class="card-back">
                    <div class="word-translation">${currentWord.translation}</div>
                    ${example ? `
                    <div class="word-example">
                        <div class="example-korean">${example.korean}</div>
                        <div class="example-translation">${example.translation}</div>
                        <button class="sound-btn" onclick="app.playSound('${example.korean}')">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="card-controls">
                <button class="card-btn" id="repeatCardBtn">
                    <i class="fas fa-redo"></i> Повторить
                </button>
                <button class="card-btn primary" id="nextCardBtn">
                    <i class="fas fa-arrow-right"></i> Следующая
                </button>
            </div>
            <div class="progress">1/${words.length}</div>
        </div>
    `;

        // Инициализация карточек
        const wordCard = document.getElementById('wordCard');
        const nextBtn = document.getElementById('nextCardBtn');
        const repeatBtn = document.getElementById('repeatCardBtn');
        const exitBtn = document.getElementById('exitCardsBtn');

        // Клик по карточке для переворота
        wordCard.addEventListener('click', (e) => {
            e.preventDefault();
            // Игнорируем клики по кнопкам управления
            if (e.target.closest('.card-controls')) return;
            wordCard.classList.toggle('flipped');
        });

        // Кнопка следующей карточки
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.currentCardIndex++;
            
            if (this.currentCardIndex < this.currentSessionWords.length) {
                const word = this.currentSessionWords[this.currentCardIndex];
                this.updateCard(word);
                wordCard.classList.remove('flipped');
            } else if (this.wordsToRepeat.length > 0) {
                // Переход к повторению
                this.currentSessionWords = [...this.wordsToRepeat];
                this.wordsToRepeat = [];
                this.currentCardIndex = 0;
                const word = this.currentSessionWords[0];
                this.updateCard(word);
                wordCard.classList.remove('flipped');
            } else {
                // Завершение сессии
                this.showLevelsPage();
            }
        });

        // Кнопка повтора
        repeatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentWord = this.currentSessionWords[this.currentCardIndex];
            this.wordsToRepeat.push(currentWord);
            wordCard.classList.remove('flipped');
        });

        // Кнопка выхода
        exitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLevelsPage();
        });

        this.updateNavActiveState('cards');
    }

    updateCard(word) {
    const wordCard = document.getElementById('wordCard');
    const front = wordCard.querySelector('.card-front');
    const back = wordCard.querySelector('.card-back');
    const progress = wordCard.querySelector('.progress');
    
    const example = word.examples ? word.examples[0] : null;
    
    front.innerHTML = `
        <div class="word-header">
            <div class="word-korean">${word.korean}</div>
            <button class="sound-btn" onclick="app.playSound('${word.korean}')">
                <i class="fas fa-volume-up"></i>
            </button>
        </div>
        <div class="word-romanization">${word.romanization}</div>
    `;
    
    back.innerHTML = `
        <div class="word-translation">${word.translation}</div>
        ${example ? `
        <div class="word-example">
            <div class="example-korean">${example.korean}</div>
            <div class="example-translation">${example.translation}</div>
            <button class="sound-btn" onclick="app.playSound('${example.korean}')">
                <i class="fas fa-volume-up"></i>
            </button>
        </div>
        ` : ''}
    `;
    
    progress.textContent = `${this.currentCardIndex + 1}/${this.currentSessionWords.length}`;
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
