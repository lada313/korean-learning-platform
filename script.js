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

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadUserProgress();
    loadData().then(() => {
        showHomePage();
        setupEventListeners();
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
    
    document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
    document.querySelector('.progress-info span:first-child').textContent = `${progressPercent}% завершено`;
    document.querySelector('.progress-info span:last-child').textContent = `Уровень ${userProgress.currentLevel}`;
}

// Навигация
function showHomePage() {
    const wordsForReview = getDueWords().slice(0, 6);
    const recentLevels = allLevels.slice(0, 10);
    
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Учебные модули</h2>
        </div>
        <div class="cards-grid">
            <div class="card" onclick="showLevelsPage()">
                <div class="card-icon levels">
                    <i class="fas fa-book"></i>
                </div>
                <h3>Уровни</h3>
                <p>${allLevels.length} уровней по 15 слов + грамматика</p>
                <div class="badge primary">${allWords.length} слов</div>
                <div class="progress-container-sm">
                    <div class="progress-bar-sm levels" style="width: ${(userProgress.completedLevels.length / allLevels.length) * 100}%"></div>
                </div>
            </div>
            
            <div class="card" onclick="showCardsPage()">
                <div class="card-icon cards">
                    <i class="fas fa-layer-group"></i>
                </div>
                <h3>Карточки</h3>
                <p>Интервальное повторение слов</p>
                <div class="progress-container-sm">
                    <div class="progress-bar-sm cards" style="width: ${(userProgress.knownWords.length / allWords.length) * 100}%"></div>
                </div>
            </div>
            
            <div class="card" onclick="showGrammarPage()">
                <div class="card-icon grammar">
                    <i class="fas fa-pen-nib"></i>
                </div>
                <h3>Грамматика</h3>
                <p>Правила и примеры использования</p>
            </div>
            
            <div class="card" onclick="showTextsPage()">
                <div class="card-icon text">
                    <i class="fas fa-font"></i>
                </div>
                <h3>Тексты</h3>
                <p>Чтение и перевод</p>
            </div>
            
            <div class="card" onclick="showTestsPage()">
                <div class="card-icon test">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Тесты</h3>
                <p>Проверка знаний</p>
            </div>
            
            <div class="card" onclick="showWritingPage()">
                <div class="card-icon writing">
                    <i class="fas fa-pencil-alt"></i>
                </div>
                <h3>Прописи</h3>
                <p>Практика написания</p>
            </div>
        </div>
        
        <div class="section-title">
            <h2>Открытые уровни</h2>
            <a href="#" class="view-all" onclick="showLevelsPage()">Все уровни</a>
        </div>
        <div class="levels-container">
            ${generateLevelsPreview(recentLevels)}
        </div>
        
        <div class="section-title">
            <h2>Повторение слов</h2>
            <div class="daily-count">${wordsForReview.length} слов</div>
        </div>
        <div class="daily-container">
            <div class="daily-header">
                <div class="daily-title">Слова для повторения</div>
                ${wordsForReview.length > 0 ? '<a href="#" class="view-all" onclick="showCardsPage()">Все слова</a>' : ''}
            </div>
            <div class="word-list">
                ${wordsForReview.length > 0 ? 
                    wordsForReview.map(word => `
                        <div class="word-preview-card" onclick="showWordCard(${word.id})">
                            <div class="word-preview-korean">${word.korean}</div>
                            <div class="word-preview-translation">${word.translation}</div>
                            <div class="word-preview-level">Ур. ${word.level}</div>
                        </div>
                    `).join('') : 
                    '<p class="empty-message">Нет слов для повторения</p>'
                }
            </div>
        </div>
    `;
    
    updateActiveNav('home');
}

function generateLevelsPreview(levels) {
    return levels.map(level => `
        <div class="level-card ${userProgress.currentLevel < level.id ? 'locked' : ''}" 
             onclick="${userProgress.currentLevel >= level.id ? `startLevel(${level.id})` : ''}">
            ${userProgress.currentLevel < level.id ? '<i class="fas fa-lock lock-icon"></i>' : ''}
            <div class="level-number">${level.id}</div>
            <div class="level-info">
                ${userProgress.completedLevels.includes(level.id) ? '15/15 слов' : '0/15 слов'}
            </div>
            <div class="level-progress">
                <div class="level-progress-bar" style="width: ${userProgress.completedLevels.includes(level.id) ? '100' : '0'}%"></div>
            </div>
        </div>
    `).join('');
}

// Работа с карточками
function showCardsPage() {
    const dueWords = getDueWords();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Карточки для повторения</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        
        <div id="flashcardContainer">
            ${dueWords.length > 0 ? `
                <div class="word-card" id="currentFlashcard" onclick="flipCard(this)">
                    <div class="card-inner">
                        <div class="card-front">
                            <div class="word-korean">${dueWords[0].korean}</div>
                            <div class="word-romanization">${dueWords[0].romanization}</div>
                            <div class="word-level">Уровень ${dueWords[0].level}</div>
                            <button class="speak-btn" onclick="speakWord(event, '${dueWords[0].korean}')">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                        <div class="card-back">
                            <div class="word-translation">${dueWords[0].translation}</div>
                            ${dueWords[0].examples.map(ex => `
                                <div class="example">
                                    <div>${ex.korean}</div>
                                    <div>${ex.translation}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="card-controls">
                    <button class="card-btn" onclick="handleCardResponse('again', ${dueWords[0].id})">
                        <i class="fas fa-redo"></i> Снова
                    </button>
                    <button class="card-btn" onclick="handleCardResponse('hard', ${dueWords[0].id})">
                        <i class="fas fa-hourglass-half"></i> Трудно
                    </button>
                    <button class="card-btn" onclick="handleCardResponse('easy', ${dueWords[0].id})">
                        <i class="fas fa-smile"></i> Легко
                    </button>
                </div>
            ` : `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>Повторений нет!</h3>
                    <p>Все слова повторены. Возвращайтесь позже.</p>
                    <button class="card-btn" onclick="showHomePage()">
                        На главную
                    </button>
                </div>
            `}
        </div>
    `;
    
    updateActiveNav('study');
}

function showWordCard(wordId) {
    const word = allWords.find(w => w.id === wordId);
    if (!word) return showHomePage();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Повторение слова</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        
        <div class="word-card" onclick="flipCard(this)">
            <div class="card-inner">
                <div class="card-front">
                    <div class="word-korean">${word.korean}</div>
                    <div class="word-romanization">${word.romanization}</div>
                    <div class="word-level">Уровень ${word.level}</div>
                    <button class="speak-btn" onclick="speakWord(event, '${word.korean}')">
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
            <button class="card-btn" onclick="handleCardResponse('hard', ${word.id})">
                <i class="fas fa-hourglass-half"></i> Трудно
            </button>
            <button class="card-btn" onclick="handleCardResponse('easy', ${word.id})">
                <i class="fas fa-check-circle"></i> Знаю
            </button>
        </div>
    `;
}

function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

function handleCardResponse(response, wordId) {
    updateCardInterval(wordId, response);
    
    if (response === 'easy') {
        if (!userProgress.knownWords.includes(wordId)) {
            userProgress.knownWords.push(wordId);
        }
    }
    
    saveUserProgress();
    showCardsPage();
}

function getDueWords() {
    const now = Date.now();
    return allWords.filter(word => {
        // Новые слова
        if (!userProgress.cardIntervals || !userProgress.cardIntervals[word.id]) {
            return true;
        }
        
        // Слова для повторения
        const cardData = userProgress.cardIntervals[word.id];
        return now >= cardData.nextReview;
    });
}

function updateCardInterval(cardId, response) {
    if (!userProgress.cardIntervals) userProgress.cardIntervals = {};
    
    const intervals = {
        'again': 1 * 24 * 60 * 60 * 1000,    // 1 день
        'hard': 3 * 24 * 60 * 60 * 1000,     // 3 дня
        'easy': 7 * 24 * 60 * 60 * 1000      // 7 дней
    };
    
    userProgress.cardIntervals[cardId] = {
        nextReview: Date.now() + intervals[response],
        interval: intervals[response] / (24 * 60 * 60 * 1000)
    };
}

// Вспомогательные функции
function updateActiveNav(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItem = document.querySelector(`.nav-item[onclick*="${section}"]`);
    if (navItem) navItem.classList.add('active');
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
    // Глобальные обработчики событий
}

// Экспорт функций для HTML
window.showHomePage = showHomePage;
window.showLevelsPage = showLevelsPage;
window.showCardsPage = showCardsPage;
window.showGrammarPage = function() { alert("Раздел грамматики в разработке"); };
window.showTextsPage = function() { alert("Раздел текстов в разработке"); };
window.showTestsPage = function() { alert("Раздел тестов в разработке"); };
window.showWritingPage = function() { alert("Раздел прописей в разработке"); };
window.flipCard = flipCard;
window.speakWord = speakWord;
window.showWordCard = showWordCard;
window.startLevel = function(levelId) {
    userProgress.currentLevel = levelId;
    saveUserProgress();
    alert(`Начало уровня ${levelId}. Загрузка слов...`);
};
