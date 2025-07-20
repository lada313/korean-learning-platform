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
let currentCardIndex = 0;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadUserProgress();
    loadData().then(() => {
        showHomePage();
    });
    
    // Инициализация синтеза речи
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = function() {
            console.log("Голоса загружены");
        };
    }
});

// Загрузка данных
async function loadData() {
    try {
        const [wordsResponse, levelsResponse] = await Promise.all([
            fetch('data/words.json'),
            fetch('data/levels.json')
        ]);
        
        allWords = await wordsResponse.json();
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
    const totalWords = allWords.length;
    const knownCount = userProgress.knownWords.length;
    const progressPercent = totalWords > 0 ? Math.floor((knownCount / totalWords) * 100) : 0;
    
    if (document.querySelector('.progress-bar')) {
        document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
        document.querySelector('.progress-info span:first-child').textContent = `${progressPercent}% завершено`;
        document.querySelector('.progress-info span:last-child').textContent = `Уровень ${userProgress.currentLevel}`;
    }
}

// Навигация
function showHomePage() {
    const wordsForReview = getDueWords().slice(0, 6);
    const recentLevels = allLevels.slice(0, 10);
    
    document.getElementById('mainContent').innerHTML = `
        <!-- Ваш HTML код главной страницы -->
        <div class="section-title">
            <h2>Учебные модули</h2>
        </div>
        <div class="cards-grid">
            <div class="card" onclick="showLevelsPage()">
                <div class="card-icon levels">
                    <i class="fas fa-book"></i>
                </div>
                <h3>Уровни</h3>
                <p>${allLevels.length} уровней</p>
            </div>
            
            <div class="card" onclick="showCardsPage()">
                <div class="card-icon cards">
                    <i class="fas fa-layer-group"></i>
                </div>
                <h3>Карточки</h3>
                <p>Повторение слов</p>
            </div>
            
            <!-- Остальные карточки -->
        </div>
        
        <div class="section-title">
            <h2>Повторение слов</h2>
            <div class="daily-count">${wordsForReview.length} слов</div>
        </div>
        <div class="daily-container">
            <div class="word-list">
                ${wordsForReview.map(word => `
                    <div class="word-preview-card" onclick="showWordCard(${word.id})">
                        <div class="word-preview-korean">${word.korean}</div>
                        <div class="word-preview-translation">${word.translation}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    updateActiveNav('home');
}

function showCardsPage() {
    const dueWords = getDueWords();
    currentCardIndex = 0;
    
    if (dueWords.length === 0) {
        document.getElementById('mainContent').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>Нет слов для повторения</h3>
                <button class="card-btn" onclick="showHomePage()">На главную</button>
            </div>
        `;
        return;
    }
    
    showCurrentCard(dueWords);
    updateActiveNav('study');
}

function showCurrentCard(dueWords) {
    const currentWord = dueWords[currentCardIndex];
    
    document.getElementById('mainContent').innerHTML = `
        <div class="word-card" onclick="flipCard(this)">
            <div class="card-inner">
                <div class="card-front">
                    <div class="word-korean">${currentWord.korean}</div>
                    <button class="speak-btn" onclick="speakWord(event, '${currentWord.korean}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <div class="card-back">
                    <div class="word-translation">${currentWord.translation}</div>
                </div>
            </div>
        </div>
        <div class="card-controls">
            <button class="card-btn" onclick="handleCardResponse('again', ${currentWord.id})">
                Снова
            </button>
            <button class="card-btn" onclick="handleCardResponse('easy', ${currentWord.id})">
                Знаю
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
        showCardsPage(); // Вернёт на экран "Нет слов для повторения"
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

// Экспорт функций для HTML
window.showHomePage = showHomePage;
window.showCardsPage = showCardsPage;
window.showLevelsPage = () => showHomePage(); // Заглушка
window.flipCard = flipCard;
window.speakWord = speakWord;
window.showWordCard = (id) => {
    const word = allWords.find(w => w.id === id);
    if (word) {
        alert(`Слово: ${word.korean}\nПеревод: ${word.translation}`);
    }
};
