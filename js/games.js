const games = {
    currentGame: null,
  
    startCardGame(words) {
        this.currentGame = new WordCardsGame(words);
        document.getElementById('defaultContent').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('gameContainer').innerHTML = this.currentGame.renderCard();
        
        const wordCard = document.getElementById('wordCard');
        
        // Клик по карточке для переворота
        wordCard.addEventListener('click', (e) => {
            if (e.target.closest('.card-controls') || e.target.closest('.sound-btn')) return;
            wordCard.classList.toggle('flipped');
        });
        
        // Кнопки управления
        document.getElementById('nextCardBtn').addEventListener('click', () => {
            this.currentGame.nextCard();
        });
        
        document.getElementById('repeatCardBtn').addEventListener('click', () => {
            this.currentGame.repeatCard();
        });
        
        document.getElementById('exitCardsBtn').addEventListener('click', () => {
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('defaultContent').style.display = 'block';
            window.app.showLevelsPage();
        });

        // Инициализация свайпов
        this.setupSwipeEvents(wordCard);
    },

    setupSwipeEvents(element) {
        let touchStartX = 0;
        let touchEndX = 0;

        element.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe();
        }, { passive: true });

        this.handleSwipe = () => {
            const threshold = 50; // Минимальное расстояние свайпа
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) > threshold) {
                if (swipeDistance > 0) {
                    // Свайп вправо - повторить
                    document.getElementById('repeatCardBtn').click();
                } else {
                    // Свайп влево - следующая карточка
                    document.getElementById('nextCardBtn').click();
                }
            }
        };
    }
};

class WordCardsGame {
    constructor(words) {
        this.words = words;
        this.currentIndex = 0;
        this.wordsToRepeat = [];
    }

    renderCard() {
        const word = this.words[this.currentIndex];
        const example = word.examples ? word.examples[0] : null;
        
        return `
            <div class="section-title">
                <h2>Карточки слов</h2>
                <button class="card-btn" id="exitCardsBtn">
                    <i class="fas fa-times"></i> Выйти
                </button>
            </div>
            <div class="word-card" id="wordCard">
                <div class="swipe-hint">
                    <i class="fas fa-arrow-left"></i> Свайп для переключения <i class="fas fa-arrow-right"></i>
                </div>
                <div class="card-inner">
                    <div class="card-front">
                        <div class="word-korean">${word.korean}</div>
                        <div class="sound-btn-container">
                            <button class="sound-btn" onclick="app.playSound(event, '${word.korean}')">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-back">
                        <div class="word-translation">${word.translation}</div>
                        ${example ? `
                        <div class="word-example">
                            <div class="example-header">
                                <span>Пример:</span>
                                <button class="sound-btn" onclick="app.playSound(event, '${example.korean}')">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            </div>
                            <div class="example-korean">${example.korean}</div>
                            <div class="example-translation">${example.translation}</div>
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
                <div class="progress">${this.currentIndex + 1}/${this.words.length}</div>
            </div>
        `;
    }

    nextCard() {
        this.currentIndex++;
        
        if (this.currentIndex < this.words.length) {
            this.updateCard();
        } else if (this.wordsToRepeat.length > 0) {
            this.words = [...this.wordsToRepeat];
            this.wordsToRepeat = [];
            this.currentIndex = 0;
            this.updateCard();
        } else {
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('defaultContent').style.display = 'block';
            window.app.showLevelsPage();
        }
    }

    repeatCard() {
        const currentWord = this.words[this.currentIndex];
        this.wordsToRepeat.push(currentWord);
        document.getElementById('wordCard').classList.remove('flipped');
    }

    updateCard() {
        const word = this.words[this.currentIndex];
        const wordCard = document.getElementById('wordCard');
        const example = word.examples ? word.examples[0] : null;
        
        wordCard.querySelector('.card-front').innerHTML = `
            <div class="word-header">
                <div class="word-korean">${word.korean}</div>
                <button class="sound-btn" onclick="app.playSound(event, '${word.korean}')">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
        `;
        
        wordCard.querySelector('.card-back').innerHTML = `
            <div class="word-translation">${word.translation}</div>
            ${example ? `
            <div class="word-example">
                <div class="example-header">
                    <span>Пример:</span>
                    <button class="sound-btn" onclick="app.playSound(event, '${example.korean}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <div class="example-korean">${example.korean}</div>
                <div class="example-translation">${example.translation}</div>
            </div>
            ` : ''}
        `;
        
        wordCard.querySelector('.progress').textContent = 
            `${this.currentIndex + 1}/${this.words.length}`;
        
        wordCard.classList.remove('flipped');
    }
}
