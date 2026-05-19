const questionEl = document.getElementById("question");
const numeratorEl = document.getElementById("numeratorDisplay");
const denominatorEl = document.getElementById("denominatorDisplay");
const modeBtn = document.getElementById("modeButton");
const toast = document.getElementById("toast");
const buttonsContainer = document.getElementById("buttons");

let inputMode = "denominator";
let numeratorInput = "";
let denominatorInput = "";
let correctAnswer = null;

// ===== ボタン定義 =====
const buttons = [
  "1","2","3","x","y","消",
  "4","5","6","○²","○³","○⁴",
  "7","8","9","○⁵","○⁶","OK",
  "0","MODE"
];

// ===== ボタン生成 =====
buttons.forEach(b => {
  const btn = document.createElement("button");

  if (b === "MODE") {
    btn.id = "modeButton";
    btn.textContent = "分子入力へ";
  } else {
    btn.textContent = b;
  }

  btn.dataset.key = b;

  btn.addEventListener("click", () => {
    handleInput(b);
  });

  if (b === "消") {
    let interval = null;
    let timeout = null;

    btn.addEventListener("pointerdown", () => {
      timeout = setTimeout(() => {
        interval = setInterval(() => handleInput("消"), 60);
      }, 300);
    });

    const stop = () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };

    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointerleave", stop);
    btn.addEventListener("pointercancel", stop);
  }

  buttonsContainer.appendChild(btn);
});

// ===== ユーティリティ =====
function gcd(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return Math.abs(a);
}

function simplify(num, den) {
  const g = gcd(num, den);
  return {
    num: num / g,
    den: den / g
  };
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomExponentSum(max = 3) {
  const total = rand(1, max);
  const x = rand(0, total);
  return [x, total - x];
}

function superscript(n) {
  const map = {
    "0":"⁰","1":"¹","2":"²","3":"³",
    "4":"⁴","5":"⁵","6":"⁶"
  };
  return String(n).split("").map(c => map[c]).join("");
}

// ===== 単項式表示 =====
function formatVars(x, y) {
  let s = "";

  if (x > 0) {
    s += `<span class="var">x</span>${x > 1 ? superscript(x) : ""}`;
  }

  if (y > 0) {
    s += `<span class="var">y</span>${y > 1 ? superscript(y) : ""}`;
  }

  return s;
}

function formatMonomial(num, den, x, y) {
  const vars = formatVars(x, y);

  if (den === 1) {
    if (num === 1 && vars) return vars;
    return num + vars;
  }

  return {
    num: (num === 1 && vars) ? vars : num + vars,
    den: den
  };
}

// ===== 表示更新 =====
function updateDisplay() {
  numeratorEl.innerHTML = formatInput(numeratorInput);
  denominatorEl.innerHTML = denominatorInput;

  numeratorEl.classList.toggle("active", inputMode === "numerator");
  denominatorEl.classList.toggle("active", inputMode === "denominator");

  document.getElementById("modeButton").textContent =
    inputMode === "denominator"
      ? "分子へ"
      : "分母入力へ";
}

// ===== 入力処理 =====
function getCurrentInput() {
  return inputMode === "denominator" ? denominatorInput : numeratorInput;
}

function setCurrentInput(v) {
  if (inputMode === "denominator") {
    denominatorInput = v;
  } else {
    numeratorInput = v;
  }
}

function handleInput(val) {
  if (val === "MODE") {
    inputMode = inputMode === "denominator" ? "numerator" : "denominator";
    updateDisplay();
    return;
  }

  if (val === "OK") {
    checkAnswer();
    return;
  }

  let current = getCurrentInput();

  if (val === "消") {
    current = current.slice(0, -1);

} else if (val.startsWith("○")) {
  const power = val.slice(1);
  if (/[xy]$/.test(current)) current += power;

  } else {
    current += val;
  }

  setCurrentInput(current);
  updateDisplay();
}
function formatInput(str) {
  return str
    .replace(/x/g, '<span class="var">x</span>')
    .replace(/y/g, '<span class="var">y</span>');
}
// ===== パース =====
function parseMonomial(str, denStr) {
  if (!str) return null;

  let coefMatch = str.match(/^\d+/);
  let coef = coefMatch ? parseInt(coefMatch[0]) : 1;

  let x = 0, y = 0;

  const xMatch = str.match(/x([²³⁴⁵⁶])?/);
  const yMatch = str.match(/y([²³⁴⁵⁶])?/);

  const rev = { "²":2,"³":3,"⁴":4,"⁵":5,"⁶":6 };

  if (xMatch) x = xMatch[1] ? rev[xMatch[1]] : 1;
  if (yMatch) y = yMatch[1] ? rev[yMatch[1]] : 1;

  const den = denStr ? parseInt(denStr) : 1;

  return { coef, den, x, y };
}

// ===== 問題生成 =====
function newQuestion() {
  let op = Math.random() < 0.5 ? "×" : "÷";

let leftFrac = simplify(rand(1, 9), rand(2, 12));
let rightFrac = simplify(rand(1, 9), rand(2, 12));

let a = leftFrac.num;
let b = leftFrac.den;
let c = rightFrac.num;
let d = rightFrac.den;

let [x1, y1] = randomExponentSum(6);
let [x2, y2] = randomExponentSum(6);

  let num, den, rx, ry;

if (op === "×") {
  num = a * c;
  den = b * d;
  rx = x1 + x2;
  ry = y1 + y2;

} else {
  num = a * d;
  den = b * c;

  if (x1 < x2 || y1 < y2) return newQuestion();

  rx = x1 - x2;
  ry = y1 - y2;
}

if (rx > 6 || ry > 6) return newQuestion();

  const simp = simplify(num, den);

  correctAnswer = {
    coef: simp.num,
    den: simp.den,
    x: rx,
    y: ry
  };

  const left = formatMonomial(a, b, x1, y1);
  const right = formatMonomial(c, d, x2, y2);

  questionEl.innerHTML = renderQuestion(left, op, right);

  numeratorInput = "";
  denominatorInput = "";
  inputMode = "denominator";
  updateDisplay();
}

function renderFraction(m) {
  if (typeof m === "string") return m;

  return `
    <span class="qFrac">
      <span class="qNum">${m.num}</span>
      <span class="qLine"></span>
      <span class="qDen">${m.den}</span>
    </span>
  `;
}

function renderQuestion(left, op, right) {
  return `${renderFraction(left)} ${op} ${renderFraction(right)}`;
}

// ===== トースト =====
function showToast(message, type="") {
  toast.textContent = message;
  toast.className = "show " + type;

  setTimeout(() => {
    toast.className = "";
  }, 1500);
}

// ===== 採点 =====
function checkAnswer() {
  const c = correctAnswer;

  // 分母1なのに入力したら不正解
  if (c.den === 1 && denominatorInput.trim() !== "") {
    showToast("分母1は書かないよ！", "error");
    return;
  }

  // 分母が必要なのに空欄
  if (c.den !== 1 && denominatorInput.trim() === "") {
    showToast("分母を入力しよう！", "error");
    return;
  }

  const user = parseMonomial(numeratorInput, denominatorInput);

  if (!user) {
    showToast("入力してください", "error");
    return;
  }

  const ok =
    user.coef === c.coef &&
    user.den === c.den &&
    user.x === c.x &&
    user.y === c.y;

  if (ok) {
    showToast("正解！よくできました！", "success");
    newQuestion();
  } else {
    showToast("おしい！もう一度！", "error");
  }
}

// ===== 初期化 =====
newQuestion();
updateDisplay();
