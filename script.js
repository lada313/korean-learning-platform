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
let allGrammar = [];
let allTexts = [];
let currentCardIndex = 0;
let flashcards = [];

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
        const [wordsResponse, levelsResponse, grammarResponse, textsResponse] = await Promise.all([
            fetch('data/words.json'),
            fetch('data/levels.json'),
            fetch('data/grammar.json'),
            fetch('data/texts.json')
        ]);
        
        allWords = await wordsResponse.json();
        allLevels = await levelsResponse.json();
        allGrammar = await grammarResponse.json();
        allTexts = await textsResponse.json();
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
    document.getElementById('mainContent').innerHTML = `
        <div class="modules-grid">
            <a href="javascript:void(0)" onclick="showLevelsPage()" class="module-card">
                <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                <h2>Уровни</h2>
                <p>Пошаговое изучение от начального до продвинутого</p>
            </a>

            <a href="javascript:void(0)" onclick="showCardsPage()" class="module-card">
                <div class="card-icon cards"><i class="fas fa-flipbook"></i></div>
                <h2>Карточки</h2>
                <p>Запоминание слов с интервальным повторением</p>
            </a>

            <a href="javascript:void(0)" onclick="showGrammarPage()" class="module-card">
                <div class="card-icon grammar"><i class="fas fa-book-open"></i></div>
                <h2>Грамматика</h2>
                <p>Изучение правил и языковых конструкций</p>
            </a>

            <a href="javascript:void(0)" onclick="showTextsPage()" class="module-card">
                <div class="card-icon text"><i class="fas fa-align-left"></i></div>
                <h2>Текст и перевод</h2>
                <p>Чтение и анализ текстов с переводом</p>
            </a>
        </div>

        <div class="repetition-section">
            <h2>Повторение</h2>
            <p>Повторяйте изученный материал для закрепления знаний</p>
            <button class="card-btn" onclick="showCardsPage()">
                <i class="fas fa-redo"></i> Начать повторение
            </button>
        </div>
    `;
    updateActiveNav('home');
}

