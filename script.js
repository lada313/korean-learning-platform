
    // Глобальные переменные
    let words = [];
    let levels = [];
    let currentCardIndex = 0;
    let isCardFlipped = false;

    // Инициализация приложения
    document.addEventListener('DOMContentLoaded', function() {
      loadWords();
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

    // Загрузка слов из localStorage
    function loadWords() {
      try {
        const savedWords = localStorage.getItem('koreanWords');
        words = savedWords ? JSON.parse(savedWords) : [];
        if (!Array.isArray(words)) words = [];
      } catch (e) {
        console.error('Ошибка загрузки слов:', e);
        words = [];
      }
    }

    // ==================== СИСТЕМА КАРТОЧЕК ====================
    function initCards() {
      const cardContent = document.getElementById('card-content');
      const prevBtn = document.getElementById('prev-card');
      const nextBtn = document.getElementById('next-card');
      const counter = document.getElementById('card-counter');

      function updateCard() {
        if (!words.length) {
          cardContent.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-book-open"></i>
              <p>Добавьте слова в словаре</p>
            </div>
          `;
          counter.textContent = "0/0";
          return;
        }

        const word = words[currentCardIndex];
        cardContent.innerHTML = `
          <div class="card-front">${escapeHtml(word.korean)}</div>
          <div class="card-back">
            <div>${escapeHtml(word.russian)}</div>
            ${word.example ? `<div class="example">Пример: ${escapeHtml(word.example)}</div>` : ''}
          </div>
        `;
        counter.textContent = `${currentCardIndex + 1}/${words.length}`;
        isCardFlipped = false;
        cardContent.style.transform = 'rotateY(0)';
      }

      // Переворот карточки
      cardContent.addEventListener('click', () => {
        if (!words.length) return;
        isCardFlipped = !isCardFlipped;
        cardContent.style.transform = isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0)';
      });

      // Навигация
      prevBtn.addEventListener('click', () => {
        if (words.length) {
          currentCardIndex = (currentCardIndex - 1 + words.length) % words.length;
          updateCard();
        }
      });

      nextBtn.addEventListener('click', () => {
        if (words.length) {
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
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? nextBtn.click() : prevBtn.click();
        }
      }, { passive: true });

      // Горячие клавиши
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevBtn.click();
        if (e.key === 'ArrowRight') nextBtn.click();
        if (e.key === ' ') cardContent.click();
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
        const filteredWords = filter ? words.filter(word => 
          word.korean.toLowerCase().includes(filter.toLowerCase()) || 
          word.russian.toLowerCase().includes(filter.toLowerCase())
        ) : words;

        wordsList.innerHTML = filteredWords.length ? 
          filteredWords.map((word, index) => `
            <div class="word-item">
              <div class="word-header">
                <div>
                  <div class="word-korean">${escapeHtml(word.korean)}</div>
                  <div class="word-translation">${escapeHtml(word.russian)}</div>
                </div>
                <button class="delete-word" data-index="${index}">×</button>
              </div>
              ${word.example ? `<div class="word-example">${escapeHtml(word.example)}</div>` : ''}
            </div>
          `).join('') : `
          <div class="empty-message">
            <i class="fas fa-search"></i>
            <p>Совпадений не найдено</p>
          </div>
        `;

        // Обработчики удаления
        document.querySelectorAll('.delete-word').forEach(btn => {
          btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            if (confirm('Удалить это слово?')) {
              words.splice(index, 1);
              saveWords();
              renderWords(searchInput.value);
              updateCardsAndLevels();
            }
          });
        });
      }

      // Поиск с debounce
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => renderWords(e.target.value), 300);
      });

      // Форма добавления
      addBtn.addEventListener('click', () => addForm.classList.remove('hidden'));
      cancelBtn.addEventListener('click', () => {
        addForm.classList.add('hidden');
        document.getElementById('new-korean-word').value = '';
        document.getElementById('new-russian-word').value = '';
        document.getElementById('new-word-example').value = '';
      });

      saveBtn.addEventListener('click', () => {
        const korean = document.getElementById('new-korean-word').value.trim();
        const russian = document.getElementById('new-russian-word').value.trim();
        const example = document.getElementById('new-word-example').value.trim();

        if (korean && russian) {
          words.push({ korean, russian, ...(example && { example }) });
          saveWords();
          
          // Сброс формы
          document.getElementById('new-korean-word').value = '';
          document.getElementById('new-russian-word').value = '';
          document.getElementById('new-word-example').value = '';
          addForm.classList.add('hidden');
          
          // Обновление интерфейса
          renderWords(searchInput.value);
          updateCardsAndLevels();
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

      // Создание уровней
      const totalLevels = Math.max(1, Math.ceil(words.length / 10));
      levels = Array.from({ length: totalLevels }, (_, i) => ({
        id: i + 1,
        name: `Уровень ${i + 1}`,
        words: words.slice(i * 10, (i + 1) * 10),
        passed: localStorage.getItem(`level_${i+1}_passed`) === 'true',
        locked: i > 0 && localStorage.getItem(`level_${i}_passed`) !== 'true'
      }));

      // Отрисовка
      function renderLevels() {
        levelsGrid.innerHTML = levels.map(level => `
          <div class="level-card ${level.passed ? 'passed' : ''} ${level.locked ? 'locked' : ''}" 
               data-level="${level.id}">
            <h3>${level.name}</h3>
            <p>Слов: ${level.words.length}/10</p>
            ${level.passed ? '<div class="level-badge">✓</div>' : ''}
          </div>
        `).join('');

        completedEl.textContent = levels.filter(l => l.passed).length;
        totalEl.textContent = levels.length;

        // Обработчики кликов по уровням
        document.querySelectorAll('.level-card:not(.locked)').forEach(card => {
          card.addEventListener('click', function() {
            const levelId = parseInt(this.dataset.level);
            startLevel(levelId);
          });
        });
      }

      function startLevel(levelId) {
        const level = levels.find(l => l.id === levelId);
        if (!level) return;
        
        // Здесь можно добавить логику начала уровня
        alert(`Начало уровня ${levelId} с ${level.words.length} словами`);
        
        // После прохождения уровня:
        // level.passed = true;
        // localStorage.setItem(`level_${levelId}_passed`, 'true');
        // saveWords();
        // renderLevels();
      }

      renderLevels();
    }

    // ==================== ОБЩИЕ ФУНКЦИИ ====================
    function saveWords() {
      try {
        localStorage.setItem('koreanWords', JSON.stringify(words));
      } catch (e) {
        console.error('Ошибка сохранения слов:', e);
      }
    }

    function updateCardsAndLevels() {
      initCards();
      initLevels();
    }

    function initNavigation() {
      const setActivePage = (pageId) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        document.getElementById(pageId)?.classList.add('active');
        document.querySelector(`.nav-link[href="#${pageId}"]`)?.classList.add('active');
      };

      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const pageId = this.getAttribute('href').substring(1);
          setActivePage(pageId);
          window.location.hash = pageId;
        });
      });
      
      // Инициализация по hash
      setActivePage(window.location.hash.substring(1) || 'cards');
    }

    // Экранирование HTML для безопасности
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  
