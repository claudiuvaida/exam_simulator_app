const EXAM_CONFIG = {
  "Economie": 5,
  "Management General": 20,
  "Managementul Afacerilor": 10,
  "Managementul R. U.": 10,
};

let state = { mode: null, questions: [], index: 0, answers: [], locked: false };
let learnState = { category: null, questions: [], index: 0 };

const $ = id => document.getElementById(id);
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const categories = () => [...new Set(QUESTIONS.map(q => q.category))];
const byCat = cat => QUESTIONS.filter(q => q.category === cat);

function hideAll(){ ["start","quiz","learn","result"].forEach(id => $(id).classList.add("hidden")); }
function goHome(){
  hideAll();
  $("start").classList.remove("hidden");
  $("practicePicker").classList.add("hidden");
  $("learnPicker").classList.add("hidden");
  updateScore();
}
function updateScore(){
  $("modeLabel").textContent = state.mode || "Alege modul";
  if(state.mode === "Simulare examen"){
    const correct = state.answers.filter(a => a && a.correct).length;
    $("scoreLabel").textContent = `${10 + correct * 2} pct`;
  } else if(state.mode && state.mode.startsWith("Practică")) {
    $("scoreLabel").textContent = "Practică";
  } else if(state.mode && state.mode.startsWith("Învățare")) {
    $("scoreLabel").textContent = "Învățare";
  } else $("scoreLabel").textContent = "—";
}

function startExam(){
  const selected = [];
  for(const [cat, count] of Object.entries(EXAM_CONFIG)){
    selected.push(...shuffle(byCat(cat)).slice(0, count));
  }
  state = { mode: "Simulare examen", questions: shuffle(selected), index: 0, answers: [], locked: false };
  showQuestion();
}

function showPractice(){
  $("learnPicker").classList.add("hidden");
  $("categoryButtons").innerHTML = categories().map(cat => `<button onclick="startPractice('${escapeForJs(cat)}')">${escapeHtml(cat)}<small>${byCat(cat).length} întrebări</small></button>`).join("");
  $("practicePicker").classList.remove("hidden");
}

function startPractice(cat){
  state = { mode: `Practică: ${cat}`, questions: shuffle(byCat(cat)), index: 0, answers: [], locked: false };
  showQuestion();
}

function showQuestion(){
  hideAll(); $("quiz").classList.remove("hidden");
  state.locked = false;
  const q = state.questions[state.index];
  const total = state.questions.length;
  $("progressText").textContent = `Întrebarea ${state.index + 1} din ${total}`;
  $("progressBar").style.width = `${((state.index + 1) / total) * 100}%`;
  $("qCategory").textContent = q.category;
  $("qNumber").textContent = `Nr. ${q.nr}`;
  $("questionText").textContent = q.question;
  $("feedback").className = "feedback hidden";
  $("feedback").innerHTML = "";
  $("nextBtn").disabled = true;
  $("nextBtn").textContent = state.index === total - 1 ? "Vezi rezultatul" : "Următoarea";
  $("answers").innerHTML = q.answers.map(a => `<button class="answer" onclick="chooseAnswer('${a.key}')"><b>${a.key}.</b> ${escapeHtml(a.text)}</button>`).join("");
  updateScore();
}

function chooseAnswer(key){
  if(state.locked) return;
  state.locked = true;
  const q = state.questions[state.index];
  const correct = key === q.correct;
  state.answers[state.index] = { id: q.id, chosen: key, correct };
  [...document.querySelectorAll(".answer")].forEach(btn => {
    const k = btn.textContent.trim()[0];
    if(k === q.correct) btn.classList.add("good");
    if(k === key && !correct) btn.classList.add("bad");
    btn.disabled = true;
  });
  $("feedback").className = `feedback ${correct ? "ok" : "no"}`;
  $("feedback").innerHTML = correct
    ? `Corect ✅ Răspuns: <b>${q.correct}</b> — ${escapeHtml(q.correctText)}`
    : `Greșit ❌ Ai ales <b>${key}</b>. Corect era <b>${q.correct}</b> — ${escapeHtml(q.correctText)}`;
  $("nextBtn").disabled = false;
  updateScore();
}

function nextQuestion(){
  if(state.index < state.questions.length - 1){ state.index++; showQuestion(); }
  else finishQuiz();
}

function finishQuiz(){
  hideAll(); $("result").classList.remove("hidden");
  const correct = state.answers.filter(a => a && a.correct).length;
  const total = state.questions.length;
  const score = state.mode === "Simulare examen" ? 10 + correct * 2 : null;
  $("result").innerHTML = `
    <h2>Rezultat</h2>
    <p class="big">${correct} / ${total} răspunsuri corecte</p>
    ${score !== null ? `<p class="big">Punctaj: <b>${score} / 100</b></p>` : `<p>Mod practică: fără punctaj.</p>`}
    <div class="actions"><button onclick="goHome()">Alege alt test</button><button class="ghost" onclick="state.index=0; state.answers=[]; showQuestion()">Reia aceleași întrebări</button></div>
  `;
  updateScore();
}

function showLearn(){
  $("practicePicker").classList.add("hidden");
  $("learnCategoryButtons").innerHTML = categories().map(cat => `<button onclick="startLearn('${escapeForJs(cat)}')">${escapeHtml(cat)}<small>${byCat(cat).length} întrebări</small></button>`).join("");
  $("learnPicker").classList.remove("hidden");
}

function startLearn(cat){
  learnState = { category: cat, questions: byCat(cat), index: 0 };
  state.mode = `Învățare: ${cat}`;
  renderLearnSelectors();
  showLearnQuestion();
}

function renderLearnSelectors(){
  const catOptions = categories().map(cat => `<option value="${escapeHtml(cat)}" ${cat === learnState.category ? "selected" : ""}>${escapeHtml(cat)}</option>`).join("");
  $("learnCategorySelect").innerHTML = catOptions;
  $("learnJump").innerHTML = learnState.questions.map((q, i) => `<option value="${i}" ${i === learnState.index ? "selected" : ""}>${i + 1}. Nr. ${q.nr}</option>`).join("");
}

function showLearnQuestion(){
  hideAll(); $("learn").classList.remove("hidden");
  const q = learnState.questions[learnState.index];
  renderLearnSelectors();
  $("learnCategory").textContent = q.category;
  $("learnNumber").textContent = `Întrebarea ${learnState.index + 1} din ${learnState.questions.length} · Nr. ${q.nr}`;
  $("learnQuestionText").textContent = q.question;
  $("learnAnswers").innerHTML = q.answers.map(a => {
    const cls = a.key === q.correct ? "answer good static-answer" : "answer static-answer";
    const mark = a.key === q.correct ? " ✅" : "";
    return `<div class="${cls}"><b>${a.key}.</b> ${escapeHtml(a.text)}${mark}</div>`;
  }).join("");
  $("learnCorrect").innerHTML = `Răspuns corect: <b>${q.correct}</b> — ${escapeHtml(q.correctText)}`;
  updateScore();
}

function jumpLearnQuestion(i){
  learnState.index = Math.max(0, Math.min(i, learnState.questions.length - 1));
  showLearnQuestion();
}
function prevLearnQuestion(){
  if(learnState.index > 0) learnState.index--;
  else learnState.index = learnState.questions.length - 1;
  showLearnQuestion();
}
function nextLearnQuestion(){
  if(learnState.index < learnState.questions.length - 1) learnState.index++;
  else learnState.index = 0;
  showLearnQuestion();
}

function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function escapeForJs(str){ return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }

goHome();
