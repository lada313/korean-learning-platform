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
    const wordsForReview = getDueWords().slice(0, 6);
    
    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Учебные модули</h2>
        </div>
        <div class="cards-grid">
            <div class="card" onclick="showDictionaryPage()">
                <div class="card-icon cards">
                    <i class="fas fa-book"></i>
                </div>
                <h3>Словарь</h3>
                <p>Все слова для изучения</p>
            </div>
            
            <div class="card" onclick="showLevelsPage()">
                <div class="card-icon levels">
                    <i class="fas fa-layer-group"></i>
                </div>
                <h3>Уровни</h3>
                <p>Постепенное изучение</p>
            </div>
        </div>
        
        <div class="section-title">
            <h2>Повторение слов</h2>
            <div class="daily-count">${wordsForReview.length} слов</div>
        </div>
        <div class="daily-container">
            <div class="word-list">
                ${wordsForReview.length > 0 ? 
                    wordsForReview.map(word => `
                        <div class="word-preview-card" onclick="speakWord(null, '${word.korean}')">
                            <div class="word-preview-korean">${word.korean}</div>
                            <div class="word-preview-translation">${word.translation}</div>
                            <button class="speak-btn" onclick="speakWord(event, '${word.korean}')">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                    `).join('') : 
                    '<p class="empty-message">Нет слов для повторения</p>'
                }
            </div>
        </div>
    `;
    
    updateActiveNav('home');
}

// Словарь слов
function showDictionaryPage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="dictionary-container">
            <div class="search-box">
                <input type="text" id="wordSearch" placeholder="Поиск по корейскому или русскому..." oninput="filterWords()">
                <i class="fas fa-search"></i>
            </div>
            <div class="word-list" id="dictionaryList">
                ${generateWordList(allWords)}
            </div>
        </div>
    `;
    updateActiveNav('study');
}

function generateWordList(words) {
    return words.map(word => `
        <div class="word-item">
            <div class="word-content">
                <span class="word-korean">${word.korean}</span>
                <span class="word-translation">${word.translation}</span>
                ${word.romanization ? `<span class="word-romanization">${word.romanization}</span>` : ''}
            </div>
            <button class="speak-btn" onclick="speakWord(event, '${word.korean}')">
                <i class="fas fa-volume-up"></i>
            </button>
        </div>
    `).join('');
}

function filterWords() {
    const searchTerm = document.getElementById('wordSearch').value.toLowerCase();
    const filteredWords = allWords.filter(word => 
        word.korean.toLowerCase().includes(searchTerm) || 
        word.translation.toLowerCase().includes(searchTerm) ||
        (word.romanization && word.romanization.toLowerCase().includes(searchTerm))
    );
    
    document.getElementById('dictionaryList').innerHTML = generateWordList(filteredWords);
}

// Работа с карточками
function getDueWords() {
    const now = Date.now();
    return allWords.filter(word => {
        if (!userProgress.cardIntervals?.[word.id]) return true;
        return now >= userProgress.cardIntervals[word.id].nextReview;
    });
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
function showProgressPage() { alert("Раздел прогресса в разработке"); }

// Экспорт функций для HTML
window.showHomePage = showHomePage;
window.showDictionaryPage = showDictionaryPage;
window.filterWords = filterWords;
window.speakWord = speakWord;
