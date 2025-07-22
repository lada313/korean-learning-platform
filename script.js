// ==================== СИСТЕМА КАРТОЧЕК ====================
function initCards() {
  // Загрузка данных
  const cardsData = loadWords();
  let currentCardIndex = 0;
  let isFlipped = false;
  let resetFlip = null;

  // Элементы DOM
  const cardContent = document.getElementById('card-content');
  const cardCounter = document.getElementById('card-counter');
  const prevBtn = document.getElementById('prev-card');
  const nextBtn = document.getElementById('next-card');
  const cardContainer = document.getElementById('main-card');

  // Показ текущей карточки
  function showCard(index) {
    // Проверка пустого словаря
    if (cardsData.length === 0) {
      cardContent.innerHTML = `
        <div class="empty-state">
          <p>Словарь пуст</p>
          <button onclick="location.hash='#dictionary'">Добавить слова</button>
        </div>
      `;
      cardCounter.textContent = "0/0";
      return;
    }

    // Корректировка индекса
    index = (index + cardsData.length) % cardsData.length;
    currentCardIndex = index;
    const card = cardsData[index];

    // Обновление контента
    cardContent.innerHTML = `
      <div class="card-front">${card.korean}</div>
      <div class="card-back">
        <p>${card.russian}</p>
        ${card.example ? `<div class="example"><em>Пример:</em> ${card.example}</div>` : ''}
      </div>
    `;
    cardCounter.textContent = `${index + 1}/${cardsData.length}`;

    // Сброс состояния переворота
    if (resetFlip) resetFlip();
    resetFlip = initCardFlip();
  }

  // Инициализация переворота карточки
  function initCardFlip() {
    let flipped = false;
    const front = cardContent.querySelector('.card-front');
    const back = cardContent.querySelector('.card-back');

    function flip() {
      flipped = !flipped;
      cardContent.style.transform = flipped ? 'rotateY(180deg)' : 'rotateY(0)';
      front.style.visibility = flipped ? 'hidden' : 'visible';
      back.style.visibility = flipped ? 'visible' : 'hidden';
    }

    // Обработчики для разных устройств
    cardContent.onclick = flip;
    cardContent.ontouchend = flip;

    // Функция сброса
    return () => {
      if (flipped) {
        cardContent.style.transform = 'rotateY(0)';
        front.style.visibility = 'visible';
        back.style.visibility = 'hidden';
        flipped = false;
      }
    };
  }

  // Навигация
  function goToCard(offset) {
    const newIndex = currentCardIndex + offset;
    if (newIndex >= 0 && newIndex < cardsData.length) {
      showCard(newIndex);
    }
    return newIndex;
  }

  prevBtn.addEventListener('click', () => goToCard(-1));
  nextBtn.addEventListener('click', () => goToCard(1));

  // Обработка свайпов
  let touchStartX = 0;
  let touchStartTime = 0;

  cardContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
  }, { passive: true });

  cardContainer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndTime = Date.now();
    handleSwipe(touchStartX, touchEndX, touchEndTime - touchStartTime);
  }, { passive: true });

  function handleSwipe(startX, endX, duration) {
    const deltaX = endX - startX;
    const absDeltaX = Math.abs(deltaX);
    const isFastSwipe = duration < 300 && absDeltaX > 50;
    const isLongSwipe = absDeltaX > 100;

    if (isFastSwipe || isLongSwipe) {
      if (deltaX > 0) {
        // Свайп вправо - предыдущая карточка
        goToCard(-1);
      } else {
        // Свайп влево - следующая карточка
        goToCard(1);
      }
    }
  }

  // Горячие клавиши
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goToCard(-1);
    if (e.key === 'ArrowRight') goToCard(1);
    if (e.key === ' ') cardContent.click(); // Пробел для переворота
  });

  // Инициализация
  showCard(0);

  // Экспорт функций для отладки
  window.debugCards = {
    goToCard,
    currentIndex: () => currentCardIndex,
    cardsCount: () => cardsData.length
  };
}
