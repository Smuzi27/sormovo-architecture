const Route = {
  points: [],
  achievements: [],
  currentPoint: null,

  CATEGORIES: [
    { id: 'avangard', name: 'Эпоха Авангарда', icon: 'hexagon', period: '1920-30-е', eras: ['Эпоха Авангарда'] },
    { id: 'empire', name: 'Сталинский ампир', icon: 'crown', period: '1930-50-е', eras: ['Сталинский ампир'] },
    { id: 'modernism', name: 'Модернизм и Память', icon: 'building-2', period: 'XX век', eras: ['Модернизм и Память'] }
  ],

  async load() {
    try {
      const response = await fetch('assets/data/points.json');
      if (!response.ok) throw new Error('Failed to load points');
      const data = await response.json();
      this.points = data.points;
      this.achievements = data.achievements;
      return data;
    } catch (error) {
      console.error('Error loading route data:', error);
      return { points: [], achievements: [] };
    }
  },

  getPoint(id) {
    return this.points.find(p => p.id === id);
  },

  getAllPoints() {
    return this.points;
  },

  getAchievements() {
    return this.achievements;
  },

  getPointByIndex(index) {
    return this.points[index] || null;
  },

  getPointIndex(id) {
    return this.points.findIndex(p => p.id === id);
  },

  getCategories() {
    return this.CATEGORIES.map(category => {
      const points = this.getPointsByCategory(category);
      return {
        ...category,
        points: points.sort((a, b) => {
          const yearA = a.year.replace(/[^\d]/g, '') || '0';
          const yearB = b.year.replace(/[^\d]/g, '') || '0';
          return parseInt(yearA) - parseInt(yearB);
        })
      };
    });
  },

  getPointsByCategory(category) {
    return this.points.filter(point => category.eras.includes(point.era));
  },

  getCategoryProgress(categoryId) {
    const category = this.CATEGORIES.find(c => c.id === categoryId);
    if (!category) return { visited: 0, total: 0 };

    const points = this.getPointsByCategory(category);
    const visited = points.filter(p => Gamification.isPointVisited(p.id)).length;
    return { visited, total: points.length };
  },

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  findNearestPoint(userLat, userLng) {
    if (!this.points.length) return null;

    let nearest = null;
    let minDistance = Infinity;

    this.points.forEach(point => {
      const distance = this.calculateDistance(
        userLat, userLng,
        point.coordinates.lat, point.coordinates.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    });

    return { point: nearest, distance: minDistance };
  },

  getRouteBounds() {
    if (!this.points.length) return null;

    const lats = this.points.map(p => p.coordinates.lat);
    const lngs = this.points.map(p => p.coordinates.lng);

    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  }
};

window.Route = Route;
