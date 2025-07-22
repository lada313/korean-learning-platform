// Глобальные переменные
let userProgress = {
    knownWords: [],
    difficultWords: [],
    completedLevels: [],
    currentLevel: 1,
    cardIntervals: {}
};

let allWords = [];
let allLevels = [];
let currentCardIndex = 0;
let flashcards = [];
let currentFlashcardIndex = 0;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadUserProgress();
    loadData().then(() => {
        showHomePage();
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
    localStorage.setItem('koreanPlatformProgress', JSON.stringify(userProgress));
    updateProgressUI();
}

function updateProgressUI() {
    const progressPercent = allWords.length > 0 
        ? Math.floor((userProgress.knownWords.length / allWords.length) * 100)
        : 0;
    
    if (document.querySelector('.progress-bar')) {
        document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
        document.querySelector('.progress-info span:first-child').textContent = `${progressPercent}% завершено`;
        document.querySelector('.progress-info span:last-child').textContent = `Уровень ${userProgress.currentLevel}`;
    }
}

// Навигация
function showHomePage() {
    fetch('data/words.json')
        .then(response => response.json())
        .then(words => {
            const reviewWords = words.filter(word => 
                userProgress.knownWords.includes(word.id) && 
                isDueForReview(word.id)
            ).slice(0, 6);
            
            document.getElementById('mainContent').innerHTML = `
                <!-- Остальной HTML код -->
                <div class="section-title">
                    <h2>Повторение слов</h2>
                    <div class="daily-count">${reviewWords.length} слов</div>
                </div>
                <div class="daily-container">
                    <div class="word-list">
                        ${reviewWords.length > 0 ? 
                            reviewWords.map(word => `
                                <div class="word-preview-card" onclick="showWordCard(${word.id})">
                                    <div class="word-preview-korean">${word.korean}</div>
                                    <div class="word-preview-translation">${word.translation}</div>
                                </div>
                            `).join('') : 
                            '<p class="empty-message">Нет слов для повторения</p>'
                        }
                    </div>
                </div>
            `;
            
            updateActiveNav('home');
        });
}
function isDueForReview(wordId) {
    // Если слово еще не изучено - показываем его
    if (!userProgress.knownWords.includes(wordId)) return true;
    
    // Если нет данных о повторении - показываем
    if (!userProgress.cardIntervals?.[wordId]) return true;
    
    // Проверяем, пришло ли время повторения
    return Date.now() >= userProgress.cardIntervals[wordId].nextReview;
}
function showCardsPage() {
    fetch('data/words.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(words => {
            // Сначала показываем все слова, которые нужно повторить
            flashcards = words.filter(word => 
                isDueForReview(word.id)
            );
            
            // Если нет слов для повторения, берем новые слова
            if (flashcards.length === 0) {
                flashcards = words.filter(word => 
                    !userProgress.knownWords.includes(word.id)
                ).slice(0, 5);
                
                if (flashcards.length === 0) {
                    flashcards = words.slice(0, 5);
                }
            }
            
            currentFlashcardIndex = 0;
            renderFlashcard();
            updateActiveNav('study');
        })
        .catch(error => {
            console.error('Error loading words:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Ошибка загрузки данных</h3>
                    <button class="card-btn" onclick="showHomePage()">На главную</button>
                </div>
            `;
        });
}

// Новая функция renderFlashcard()
function renderFlashcard() {
    if (flashcards.length === 0) {
        document.getElementById('mainContent').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>Нет слов для повторения</h3>
                <button class="card-btn" onclick="showHomePage()">На главную</button>
            </div>
        `;
        return;
    }
    
    const word = flashcards[currentFlashcardIndex];
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Карточки для повторения</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        
        <div class="word-card" onclick="flipCard(this)">
            <div class="card-inner">
                <div class="card-front">
                    <div class="word-korean">${word.korean}</div>
                    <div class="word-romanization">${word.romanization}</div>
                    <button class="speak-btn" onclick="speakWord(event, '${word.korean}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <div class="card-back">
                    <div class="word-translation">${word.translation}</div>
                    ${word.examples?.map(ex => `
                        <div class="example-container">
                            <div class="example-korean">${ex.korean}</div>
                            <button class="speak-example-btn" onclick="speakWord(event, '${ex.korean}')">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                    `).join('') || ''}
                </div>
            </div>
        </div>
        
        <div class="card-controls">
            <button class="card-btn" onclick="nextCard(false)">
                <i class="fas fa-redo"></i> Снова
            </button>
            <button class="card-btn" onclick="nextCard(true); speakWord(null, '${word.korean}')">
                <i class="fas fa-check-circle"></i> Знаю
            </button>
        </div>
    `;
}

/ Обновленная функция nextCard()
function nextCard(know) {
    if (know) {
        if (!userProgress.knownWords.includes(flashcards[currentFlashcardIndex].id)) {
            userProgress.knownWords.push(flashcards[currentFlashcardIndex].id);
            saveUserProgress();
        }
    }
    
    currentFlashcardIndex++;
    if (currentFlashcardIndex < flashcards.length) {
        renderFlashcard();
    } else {
        showCardsPage(); // Возвращаем к началу если карточки закончились
    }
}

function showWordCard(wordId) {
    const word = allWords.find(w => w.id === wordId);
    if (!word) return;
    
    document.getElementById('mainContent').innerHTML = `
        <div class="word-card" onclick="flipCard(this)">
            <div class="card-inner">
                <div class="card-front">
                    <div class="word-korean">${word.korean}</div>
                    <div class="word-romanization">${word.romanization}</div>
                    <button class="speak-btn" onclick="speakWord(event, '${word.korean}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <div class="card-back">
                    <div class="word-translation">${word.translation}</div>
                    ${word.examples.map(ex => `
                        <div class="example-container">
                            <div class="example-korean">${ex.korean}</div>
                            <button class="speak-example-btn" onclick="speakWord(event, '${ex.korean}')">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="card-controls">
            <button class="card-btn" onclick="showHomePage()">
                <i class="fas fa-arrow-left"></i> Назад
            </button>
        </div>
    `;
}

// Работа с карточками
function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
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
    event?.stopPropagation();
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        window.speechSynthesis.speak(utterance);
    }
}

// Заглушки для остальных функций
function showLevelsPage() { alert("Раздел уровней в разработке"); }
function showGrammarPage() { alert("Раздел грамматики в разработке"); }
function showTextsPage() { alert("Раздел текстов в разработке"); }
function showProgressPage() { alert("Раздел прогресса в разработке"); }
function showSettingsPage() { alert("Раздел настроек в разработке"); }

// Экспорт функций для HTML
window.showHomePage = showHomePage;
window.showCardsPage = showCardsPage;
window.showWordCard = showWordCard;
window.flipCard = flipCard;
window.nextCard = nextCard;
window.speakWord = speakWord;

