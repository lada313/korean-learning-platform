const games = {
    currentGame: null,
  
    startCardGame(words) {
        this.currentGame = new WordCardsGame(words);
        this.renderGame();
    },
  
    renderGame() {
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.innerHTML = this.currentGame.renderCard();
    }
};

class WordCardsGame {
    constructor(words) {
        this.words = words;
        this.currentIndex = 0;
    }

    renderCard() {
        const word = this.words[this.currentIndex];
        
        return `
            <div class="game-card">
                <div class="card-word">${word.korean}</div>
                <div class="card-romanization">${word.romanization}</div>
                
                <div class="card-controls">
                    <button class="card-btn" id="nextCardBtn">
                        <i class="fas fa-arrow-right"></i> Следующая карточка
                    </button>
                </div>
                
                <div class="progress">${this.currentIndex + 1}/${this.words.length}</div>
            </div>
        `;
    }
}
