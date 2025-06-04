// ====== Node.js 伺服器功能（原 server.js 內容） ======
// 若此檔案以 Node.js 執行，可啟動 Express 伺服器
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3000;
  app.use(express.static('public'));
  app.listen(port, () => {
    console.log(`伺服器運行中：http://localhost:${port}`);
  });
}

// 主程式 for 合併版線上測驗
let allQuestions = [];
let selectedQuestions = [];
let userAnswers = [];
let chapterMap = {};

const titles = {
  erp: 'ERP 規劃師線上測驗',
  rz: '人資題庫測驗'
};

const quizTypeSelect = document.getElementById('quiz-type');
const quizTitle = document.getElementById('quiz-title');
const chapterCheckboxes = document.getElementById('chapter-checkboxes');

function fetchQuestions(type) {
  const file = type === 'erp' ? '../erp-question.json' : '../rz-question.json';
  fetch(file)
    .then(res => res.json())
    .then(data => {
      allQuestions = data;
      buildChapterSelect(type);
    });
}

function buildChapterSelect(type) {
  chapterMap = {};
  if (type === 'rz') {
    // 只顯示第7、9、10、12章
    const showChapters = ['第7章', '第9章', '第10章', '第12章'];
    allQuestions.forEach(q => {
      const chName = q.chapter.match(/^第\d+章/);
      if (chName && showChapters.includes(chName[0])) {
        chapterMap[q.chapter] = q.questions.length;
      }
    });
  } else {
    allQuestions.forEach(q => {
      chapterMap[q.chapter] = q.questions.length;
    });
  }
  chapterCheckboxes.innerHTML = '';
  Object.keys(chapterMap).forEach((ch, idx) => {
    const id = 'chapter_cb_' + idx;
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.marginRight = '0';
    label.style.marginBottom = '8px';
    label.style.color = '#fff';
    label.style.position = 'relative';
    label.style.background = 'transparent';
    label.style.borderRadius = '6px';
    label.style.padding = '6px 8px 6px 0';
    label.style.transition = 'background 0.2s';
    label.onmouseover = () => label.style.background = 'rgba(90,110,140,0.10)';
    label.onmouseleave = () => label.style.background = 'transparent';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = ch;
    cb.id = id;
    cb.style.marginLeft = '12px';
    label.appendChild(cb);
    const match = ch.match(/^(.*?)(\d+)\s*題$/);
    let displayText = ch;
    let countText = '';
    if (match) {
      displayText = match[1].trim();
      countText = `（${match[2]}題）`;
    } else {
      displayText = ch;
      countText = '';
    }
    const leftSpan = document.createElement('span');
    leftSpan.textContent = ' ' + displayText;
    leftSpan.style.flex = '1';
    leftSpan.style.minWidth = '0';
    leftSpan.style.paddingRight = '80px';
    leftSpan.style.fontSize = '1.05em';
    const rightSpan = document.createElement('span');
    rightSpan.textContent = countText;
    rightSpan.className = 'chapter-count';
    rightSpan.style.position = 'absolute';
    rightSpan.style.right = '18px';
    rightSpan.style.minWidth = '60px';
    rightSpan.style.textAlign = 'right';
    rightSpan.style.color = '#e8e8f0';
    rightSpan.style.fontWeight = '400';
    rightSpan.style.fontSize = '0.98em';
    label.appendChild(leftSpan);
    label.appendChild(rightSpan);
    chapterCheckboxes.appendChild(label);
  });
}

quizTypeSelect.addEventListener('change', function() {
  const type = this.value;
  quizTitle.textContent = titles[type];
  fetchQuestions(type);
});

// ===== 自動偵測模式（合併 or 單一人資題庫） =====
(function() {
  const selectArea = document.querySelector('.select-area');
  const quizTypeSelect = document.getElementById('quiz-type');
  const quizTitle = document.getElementById('quiz-title');
  if (!selectArea || !quizTypeSelect) {
    // 單一人資題庫模式
    if (quizTitle) quizTitle.textContent = '人資題庫測驗';
    fetch('../rz-question.json')
      .then(res => res.json())
      .then(data => {
        allQuestions = data;
        buildChapterSelect('rz');
      });
    // 隱藏選擇測驗區塊
    if (selectArea) selectArea.style.display = 'none';
  }
})();

