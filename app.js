let questions = [];
let currentIndex = 0;
let sessionAnswers = []; // [{ question, userAnswer, correctAnswer, isCorrect }]

const questionEl = document.getElementById('question');
const answerInput = document.getElementById('answer');
const submitBtn = document.getElementById('submitAnswer');
const nextBtn = document.getElementById('nextQuestion');
const feedbackEl = document.getElementById('feedback');
const restartBtn = document.getElementById('restart');

// Fetch questions from JSON
async function loadQuestions() {
  try {
    const res = await fetch('data/questions.json');
    if (!res.ok) throw new Error('Failed to load questions.json');
    questions = await res.json();
    startSession();
  } catch (err) {
    questionEl.textContent = 'Error loading questions.';
    console.error(err);
  }
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
}

function checkAnswer() {
  const userAnswer = answerInput.value.trim();
  const correctAnswer = questions[currentIndex].answer.trim();
  
  if (userAnswer === '') return;

  const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

  // Store result
  sessionAnswers[currentIndex] = {
    question: questions[currentIndex].question,
    userAnswer,
    correctAnswer,
    isCorrect
  };

  if (isCorrect) {
    feedbackEl.textContent = `✅ Correct! The answer is "${correctAnswer}".`;
    feedbackEl.style.color = 'green';
  } else {
    feedbackEl.textContent = `❌ Wrong. You said "${userAnswer}", correct is "${correctAnswer}".`;
    feedbackEl.style.color = 'red';
  }

  // Disable further edits for this question
  answerInput.disabled = true;
  submitBtn.disabled = true;

  // Last question check
  if (currentIndex >= questions.length - 1) {
    nextBtn.disabled = false;
    nextBtn.textContent = "Show Summary";
  } else {
    nextBtn.disabled = false;
    nextBtn.textContent = "Next Question";
  }
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

  // Add restart listener again (since we replaced HTML)
  document.getElementById('restart').addEventListener('click', restartQuiz);
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

  // Re-link elements
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
  answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  });
  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', restartQuiz);
}

// Init
loadQuestions();

// First link
submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    checkAnswer();
  }
});
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartQuiz);

