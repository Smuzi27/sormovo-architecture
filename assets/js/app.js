const App = {
  tg: null,
  user: null,
  expandedCategories: new Set(),

  async init() {
    this.tg = window.Telegram?.WebApp;
    if (this.tg) {
      this.tg.ready();
      this.tg.expand();
      this.user = this.tg.initDataUnsafe?.user;
    }

    this.loadTheme();
    Gamification.init();
    await Route.load();
    OfflineManager.init();
    Quiz.init();
    Navigation.init();

    this.bindEvents();
    this.updateStats();
    this.updateProfile();
    this.updateAchievements();
    this.renderCategories();

    if (this.user) {
      this.updateUserInfo();
    }
  },

  loadTheme() {
    const savedTheme = localStorage.getItem('app_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcons(savedTheme);
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app_theme', newTheme);
    this.updateThemeIcons(newTheme);
  },

  updateThemeIcons(theme) {
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');
    if (lightIcon && darkIcon) {
      lightIcon.style.display = theme === 'light' ? 'block' : 'none';
      darkIcon.style.display = theme === 'dark' ? 'block' : 'none';
    }
  },

  bindEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        this.showScreen(screen);
      });
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
      this.showScreen('list-section');
    });

    document.getElementById('profile-back-btn')?.addEventListener('click', () => {
      this.showScreen('list-section');
    });

    document.getElementById('checkin-btn')?.addEventListener('click', () => {
      this.checkIn();
    });

    document.getElementById('share-btn')?.addEventListener('click', () => {
      Gamification.share();
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите сбросить весь прогресс?')) {
        Gamification.reset();
        this.updateStats();
        this.updateProfile();
        this.updateAchievements();
        this.renderCategories();
      }
    });

    document.getElementById('completion-share-btn')?.addEventListener('click', () => {
      Gamification.share();
    });

    document.getElementById('completion-back-btn')?.addEventListener('click', () => {
      this.showScreen('list-section');
    });

    document.getElementById('fab-nav')?.addEventListener('click', () => {
      Navigation.handleNavigationClick();
    });

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    document.getElementById(screenId)?.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === screenId);
    });

    if (screenId === 'profile-section') {
      this.updateProfile();
      this.updateAchievements();
    }
  },

  renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    const categories = Route.getCategories();

    container.innerHTML = categories.map(category => {
      const progress = Route.getCategoryProgress(category.id);
      const isComplete = progress.visited === progress.total && progress.total > 0;
      const isExpanded = this.expandedCategories.has(category.id);
      const progressPercent = progress.total > 0 ? (progress.visited / progress.total) * 100 : 0;

      return `
        <div class="category ${isExpanded ? 'expanded' : ''} ${category.id}" data-category="${category.id}">
          <div class="category-header" onclick="App.toggleCategory('${category.id}')">
            <div class="category-info">
              <div class="category-icon">
                <i data-lucide="${category.icon}"></i>
              </div>
              <span class="category-name">${category.name}</span>
            </div>
            <div class="category-progress-wrapper">
              <span class="category-progress ${isComplete ? 'complete' : ''}">${progress.visited}/${progress.total}</span>
              <div class="category-progress-bar">
                <div class="category-progress-fill" style="width: ${progressPercent}%"></div>
              </div>
            </div>
            <div class="category-arrow">
              <i data-lucide="chevron-down"></i>
            </div>
          </div>
          <div class="category-content">
            ${category.points.map(point => this.renderPointItem(point, category.id)).join('')}
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  },

  renderPointItem(point, categoryId) {
    const isVisited = Gamification.isPointVisited(point.id);
    return `
      <div class="point-item ${isVisited ? 'visited' : ''}" onclick="App.showPointDetail(Route.getPoint(${point.id}))">
        <div class="point-status ${isVisited ? 'visited' : 'pending'}">
          <i data-lucide="${isVisited ? 'check-circle' : 'circle'}"></i>
        </div>
        <div class="point-details">
          <div class="point-item-name">${point.name}</div>
          <div class="point-item-meta">${point.address}</div>
        </div>
        <div class="point-item-year">${point.year}</div>
      </div>
    `;
  },

  toggleCategory(categoryId) {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }

    const categoryEl = document.querySelector(`[data-category="${categoryId}"]`);
    if (categoryEl) {
      categoryEl.classList.toggle('expanded', this.expandedCategories.has(categoryId));
    }
  },

  showPointDetail(point) {
    if (!point) return;

    Route.currentPoint = point;

    const imgEl = document.getElementById('point-image');
    if (point.image) {
      imgEl.src = point.image;
      imgEl.style.display = 'block';
    } else {
      imgEl.src = '';
      imgEl.style.display = 'none';
    }

    document.getElementById('point-name').textContent = point.name;
    document.getElementById('point-address').textContent = point.address;
    document.getElementById('point-year').textContent = point.year;
    document.getElementById('point-era').textContent = point.era;
    document.getElementById('point-style').textContent = point.style;
    document.getElementById('point-architect').innerHTML = `<i data-lucide="pencil-ruler"></i> ${point.architect}`;
    document.getElementById('point-description').textContent = point.description;

    const quizBtn = document.getElementById('quiz-btn');
    if (Gamification.isQuizCompleted(point.id)) {
      quizBtn.innerHTML = '<i data-lucide="check-circle"></i> Квиз пройден';
      quizBtn.disabled = true;
      quizBtn.className = 'btn btn-tonal';
    } else {
      quizBtn.innerHTML = '<i data-lucide="brain"></i> Пройти квиз <span class="points-badge">+10</span>';
      quizBtn.disabled = false;
      quizBtn.className = 'btn btn-tonal';
    }

    const checkinBtn = document.getElementById('checkin-btn');
    if (Gamification.isPointVisited(point.id)) {
      checkinBtn.innerHTML = '<i data-lucide="check-circle"></i> Посещено';
      checkinBtn.disabled = true;
      checkinBtn.className = 'btn btn-tonal';
    } else {
      checkinBtn.innerHTML = '<i data-lucide="map-pin"></i> Я на месте';
      checkinBtn.disabled = false;
      checkinBtn.className = 'btn btn-filled success';
    }

    lucide.createIcons();
    this.showScreen('point-detail');
  },

  checkIn() {
    if (!Route.currentPoint) return;

    const result = Gamification.visitPoint(Route.currentPoint.id);

    if (result.alreadyVisited) {
      this.showNotification('Вы уже посещали эту точку');
      return;
    }

    this.updateStats();
    this.renderCategories();

    const checkinBtn = document.getElementById('checkin-btn');
    checkinBtn.innerHTML = '<i data-lucide="check-circle"></i> Посещено';
    checkinBtn.disabled = true;
    checkinBtn.className = 'btn btn-tonal';
    lucide.createIcons();

    this.showNotification(`+${Gamification.POINTS_VISIT} баллов за посещение!`);

    const completion = Gamification.checkCompletion();
    if (completion.completed) {
      setTimeout(() => {
        this.showCompletionScreen();
      }, 1500);
    }
  },

  showCompletionScreen() {
    const stats = Gamification.getStats();
    document.getElementById('final-points').textContent = stats.points;
    this.showScreen('completion-section');
  },

  updateStats() {
    const stats = Gamification.getStats();
    document.getElementById('points-display').innerHTML = `<i data-lucide="star"></i> ${stats.points} баллов`;
    document.getElementById('progress-display').innerHTML = `<i data-lucide="map-pin"></i> ${stats.visitedCount}/${stats.totalPoints}`;
    lucide.createIcons();
  },

  updateProfile() {
    const stats = Gamification.getStats();
    document.getElementById('total-points').textContent = stats.points;
    document.getElementById('visited-points').textContent = `${stats.visitedCount}/${stats.totalPoints}`;
    document.getElementById('quiz-correct').textContent = stats.correctQuizzes;
  },

  updateAchievements() {
    const achievements = Gamification.getAchievementsStatus();
    const container = document.getElementById('achievements-list');

    if (!container) return;

    container.innerHTML = achievements.map(a => `
      <div class="achievement ${a.unlocked ? '' : 'locked'}">
        <div class="achievement-icon">
          <i data-lucide="${a.unlocked ? a.icon : 'lock'}"></i>
        </div>
        <div class="achievement-info">
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.description}</div>
        </div>
      </div>
    `).join('');

    lucide.createIcons();
  },

  updateUserInfo() {
    if (this.user) {
      const nameEl = document.getElementById('user-name');
      if (nameEl) {
        nameEl.textContent = this.user.first_name || 'Путешественник';
      }

      const avatarEl = document.getElementById('user-avatar');
      if (avatarEl && this.user.photo_url) {
        avatarEl.innerHTML = `<img src="${this.user.photo_url}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      }
    }
  },

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      padding: 14px 24px;
      background: var(--md3-success);
      color: white;
      border-radius: var(--md3-border-radius-full);
      font-weight: 600;
      font-family: var(--font-family);
      z-index: 1000;
      animation: slideDown var(--md3-motion-duration-medium) var(--md3-motion-easing-standard);
      box-shadow: var(--md3-elevation-3);
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    notification.innerHTML = `<i data-lucide="check-circle" style="width:20px;height:20px;"></i> ${message}`;
    document.body.appendChild(notification);
    lucide.createIcons();

    setTimeout(() => {
      notification.style.animation = 'slideDown var(--md3-motion-duration-medium) reverse';
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
