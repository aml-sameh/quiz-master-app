
import Quiz from "./quiz.js";
import Question from "./question.js";

const quizOptionsForm = document.getElementById("quizOptions");
const playerNameInput = document.getElementById("playerName");
const categoryInput = document.getElementById("categoryMenu");
const difficultyOptions = document.getElementById("difficultyOptions");
const questionsNumber = document.getElementById("questionsNumber");
const startQuizBtn = document.getElementById("startQuiz");
const questionsContainer = document.querySelector(".questions-container");

questionsNumber.value = "";
questionsNumber.placeholder = "Enter 1-50 rounds";




const categories = [
  { value: "", name: "Random Category", icon: "fa-shuffle" },
  { value: "9", name: "General Knowledge", icon: "fa-brain" },
  { value: "10", name: "Books", icon: "fa-book" },
  { value: "11", name: "Film", icon: "fa-film" },
  { value: "12", name: "Music", icon: "fa-music" },
  { value: "15", name: "Video Games", icon: "fa-gamepad" },
  { value: "17", name: "Science & Nature", icon: "fa-flask" },
  { value: "18", name: "Computers", icon: "fa-laptop-code" },
  { value: "21", name: "Sports", icon: "fa-futbol" },
  { value: "22", name: "Geography", icon: "fa-earth-americas" },
  { value: "23", name: "History", icon: "fa-landmark" },
  { value: "27", name: "Animals", icon: "fa-paw" },
  { value: "31", name: "Anime & Manga", icon: "fa-torii-gate" }
];

function addCategories() {
  const optionsBox = document.querySelector("#categorySelect .custom-select-options");

  optionsBox.innerHTML = "";

  for (let i = 0; i < categories.length; i++) {
    const option = document.createElement("div");
    option.className = "custom-select-option";
    option.dataset.value = categories[i].value;

    const icon = document.createElement("i");
    icon.className = "fa-solid " + categories[i].icon;

    option.appendChild(icon);
    option.appendChild(document.createTextNode(" " + categories[i].name));

    optionsBox.appendChild(option);
  }
}

addCategories();

let currentQuiz = null;

function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>`;
}

function hideLoading() {
  const loading = document.querySelector(".loading-overlay");
  if (loading) {
    loading.remove();
  }
}
function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message"></p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>`;

  questionsContainer.querySelector(".error-message").textContent = message;

  const retryBtn = questionsContainer.querySelector(".retry-btn");
  retryBtn.addEventListener("click", function () {
    resetToStart();
  });
}
function validateForm() {
  const value = questionsNumber.value;

  if (value === "") {
    return { isValid: false, error: "Please enter the number of questions." };
  }

  const number = Number(value);

  if (number < 1) {
    return { isValid: false, error: "Minimum is 1 question." };
  }

  if (number > 50) {
    return { isValid: false, error: "Maximum is 50 questions." };
  }

  return { isValid: true, error: null };
}

function showFormError(message) {

  const oldError = document.querySelector(".form-error");
  if (oldError) {
    oldError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> `;
  errorDiv.appendChild(document.createTextNode(message));

  startQuizBtn.parentNode.insertBefore(errorDiv, startQuizBtn);


  setTimeout(function () {
    errorDiv.style.transition = "opacity 0.5s";
    errorDiv.style.opacity = "0";
    setTimeout(function () {
      errorDiv.remove();
    }, 500);
  }, 3000);
}

function resetToStart() {
  questionsContainer.innerHTML = "";
  quizOptionsForm.classList.remove("hidden");
  currentQuiz = null;
}

async function startQuiz() {
  const validation = validateForm();
  if (!validation.isValid) {
    showFormError(validation.error);
    return;
  }

  let playerName = playerNameInput.value.trim();
  if (playerName === "") {
    playerName = "Player";
  }
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numberOfQuestions = Number(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);

  quizOptionsForm.classList.add("hidden");
  showLoading();

  try {
    await currentQuiz.getQuestions();
    hideLoading();

    if (currentQuiz.questions.length === 0) {
      showError("No questions found. Try different options.");
      return;
    }

    const firstQuestion = new Question(currentQuiz, questionsContainer, resetToStart);
    firstQuestion.displayQuestion();
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}
startQuizBtn.addEventListener("click", function () {
  startQuiz();
});

questionsNumber.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    startQuiz();
  }
});