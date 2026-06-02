const Gamification = {
  STORAGE_KEY: 'sormovo_progress',
  POINTS_VISIT: 5,
  POINTS_QUIZ_CORRECT: 10,
  POINTS_COMPLETION_BONUS: 50,

  data: {
    points: 0,
    visitedPoints: [],
    quizResults: [],
    achievements: []
  },

  init() {
    this.load();
  },

  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.data = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  },

  visitPoint(pointId) {
    if (this.data.visitedPoints.includes(pointId)) {
      return { visited: false, points: 0, alreadyVisited: true };
    }

    this.data.visitedPoints.push(pointId);
    this.data.points += this.POINTS_VISIT;
    this.save();

    this.checkAchievements();

    return {
      visited: true,
      points: this.POINTS_VISIT,
      alreadyVisited: false,
      totalPoints: this.data.points,
      visitedCount: this.data.visitedPoints.length
    };
  },

  recordQuizResult(pointId, correct) {
    const result = {
      pointId,
      correct,
      timestamp: Date.now()
    };

    this.data.quizResults.push(result);

    if (correct) {
      this.data.points += this.POINTS_QUIZ_CORRECT;
    }

    this.save();
    this.checkAchievements();

    return {
      correct,
      points: correct ? this.POINTS_QUIZ_CORRECT : 0,
      totalPoints: this.data.points,
      correctQuizzes: this.data.quizResults.filter(r => r.correct).length
    };
  },

  checkAchievements() {
    const achievements = Route.getAchievements();
    const newAchievements = [];

    achievements.forEach(achievement => {
      if (this.data.achievements.includes(achievement.id)) return;

      let unlocked = false;

      switch (achievement.id) {
        case 'first_visit':
          unlocked = this.data.visitedPoints.length >= achievement.threshold;
          break;
        case 'explorer':
          unlocked = this.data.visitedPoints.length >= achievement.threshold;
          break;
        case 'historian':
          const correctQuizzes = this.data.quizResults.filter(r => r.correct).length;
          unlocked = correctQuizzes >= achievement.threshold;
          break;
        case 'completionist':
          unlocked = this.data.visitedPoints.length >= achievement.threshold;
          break;
        case 'expert':
          unlocked = this.data.points >= achievement.threshold;
          break;
      }

      if (unlocked) {
        this.data.achievements.push(achievement.id);
        newAchievements.push(achievement);
      }
    });

    if (newAchievements.length > 0) {
      this.save();
    }

    return newAchievements;
  },

  checkCompletion() {
    const totalPoints = Route.getAllPoints().length;
    if (this.data.visitedPoints.length >= totalPoints) {
      if (!this.data.completionBonusReceived) {
        this.data.points += this.POINTS_COMPLETION_BONUS;
        this.data.completionBonusReceived = true;
        this.save();
        return { completed: true, bonus: this.POINTS_COMPLETION_BONUS };
      }
    }
    return { completed: false, bonus: 0 };
  },

  isPointVisited(pointId) {
    return this.data.visitedPoints.includes(pointId);
  },

  isQuizCompleted(pointId) {
    return this.data.quizResults.some(r => r.pointId === pointId);
  },

  getStats() {
    const correctQuizzes = this.data.quizResults.filter(r => r.correct).length;
    return {
      points: this.data.points,
      visitedCount: this.data.visitedPoints.length,
      totalPoints: Route.getAllPoints().length,
      correctQuizzes,
      totalQuizzes: this.data.quizResults.length,
      achievements: this.data.achievements
    };
  },

  getAchievementsStatus() {
    const achievements = Route.getAchievements();
    return achievements.map(a => ({
      ...a,
      unlocked: this.data.achievements.includes(a.id)
    }));
  },

  reset() {
    this.data = {
      points: 0,
      visitedPoints: [],
      quizResults: [],
      achievements: [],
      completionBonusReceived: false
    };
    this.save();
  },

  share() {
    const stats = this.getStats();
    const text = `🏛 Советское Сормово\n\n` +
      `⭐ ${stats.points} баллов\n` +
      `📍 ${stats.visitedCount}/${stats.totalPoints} точек\n` +
      `❓ ${stats.correctQuizzes} квизов\n\n` +
      `Пройди архитектурный маршрут по Сормову!`;

    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`
      );
    } else if (navigator.share) {
      navigator.share({
        title: 'Архитектурный маршрут «Советское Сормово»',
        text: text,
        url: window.location.href
      });
    }
  }
};

window.Gamification = Gamification;
