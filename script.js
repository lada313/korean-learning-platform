// Глобальные переменные
let words = [];
let levels = [];
let currentCardIndex = 0;
let isCardFlipped = false;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  initNavigation();
  initCards();
  initDictionary();
  initLevels();
  
  // Инициализация Service Worker для PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker зарегистрирован'))
      .catch(err => console.error('Ошибка Service Worker:', err));
  }
});

// ==================== СИСТЕМА КАРТОЧЕК ====================
function initCards() {
  const cardContent = document.getElementById('card-content');
  const prevBtn = document.getElementById('prev-card');
  const nextBtn = document.getElementById('next-card');
  const counter = document.getElementById('card-counter');

  function updateCard() {
    if (words.length === 0) {
      cardContent.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-book-open" style="font-size: 2rem; color: var(--primary); margin-bottom: 10px;"></i>
          <p>Добавьте слова в словаре</p>
        </div>
      `;
      counter.textContent = "0/0";
      return;
    }

    const word = words[currentCardIndex];
    cardContent.innerHTML = `
      <div class="card-front">${word.korean}</div>
      <div class="card-back">
        <div>${word.russian}</div>
        ${word.example ? `<div class="example">Пример: ${word.example}</div>` : ''}
      </div>
    `;
    counter.textContent = `${currentCardIndex + 1}/${words.length}`;
    isCardFlipped = false;
    cardContent.style.transform = 'rotateY(0)';
  }

  // Переворот карточки
  cardContent.addEventListener('click', () => {
    isCardFlipped = !isCardFlipped;
    cardContent.style.transform = isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0)';
  });

  // Навигация
  prevBtn.addEventListener('click', () => {
    if (words.length > 0) {
      currentCardIndex = (currentCardIndex - 1 + words.length) % words.length;
      updateCard();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (words.length > 0) {
      currentCardIndex = (currentCardIndex + 1) % words.length;
      updateCard();
    }
  });

  // Свайпы для мобильных
  let touchStartX = 0;

  cardContent.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  cardContent.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextBtn.click();
      else prevBtn.click();
    }
  }, { passive: true });

  // Горячие клавиши
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
    if (e.key === ' ') cardContent.click(); // Пробел для переворота
  });

  updateCard();
}

// ==================== СЛОВАРЬ ====================
function initDictionary() {
  const addBtn = document.getElementById('add-word-btn');
  const saveBtn = document.getElementById('save-word');
  const cancelBtn = document.getElementById('cancel-add-word');
  const addForm = document.getElementById('add-word-form');
  const wordsList = document.getElementById('words-list');
  const searchInput = document.getElementById('word-search');

  function renderWords(filter = '') {
    const filteredWords = filter 
      ? words.filter(word => 
          word.korean.toLowerCase().includes(filter.toLowerCase()) || 
          word.russian.toLowerCase().includes(filter.toLowerCase()))
      : words;

    if (filteredWords.length === 0) {
      wordsList.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-search" style="font-size: 2rem; color: var(--text-light); margin-bottom: 10px;"></i>
          <p>Совпадений не найдено</p>
        </div>
      `;
      return;
    }

    wordsList.innerHTML = filteredWords.map((word, index) => `
      <div class="word-item">
        <div class="word-header">
          <div>
            <div class="word-korean">${word.korean}</div>
            <div class="word-translation">${word.russian}</div>
          </div>
          <button class="delete-word" data-index="${index}">×</button>
        </div>
        ${word.example ? `<div class="word-example">${word.example}</div>` : ''}
      </div>
    `).join('');

    // Обработчики удаления
    document.querySelectorAll('.delete-word').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        if (confirm('Удалить это слово?')) {
          words.splice(index, 1);
          saveWords();
          renderWords(searchInput.value);
          initCards();
          initLevels();
        }
      });
    });
  }

  // Поиск
  searchInput.addEventListener('input', (e) => {
    renderWords(e.target.value);
  });

  // Форма добавления
  addBtn.addEventListener('click', () => {
    addForm.classList.remove('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    addForm.classList.add('hidden');
  });

  saveBtn.addEventListener('click', () => {
    const korean = document.getElementById('new-korean-word').value.trim();
    const russian = document.getElementById('new-russian-word').value.trim();
    const example = document.getElementById('new-word-example').value.trim();

    if (korean && russian) {
      const newWord = { korean, russian };
      if (example) newWord.example = example;
      
      words.push(newWord);
      saveWords();
      
      // Сброс формы
      document.getElementById('new-korean-word').value = '';
      document.getElementById('new-russian-word').value = '';
      document.getElementById('new-word-example').value = '';
      addForm.classList.add('hidden');
      
      // Обновление интерфейса
      renderWords(searchInput.value);
      initCards();
      initLevels();
    } else {
      alert('Заполните обязательные поля (слово и перевод)');
    }
  });

  renderWords();
}

// ==================== УРОВНИ ====================
function initLevels() {
  const levelsGrid = document.getElementById('levels-grid');
  const completedEl = document.getElementById('levels-completed');
  const totalEl = document.getElementById('levels-total');

  // Создание уровней (по 10 слов)
  const totalLevels = Math.max(1, Math.ceil(words.length / 10));
  levels = Array.from({ length: totalLevels }, (_, i) => ({
    id: i + 1,
    name: `Уровень ${i + 1}`,
    words: words.slice(i * 10, (i + 1) * 10),
    passed: false,
    locked: i > 0
  }));

  // Отрисовка
  function renderLevels() {
    levelsGrid.innerHTML = levels.map(level => `
      <div class="level-card ${level.passed ? 'passed' : ''} ${level.locked ? 'locked' : ''}">
        <h3>${level.name}</h3>
        <p>Слов: ${level.words.length}/10</p>
        ${level.passed ? '<div class="level-badge">✓</div>' : ''}
      </div>
    `).join('');

    completedEl.textContent = levels.filter(l => l.passed).length;
    totalEl.textContent = levels.length;
  }

  renderLevels();
}

// ==================== ОБЩИЕ ФУНКЦИИ ====================
function loadData() {
  words = JSON.parse(localStorage.getItem('koreanWords')) || [];
}

function saveWords() {
  localStorage.setItem('koreanWords', JSON.stringify(words));
}

function initNavigation() {
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function setActivePage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        
        document.getElementById(pageId).classList.add('active');
        document.querySelector(`.nav-link[href="#${pageId}"]`).classList.add('active');
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('href').substring(1);
            setActivePage(pageId);
            window.location.hash = pageId;
        });
    });
    
    // Инициализация по hash
    const initialPage = window.location.hash.substring(1) || 'cards';
    setActivePage(initialPage);
}