function showLevelsPage() {
    const levelsHtml = allLevels.map(level => `
        <div class="level-card" onclick="startLevel(${level.id})">
            <h3>${level.title}</h3>
            <p>${level.description}</p>
            <div class="level-progress">
                <div class="progress-bar" style="width: ${level.completed ? 100 : 0}%"></div>
            </div>
        </div>
    `).join('');

    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Уровни изучения</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="levels-container">
            ${levelsHtml}
        </div>
    `;
    updateActiveNav('levels');
}

function showCardsPage() {
    flashcards = allWords.filter(word => isDueForReview(word.id));
    currentCardIndex = 0;
    renderFlashcard();
    updateActiveNav('cards');
}

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
    
    const word = flashcards[currentCardIndex];
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

function nextCard(know) {
    if (know) {
        if (!userProgress.knownWords.includes(flashcards[currentCardIndex].id)) {
            userProgress.knownWords.push(flashcards[currentCardIndex].id);
            saveUserProgress();
        }
    }
    
    currentCardIndex++;
    if (currentCardIndex < flashcards.length) {
        renderFlashcard();
    } else {
        showCardsPage();
    }
}

function showGrammarPage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Грамматика корейского языка</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="grammar-container">
            ${allGrammar.map(grammar => `
                <div class="grammar-card">
                    <h3>${grammar.title}</h3>
                    <p>${grammar.description}</p>
                    <div class="grammar-examples">
                        ${grammar.examples.map(ex => `
                            <div class="example">
                                <div class="example-korean">${ex.korean}</div>
                                <div class="example-translation">${ex.translation}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    updateActiveNav('grammar');
}

function showTextsPage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Тексты для чтения</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="texts-container">
            ${allTexts.map(text => `
                <div class="text-card">
                    <h3>${text.title}</h3>
                    <div class="text-content">
                        <p class="korean-text">${text.content}</p>
                        <p class="translation">${text.translation}</p>
                    </div>
                    <button class="card-btn" onclick="speakText('${text.content}')">
                        <i class="fas fa-volume-up"></i> Озвучить текст
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    updateActiveNav('texts');
}

function showProgressPage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Ваш прогресс</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-value">${userProgress.knownWords.length}</div>
                <div class="stat-label">Изучено слов</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${userProgress.completedLevels.length}</div>
                <div class="stat-label">Пройдено уровней</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${userProgress.difficultWords.length}</div>
                <div class="stat-label">Сложных слов</div>
            </div>
        </div>
    `;
    updateActiveNav('progress');
}

function showProfilePage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Ваш профиль</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="profile-container">
            <div class="profile-card">
                <div class="profile-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h3>Ученик корейского</h3>
                <p>Текущий уровень: ${userProgress.currentLevel}</p>
            </div>
        </div>
    `;
    updateActiveNav('profile');
}

function showSettingsPage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Настройки</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="settings-container">
            <div class="setting-item">
                <label>Уведомления</label>
                <label class="switch">
                    <input type="checkbox" checked>
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="setting-item">
                <label>Автоозвучка</label>
                <label class="switch">
                    <input type="checkbox" checked>
                    <span class="slider round"></span>
                </label>
            </div>
            <button class="card-btn" onclick="resetProgress()">
                <i class="fas fa-trash"></i> Сбросить прогресс
            </button>
        </div>
    `;
    updateActiveNav('settings');
}

function startLevel(levelId) {
    const level = allLevels.find(l => l.id === levelId);
    if (!level) return;
    
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>${level.title}</h2>
            <div class="view-all" onclick="showLevelsPage()">Назад</div>
        </div>
        <div class="level-content">
            <p>${level.content}</p>
            <div class="level-words">
                ${level.words.map(wordId => {
                    const word = allWords.find(w => w.id === wordId);
                    return word ? `
                        <div class="word-preview-card" onclick="showWordCard(${word.id})">
                            <div class="word-preview-korean">${word.korean}</div>
                            <div class="word-preview-translation">${word.translation}</div>
                        </div>
                    ` : '';
                }).join('')}
            </div>
            <button class="card-btn" onclick="completeLevel(${level.id})">
                <i class="fas fa-check"></i> Завершить уровень
            </button>
        </div>
    `;
}

function completeLevel(levelId) {
    if (!userProgress.completedLevels.includes(levelId)) {
        userProgress.completedLevels.push(levelId);
        userProgress.currentLevel = Math.max(userProgress.currentLevel, levelId + 1);
        saveUserProgress();
    }
    showLevelsPage();
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

function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

function isDueForReview(wordId) {
    if (!userProgress.knownWords.includes(wordId)) return true;
    if (!userProgress.cardIntervals?.[wordId]) return true;
    return Date.now() >= userProgress.cardIntervals[wordId].nextReview;
}

function updateCardInterval(cardId, response) {
    const intervals = {
        'again': 1,
        'hard': 3,
        'easy': 7
    };
    
    if (!userProgress.cardIntervals) {
        userProgress.cardIntervals = {};
    }
    
    userProgress.cardIntervals[cardId] = {
        nextReview: Date.now() + intervals[response] * 86400000,
        interval: intervals[response]
    };
}

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

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

function resetProgress() {
    if (confirm("Вы уверены, что хотите сбросить весь прогресс?")) {
        localStorage.removeItem('koreanPlatformProgress');
        userProgress = {
            knownWords: [],
            difficultWords: [],
            completedLevels: [],
            currentLevel: 1,
            cardIntervals: {}
        };
        showHomePage();
    }
}

// Экспорт функций для HTML
window.showHomePage = showHomePage;
window.showLevelsPage = showLevelsPage;
window.showCardsPage = showCardsPage;
window.showGrammarPage = showGrammarPage;
window.showTextsPage = showTextsPage;
window.showProgressPage = showProgressPage;
window.showProfilePage = showProfilePage;
window.showSettingsPage = showSettingsPage;
window.showWordCard = showWordCard;
window.flipCard = flipCard;
window.nextCard = nextCard;
window.speakWord = speakWord;
window.speakText = speakText;
window.resetProgress = resetProgress;
