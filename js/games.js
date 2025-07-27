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
        
        return `
            <div class="section-title">
                <h2>Карточки слов</h2>
                <button class="card-btn" id="exitCardsBtn">
                    <i class="fas fa-times"></i> Выйти
                </button>
            </div>
            <div class="word-card" id="wordCard">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="word-korean">${word.korean}</div>
                        <div class="word-romanization">${word.romanization}</div>
                    </div>
                    <div class="card-back">
                        <div class="word-translation">${word.translation}</div>
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
        
        wordCard.querySelector('.card-front').innerHTML = `
            <div class="word-korean">${word.korean}</div>
            <div class="word-romanization">${word.romanization}</div>
        `;
        
        wordCard.querySelector('.card-back').innerHTML = `
            <div class="word-translation">${word.translation}</div>
        `;
        
        wordCard.querySelector('.progress').textContent = 
            `${this.currentIndex + 1}/${this.words.length}`;
        
        wordCard.classList.remove('flipped');
    }
}
