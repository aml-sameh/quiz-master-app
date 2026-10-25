
let audioCtx = null;

function playSound(type) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }
  if (audioCtx === null) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.value = 0.2;

  const now = audioCtx.currentTime;

  if (type === "correct") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(900, now + 0.12);
    osc.start();
    osc.stop(now + 0.3);
  } else {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(120, now + 0.15);
    osc.start();
    osc.stop(now + 0.4);
  }
}
export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;

    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);

    this.wrongAnswers = [];
    for (let i = 0; i < this.questionData.incorrect_answers.length; i++) {
      this.wrongAnswers.push(this.decodeHtml(this.questionData.incorrect_answers[i]));
    }

    this.allAnswers = this.shuffleAnswers();

    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15;
    this.keyHandler = null;
  }

  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  shuffleAnswers() {
    if (this.questionData.type === "boolean") {
      return ["True", "False"];
    }

    const answers = this.wrongAnswers.concat([this.correctAnswer]);

    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = answers[i];
      answers[i] = answers[j];
      answers[j] = temp;
    }

    return answers;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  getDifficultyIcon(difficulty) {
    if (difficulty === "easy") {
      return "fa-face-smile";
    } else if (difficulty === "medium") {
      return "fa-face-meh";
    } else {
      return "fa-skull";
    }
  }

  displayQuestion() {
    const total = this.quiz.numberOfQuestions;
    const number = this.index + 1;
    const difficulty = this.questionData.difficulty;

    let answersHtml = "";
    for (let i = 0; i < this.allAnswers.length; i++) {
      answersHtml += `
        <button class="answer-btn">
          <span class="answer-key">${i + 1}</span>
          <span class="answer-text">${this.escapeHtml(this.allAnswers[i])}</span>
        </button>`;
    }

    this.container.innerHTML = `
      <div class="game-card question-card">

        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Round ${number}/${total}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.escapeHtml(this.category)}</span>
          </div>
          <div class="stat-badge difficulty ${difficulty}">
            <i class="fa-solid ${this.getDifficultyIcon(difficulty)}"></i>
            <span>${difficulty}</span>
          </div>
          <div class="stat-badge timer">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value">${this.timeRemaining}</span>s
          </div>
          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${number}/${total}</span>
          </div>
        </div>

        <h2 class="question-text">${this.escapeHtml(this.question)}</h2>

        <div class="answers-grid">${answersHtml}</div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-4 to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>`;
    const buttons = this.container.querySelectorAll(".answer-btn");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].dataset.answer = this.allAnswers[i];
    }

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    const self = this;
    const buttons = this.container.querySelectorAll(".answer-btn");
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      button.addEventListener("click", function () {
        self.checkAnswer(button);
      });
    }


    this.keyHandler = function (event) {
      const validKeys = ["1", "2", "3", "4"];
      if (validKeys.indexOf(event.key) === -1) {
        return;
      }
      const position = Number(event.key) - 1;
      if (position < buttons.length) {
        self.checkAnswer(buttons[position]);
      }
    };
    document.addEventListener("keydown", this.keyHandler);
  }

  removeEventListeners() {
    if (this.keyHandler !== null) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
  }

  startTimer() {
    const self = this;
    const timerValue = this.container.querySelector(".timer-value");
    const timerBadge = this.container.querySelector(".stat-badge.timer");

    this.timerInterval = setInterval(function () {
      self.timeRemaining = self.timeRemaining - 1;
      timerValue.textContent = self.timeRemaining;

      if (self.timeRemaining <= 5) {
        timerBadge.classList.add("warning");
      }

      if (self.timeRemaining <= 0) {
        self.stopTimer();
        self.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();

    this.highlightCorrectAnswer();
    this.disableOtherButtons(null);
    playSound("wrong");

    const grid = this.container.querySelector(".answers-grid");
    const message = document.createElement("div");
    message.className = "time-up-message";
    message.innerHTML = `<i class="fa-solid fa-clock"></i> TIME'S UP!`;
    grid.parentNode.insertBefore(message, grid);

    this.animateQuestion(400);
  }

  checkAnswer(choiceElement) {
    if (this.answered) {
      return;
    }
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    const selected = choiceElement.dataset.answer;

    if (selected.toLowerCase() === this.correctAnswer.toLowerCase()) {
      choiceElement.classList.add("correct");
      this.quiz.incrementScore();
      this.container.querySelector(".score-item-value").textContent = this.quiz.score;
      playSound("correct");
    } else {
      choiceElement.classList.add("wrong");
      this.highlightCorrectAnswer();
      playSound("wrong");
    }

    this.disableOtherButtons(choiceElement);
    this.animateQuestion(400);
  }

  highlightCorrectAnswer() {
    const buttons = this.container.querySelectorAll(".answer-btn");
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].dataset.answer.toLowerCase() === this.correctAnswer.toLowerCase()) {
        buttons[i].classList.add("correct-reveal");
      }
    }
  }

  disableOtherButtons(choiceElement) {
    const buttons = this.container.querySelectorAll(".answer-btn");
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      if (button === choiceElement) {
        continue;
      }
      if (button.classList.contains("correct-reveal")) {
        continue;
      }
      button.classList.add("disabled");
    }
  }

  getNextQuestion() {
    const hasMore = this.quiz.nextQuestion();

    if (hasMore) {
      const nextQuestion = new Question(this.quiz, this.container, this.onQuizEnd);
      nextQuestion.displayQuestion();
    } else {
      const onQuizEnd = this.onQuizEnd;
      this.container.innerHTML = this.quiz.endQuiz();

      const playAgainButton = this.container.querySelector(".btn-restart");
      playAgainButton.addEventListener("click", function () {
        onQuizEnd();
      });
    }
  }

  animateQuestion(duration) {
    const self = this;


    setTimeout(function () {
      const card = self.container.querySelector(".question-card");
      if (card) {
        card.classList.add("exit");
      }
      setTimeout(function () {
        self.getNextQuestion();
      }, duration);
    }, 1500);
  }
}