// ======================
// Глобальные переменные
// ======================
let userProgress = {
    knownWords: [],
    completedLevels: [],
    currentLevel: 1,
    overallProgress: 0
};

// ======================
// Инициализация приложения
// ======================
document.addEventListener('DOMContentLoaded', function() {
    loadUserProgress();
    showHomePage();
    setupEventListeners();
    
    // Проверяем поддержку SpeechSynthesis API
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = function() {
            console.log("Голоса загружены");
        };
    }
});

// ======================
// Загрузка и сохранение прогресса
// ======================
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
    // Обновляем прогресс в шапке
    const progressPercent = Math.floor((userProgress.knownWords.length / 3000) * 100);
    document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
    document.querySelector('.progress-info span:first-child').textContent = `${progressPercent}% завершено`;
    document.querySelector('.progress-info span:last-child').textContent = `Уровень ${userProgress.currentLevel}`;
}

// ======================
// Навигация по страницам
// ======================
function showHomePage() {
    fetch('data/levels.json')
        .then(response => response.json())
        .then(levels => {
            const mainContent = document.getElementById('mainContent');
            mainContent.innerHTML = `
                <div class="section-title">
                    <h2>Учебные модули</h2>
                </div>
                <div class="cards-grid">
                    <div class="card" onclick="showLevelsPage()">
                        <div class="card-icon levels">
                            <i class="fas fa-book"></i>
                        </div>
                        <h3>Уровни</h3>
                        <p>200 уровней по 15 слов + 2 грамматики</p>
                        <div class="badge primary">3000 слов</div>
                        <div class="progress-container-sm">
                            <div class="progress-bar-sm levels" style="width: ${userProgress.completedLevels.length / 2}%"></div>
                        </div>
                    </div>
                    
                    <div class="card" onclick="showCardsPage()">
                        <div class="card-icon cards">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <h3>Карточки</h3>
                        <p>Интервальное повторение слов</p>
                        <div class="progress-container-sm">
                            <div class="progress-bar-sm cards" style="width: ${userProgress.knownWords.length / 30}%"></div>
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
                        <p>Выбери правильный вариант</p>
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
                    <a href="#" class="view-all" onclick="showAllLevels()">Все уровни</a>
                </div>
                <div class="levels-container" id="levelsContainer">
                    ${generateLevelsPreview(levels)}
                </div>
                
                <button class="show-more" onclick="showMoreLevels()">
                    Показать больше уровней
                </button>
                
                <div class="section-title">
                    <h2>Повторение слов</h2>
                    <div class="daily-count">${getDueCardsCount()} слов</div>
                </div>
                <div class="daily-container">
                    <div class="daily-header">
                        <div class="daily-title">Повторение слов из изученных уровней</div>
                    </div>
                    <div class="word-list" id="dueWordsList">
                        ${generateDueWordsPreview()}
                    </div>
                </div>
            `;
            
            updateActiveNav('home');
        });
}

function generateLevelsPreview(levels) {
    return levels.slice(0, 10).map(level => `
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

function generateDueWordsPreview() {
    // В реальном приложении здесь должна быть логика получения слов для повторения
    const dueWords = [
        { korean: "가다", translation: "идти", level: 1 },
        { korean: "먹다", translation: "есть", level: 2 },
        { korean: "보다", translation: "видеть", level: 1 },
        { korean: "있다", translation: "иметься", level: 3 },
        { korean: "학교", translation: "школа", level: 4 },
        { korean: "친구", translation: "друг", level: 2 }
    ];
    
    return dueWords.map(word => `
        <div class="word-card" onclick="showWordDetail('${word.korean}')">
            <div class="word-korean">${word.korean}</div>
            <div class="word-translation">${word.translation}</div>
            <div class="word-level">Ур. ${word.level}</div>
        </div>
    `).join('');
}

function getDueCardsCount() {
    // Здесь должна быть логика подсчета слов для повторения
    return 20; // Временное значение
}

// ======================
// Страницы приложения
// ======================
function showLevelsPage() {
    fetch('data/levels.json')
        .then(response => response.json())
        .then(levels => {
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Все уровни</h2>
                    <div class="view-all" onclick="showHomePage()">На главную</div>
                </div>
                <div class="levels-container">
                    ${levels.map(level => `
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
                    `).join('')}
                </div>
            `;
            updateActiveNav('study');
        });
}

