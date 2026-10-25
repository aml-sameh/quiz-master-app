

export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async getQuestions() {
    const url = this.buildApiUrl();
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Too many requests. Wait 5 seconds and try again.");
      }
      throw new Error("Failed to load questions. Please try again.");
    }

    const data = await response.json();

    if (data.response_code === 0) {
      this.questions = data.results;
      return this.questions;
    }

    if (data.response_code === 1) {
      throw new Error("Not enough questions for these options. Try fewer questions or another category.");
    }

    if (data.response_code === 5) {
      throw new Error("Too many requests. Wait 5 seconds and try again.");
    }

    throw new Error("Failed to load questions. Please try again.");
  }

 
  buildApiUrl() {
    const params = new URLSearchParams();
    params.append("amount", this.numberOfQuestions);

    if (this.category !== "") {
      params.append("category", this.category);
    }

    params.append("difficulty", this.difficulty);

    return "https://opentdb.com/api.php?" + params.toString();
  }

  incrementScore() {
    this.score = this.score + 1;
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }


  nextQuestion() {
    this.currentQuestionIndex = this.currentQuestionIndex + 1;
    if (this.currentQuestionIndex < this.questions.length) {
      return true;
    } else {
      return false;
    }
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }



  getHighScores() {
    try {
      const saved = localStorage.getItem("quizHighScores");
      if (saved === null) {
        return [];
      }
      return JSON.parse(saved);
    } catch (error) {
      return [];
    }
  }

  saveHighScore() {
    const scores = this.getHighScores();

    const newScore = {
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString()
    };

    scores.push(newScore);


    scores.sort(function (a, b) {
      return b.percentage - a.percentage;
    });

    const top10 = scores.slice(0, 10);
    localStorage.setItem("quizHighScores", JSON.stringify(top10));
  }

  isHighScore() {
    const scores = this.getHighScores();

    if (scores.length < 10) {
      return true;
    }

    const lowest = scores[scores.length - 1].percentage;
    return this.getScorePercentage() > lowest;
  }

  
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  
  endQuiz() {
    const percentage = this.getScorePercentage();

    const isNew = this.isHighScore();
    if (isNew) {
      this.saveHighScore();
    }

    const scores = this.getHighScores();

    let badge = "";
    if (isNew && percentage > 0) {
      badge = `
        <div class="new-record-badge">
          <i class="fa-solid fa-star"></i> New High Score!
        </div>`;
    }

    let listHtml = "";
    for (let i = 0; i < scores.length; i++) {
      let rankClass = "";
      if (i === 0) {
        rankClass = "gold";
      } else if (i === 1) {
        rankClass = "silver";
      } else if (i === 2) {
        rankClass = "bronze";
      }

      listHtml += `
        <li class="leaderboard-item ${rankClass}">
          <span class="leaderboard-rank">#${i + 1}</span>
          <span class="leaderboard-name">${this.escapeHtml(scores[i].name)}</span>
          <span class="leaderboard-score">${scores[i].percentage}%</span>
        </li>`;
    }

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>
        ${badge}
        <div class="leaderboard">
          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="leaderboard-list">${listHtml}</ul>
        </div>
        <div class="action-buttons">
          <button class="btn-restart">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>`;
  }
}