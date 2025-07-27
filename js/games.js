// games.js
class WordCardsGame {
  constructor(words) {
    this.words = words;
    this.currentIndex = 0;
    this.unknownWords = [];
    this.isReviewRound = false;
  }

  renderCard() {
    const word = this.isReviewRound 
      ? this.unknownWords[this.currentIndex] 
      : this.words[this.currentIndex];

    return `
      <div class="game-card">
        <div class="card-word">${word.korean}</div>
        <div class="card-romanization">${word.romanization}</div>
        
        <div class="card-controls">
          <button class="card-btn" onclick="games.currentGame.handleUnknown()">
            <i class="fas fa-redo"></i> Повтор
          </button>
          <button class="card-btn primary" onclick="games.currentGame.handleKnown()">
            <i class="fas fa-check"></i> Знаю
          </button>
        </div>
        
        <div class="progress">${this.currentIndex + 1}/${this.getTotalWords()}</div>
      </div>
    `;
  }

  handleKnown() {
    if (!this.isReviewRound && Math.random() > 0.7) { // 30% chance to add to unknown
      this.unknownWords.push(this.words[this.currentIndex]);
    }
    this.nextCard();
  }

  handleUnknown() {
    this.unknownWords.push(this.getCurrentWord());
    this.nextCard();
  }

  nextCard() {
    this.currentIndex++;
    
    if (this.currentIndex >= this.getTotalWords()) {
      if (this.isReviewRound || this.unknownWords.length === 0) {
        games.startMatchGame(this.words);
        return;
      }
      
      this.isReviewRound = true;
      this.words = [...this.unknownWords];
      this.unknownWords = [];
      this.currentIndex = 0;
    }
    
    document.getElementById('gameContainer').innerHTML = this.renderCard();
  }

  getCurrentWord() {
    return this.isReviewRound 
      ? this.unknownWords[this.currentIndex] 
      : this.words[this.currentIndex];
  }

  getTotalWords() {
    return this.isReviewRound 
      ? this.unknownWords.length 
      : this.words.length;
  }
}

class MatchTranslationGame {
  constructor(words) {
    this.words = words;
    this.currentWord = this.getRandomWord();
    this.options = this.generateOptions();
  }

  render() {
    return `
      <div class="match-game">
        <div class="word-to-match">${this.currentWord.korean}</div>
        
        <div class="options-container">
          ${this.options.map(opt => `
            <button class="option-btn" 
                    onclick="games.currentGame.checkAnswer('${opt}')">
              ${opt}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  checkAnswer(selectedTranslation) {
    if (selectedTranslation === this.currentWord.translation) {
      alert('Правильно!');
      games.startMatchGame(this.words); // Новое слово
    } else {
      alert('Неправильно, попробуйте ещё!');
    }
  }

  getRandomWord() {
    return this.words[Math.floor(Math.random() * this.words.length)];
  }

  generateOptions() {
    const options = [this.currentWord.translation];
    
    while (options.length < 4) {
      const randomWord = this.getRandomWord();
      if (!options.includes(randomWord.translation)) {
        options.push(randomWord.translation);
      }
    }
    
    return this.shuffleArray(options);
  }

  shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }
}

const games = {
  currentGame: null,
  
  startCardGame(words) {
    this.currentGame = new WordCardsGame(words);
    document.getElementById('gameContainer').innerHTML = 
      this.currentGame.renderCard();
  },
  
  startMatchGame(words) {
    this.currentGame = new MatchTranslationGame(words);
    document.getElementById('gameContainer').innerHTML = 
      this.currentGame.render();
  }
};
