let questions = [];
let score = 0;
let currentQuestion = null;
let answered = false;

let wrongQuestions = [];
let wrongPracticeMode = false;

/* ===== 新增：隨機不重複 ===== */

let shuffledQuestions = [];
let currentIndex = 0;

/* ========================= */

const fileInput =
  document.getElementById("fileInput");

const scoreEl =
  document.getElementById("score");

const sentenceEl =
  document.getElementById("sentence");

const targetWordEl =
  document.getElementById("targetWord");

const optionsEl =
  document.getElementById("options");

const feedbackEl =
  document.getElementById("feedback");

const nextBtn =
  document.getElementById("nextBtn");

const wrongPracticeBtn =
  document.getElementById("wrongPracticeBtn");

const wrongCountEl =
  document.getElementById("wrongCount");

const modeLabelEl =
  document.getElementById("modeLabel");

fileInput.addEventListener(
  "change",
  handleFileUpload
);

window.addEventListener(
  "load",
  loadDefaultCSV
);

async function loadDefaultCSV() {

  try {

    const response =
      await fetch("questions.csv");

    if (!response.ok) {

      feedbackEl.textContent =
        "請上傳 CSV 題庫。";

      return;
    }

    const csvText =
      await response.text();

    loadQuestionsFromCSV(
      csvText,
      "題庫載入成功！"
    );

  } catch {

    feedbackEl.textContent =
      "請上傳 CSV 題庫。";
  }
}

function handleFileUpload(event) {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {

    loadQuestionsFromCSV(
      e.target.result,
      "上傳題庫成功！"
    );
  };

  reader.readAsText(file, "UTF-8");
}

function loadQuestionsFromCSV(csvText, message) {

  questions = parseCSV(csvText);

  if (questions.length === 0) {

    feedbackEl.textContent =
      "題庫格式錯誤，請檢查 questions.csv。";

    return;
  }

  score = 0;

  wrongQuestions = [];

  wrongPracticeMode = false;

  /* ===== 新增 ===== */

  shuffledQuestions = [];
  currentIndex = 0;

  /* ============== */

  scoreEl.textContent = score;

  feedbackEl.textContent = message;

  pickQuestion();
}

function parseCSV(csvText) {

  const lines =
    csvText.trim().split(/\r?\n/);

  const dataLines = lines.slice(1);

  return dataLines
    .map(line => parseCSVLine(line))
    .filter(cols => cols.length >= 5)
    .map(cols => ({
      sentence:
        parseSentence(cols[0].trim()),

      word:
        cols[1].trim(),

      options:
        cols[2]
          .split("|")
          .map(v => v.trim()),

      answer:
        cols[3].trim(),

      explanation:
        cols[4].trim()
    }));
}

