let questions = [];
let currentIndex = 0;
let sessionAnswers = []; // Tracks whether each answer was correct (true/false)

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
  const userAnswer = answerInput.value.trim().toLowerCase();
  const correctAnswer = questions[currentIndex].answer.trim().toLowerCase();
  
  if (userAnswer === '') return;

  const isCorrect = userAnswer === correctAnswer;
  sessionAnswers[currentIndex] = isCorrect;

  if (isCorrect) {
    feedbackEl.textContent = `✅ Correct! The answer is "${questions[currentIndex].answer}".`;
    feedbackEl.style.color = 'green';
  } else {
    feedbackEl.textContent = `❌ Wrong. You said "${answerInput.value}", correct is "${questions[currentIndex].answer}".`;
    feedbackEl.style.color = 'red';
  }

  // Disable further edits for this question
  answerInput.disabled = true;
  submitBtn.disabled = true;

  // If last question → show summary button state
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
  const correctCount = sessionAnswers.filter(ans => ans).length;
  const total = questions.length;
  questionEl.textContent = `Session Complete! ✅ ${correctCount} / ${total} correct.`;
  answerInput.style.display = 'none';
  submitBtn.style.display = 'none';
  nextBtn.style.display = 'none';
  feedbackEl.textContent = '';
}

function restartQuiz() {
  answerInput.style.display = 'inline';
  submitBtn.style.display = 'inline-block';
  nextBtn.style.display = 'inline-block';
  nextBtn.textContent = 'Next Question';
  startSession();
}

// Event Listeners
submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    checkAnswer();
  }
});
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartQuiz);

// Init
loadQuestions();