// ====== 開始答題、顯示題目、檢查答案 ======
document.getElementById('start-btn').onclick = function() {
  // 隱藏選擇測驗與章節區塊
  document.querySelector('.select-area').style.display = 'none';
  document.getElementById('setup-section').style.display = 'none';

  const checkboxes = document.querySelectorAll('#chapter-checkboxes input[type=checkbox]:checked');
  const chapters = Array.from(checkboxes).map(cb => cb.value);
  const n = parseInt(document.getElementById('question-count').value);
  if (chapters.length === 0) {
    alert('請選擇至少一個章節');
    // 顯示回來
    document.querySelector('.select-area').style.display = '';
    document.getElementById('setup-section').style.display = '';
    return;
  }
  let pool = [];
  allQuestions.forEach(chap => {
    if (chapters.includes(chap.chapter)) {
      pool = pool.concat(chap.questions);
    }
  });
  if (pool.length < n) {
    alert('選擇的章節題目數不足');
    // 顯示回來
    document.querySelector('.select-area').style.display = '';
    document.getElementById('setup-section').style.display = '';
    return;
  }
  selectedQuestions = shuffle(pool).slice(0, n);
  userAnswers = Array(n).fill(null);
  showQuiz();
};

function showQuiz() {
  document.getElementById('setup-section').style.display = 'none';
  const quizSection = document.getElementById('quiz-section');
  quizSection.innerHTML = '';
  selectedQuestions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'quiz-question';
    div.style.background = 'rgba(255,255,255,0.15)';
    div.style.color = '#fff';
    div.style.backdropFilter = 'blur(6px)';
    div.style.borderRadius = '12px';
    div.style.marginBottom = '24px';
    div.style.padding = '24px';
    // 題目粗體
    const titleDiv = document.createElement('div');
    titleDiv.className = 'question-title';
    titleDiv.innerHTML = `<b>${idx+1}. ${q.question}</b>`;
    div.appendChild(titleDiv);
    // 顯示選項
    const form = document.createElement('form');
    q.options.forEach((opt, i) => {
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.padding = '14px 16px';
      label.style.marginBottom = '12px';
      label.style.cursor = 'pointer';
      label.style.color = 'var(--text-main)';
      label.style.transition = 'background 0.18s, color 0.18s';
      label.style.border = '1px solid transparent';
      label.style.borderRadius = '8px';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${idx}`;
      input.value = i;
      input.onchange = () => {
        userAnswers[idx] = i;
        // 先移除同組所有 label 的高亮
        form.querySelectorAll('label').forEach(lab => {
          lab.style.background = 'rgba(67, 217, 188, 0.06)';
          lab.style.color = 'var(--text-main)';
          lab.style.border = '1px solid transparent';
        });
        // 高亮目前選到的
        label.style.background = 'linear-gradient(90deg,rgb(44, 53, 187) 10%, #e0e7fa 100%)';
        label.style.color = '#198080';
        label.style.border = '1.5px solid #43d9bc';
      };
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + opt));
      form.appendChild(label);
    });
    div.appendChild(form);
    quizSection.appendChild(div);
  });
  // 檢查答案與返回按鈕區塊
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.justifyContent = 'space-between';
  btnRow.style.gap = '18px';
  btnRow.style.marginTop = '18px';

  // 檢查答案按鈕
  const btn = document.createElement('button');
  btn.textContent = '檢查答案';
  btn.style.flex = '1';
  btn.onclick = function(e) {
    e.preventDefault();
    checkAnswers();
  };
  btnRow.appendChild(btn);

  // 返回按鈕
  const backBtn = document.createElement('button');
  backBtn.textContent = '返回選擇題目';
  backBtn.style.flex = '1';
  backBtn.onclick = function(e) {
    e.preventDefault();
    if (confirm('確定要返回選擇題目嗎？目前作答內容將會消失。')) {
      document.querySelector('.select-area').style.display = '';
      document.getElementById('setup-section').style.display = '';
      document.getElementById('quiz-section').style.display = 'none';
      document.getElementById('result-section').style.display = 'none';
      userAnswers = [];
    }
  };
  btnRow.appendChild(backBtn);

  quizSection.appendChild(btnRow);

  quizSection.style.display = '';
  document.getElementById('result-section').style.display = 'none';
}

function checkAnswers() {
  let correct = 0;
  let wrongList = [];
  const quizSection = document.getElementById('quiz-section');
  quizSection.querySelectorAll('.quiz-question').forEach((div, idx) => {
    const q = selectedQuestions[idx];
    const userAns = userAnswers[idx];
    const labels = div.querySelectorAll('label');
    labels.forEach((label, i) => {
      label.style.background = '';
      label.style.color = '#fff';
      if (userAns !== q.answer && i === userAns) {
        label.style.background = '#e74c3c';
        label.style.color = '#fff';
        label.style.borderRadius = '6px';
        label.style.padding = '4px 8px';
      }
    });
    if (userAns === q.answer) correct++;
    else wrongList.push({idx, q, userAns});
  });
  // 美化答對率顯示
  const resultSection = document.getElementById('result-section');
  resultSection.innerHTML = `<div style="background:rgba(200,200,200,0.25);color:#222;font-size:1.25rem;font-weight:bold;padding:12px 0;margin:32px 0 24px 0;border-radius:16px;text-align:center;letter-spacing:2px;">答對率：${correct} / ${selectedQuestions.length}（${Math.round(correct/selectedQuestions.length*100)}%）</div>`;
  if (wrongList.length > 0) {
    // 訂正題目區塊
    wrongList.forEach(item => {
      const box = document.createElement('div');
      box.style.background = 'rgba(180,180,180,0.18)';
      box.style.borderRadius = '12px';
      box.style.marginBottom = '24px';
      box.style.padding = '24px';
      box.style.color = '#fff';
      box.style.textAlign = 'left';
      box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      // 題目
      const qDiv = document.createElement('div');
      qDiv.style.fontWeight = 'bold';
      qDiv.style.marginBottom = '12px';
      qDiv.style.color = '#fff';
      qDiv.textContent = `第${item.idx+1}題：${item.q.question}`;
      box.appendChild(qDiv);
      // 你的答案
      const yourAnsDiv = document.createElement('div');
      yourAnsDiv.style.marginBottom = '6px';
      yourAnsDiv.innerHTML = `<span style='color:#e74c3c;font-weight:bold;'>你的答案：</span> <span style='color:#fff;'>${item.q.options[item.userAns] || '未作答'}</span>`;
      box.appendChild(yourAnsDiv);
      // 正確答案
      const correctAnsDiv = document.createElement('div');
      correctAnsDiv.innerHTML = `<span style='color:#27ae60;font-weight:bold;'>正確答案：</span> <span style='color:#fff;'>${item.q.options[item.q.answer]}</span>`;
      box.appendChild(correctAnsDiv);
      resultSection.appendChild(box);
    });
  }
  resultSection.style.display = '';
}

function shuffle(arr) {
  return arr.map(a => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
}

// ===== 深淺色主題切換 =====
const themeToggle = document.getElementById('theme-toggle-checkbox');
const root = document.documentElement;

// 進站預設自動偵測系統色調
if (
  localStorage.getItem('theme') === 'dark' ||
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  root.setAttribute('data-theme', 'dark');
  themeToggle.checked = true;
} else {
  root.setAttribute('data-theme', 'light');
  themeToggle.checked = false;
}

// 切換開關
if (themeToggle) {
  themeToggle.addEventListener('change', function () {
    if (this.checked) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  });
}

// ====== 全選章節按鈕功能 ======
document.getElementById('select-all-chapters-btn').onclick = function() {
  // 勾選所有章節
  const checkboxes = document.querySelectorAll('#chapter-checkboxes input[type=checkbox]');
  checkboxes.forEach(cb => cb.checked = true);
  // 計算總題數
  let total = 0;
  allQuestions.forEach(q => {
    if (Object.keys(chapterMap).includes(q.chapter)) {
      total += q.questions.length;
    }
  });
  document.getElementById('question-count').value = total;
};

document.getElementById('unselect-all-chapters-btn').onclick = function() {
  // 取消所有章節勾選
  const checkboxes = document.querySelectorAll('#chapter-checkboxes input[type=checkbox]');
  checkboxes.forEach(cb => cb.checked = false);
  // 清空題目數量
  document.getElementById('question-count').value = '';
};

// ===== 字體與畫面縮放控制 =====
(function() {
  let fontSize = 1.0;
  let wrapperScale = 1.0;
  const minFont = 0.8;
  const maxFont = 1.4;
  const minScale = 0.85;
  const maxScale = 1.18;
  const root = document.documentElement;
  const wrapper = document.querySelector('.wrapper');
  const plusBtn = document.getElementById('font-size-plus');
  const minusBtn = document.getElementById('font-size-minus');
  function applyScale() {
    root.style.fontSize = (fontSize * 100) + '%';
    if(wrapper) wrapper.style.transform = `scale(${wrapperScale})`;
    if(wrapper) wrapper.style.transition = 'transform 0.2s';
  }
  plusBtn.onclick = function() {
    if(fontSize < maxFont) fontSize += 0.06;
    if(wrapperScale < maxScale) wrapperScale += 0.04;
    applyScale();
  };
  minusBtn.onclick = function() {
    if(fontSize > minFont) fontSize -= 0.06;
    if(wrapperScale > minScale) wrapperScale -= 0.04;
    applyScale();
  };
})();

// ====== 已答過題目記錄功能 ======
function getAnsweredSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem('answeredQuestions') || '[]'));
  } catch { return new Set(); }
}
function saveAnsweredSet(set) {
  localStorage.setItem('answeredQuestions', JSON.stringify(Array.from(set)));
}
function markQuestionsAsAnswered(questions) {
  const set = getAnsweredSet();
  questions.forEach(q => set.add(qKey(q)));
  saveAnsweredSet(set);
}
function qKey(q) {
  // 用章節+題目內容唯一標示
  return (q.chapter || '') + '::' + q.question;
}
function filterUnanswered(pool) {
  if (!document.getElementById('only-unanswered-checkbox')?.checked) return pool;
  const set = getAnsweredSet();
  return pool.filter(q => !set.has(qKey(q)));
}
function resetAnswered() {
  localStorage.removeItem('answeredQuestions');
  alert('已重置已答過題目紀錄！');
}
// ====== 章節勾選自動更新題目數量 ======
function updateQuestionCountByChapters() {
  const checkboxes = document.querySelectorAll('#chapter-checkboxes input[type=checkbox]:checked');
  const chapters = Array.from(checkboxes).map(cb => cb.value);
  let total = 0;
  allQuestions.forEach(chap => {
    if (chapters.includes(chap.chapter)) total += chap.questions.length;
  });
  document.getElementById('question-count').value = total || '';
}
// ====== 章節勾選監聽 ======
function addChapterCheckboxListeners() {
  document.querySelectorAll('#chapter-checkboxes input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', updateQuestionCountByChapters);
  });
}
// ====== 修改 buildChapterSelect 讓章節勾選後自動更新題數 ======
const _origBuildChapterSelect = buildChapterSelect;
buildChapterSelect = function(type) {
  _origBuildChapterSelect(type);
  addChapterCheckboxListeners();
  updateQuestionCountByChapters();
}
// ====== 修改全選/取消全選按鈕，勾選後自動更新題數 ======
document.getElementById('select-all-chapters-btn').onclick = function() {
  const checkboxes = document.querySelectorAll('#chapter-checkboxes input[type=checkbox]');
  checkboxes.forEach(cb => cb.checked = true);
  updateQuestionCountByChapters();
};
document.getElementById('unselect-all-chapters-btn').onclick = function() {
  const checkboxes = document.querySelectorAll('#chapter-checkboxes input[type=checkbox]');
  checkboxes.forEach(cb => cb.checked = false);
  updateQuestionCountByChapters();
};
// ====== 修改開始答題，支援只出未答過題目 ======
const _origStartBtn = document.getElementById('start-btn').onclick;
document.getElementById('start-btn').onclick = function() {
  document.querySelector('.select-area').style.display = 'none';
  document.getElementById('setup-section').style.display = 'none';
  const checkboxes = document.querySelectorAll('#chapter-checkboxes input[type=checkbox]:checked');
  const chapters = Array.from(checkboxes).map(cb => cb.value);
  const n = parseInt(document.getElementById('question-count').value);
  if (chapters.length === 0) {
    alert('請選擇至少一個章節');
    document.querySelector('.select-area').style.display = '';
    document.getElementById('setup-section').style.display = '';
    return;
  }
  let pool = [];
  allQuestions.forEach(chap => {
    if (chapters.includes(chap.chapter)) {
      pool = pool.concat(chap.questions.map(q => ({...q, chapter: chap.chapter})));
    }
  });
  pool = filterUnanswered(pool);
  if (pool.length < n) {
    alert('選擇的章節題目數不足（未答過題目僅剩 ' + pool.length + ' 題）');
    document.querySelector('.select-area').style.display = '';
    document.getElementById('setup-section').style.display = '';
    return;
  }
  selectedQuestions = shuffle(pool).slice(0, n);
  userAnswers = Array(n).fill(null);
  showQuiz();
};
// ====== 修改檢查答案，作答後記錄已答過題目 ======
const _origCheckAnswers = checkAnswers;
checkAnswers = function() {
  _origCheckAnswers();
  markQuestionsAsAnswered(selectedQuestions);
};
 