const games = {
    currentGame: null,
  
    startCardGame(words) {
        this.currentGame = new WordCardsGame(words);
        document.getElementById('gameContainer').innerHTML = this.renderGameUI();
        this.setupEventListeners();
        this.setupSwipeGestures();
    },

    renderGameUI() {
        return `
            <div class="section-title">
                <h2>Карточки слов</h2>
                <button class="card-btn" id="exitCardsBtn">
                    <i class="fas fa-times"></i> Выйти
                </button>
            </div>
            <div class="word-card" id="wordCard">
                ${this.currentGame.renderCardContent()}
            </div>
        `;
    },

    setupEventListeners() {
        const wordCard = document.getElementById('wordCard');
        
        wordCard.addEventListener('click', (e) => {
            if (e.target.closest('.card-controls') || e.target.closest('.sound-btn')) return;
            wordCard.classList.toggle('flipped');
        });

        document.getElementById('nextCardBtn').addEventListener('click', () => {
            this.currentGame.nextCard();
        });
        
        document.getElementById('repeatCardBtn').addEventListener('click', () => {
            this.currentGame.repeatCard();
        });
        
        document.getElementById('exitCardsBtn').addEventListener('click', () => {
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('defaultContent').style.display = 'block';
        });
    },

    setupSwipeGestures() {
        const element = document.getElementById('wordCard');
        if (!element) return;

        let startX, startTime;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startTime = Date.now();
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endTime = Date.now();
            const diffX = endX - startX;
            const duration = endTime - startTime;

            // Проверка на быстрый горизонтальный свайп
            if (duration < 500 && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    document.getElementById('repeatCardBtn').click(); // Вправо
                } else {
                    document.getElementById('nextCardBtn').click(); // Влево
                }
            }
        }, { passive: true });
    }
};

class WordCardsGame {
    constructor(words) {
        this.words = words;
        this.currentIndex = 0;
    }

    renderCardContent() {
        const word = this.words[this.currentIndex];
        return `
            <div class="swipe-hint">
                <i class="fas fa-arrow-left"></i> Свайп для переключения <i class="fas fa-arrow-right"></i>
            </div>
            <div class="card-inner">
                <div class="card-front">
                    <div class="word-korean">${word.korean}</div>
                    <div class="sound-btn-container">
                        <button class="sound-btn" onclick="app.playSound(event, '${this.escapeText(word.korean)}')">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                </div>
                <div class="card-back">
                    <div class="word-translation">${word.translation}</div>
                    ${word.examples && word.examples[0] ? this.renderExample(word.examples[0]) : ''}
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
            <div class="progress">${this.currentIndex + 1}/${this.words.length}</div>
        `;
    }

    renderExample(example) {
        return `
            <div class="word-example">
                <div class="example-header">
                    <span>Пример:</span>
                    <button class="sound-btn" onclick="app.playSound(event, '${this.escapeText(example.korean)}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <div class="example-korean">${example.korean}</div>
                <div class="example-translation">${example.translation}</div>
            </div>
        `;
    }

    escapeText(text) {
        return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    nextCard() {
        this.currentIndex++;
        if (this.currentIndex < this.words.length) {
            document.getElementById('wordCard').innerHTML = this.renderCardContent();
        } else {
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('defaultContent').style.display = 'block';
        }
    }

    repeatCard() {
        document.getElementById('wordCard').classList.remove('flipped');
    }
}
