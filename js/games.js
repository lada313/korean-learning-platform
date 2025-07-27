const games = {
    currentGame: null,
  
    startCardGame(words) {
        this.currentGame = new WordCardsGame(words);
        document.getElementById('defaultContent').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('gameContainer').innerHTML = this.currentGame.renderCard();
        
        const wordCard = document.getElementById('wordCard');
        wordCard.addEventListener('click', (e) => {
            if (e.target.closest('.card-controls')) return;
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
            window.app.showLevelsPage();
        });

        this.setupSwipeEvents(wordCard);
    },

    setupSwipeEvents(element) {
        let xDown = null;
        let yDown = null;

        const handleTouchStart = (evt) => {
            xDown = evt.touches[0].clientX;
            yDown = evt.touches[0].clientY;
        };

        const handleTouchMove = (evt) => {
            if (!xDown || !yDown) return;
            
            let xUp = evt.touches[0].clientX;
            let yUp = evt.touches[0].clientY;
            
            let xDiff = xDown - xUp;
            let yDiff = yDown - yUp;
            
            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                if (Math.abs(xDiff) > 50) {
                    if (xDiff > 0) {
                        document.getElementById('nextCardBtn').click();
                    } else {
                        document.getElementById('repeatCardBtn').click();
                    }
                }
            }
            xDown = null;
            yDown = null;
        };

        element.addEventListener('touchstart', handleTouchStart, false);
        element.addEventListener('touchmove', handleTouchMove, false);
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
                        <div class="word-header">
                            <div class="word-korean">${word.korean}</div>
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
