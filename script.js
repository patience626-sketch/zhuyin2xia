const questions = [
  {
    sentence: "我喜歡聽音樂。",
    word: "樂",
    options: ["ㄌㄜˋ", "ㄩㄝˋ"],
    answer: "ㄩㄝˋ",
    explanation: "「音樂」的「樂」讀作 ㄩㄝˋ。"
  },
  {
    sentence: "今天我覺得很快樂。",
    word: "樂",
    options: ["ㄌㄜˋ", "ㄩㄝˋ"],
    answer: "ㄌㄜˋ",
    explanation: "「快樂」的「樂」讀作 ㄌㄜˋ。"
  },
  {
    sentence: "哥哥已經長大了。",
    word: "長",
    options: ["ㄔㄤˊ", "ㄓㄤˇ"],
    answer: "ㄓㄤˇ",
    explanation: "「長大」的「長」讀作 ㄓㄤˇ。"
  },
  {
    sentence: "這條繩子很長。",
    word: "長",
    options: ["ㄔㄤˊ", "ㄓㄤˇ"],
    answer: "ㄔㄤˊ",
    explanation: "表示長度時，「長」讀作 ㄔㄤˊ。"
  },
  {
    sentence: "這件事很重要。",
    word: "重",
    options: ["ㄓㄨㄥˋ", "ㄔㄨㄥˊ"],
    answer: "ㄓㄨㄥˋ",
    explanation: "「重要」的「重」讀作 ㄓㄨㄥˋ。"
  },
  {
    sentence: "請你重複說一次。",
    word: "重",
    options: ["ㄓㄨㄥˋ", "ㄔㄨㄥˊ"],
    answer: "ㄔㄨㄥˊ",
    explanation: "「重複」的「重」讀作 ㄔㄨㄥˊ。"
  },
  {
    sentence: "爸爸在銀行工作。",
    word: "行",
    options: ["ㄒㄧㄥˊ", "ㄏㄤˊ"],
    answer: "ㄏㄤˊ",
    explanation: "「銀行」的「行」讀作 ㄏㄤˊ。"
  },
  {
    sentence: "我們一起行走在人行道上。",
    word: "行",
    options: ["ㄒㄧㄥˊ", "ㄏㄤˊ"],
    answer: "ㄒㄧㄥˊ",
    explanation: "表示走路、可以時，「行」常讀作 ㄒㄧㄥˊ。"
  },
  {
    sentence: "他是一個好孩子。",
    word: "好",
    options: ["ㄏㄠˇ", "ㄏㄠˋ"],
    answer: "ㄏㄠˇ",
    explanation: "表示良好時，「好」讀作 ㄏㄠˇ。"
  },
  {
    sentence: "他很好學，每天都看書。",
    word: "好",
    options: ["ㄏㄠˇ", "ㄏㄠˋ"],
    answer: "ㄏㄠˋ",
    explanation: "表示喜愛、喜歡時，「好」讀作 ㄏㄠˋ。"
  }
];

let score = 0;
let currentQuestion = null;
let answered = false;
let wrongQuestions = [];
let wrongPracticeMode = false;

const scoreEl = document.getElementById("score");
const sentenceEl = document.getElementById("sentence");
const targetWordEl = document.getElementById("targetWord");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const wrongPracticeBtn = document.getElementById("wrongPracticeBtn");
const wrongCountEl = document.getElementById("wrongCount");
const modeLabelEl = document.getElementById("modeLabel");

function pickQuestion() {
  const pool = wrongPracticeMode && wrongQuestions.length > 0
    ? wrongQuestions
    : questions;

  const randomIndex = Math.floor(Math.random() * pool.length);
  currentQuestion = pool[randomIndex];
  answered = false;

  renderQuestion();
}

function renderQuestion() {
  sentenceEl.textContent = currentQuestion.sentence;
  targetWordEl.textContent = currentQuestion.word;
  optionsEl.innerHTML = "";
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";

  currentQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(option, button));
    optionsEl.appendChild(button);
  });

  updateStatus();
}

function checkAnswer(selectedOption, selectedButton) {
  if (answered) return;
  answered = true;

  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(button => {
    button.disabled = true;

    if (button.textContent === currentQuestion.answer) {
      button.classList.add("correct");
    }
  });

  if (selectedOption === currentQuestion.answer) {
    score += 10;
    scoreEl.textContent = score;

    feedbackEl.className = "feedback good";
    feedbackEl.innerHTML = `太棒了！答對了！<br>${currentQuestion.explanation}`;

    if (wrongPracticeMode) {
      removeFromWrongQuestions(currentQuestion);
    }
  } else {
    selectedButton.classList.add("wrong");

    feedbackEl.className = "feedback bad";
    feedbackEl.innerHTML = `差一點！正確答案是 <strong>${currentQuestion.answer}</strong><br>${currentQuestion.explanation}`;

    addToWrongQuestions(currentQuestion);
  }

  updateStatus();
}

function addToWrongQuestions(question) {
  const exists = wrongQuestions.some(q =>
    q.sentence === question.sentence && q.word === question.word
  );

  if (!exists) {
    wrongQuestions.push(question);
  }
}

function removeFromWrongQuestions(question) {
  wrongQuestions = wrongQuestions.filter(q =>
    !(q.sentence === question.sentence && q.word === question.word)
  );

  if (wrongQuestions.length === 0) {
    wrongPracticeMode = false;
    feedbackEl.innerHTML += "<br>錯題都練完了，回到一般練習！";
  }
}

function updateStatus() {
  wrongCountEl.textContent = `錯題：${wrongQuestions.length}`;
  modeLabelEl.textContent = wrongPracticeMode ? "錯題練習中" : "一般練習";

  if (wrongQuestions.length > 0) {
    wrongPracticeBtn.classList.remove("hidden");
  } else {
    wrongPracticeBtn.classList.add("hidden");
  }
}

nextBtn.addEventListener("click", () => {
  pickQuestion();
});

wrongPracticeBtn.addEventListener("click", () => {
  if (wrongQuestions.length === 0) return;
  wrongPracticeMode = true;
  pickQuestion();
});

pickQuestion();
