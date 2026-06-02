const Quiz = {
  currentPoint: null,
  answered: false,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('quiz-btn')?.addEventListener('click', () => {
      this.showQuiz(Route.currentPoint);
    });

    document.getElementById('quiz-back-btn')?.addEventListener('click', () => {
      this.hideQuiz();
    });

    document.getElementById('quiz-continue-btn')?.addEventListener('click', () => {
      this.hideQuiz();
    });
  },

  showQuiz(point) {
    if (!point || !point.quiz) return;

    this.currentPoint = point;
    this.answered = false;

    document.getElementById('quiz-question').textContent = point.quiz.question;
    
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    point.quiz.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'quiz-option';
      button.textContent = option;
      button.dataset.index = index;
      button.addEventListener('click', () => this.answer(index));
      optionsContainer.appendChild(button);
    });

    document.getElementById('quiz-result').classList.add('hidden');
    App.showScreen('quiz-section');
  },

  hideQuiz() {
    App.showPointDetail(Route.currentPoint);
  },

  answer(selectedIndex) {
    if (this.answered || !this.currentPoint) return;
    this.answered = true;

    const quiz = this.currentPoint.quiz;
    const isCorrect = selectedIndex === quiz.correct;

    const options = document.querySelectorAll('.quiz-option');
    options.forEach((option, index) => {
      option.disabled = true;
      if (index === quiz.correct) {
        option.classList.add('correct');
      } else if (index === selectedIndex && !isCorrect) {
        option.classList.add('incorrect');
      }
    });

    const result = Gamification.recordQuizResult(this.currentPoint.id, isCorrect);

    const resultDiv = document.getElementById('quiz-result');
    const resultText = document.getElementById('quiz-result-text');

    if (isCorrect) {
      resultText.innerHTML = `✅ Правильно!<br>+${Gamification.POINTS_QUIZ_CORRECT} баллов<br><br>Всего: ${result.totalPoints} баллов`;
    } else {
      resultText.innerHTML = `❌ Неправильно.<br>Правильный ответ: ${quiz.options[quiz.correct]}`;
    }

    resultDiv.classList.remove('hidden');
    App.updateStats();
  }
};

window.Quiz = Quiz;