function parseCSVLine(line) {

  const result = [];

  let current = "";

  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {

    const char = line[i];

    if (char === '"') {

      insideQuotes = !insideQuotes;

    } else if (
      char === "," &&
      !insideQuotes
    ) {

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

    const match =
      part.match(/^(.+?)\((.+?)\)$/);

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

function splitZhuyin(zhuyin) {

  let tone = "";
  let toneClass = "";

  if (zhuyin.includes("ˊ")) {

    tone = "ˊ";
    toneClass = "tone2";

  } else if (zhuyin.includes("ˇ")) {

    tone = "ˇ";
    toneClass = "tone3";

  } else if (zhuyin.includes("ˋ")) {

    tone = "ˋ";
    toneClass = "tone4";

  } else if (zhuyin.includes("˙")) {

    tone = "˙";
    toneClass = "tone5";
  }

  const body =
    zhuyin.replace(/[ˊˇˋ˙]/g, "");

  const letters =
    Array.from(body);

  return {

    letters,
    tone,
    toneClass,
    lengthClass:
      "len" + letters.length
  };
}

function createZhuyinHTML(zhuyin) {

  if (!zhuyin) return "";

  const parts =
    splitZhuyin(zhuyin);

  let html = `
    <div class="zhuyin-column ${parts.lengthClass}">
      <div class="zhuyin-body">
  `;

  parts.letters.forEach(letter => {

    html += `
      <div class="zhuyin-letter">
        ${letter}
      </div>
    `;
  });

  html += `</div>`;

  if (parts.tone) {

    html += `
      <div class="tone-mark ${parts.toneClass}">
        ${parts.tone}
      </div>
    `;
  }

  html += `</div>`;

  return html;
}

function createOptionZhuyinHTML(zhuyin) {

  const parts =
    splitZhuyin(zhuyin);

  let html = `
    <div class="option-zhuyin-box ${parts.lengthClass}">
      <div class="option-body">
  `;

  parts.letters.forEach(letter => {

    html += `
      <div class="option-letter">
        ${letter}
      </div>
    `;
  });

  html += `</div>`;

  if (parts.tone) {

    html += `
      <div class="option-tone ${parts.toneClass}">
        ${parts.tone}
      </div>
    `;
  }

  html += `</div>`;

  return html;
}

/* ===================================== */
/* ===== 這裡是新的隨機不重複功能 ===== */
/* ===================================== */

function shuffleArray(array) {

  const copied = [...array];

  for (
    let i = copied.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [copied[i], copied[j]] =
      [copied[j], copied[i]];
  }

  return copied;
}

function pickQuestion() {

  if (questions.length === 0) return;

  const pool =

    wrongPracticeMode &&
    wrongQuestions.length > 0

      ? wrongQuestions

      : questions;

  if (
    shuffledQuestions.length === 0 ||
    currentIndex >= shuffledQuestions.length
  ) {

    shuffledQuestions =
      shuffleArray(pool);

    currentIndex = 0;
  }

  currentQuestion =
    shuffledQuestions[currentIndex];

  currentIndex++;

  answered = false;

  renderQuestion();
}

/* ===================================== */

function renderQuestion() {

  sentenceEl.innerHTML = "";

  currentQuestion.sentence.forEach(item => {

    const span =
      document.createElement("span");

    if (
      item.char ===
      currentQuestion.word
    ) {

      span.className =
        "char-block no-zhuyin";

      span.innerHTML = `
        <div class="target-char">
          ${item.char}
        </div>
      `;

    } else if (item.zhuyin) {

      span.className =
        "char-block";

      span.innerHTML = `
        <div class="main-char">
          ${item.char}
        </div>

        ${createZhuyinHTML(item.zhuyin)}
      `;

    } else {

      span.className =
        "char-block no-zhuyin";

      span.innerHTML = `
        <div class="main-char">
          ${item.char}
        </div>
      `;
    }

    sentenceEl.appendChild(span);
  });

  targetWordEl.textContent =
    currentQuestion.word;

  optionsEl.innerHTML = "";

  feedbackEl.textContent = "";

  feedbackEl.className =
    "feedback";

  currentQuestion.options.forEach(option => {

    const button =
      document.createElement("button");

    button.className =
      "option-btn";

    button.innerHTML =
      createOptionZhuyinHTML(option);

    button.addEventListener(
      "click",
      () => {

        checkAnswer(option, button);
      }
    );

    optionsEl.appendChild(button);
  });

  updateStatus();
}

function checkAnswer(
  selectedOption,
  selectedButton
) {

  if (answered) return;

  answered = true;

  const buttons =
    document.querySelectorAll(
      ".option-btn"
    );

  buttons.forEach(button => {

    button.disabled = true;
  });

  if (
    selectedOption ===
    currentQuestion.answer
  ) {

    score += 10;

    scoreEl.textContent = score;

    selectedButton.classList.add(
      "correct"
    );

    feedbackEl.className =
      "feedback good";

    feedbackEl.innerHTML = `
      太棒了！答對了！<br>
      ${currentQuestion.explanation}
    `;

    if (wrongPracticeMode) {

      removeFromWrongQuestions(
        currentQuestion
      );
    }

  } else {

    selectedButton.classList.add(
      "wrong"
    );

    feedbackEl.className =
      "feedback bad";

    feedbackEl.innerHTML = `
      答錯了！<br>
      正確答案是：
      ${currentQuestion.answer}<br>
      ${currentQuestion.explanation}
    `;

    addToWrongQuestions(
      currentQuestion
    );
  }

  updateStatus();
}

function addToWrongQuestions(question) {

  const exists =

    wrongQuestions.some(q =>

      q.word === question.word &&

      JSON.stringify(q.sentence) ===
      JSON.stringify(question.sentence)
    );

  if (!exists) {

    wrongQuestions.push(question);
  }
}

function removeFromWrongQuestions(question) {

  wrongQuestions =

    wrongQuestions.filter(q =>

      !(
        q.word === question.word &&

        JSON.stringify(q.sentence) ===
        JSON.stringify(question.sentence)
      )
    );

  if (wrongQuestions.length === 0) {

    wrongPracticeMode = false;
  }
}

function updateStatus() {

  modeLabelEl.textContent =

    wrongPracticeMode
      ? "錯題練習模式"
      : "一般練習";

  wrongCountEl.textContent =

    `錯題：${wrongQuestions.length}`;

  if (wrongQuestions.length > 0) {

    wrongPracticeBtn.classList.remove(
      "hidden"
    );

  } else {

    wrongPracticeBtn.classList.add(
      "hidden"
    );
  }
}

nextBtn.addEventListener(
  "click",
  pickQuestion
);

wrongPracticeBtn.addEventListener(
  "click",
  () => {

    if (
      wrongQuestions.length === 0
    ) return;

    wrongPracticeMode = true;

    shuffledQuestions = [];
    currentIndex = 0;

    pickQuestion();
  }
);
