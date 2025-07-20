let currentCardIndex = 0;
let words = [];

function initCards(wordsData) {
    words = wordsData;
    currentCardIndex = 0;
    renderCard();
}

function renderCard() {
    const word = words[currentCardIndex];
    
    document.getElementById('mainContent').innerHTML = `
        <div class="word-card" onclick="toggleCard(this)">
            <div class="card-inner">
                <div class="card-front">
                    <div class="word-korean">${word.korean}</div>
                    <div class="word-romanization">${word.romanization}</div>
                    <div class="word-level">Level ${word.level}</div>
                    <button class="speak-btn" onclick="speakWord('${word.korean}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <div class="card-back">
                    <div class="word-translation">${word.translation}</div>
                    ${word.examples.map(ex => `
                        <div class="example">
                            <div>${ex.korean}</div>
                            <div>${ex.translation}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="card-controls">
            <button class="card-btn" onclick="prevCard()"><i class="fas fa-arrow-left"></i></button>
            <button class="card-btn" onclick="markAsKnown()">Знаю</button>
            <button class="card-btn" onclick="nextCard()"><i class="fas fa-arrow-right"></i></button>
        </div>
    `;
}

function toggleCard(card) {
    card.classList.toggle('flipped');
}

function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % words.length;
    renderCard();
}

function prevCard() {
    currentCardIndex = (currentCardIndex - 1 + words.length) % words.length;
    renderCard();
}

function markAsKnown() {
    const wordId = words[currentCardIndex].id;
    const progress = loadProgress();
    
    if (!progress.knownWords) progress.knownWords = [];
    if (!progress.knownWords.includes(wordId)) {
        progress.knownWords.push(wordId);
        saveProgress(progress);
    }
    
    nextCard();
}

function spekWord(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
}

function saveProgress(progress) {
    localStorage.setItem('userProgress', JSON.stringify(progress));
}
