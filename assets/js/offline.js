const OfflineManager = {
  isOnline: navigator.onLine,
  listeners: [],

  init() {
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());
    this.updateIndicator();
    this.registerServiceWorker();
  },

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered:', registration.scope);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  },

  onOnline() {
    this.isOnline = true;
    this.updateIndicator();
    this.notifyListeners(true);
  },

  onOffline() {
    this.isOnline = false;
    this.updateIndicator();
    this.notifyListeners(false);
  },

  updateIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      if (this.isOnline) {
        indicator.classList.add('hidden');
      } else {
        indicator.classList.remove('hidden');
      }
    }
  },

  addListener(callback) {
    this.listeners.push(callback);
  },

  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  },

  notifyListeners(online) {
    this.listeners.forEach(callback => {
      try {
        callback(online);
      } catch (error) {
        console.error('Offline listener error:', error);
      }
    });
  },

  async cacheImage(url) {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open('sormovo-images-v1');
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        return true;
      }
    } catch (error) {
      console.error('Image cache error:', error);
    }
    return false;
  },

  async getCachedImage(url) {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open('sormovo-images-v1');
      const response = await cache.match(url);
      if (response) {
        return URL.createObjectURL(await response.blob());
      }
    } catch (error) {
      console.error('Get cached image error:', error);
    }
    return null;
  }
};

window.OfflineManager = OfflineManager;
