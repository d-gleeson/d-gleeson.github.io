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

function showSummary() {
  const correctCount = sessionAnswers.filter(a => a.isCorrect).length;
  const total = questions.length;

  // Create summary HTML
  let summaryHTML = `<h3>Session Complete! ✅ ${correctCount} / ${total} correct.</h3>`;
  summaryHTML += `<table border="1" cellpadding="5" cellspacing="0" style="margin-top:10px; border-collapse: collapse; width: 100%;">
                    <tr>
                      <th>Question</th>
                      <th>Your Answer</th>
                      <th>Correct Answer</th>
                      <th>Result</th>
                    </tr>`;
  
  sessionAnswers.forEach(entry => {
    summaryHTML += `<tr>
                      <td>${entry.question}</td>
                      <td>${entry.userAnswer}</td>
                      <td>${entry.correctAnswer}</td>
                      <td style="text-align:center;">${entry.isCorrect ? '✅' : '❌'}</td>
                    </tr>`;
  });

  summaryHTML += `</table>`;

  // Replace main container content
  const container = document.querySelector('.container');
  container.innerHTML = summaryHTML + `<button id="restart">Start Again</button>`;
  mergeSessionIntoHistory();
  saveHistory();


  // Add restart listener again (since we replaced HTML)
  document.getElementById('restart').addEventListener('click', restartQuiz);
}

function mergeSessionIntoHistory() {
  sessionAnswers.forEach(result => {
    const questionHistory = fullHistory.find(q => q.id === result.id);
    if (questionHistory) {
      questionHistory.history.push({
        correct: result.correct,
        timestamp: result.timestamp
      });
    }
  });
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