function showCardsPage() {
    fetch('data/words.json')
        .then(response => response.json())
        .then(words => {
            const dueWords = words.filter(word => 
                userProgress.knownWords.includes(word.id) && 
                isDueForReview(word.id)
            );
            
            document.getElementById('mainContent').innerHTML = `
                <div class="section-title">
                    <h2>Карточки для повторения</h2>
                    <div class="view-all" onclick="showHomePage()">На главную</div>
                </div>
                
                <div id="flashcardContainer">
                    ${dueWords.length > 0 ? `
                        <div class="word-card" id="currentFlashcard" onclick="flipCard()">
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
                            <button class="card-btn" onclick="handleCardResponse('again')">
                                <i class="fas fa-redo"></i> Снова
                            </button>
                            <button class="card-btn" onclick="handleCardResponse('hard')">
                                <i class="fas fa-hourglass-half"></i> Трудно
                            </button>
                            <button class="card-btn" onclick="handleCardResponse('easy')">
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
        });
}

// ======================
// Работа с карточками
// ======================
let currentCardIndex = 0;
let flashcards = [];

function flipCard() {
    document.getElementById('currentFlashcard').classList.toggle('flipped');
}

function handleCardResponse(response) {
    const cardId = flashcards[currentCardIndex].id;
    
    // Обновляем интервал повторения в зависимости от ответа
    updateCardInterval(cardId, response);
    
    // Переходим к следующей карточке
    currentCardIndex++;
    if (currentCardIndex < flashcards.length) {
        renderNextCard();
    } else {
        // Все карточки пройдены
        document.getElementById('flashcardContainer').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>Повторение завершено!</h3>
                <p>Вы повторили все карточки на сегодня.</p>
                <button class="card-btn" onclick="showHomePage()">
                    На главную
                </button>
            </div>
        `;
    }
    
    saveUserProgress();
}

function updateCardInterval(cardId, response) {
    // Здесь должна быть логика интервального повторения (Anki-like алгоритм)
    if (!userProgress.cardIntervals) userProgress.cardIntervals = {};
    
    const intervals = {
        'again': 1,    // 1 день
        'hard': 3,     // 3 дня
        'easy': 7      // 7 дней
    };
    
    userProgress.cardIntervals[cardId] = {
        nextReview: Date.now() + intervals[response] * 24 * 60 * 60 * 1000,
        interval: intervals[response]
    };
}

function isDueForReview(cardId) {
    if (!userProgress.cardIntervals || !userProgress.cardIntervals[cardId]) {
        return true;
    }
    return Date.now() >= userProgress.cardIntervals[cardId].nextReview;
}

// ======================
// Вспомогательные функции
// ======================
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
    // Здесь можно добавить обработчики глобальных событий
}

// ======================
// Экспорт функций для HTML
// ======================
window.showHomePage = showHomePage;
window.showLevelsPage = showLevelsPage;
window.showCardsPage = showCardsPage;
window.showGrammarPage = function() { alert("Раздел грамматики в разработке"); };
window.showTextsPage = function() { alert("Раздел текстов в разработке"); };
window.showTestsPage = function() { alert("Раздел тестов в разработке"); };
window.showWritingPage = function() { alert("Раздел прописей в разработке"); };
window.showAllLevels = showLevelsPage;
window.showMoreLevels = function() { alert("Загрузка дополнительных уровней..."); };
window.flipCard = flipCard;
window.speakWord = speakWord;
window.startLevel = function(levelId) { alert(`Запуск уровня ${levelId}`); };
window.showWordDetail = function(word) { alert(`Детали слова: ${word}`); };
