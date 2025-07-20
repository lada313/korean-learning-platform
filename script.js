// Глобальные переменные
let userProgress = {
    knownWords: [],
    difficultWords: [],
    completedLevels: [],
    currentLevel: 1,
    cardIntervals: {},
    lastReviewDate: null
};

let allWords = [];
let allLevels = [];
let currentCardIndex = 0; // Перенесено из cards.js

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadUserProgress();
    loadData().then(() => {
        showHomePage();
        setupEventListeners();
    });
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = function() {
            console.log("Голоса загружены");
        };
    }
});

// Загрузка данных
async function loadData() {
    try {
        const wordsResponse = await fetch('data/words.json');
        allWords = await wordsResponse.json();
        
        const levelsResponse = await fetch('data/levels.json');
        allLevels = await levelsResponse.json();
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
    }
}

// Управление прогрессом
function loadUserProgress() {
    const savedProgress = localStorage.getItem('koreanPlatformProgress');
    if (savedProgress) {
        userProgress = JSON.parse(savedProgress);
        updateProgressUI();
    }
}

function saveUserProgress() {
    userProgress.lastReviewDate = new Date().toISOString();
    localStorage.setItem('koreanPlatformProgress', JSON.stringify(userProgress));
    updateProgressUI();
}

function updateProgressUI() {
    const progressPercent = allWords.length > 0 
        ? Math.floor((userProgress.knownWords.length / allWords.length) * 100)
        : 0;
    
    document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
    document.querySelector('.progress-info span:first-child').textContent = `${progressPercent}% завершено`;
    document.querySelector('.progress-info span:last-child').textContent = `Уровень ${userProgress.currentLevel}`;
}

// Навигация
function showHomePage() {
    const wordsForReview = getDueWords().slice(0, 6);
    const recentLevels = allLevels.slice(0, 10);
    
    document.getElementById('mainContent').innerHTML = `
        <!-- Ваш HTML код главной страницы -->
    `;
    
    updateActiveNav('home');
}

function showCardsPage() {
    const dueWords = getDueWords();
    currentCardIndex = 0; // Сбрасываем индекс при открытии страницы
    
    if (dueWords.length === 0) {
        showNoCardsMessage();
        return;
    }
    
    showCurrentCard(dueWords);
}

function showCurrentCard(dueWords) {
    const currentWord = dueWords[currentCardIndex];
    
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Карточки для повторения</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        
        <div class="word-card" onclick="flipCard(this)">
            <div class="card-inner">
                <div class="card-front">
                    <div class="word-korean">${currentWord.korean}</div>
                    <div class="word-romanization">${currentWord.romanization}</div>
                    <div class="word-level">Уровень ${currentWord.level}</div>
                    <button class="speak-btn" onclick="speakWord(event, '${currentWord.korean}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <div class="card-back">
                    <div class="word-translation">${currentWord.translation}</div>
                    ${currentWord.examples.map(ex => `
                        <div class="example">
                            <div>${ex.korean}</div>
                            <div>${ex.translation}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="card-controls">
            <button class="card-btn" onclick="handleCardResponse('again', ${currentWord.id})">
                <i class="fas fa-redo"></i> Снова
            </button>
            <button class="card-btn" onclick="handleCardResponse('hard', ${currentWord.id})">
                <i class="fas fa-hourglass-half"></i> Трудно
            </button>
            <button class="card-btn" onclick="handleCardResponse('easy', ${currentWord.id})">
                <i class="fas fa-smile"></i> Легко
            </button>
        </div>
    `;
}

function showNoCardsMessage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-check-circle"></i>
            <h3>Повторений нет!</h3>
            <p>Все слова повторены. Возвращайтесь позже.</p>
            <button class="card-btn" onclick="showHomePage()">
                На главную
            </button>
        </div>
    `;
}

// Работа с карточками
function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

function handleCardResponse(response, wordId) {
    updateCardInterval(wordId, response);
    
    if (response === 'easy' && !userProgress.knownWords.includes(wordId)) {
        userProgress.knownWords.push(wordId);
    }
    
    saveUserProgress();
    
    const dueWords = getDueWords();
    currentCardIndex++;
    
    if (currentCardIndex < dueWords.length) {
        showCurrentCard(dueWords);
    } else {
        showNoCardsMessage();
    }
}

function getDueWords() {
    const now = Date.now();
    return allWords.filter(word => {
        if (!userProgress.cardIntervals?.[word.id]) return true;
        return now >= userProgress.cardIntervals[word.id].nextReview;
    });
}

function updateCardInterval(cardId, response) {
    const intervals = {
        'again': 1,    // 1 день
        'hard': 3,     // 3 дня
        'easy': 7      // 7 дней
    };
    
    if (!userProgress.cardIntervals) {
        userProgress.cardIntervals = {};
    }
    
    userProgress.cardIntervals[cardId] = {
        nextReview: Date.now() + intervals[response] * 86400000,
        interval: intervals[response]
    };
}

// Вспомогательные функции
function updateActiveNav(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(section)) {
            item.classList.add('active');
        }
    });
}

function speakWord(event, text) {
    event.stopPropagation();
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        window.speechSynthesis.speak(utterance);
    }
}

function setupEventListeners() {
    // Можно добавить глобальные обработчики
}

// Экспорт функций для HTML
window.showHomePage = showHomePage;
window.showCardsPage = showCardsPage;
window.flipCard = flipCard;
window.speakWord = speakWord;

// Заглушки для остальных функций
window.showLevelsPage = () => alert("Раздел уровней в разработке");
window.showGrammarPage = () => alert("Раздел грамматики в разработке");
window.showTextsPage = () => alert("Раздел текстов в разработке");
window.showTestsPage = () => alert("Раздел тестов в разработке");
window.showWritingPage = () => alert("Раздел прописей в разработке");
window.startLevel = (levelId) => {
    userProgress.currentLevel = levelId;
    saveUserProgress();
    alert(`Начало уровня ${levelId}`);
};
