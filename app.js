let questions = [];
let currentIndex = 0;

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
    currentIndex = 0;
    displayQuestion();
  } catch (err) {
    questionEl.textContent = 'Error loading questions.';
    console.error(err);
  }
}

function displayQuestion() {
  if (questions.length === 0) return;
  const q = questions[currentIndex];
  questionEl.textContent = q.question;
  answerInput.value = '';
  feedbackEl.textContent = '';
  nextBtn.disabled = true;
  answerInput.focus();
}

function checkAnswer() {
  const userAnswer = answerInput.value.trim().toLowerCase();
  const correctAnswer = questions[currentIndex].answer.trim().toLowerCase();
  
  if (userAnswer === '') return;

  if (userAnswer === correctAnswer) {
    feedbackEl.textContent = `✅ Correct! The answer is "${questions[currentIndex].answer}".`;
    feedbackEl.style.color = 'green';
  } else {
    feedbackEl.textContent = `❌ Wrong. You said "${answerInput.value}", correct is "${questions[currentIndex].answer}".`;
    feedbackEl.style.color = 'red';
  }

  // Enable "Next" unless we're at the last question
  nextBtn.disabled = (currentIndex >= questions.length - 1);
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    displayQuestion();
  }
  if (currentIndex >= questions.length - 1) {
    nextBtn.disabled = true;
  }
}

function restartQuiz() {
  currentIndex = 0;
  displayQuestion();
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

