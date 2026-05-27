let questions = [];
let score = 0;
let currentQuestion = null;
let answered = false;
let wrongQuestions = [];
let wrongPracticeMode = false;

const fileInput = document.getElementById("fileInput");
const scoreEl = document.getElementById("score");
const sentenceEl = document.getElementById("sentence");
const targetWordEl = document.getElementById("targetWord");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const wrongPracticeBtn = document.getElementById("wrongPracticeBtn");
const wrongCountEl = document.getElementById("wrongCount");
const modeLabelEl = document.getElementById("modeLabel");

fileInput.addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const csvText = e.target.result;
    questions = parseCSV(csvText);

    if (questions.length === 0) {
      feedbackEl.textContent = "題庫讀取失敗，請檢查 CSV 格式。";
      return;
    }

    score = 0;
    wrongQuestions = [];
    wrongPracticeMode = false;
    scoreEl.textContent = score;

    feedbackEl.textContent = "題庫載入成功，開始練習！";
    pickQuestion();
  };

  reader.readAsText(file, "UTF-8");
}

function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const dataLines = lines.slice(1);

  return dataLines
    .map(line => parseCSVLine(line))
    .filter(cols => cols.length >= 5)
    .map(cols => {
      return {
        sentence: parseSentence(cols[0]),
        word: cols[1].trim(),
        options: cols[2].split("|").map(item => item.trim()),
        answer: cols[3].trim(),
        explanation: cols[4].trim()
      };
    });
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseSentence(text) {
  return text.split(" ").map(part => {
    const match = part.match(/^(.+?)\((.+?)\)$/);

    if (match) {
      return {
        char: match[1],
        zhuyin: match[2]
      };
    }

    return {
      char: part,
      zhuyin: ""
    };
  });
}

function pickQuestion() {
  if (questions.length === 0) {
    feedbackEl.textContent = "請先上傳題庫。";
    return;
  }

  const pool = wrongPracticeMode && wrongQuestions.length > 0
    ? wrongQuestions
    : questions;

  const randomIndex = Math.floor(Math.random() * pool.length);
  currentQuestion = pool[randomIndex];
  answered = false;

  renderQuestion();
}

function renderQuestion() {
  sentenceEl.innerHTML = "";

  currentQuestion.sentence.forEach(item => {
    const span = document.createElement("span");
    span.className = "char-block";

    if (item.char === currentQuestion.word) {
      span.innerHTML = `<span class="target-char">${item.char}</span>`;
    } else if (item.zhuyin) {
      span.innerHTML = `<ruby>${item.char}<rt>${item.zhuyin}</rt></ruby>`;
    } else {
      span.textContent = item.char;
    }

    sentenceEl.appendChild(span);
  });

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
    JSON.stringify(q.sentence) === JSON.stringify(question.sentence) &&
    q.word === question.word
  );

  if (!exists) {
    wrongQuestions.push(question);
  }
}

function removeFromWrongQuestions(question) {
  wrongQuestions = wrongQuestions.filter(q =>
    !(
      JSON.stringify(q.sentence) === JSON.stringify(question.sentence) &&
      q.word === question.word
    )
  );

  if (wrongQuestions.length === 0) {
    wrongPracticeMode = false;
    feedbackEl.innerHTML += "<br>錯題都練完了，回到一般練習！";
  }
}

function updateStatus() {
  if (questions.length === 0) {
    modeLabelEl.textContent = "尚未載入題庫";
  } else {
    modeLabelEl.textContent = wrongPracticeMode ? "錯題練習中" : "一般練習";
  }

  wrongCountEl.textContent = `錯題：${wrongQuestions.length}`;

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
