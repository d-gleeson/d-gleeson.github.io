let allQuestions = [];
let questions = [];
let currentQuestionIndex = 0;
let sessionAnswers = [];
let historyData = [];
let state = "question"; // "question", "answer", "summary"

async function loadQuestions() {
  try {
    const res = await fetch('data/questions.json');
    if (!res.ok) throw new Error("Failed to load");
    allQuestions = await res.json();

    startNewSession();
  } catch (err) {
    document.querySelector('.container').innerHTML = "<p>Error loading questions.</p>";
    console.error(err);
  }
}

function startNewSession() {
  // Shuffle questions and pick max 20
  questions = [...allQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(10, allQuestions.length));

  currentQuestionIndex = 0;
  sessionAnswers = [];
  showQuestion();
}

// Highlight only wrong characters in user's answer
function highlightDifferences(userAnswer, correctAnswer) {
  let highlightedUser = '';
  const maxLen = Math.max(userAnswer.length, correctAnswer.length);

  for (let i = 0; i < maxLen; i++) {
    const userChar = userAnswer[i] || '';
    const correctChar = correctAnswer[i] || '';

    if (userChar !== correctChar) {
      if (userChar) {
        highlightedUser += `<span style="background-color:#ffcccc;">${userChar}</span>`;
      }
    } else {
      highlightedUser += userChar;
    }
  }
  return highlightedUser;
}

function showQuestion() {
  state = "question";
  const q = questions[currentQuestionIndex];
  const container = document.querySelector('.container');
  container.innerHTML = `
    <h3>Question ${currentQuestionIndex + 1} of ${questions.length}</h3>
    <p>${q.question}</p>
    <input type="text" id="answerInput" autofocus />
    <button id="submitBtn">Submit</button>
    <button id="restart">Start Again</button>
  `;
  document.getElementById('submitBtn').addEventListener('click', submitAnswer);
  document.getElementById('restart').addEventListener('click', restartQuiz);
  document.getElementById('answerInput').focus();
}

function submitAnswer() {
  const q = questions[currentQuestionIndex];
  const userAnswer = document.getElementById('answerInput').value.trim();
  const isCorrect = userAnswer.toLowerCase() === q.answer.toLowerCase();

  sessionAnswers.push({
    id: q.id,
    correct: isCorrect ? 1 : 0,
    timestamp: new Date().toISOString(),
    userAnswer
  });

  showAnswer(isCorrect, userAnswer, q.answer);
}

function showAnswer(isCorrect, userAnswer, correctAnswer) {
  state = "answer";
  const container = document.querySelector('.container');
  container.innerHTML = `
    <h3>${isCorrect ? "✅ Correct!" : "❌ Wrong!"}</h3>
    <p><strong>Your Answer:</strong> ${userAnswer}</p>
    <p><strong>Correct Answer:</strong> ${correctAnswer}</p>
    <button id="nextBtn">${currentQuestionIndex < questions.length - 1 ? "Next Question" : "View Summary"}</button>
    <button id="restart">Start Again</button>
  `;
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
  document.getElementById('restart').addEventListener('click', restartQuiz);
}

function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    showSummary();
  }
}

function showSummary() {
  const correctCount = sessionAnswers.filter(a => a.correct === 1).length;
  const total = questions.length;

  let summaryHTML = `<h3>Session Complete! ✅ ${correctCount} / ${total} correct.</h3>`;
  
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

  sessionAnswers.forEach((result) => {
    const q = questions.find(q => q.id === result.id);
    const isCorrect = result.correct === 1;
    let displayUser = result.userAnswer || "(blank)";
    const displayCorrect = q.answer;

    if (!isCorrect) {
      displayUser = highlightDifferences(displayUser, displayCorrect);
    }

    summaryHTML += `
      <tr>
        <td>${q.question}</td>
        <td>${displayUser}</td>
        <td>${displayCorrect}</td>
        <td style="color:${isCorrect ? 'green' : 'red'};">${isCorrect ? '✔️' : '❌'}</td>
      </tr>
    `;
  });

  summaryHTML += `</tbody></table>`;

  summaryHTML += `
    <button id="exportResults">Export Results</button>
    <button id="restart">Start Again</button>
  `;

  document.querySelector('.container').innerHTML = summaryHTML;

  mergeSessionIntoHistory();
  saveHistory();

  document.getElementById('restart').addEventListener('click', restartQuiz);
  document.getElementById('exportResults').addEventListener('click', exportResults);

  state = "summary";
}

function restartQuiz() {
  startNewSession();
}

function exportResults() {
  const blob = new Blob([JSON.stringify(historyData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quiz_results.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function mergeSessionIntoHistory() {
  sessionAnswers.forEach(session => {
    let existing = historyData.find(h => h.id === session.id);
    if (!existing) {
      existing = { id: session.id, history: [] };
      historyData.push(existing);
    }
    existing.history.push({
      correct: session.correct,
      timestamp: session.timestamp
    });
  });
}

function saveHistory() {
  localStorage.setItem('quizHistory', JSON.stringify(historyData));
}

function loadHistory() {
  const stored = localStorage.getItem('quizHistory');
  if (stored) {
    historyData = JSON.parse(stored);
  }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === "Enter") {
    if (state === "question") {
      submitAnswer();
    } else if (state === "answer") {
      nextQuestion();
    } else if (state === "summary") {
      restartQuiz();
    }
  }
});

loadHistory();
loadQuestions();
