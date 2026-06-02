const MAP_APPS = {
  yandex: {
    name: 'Яндекс Карты',
    urlTemplate: 'https://yandex.ru/maps/?pt={lng},{lat}'
  },
  google: {
    name: 'Google Maps',
    urlTemplate: 'https://www.google.com/maps/dir/?api=1&destination={lat},{lng}'
  },
  '2gis': {
    name: '2ГИС',
    urlTemplate: 'https://2gis.ru/nizhny_novgorod/firm/70000001029254890/center/{lng},{lat},16'
  }
};

const Navigation = {
  currentPoint: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('nav-btn')?.addEventListener('click', () => {
      this.handleNavigationClick();
    });

    document.querySelectorAll('.map-app-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.dataset.app;
        const remember = document.getElementById('remember-map-app')?.checked;
        this.openMapApp(appId, remember);
      });
    });

    document.getElementById('map-selector-cancel')?.addEventListener('click', () => {
      this.hideMapSelector();
    });

    document.getElementById('map-selector')?.addEventListener('click', (e) => {
      if (e.target.id === 'map-selector') {
        this.hideMapSelector();
      }
    });
  },

  handleNavigationClick() {
    this.currentPoint = Route.currentPoint;
    if (!this.currentPoint) {
      this.findNearestAndNavigate();
    } else {
      this.showMapSelector(this.currentPoint);
    }
  },

  findNearestAndNavigate() {
    if (!navigator.geolocation) {
      this.showNotification('Геолокация недоступна');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearest = Route.findNearestPoint(latitude, longitude);
        if (nearest && nearest.point) {
          this.currentPoint = nearest.point;
          this.showMapSelector(nearest.point);
        } else {
          this.showNotification('Не удалось найти ближайшую точку');
        }
      },
      () => {
        this.showNotification('Не удалось определить местоположение');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  },

  showMapSelector(point) {
    const savedApp = localStorage.getItem('selected_map_app');
    if (savedApp) {
      this.openMapApp(savedApp, false);
      return;
    }

    this.currentPoint = point;
    const modal = document.getElementById('map-selector');
    if (modal) {
      modal.classList.add('active');
      lucide.createIcons();
    }
  },

  hideMapSelector() {
    const modal = document.getElementById('map-selector');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  openMapApp(appId, remember = false) {
    if (!this.currentPoint) return;

    if (remember) {
      localStorage.setItem('selected_map_app', appId);
    }

    const { lat, lng } = this.currentPoint.coordinates;
    const app = MAP_APPS[appId];
    if (!app) return;

    const url = app.urlTemplate
      .replace('{lat}', lat)
      .replace('{lng}', lng);

    this.hideMapSelector();

    if (window.Telegram?.WebApp) {
      Telegram.WebApp.openLink(url, { try_instant_view: true });
    } else {
      window.location.href = url;
    }
  },

  showOnTelegramMap(point) {
    if (!point) return;

    const { lat, lng } = point.coordinates;

    if (window.Telegram?.WebApp) {
      Telegram.WebApp.openLocation(lat, lng, point.name);
    } else {
      window.location.href = `https://yandex.ru/maps/?pt=${lng},${lat}&z=16`;
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

window.Navigation = Navigation;
