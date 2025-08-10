let questions = [];
let currentIndex = 0;
let sessionAnswers = [];
let fullHistory = [];
let state = "answering"; // "answering" | "feedback" | "summary"

let questionEl, answerInput, submitBtn, nextBtn, feedbackEl, restartBtn;

async function loadQuestions() {
  try {
    const res = await fetch('data/questions.json');
    if (!res.ok) throw new Error('Failed to load questions.json');
    questions = await res.json();
    loadHistory();
    startSession();
  } catch (err) {
    document.getElementById('question').textContent = 'Error loading questions.';
    console.error(err);
  }
}

function loadHistory() {
  const stored = localStorage.getItem('quizHistory');
  if (stored) {
    fullHistory = JSON.parse(stored);
  } else {
    fullHistory = questions.map(q => ({ id: q.id, history: [] }));
  }
}

function saveHistory() {
  localStorage.setItem('quizHistory', JSON.stringify(fullHistory));
}

function startSession() {
  currentIndex = 0;
  sessionAnswers = [];
  displayQuestion();
}

function displayQuestion() {
  if (questions.length === 0) return;
  const q = questions[currentIndex];
  questionEl.textContent = q.question;
  answerInput.value = '';
  feedbackEl.textContent = '';
  nextBtn.disabled = true;
  answerInput.disabled = false;
  submitBtn.disabled = false;
  answerInput.focus();
  state = "answering";
}

function checkAnswer() {
  const userAnswer = answerInput.value.trim();
  const correctAnswer = questions[currentIndex].answer.trim();

  if (userAnswer === '') return;

  const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

  sessionAnswers[currentIndex] = {
    id: questions[currentIndex].id,
    userAnswer: userAnswer,
    correct: isCorrect ? 1 : 0,
    timestamp: new Date().toISOString()
  };

  if (isCorrect) {
    feedbackEl.textContent = `✅ Correct! The answer is "${correctAnswer}".`;
    feedbackEl.style.color = 'green';
  } else {
    feedbackEl.textContent = `❌ Wrong. You said "${userAnswer}", correct is "${correctAnswer}".`;
    feedbackEl.style.color = 'red';
  }

  answerInput.disabled = true;
  submitBtn.disabled = true;
  nextBtn.disabled = false;

  if (currentIndex >= questions.length - 1) {
    nextBtn.textContent = "Show Summary";
  } else {
    nextBtn.textContent = "Next Question";
  }

  state = "feedback";
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    displayQuestion();
  } else {
    showSummary();
  }
}

function highlightDifferences(userAnswer, correctAnswer) {
  let highlightedUser = '';
  let highlightedCorrect = '';

  const maxLen = Math.max(userAnswer.length, correctAnswer.length);

  for (let i = 0; i < maxLen; i++) {
    const userChar = userAnswer[i] || '';
    const correctChar = correctAnswer[i] || '';

    if (userChar !== correctChar) {
      if (userChar) {
        highlightedUser += `<span style="background-color:#ffcccc;">${userChar}</span>`;
      }
      if (correctChar) {
        highlightedCorrect += `<span style="background-color:#ccffcc;">${correctChar}</span>`;
      }
    } else {
      highlightedUser += userChar;
      highlightedCorrect += correctChar;
    }
  }

  return { highlightedUser, highlightedCorrect };
}


function showSummary() {
  const correctCount = sessionAnswers.filter(a => a.correct === 1).length;
  const total = questions.length;

  let summaryHTML = `<h3>Session Complete! ✅ ${correctCount} / ${total} correct.</h3>`;
  
  // Table header
  summaryHTML += `
    <table border="1" style="margin: 1em auto; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Question</th>
          <th>Your Answer</th>
          <th>Correct Answer</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Table rows
  sessionAnswers.forEach((result) => {
    const q = questions.find(q => q.id === result.id);
    const userAnswer = result.userAnswer || "(blank)";
    const isCorrect = result.correct === 1;

    let displayUser = userAnswer;
    let displayCorrect = q.answer;

    if (!isCorrect) {
      const diff = highlightDifferences(userAnswer, q.answer);
      displayUser = diff.highlightedUser;
      displayCorrect = diff.highlightedCorrect;
    }

    summaryHTML += `
      <tr>
        <td>${q.question}</td>
        <td>${displayUser}</td>
        <td>${displayCorrect}</td>
        <td style="color:${isCorrect ? 'green' : 'red'};">
          ${isCorrect ? '✔️' : '❌'}
        </td>
      </tr>
    `;
  });

  summaryHTML += `</tbody></table>`;
  
  // Buttons
  summaryHTML += `<button id="exportResults">Export Results</button>
                  <button id="restart">Start Again</button>`;

  const container = document.querySelector('.container');
  container.innerHTML = summaryHTML;

  mergeSessionIntoHistory();
  saveHistory();

  document.getElementById('restart').addEventListener('click', restartQuiz);
  document.getElementById('exportResults').addEventListener('click', exportResults);

  state = "summary";
}

function exportResults() {
  const blob = new Blob([JSON.stringify(fullHistory, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quiz_history_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function restartQuiz() {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <h2 id="question">Loading...</h2>
    <input type="text" id="answer" placeholder="Type your answer here"/>
    <div>
      <button id="submitAnswer">Enter</button>
      <button id="nextQuestion">Next Question</button>
    </div>
    <p class="feedback" id="feedback"></p>
    <button id="restart">Start Again</button>
  `;
  relinkElements();
  startSession();
}

function relinkElements() {
  questionEl = document.getElementById('question');
  answerInput = document.getElementById('answer');
  submitBtn = document.getElementById('submitAnswer');
  nextBtn = document.getElementById('nextQuestion');
  feedbackEl = document.getElementById('feedback');
  restartBtn = document.getElementById('restart');

  submitBtn.addEventListener('click', checkAnswer);
  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', restartQuiz);

  // Single Enter key listener
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault(); // stop accidental form submits
      if (state === "answering") {
        checkAnswer();
      } else if (state === "feedback") {
        nextQuestion();
      } else if (state === "summary") {
        restartQuiz();
        answerInput.focus();
      }
    }
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  relinkElements();
  loadQuestions();
});

