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

window.addEventListener("load", () => {
  loadDefaultCSV();
});

async function loadDefaultCSV() {

  try {

    const response = await fetch("questions.csv");

    if (!response.ok) {
      feedbackEl.textContent = "請上傳 CSV 題庫。";
      return;
    }

    const csvText = await response.text();

    loadQuestionsFromCSV(
      csvText,
      "預設題庫載入成功！"
    );

  } catch (error) {

    feedbackEl.textContent =
      "請上傳 CSV 題庫。";
  }
}

function handleFileUpload(event) {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {

    const csvText = e.target.result;

    loadQuestionsFromCSV(
      csvText,
      "上傳題庫成功！"
    );
  };

  reader.readAsText(file, "UTF-8");
}

function loadQuestionsFromCSV(csvText, message) {

  questions = parseCSV(csvText);

  if (questions.length === 0) {

    feedbackEl.textContent =
      "題庫讀取失敗，請檢查 CSV 格式。";

    return;
  }

  score = 0;

  wrongQuestions = [];

  wrongPracticeMode = false;

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
    .map(cols => {

      return {
        sentence: parseSentence(cols[0].trim()),
        word: cols[1].trim(),
        options: cols[2]
          .split("|")
          .map(item => item.trim()),
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

  return {
    body,
    tone,
    toneClass
  };
}

function createZhuyinHTML(zhuyin) {

  const parts = splitZhuyin(zhuyin);

  if (!parts.body && !parts.tone) {
    return "";
  }

  return `
    <span class="zhuyin-wrap">
      <span class="zhuyin-body">
        ${parts.body}
      </span>

      ${
        parts.tone
          ? `
            <span class="zhuyin-tone ${parts.toneClass}">
              ${parts.tone}
            </span>
          `
          : ""
      }
    </span>
  `;
}

function createOptionZhuyinHTML(zhuyin) {

  const parts = splitZhuyin(zhuyin);

  return `
    <div class="option-zhuyin">

      <div class="option-body">
        ${parts.body}
      </div>

      ${
        parts.tone
          ? `
            <div class="option-tone ${parts.toneClass}">
              ${parts.tone}
            </div>
          `
          : ""
      }

    </div>
  `;
}

function pickQuestion() {

  if (questions.length === 0) {

    feedbackEl.textContent =
      "請先上傳題庫。";

    return;
  }

  const pool =
    wrongPracticeMode &&
    wrongQuestions.length > 0
      ? wrongQuestions
      : questions;

  const randomIndex =
    Math.floor(Math.random() * pool.length);

  currentQuestion = pool[randomIndex];

  answered = false;

  renderQuestion();
}

function renderQuestion() {

  sentenceEl.innerHTML = "";

  currentQuestion.sentence.forEach(item => {

    const span =
      document.createElement("span");

    span.className = "char-block";

    if (item.char === currentQuestion.word) {

      span.innerHTML = `
        <span class="target-char">
          ${item.char}
        </span>
      `;

    } else {

      span.innerHTML = `
        <span class="main-char">
          ${item.char}
        </span>

        ${createZhuyinHTML(item.zhuyin)}
      `;
    }

    sentenceEl.appendChild(span);
  });

  targetWordEl.textContent =
    currentQuestion.word;

  optionsEl.innerHTML = "";

  feedbackEl.textContent = "";

  feedbackEl.className = "feedback";

  currentQuestion.options.forEach(option => {

    const button =
      document.createElement("button");

    button.className = "option-btn";

    button.innerHTML =
      createOptionZhuyinHTML(option);

    button.addEventListener("click", () => {
      checkAnswer(option, button);
    });

    optionsEl.appendChild(button);
  });

  updateStatus();
}

function checkAnswer(selectedOption, selectedButton) {

  if (answered) return;

  answered = true;

  const buttons =
    document.querySelectorAll(".option-btn");

  buttons.forEach(button => {

    button.disabled = true;

    if (
      button.innerText.replace(/\s/g, "") ===
      currentQuestion.answer.replace(/\s/g, "")
    ) {
      button.classList.add("correct");
    }
  });

  if (selectedOption === currentQuestion.answer) {

    score += 10;

    scoreEl.textContent = score;

    feedbackEl.className = "feedback good";

    feedbackEl.innerHTML = `
      太棒了！答對了！<br>
      ${currentQuestion.explanation}
    `;

    if (wrongPracticeMode) {
      removeFromWrongQuestions(currentQuestion);
    }

  } else {

    selectedButton.classList.add("wrong");

    feedbackEl.className = "feedback bad";

    feedbackEl.innerHTML = `
      答錯了！<br>
      正確答案是 ${currentQuestion.answer}<br>
      ${currentQuestion.explanation}
    `;

    addToWrongQuestions(currentQuestion);
  }

  updateStatus();
}

function addToWrongQuestions(question) {

  const exists = wrongQuestions.some(q =>

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

    feedbackEl.innerHTML += `
      <br>錯題全部完成！
    `;
  }
}

function updateStatus() {

  if (questions.length === 0) {

    modeLabelEl.textContent =
      "尚未載入題庫";

  } else {

    modeLabelEl.textContent =
      wrongPracticeMode
        ? "錯題練習模式"
        : "一般練習";
  }

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

nextBtn.addEventListener("click", () => {
  pickQuestion();
});

wrongPracticeBtn.addEventListener("click", () => {

  if (wrongQuestions.length === 0) return;

  wrongPracticeMode = true;

  pickQuestion();
});
