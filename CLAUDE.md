# CLAUDE.md

## Project overview

Irish language quiz application. Users are shown a translation prompt (English → Irish) and must type the correct Irish answer. The app tracks session results and history in localStorage.

Hosted on GitHub Pages. No build step — vanilla HTML/CSS/JS only. Push to `master` to deploy.

---

## File map

| File | Purpose |
|------|---------|
| `index.html` | Main quiz UI — minimal skeleton (container div + script ref); no inline CSS |
| `style.css` | All application styles |
| `app.js` | All quiz logic — question loading, answer comparison, state machine, history |
| `data/questions.json` | Question database (20 questions, read at runtime via fetch) |
| `.gitignore` | Excludes Python `__pycache__/` and `.DS_Store` |
| `editor/index.html` | Minimal form UI for adding new questions |
| `editor/editor.js` | Builds form dynamically from questions.json schema; POSTs new records |
| `editor/server.py` | Local Python server; must be running to use the editor |

---

## Data schema — questions.json

```json
{
  "id": 1,                          // integer, required, auto-assigned by editor server
  "question": "Translate: ...",     // string, required
  "answer": "...",                  // string, required, compared case-insensitively
  "source": "NS.BI.6.7",           // string, optional — textbook reference
  "explanation": "..."              // string, optional — shown on wrong answer as tooltip
}
```

Optional fields should be omitted or set to `null` (not empty string). The `?` tooltip only appears when `explanation` is a non-null, non-empty value (guarded in `app.js` in both the answer view and the summary table).

---

## Running the editor (to add questions)

```bash
python3 editor/server.py
# then open http://localhost:8000/
```

- The editor reads the schema from the first record in questions.json to generate its form fields.
- Empty fields are submitted as `null`.
- `id` is auto-assigned (max existing id + 1). Never enter it manually.
- Press **Enter** on the last field or click Submit to save. Form clears for next entry.
- Stop with Ctrl+C when done.
- After adding questions, commit and push `data/questions.json` to deploy.

---

## App behaviour notes

- Session length: controlled by `SESSION_LENGTH` constant at top of `app.js` (currently 10)
- Questions are shuffled randomly each session
- Answer comparison is case-insensitive (`answer.trim().toLowerCase()`)
- `highlightDifferences(userAnswer, correctAnswer)` returns HTML with `<span class="char-wrong">` around incorrect characters — this is a pure function and is the core comparison logic
- State machine values: `"question"` | `"answer"` | `"summary"`
- History persisted to localStorage under key `"quizHistory"`

---

## Conventions

- No frameworks, no npm, no build step
- CSS lives in `style.css`; `index.html` is a minimal skeleton
- JS uses vanilla DOM APIs, no modules
- All user-visible text is hardcoded in JS (no i18n)
- GitHub Pages deployment: push to `master` branch

---

## Known issues / quirks

- Editor schema detection reads only the **first record** of questions.json. If a new field is added to later records but not the first, the editor won't show it.
- `Math.random() - 0.5` shuffle is not uniformly random (built-in quirk, acceptable for this use).
