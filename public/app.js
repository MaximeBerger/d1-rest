import { THEMES } from "./data/themes.js";
import { ThemeQuizEngine } from "./core/engine.js";
// utils non requis ici

// Etat global de la session multi-thèmes
const state = {
  themes: THEMES.map(t => ({ id: t.id, label: t.label, done: false, score: null })),
  current: null, // { engine, id, label }
};

// Configuration API: envoi des résultats vers l'endpoint public du même Worker
const QCM_POST_URL = '/public/qcm';

// Infos session
let sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('session-' + Math.random().toString(36).slice(2));
let sessionStartedAt = null; // Date

// Elements DOM principaux 
const panel = document.getElementById('panel');
const container = document.getElementById('container');
const questionOverlay = document.getElementById('questionOverlay');
const answersOverlay = document.getElementById('answersOverlay');

// Helper pour cibler la section Statistiques du panneau
function getStatsSection() {
  let s = document.getElementById('statsSection');
  if (s) return s;
  const sections = panel?.querySelectorAll('.panel-section');
  if (sections) {
    for (const sec of sections) {
      const title = sec.querySelector('.section-title');
      if (title && /Statistiques/i.test(title.textContent || '')) {
        sec.id = 'statsSection';
        return sec;
      }
    }
  }
  return null;
}

// Boutons existants
const btnReset = document.getElementById('btnReset');
const btnReveal = document.getElementById('btnReveal');
const btnNext = document.getElementById('btnNext');

// Stats DOM (mode examen: on ne garde que l'index / total)
const statIndex = document.getElementById('statIndex');
const statTotal = document.getElementById('statTotal');

// Modale (mode examen: on ne l'utilise pas mais on garde les refs inertes)
const overlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const btnClose = document.getElementById('btnClose');

// p5 integration (layout + drawing) est dans la page d'origine. On expose des hooks nécessaires.

// Rendu de la liste des thèmes (écran principal et panneau latéral)
function renderThemesHome() {
  // Crée ou met à jour l'overlay d'accueil des thèmes sans détruire le canvas ni les overlays
  let home = document.getElementById('themesHome');
  if (!home) {
    home = document.createElement('div');
    home.id = 'themesHome';
    home.style.position = 'absolute';
    home.style.inset = '0';
    home.style.background = '#fff';
    home.style.borderRadius = '8px';
    home.style.display = 'flex';
    home.style.flexDirection = 'column';
    container.appendChild(home);
  }
  home.innerHTML = '';
  const header = document.createElement('div');
  header.style.cssText = 'padding:20px 24px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;';
  const hTitle = document.createElement('div');
  hTitle.style.cssText = 'font-size:20px; font-weight:700; color:#111827;';
  hTitle.textContent = 'Choisis un thème';
  header.appendChild(hTitle);
  const grid = document.createElement('div');
  grid.id = 'themesGrid';
  grid.style.cssText = 'display:flex; flex-direction:column; gap:16px; padding:16px; overflow:auto;';
  for (const t of state.themes) {
    const disabled = t.done ? 'pointer-events:none; opacity:0.6; text-decoration:line-through;' : '';
    const div = document.createElement('div');
    div.setAttribute('role', 'button');
    div.style.cssText = `border:1px solid #e5e7eb; border-radius:12px; padding:22px 20px; font-weight:700; font-size:20px; cursor:pointer; background:#fff; width:100%; max-width:560px; align-self:center; text-align:center; transition:transform .05s ease, box-shadow .15s ease, background-color .15s ease; ${disabled}`;
    div.addEventListener('mouseenter', () => { if (!t.done) { div.style.background = '#f9fafb'; div.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; } });
    div.addEventListener('mouseleave', () => { div.style.background = '#fff'; div.style.boxShadow = 'none'; });
    div.textContent = t.label;
    if (!t.done) {
      div.addEventListener('click', () => startTheme(t.id));
    }
    grid.appendChild(div);
  }
  home.appendChild(header);
  home.appendChild(grid);
  // Masquer overlays et canvas
  const canvas = container.querySelector('canvas');
  if (canvas) canvas.style.display = 'none';
  if (questionOverlay) questionOverlay.style.display = 'none';
  if (answersOverlay) answersOverlay.style.display = 'none';
  // Mode examen: cacher le bouton "Suivante" tout en conservant la place
  if (btnNext) btnNext.style.visibility = 'hidden';
  // Cacher aussi la section Statistiques sur l'écran de sélection
  const stats = getStatsSection();
  if (stats) stats.style.display = 'none';
  renderThemesPanel();
}

function renderThemesPanel() {
  // Injecte une section "Thèmes" au bas du panneau (non cliquable)
  let section = panel.querySelector('#themesSection');
  if (!section) {
    section = document.createElement('div');
    section.className = 'panel-section';
    section.id = 'themesSection';
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = 'Thèmes';
    const card = document.createElement('div');
    card.className = 'stat-card';
    const list = document.createElement('div');
    list.id = 'themesList';
    list.style.display = 'grid';
    list.style.gap = '8px';
    card.appendChild(list);
    section.appendChild(title);
    section.appendChild(card);
    panel.appendChild(section);
  }
  const list = section.querySelector('#themesList');
  list.innerHTML = '';
  for (const t of state.themes) {
    const item = document.createElement('div');
    item.className = 'pill';
    item.style.cursor = 'default';
    item.style.display = 'flex';
    item.style.justifyContent = 'flex-start';
    item.style.alignItems = 'center';
    item.textContent = '';
    const name = document.createElement('span');
    name.textContent = t.label;
    name.style.textDecoration = t.done ? 'line-through' : 'none';
    item.appendChild(name);
    list.appendChild(item);
  }
  if (panel.lastElementChild !== section) panel.appendChild(section);
}

function startTheme(themeId) {
  if (state.current) return;
  const def = THEMES.find(t => t.id === themeId);
  if (!def) return;
  // Construire l'engine
  const engine = new ThemeQuizEngine(def.id, def.label, def.data, 5);
  state.current = { engine, id: def.id, label: def.label };
  // Démarrage session si première fois
  if (!sessionStartedAt) sessionStartedAt = new Date();
  // Réinitialiser le score à l'entrée d'un nouveau thème
  success = 0; errors = 0; tries = 0;
  // Initialiser l'UI quiz
  renderQuizFrame();
  loadQuestion(0);
  refreshStats();
  renderThemesPanel();
}

function endTheme() {
  if (!state.current) return;
  // Marque le thème comme fait et détruit l'engine
  const idx = state.themes.findIndex(t => t.id === state.current.id);
  if (idx !== -1) {
    state.themes[idx].done = true;
    // Enregistre le score final du thème
    state.themes[idx].score = `${success}/${state.current.engine.total}`;
  }
  state.current = null;
  renderThemesHome();
  // Si tous les thèmes sont terminés, envoyer les résultats
  if (areAllThemesCompleted()) {
    submitResults().catch(err => console.error('submitResults error:', err));
  }
}

// Gestion du cadre quiz (canvas + overlays)
function renderQuizFrame() {
  // Affiche overlays et canvas, cache l'accueil
  const home = document.getElementById('themesHome');
  if (home) home.remove();
  const canvas = container.querySelector('canvas');
  if (canvas) canvas.style.display = '';
  if (questionOverlay) questionOverlay.style.display = '';
  if (answersOverlay) answersOverlay.style.display = '';
  // Ré-afficher le bouton "Suivante"
  // if (btnNext) btnNext.style.visibility = 'visible';
  // Ré-afficher la section Statistiques pendant le questionnaire
  const stats = getStatsSection();
  if (stats) stats.style.display = '';
}

// Rendu overlays answers
function renderAnswersGroups(currentList, nextList = null) {
  const answersOverlayEl = document.getElementById('answersOverlay');
  if (!answersOverlayEl) return;
  answersOverlayEl.innerHTML = '';
  const mkGroup = (list, id) => {
    const group = document.createElement('div');
    group.className = 'answersGroup';
    group.id = id;
    for (const c of list) {
      const div = document.createElement('div');
      div.className = 'answerItem';
      div.style.left = c.x + 'px';
      div.style.top = c.y + 'px';
      div.style.width = c.w + 'px';
      div.style.height = c.h + 'px';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.fontSize = '24px';
      div.style.color = '#1f2937';
      div.style.paddingLeft = '14px';
      div.innerHTML = (c.id ? `<strong>${c.id} — </strong>` : '') + c.text;
      group.appendChild(div);
    }
    return group;
  };
  answersOverlayEl.appendChild(mkGroup(currentList, 'answersGroupCurrent'));
  if (nextList) answersOverlayEl.appendChild(mkGroup(nextList, 'answersGroupNext'));
  if (window.MathJax?.typesetPromise) MathJax.typesetPromise([answersOverlayEl]);
}

// Hooks compatibles avec le sketch existant
let cards = [];
let nextCards = null;
let qIndex = 0;
let tries = 0;
let errors = 0;
let success = 0;
let transitioning = false;
let t0 = 0;
const duration = 450;
const autoAdvanceDelay = 700;
let pendingNextIndex = null;
let locked = false;
let modalOpen = false;

function refreshStats() {
  if (!state.current) return;
  statIndex.textContent = String(qIndex + 1);
  statTotal.textContent = String(state.current.engine.total);
  // tries/errors masqués en mode examen
}

function quizGet() {
  return state.current?.engine?.questions || [];
}

function quizPrepare(idx) {
  const engine = state.current.engine;
  const q = engine.questions[idx];
  return q.answers.map(a => ({ id: a.id, text: a.text, correct: !!a.correct, remediation: a.remediation || '', state:'idle', x:0, y:0, w:0, h:0 }));
}

function quizSetCards(list) { cards = list; }

function refreshQuestionOverlay() {
  if (!state.current) return;
  const qEl = document.getElementById('questionOverlay');
  if (qEl) {
    // Utiliser l'index UI courant pour garantir la synchro avec l'animation
    const q = state.current.engine.questions[qIndex];
    qEl.innerHTML = q ? q.question : '';
    if (window.MathJax?.typesetPromise) MathJax.typesetPromise([qEl]);
  }
}

function loadQuestion(idx) {
  if (!state.current) return;
  qIndex = idx;
  tries = 0;
  locked = false;
  cards = quizPrepare(qIndex);
  layoutCards();
  refreshStats();
  refreshQuestionOverlay();
  renderAnswersGroups(cards);
}

function nextIndex() {
  if (!state.current) return null;
  return (qIndex + 1 < state.current.engine.total) ? qIndex + 1 : null;
}

function goToNextWithAnimation() {
  if (transitioning) return;
  const ni = nextIndex();
  if (ni === null) { endTheme(); return; }
  nextCards = quizPrepare(ni);
  pendingNextIndex = ni;
  transitioning = true;
  t0 = performance.now();
  renderAnswersGroups(cards, nextCards);
}

function easeInOutCubic(u){ return u<0.5 ? 4*u*u*u : 1 - Math.pow(-2*u+2,3)/2; }

// Dessin p5 existant: on réutilise le même fichier HTML avec sketch en place. Pour qu'il fonctionne, on expose ces handlers globaux:
window.__themeQuiz = {
  draw: (p, W, H, margin, headerH) => {
    // calc animation offsets
    let offsetCurY = 0, offsetNextY = 0, animating = transitioning;
    if (transitioning) {
      const u = Math.min(1, (performance.now() - t0) / duration);
      const e = easeInOutCubic(u);
      offsetCurY = -e * H;
      offsetNextY = (1 - e) * H;
      const qOverlay = document.getElementById('questionOverlay');
      if (qOverlay) qOverlay.style.transform = `translateY(${offsetCurY}px)`;
      const groupCur = document.getElementById('answersGroupCurrent');
      const groupNext = document.getElementById('answersGroupNext');
      if (groupCur) groupCur.style.transform = `translateY(${offsetCurY}px)`;
      if (groupNext) groupNext.style.transform = `translateY(${offsetNextY}px)`;
      if (u >= 1) {
        transitioning = false;
        cards = nextCards;
        nextCards = null;
        qIndex = pendingNextIndex;
        pendingNextIndex = null;
        tries = 0;
        locked = false;
        layoutCards();
        refreshStats();
        refreshQuestionOverlay();
        renderAnswersGroups(cards);
        const qo = document.getElementById('questionOverlay');
        if (qo) qo.style.transform = 'translateY(0px)';
        const g1 = document.getElementById('answersGroupCurrent');
        const g2 = document.getElementById('answersGroupNext');
        if (g1) g1.style.transform = 'translateY(0px)';
        if (g2) g2.remove();
      }
    }

    // Bandeau
    p.noStroke(); p.fill(255);
    p.rect(margin, margin, W - 2*margin, headerH, 12);
    p.stroke(230); p.noFill();
    p.rect(margin, margin, W - 2*margin, headerH, 12);

    // Réponses
    for (const c of cards) {
      let bg = p.color(255), border = p.color(229), txt = p.color(31,41,55);
      if (c.state === 'wrong') { bg = p.color(254,242,242); border = p.color(252,165,165); txt = p.color(153,27,27); }
      if (c.state === 'right') { bg = p.color(240,253,244); border = p.color(134,239,172); txt = p.color(22,101,52); }
      p.noStroke(); p.fill(bg); p.rect(c.x, c.y, c.w, c.h, 10);
      p.stroke(border); p.noFill(); p.rect(c.x, c.y, c.w, c.h, 10);
      p.noStroke(); p.fill(txt); p.textSize(24); p.textAlign(p.LEFT, p.CENTER);
    }
  },
  mousePressed: (p, mx, my) => {
    if (locked || transitioning || modalOpen || !state.current) return;
    const i = (() => { for (let k=0;k<cards.length;k++){ const c=cards[k]; if (mx>=c.x && mx<=c.x+c.w && my>=c.y && my<=c.y+c.h) return k; } return -1; })();
    if (i === -1) return;
    // Mode examen: pas de coloration ni modale
    const c = cards[i];
    if (c.correct) success++;
    locked = true;
    refreshStats();
    setTimeout(goToNextWithAnimation, 250);
  }
};

// Layout des cartes de réponses
function layoutCards() {
  const W = 800, H = 600; // canvas taille
  const startY = 200;
  const Hc = 68, gap = 12, Wc = W - 48, x = 24;
  const total = cards.length * Hc + (cards.length - 1) * gap;
  let y = startY + Math.max(0, (H - startY - 40 - total)/2);
  for (const c of cards) { c.x = x; c.y = y; c.w = Wc; c.h = Hc; y += Hc + gap; }
  if (nextCards) {
    let y2 = startY + Math.max(0, (H - startY - 40 - total)/2);
    for (const c of nextCards) { c.x = x; c.y = y2; c.w = Wc; c.h = Hc; y2 += Hc + gap; }
  }
  renderAnswersGroups(cards, nextCards);
}

// ----- Fin de session: collecte + envoi API -----
function areAllThemesCompleted() {
  return state.themes.every(t => t.done);
}

function computeSessionTotals() {
  let numQuestionsTotal = 0;
  let numCorrectTotal = 0;
  for (const t of state.themes) {
    if (t.score) {
      const parts = String(t.score).split('/');
      const c = Number(parts[0] || 0);
      const q = Number(parts[1] || 0);
      if (!Number.isNaN(c)) numCorrectTotal += c;
      if (!Number.isNaN(q)) numQuestionsTotal += q;
    }
  }
  return { numQuestionsTotal, numCorrectTotal };
}

function buildSessionPayload() {
  const { numQuestionsTotal, numCorrectTotal } = computeSessionTotals();
  const completedAt = new Date();
  return {
    session_id: sessionId,
    started_at: sessionStartedAt ? sessionStartedAt.toISOString() : null,
    completed_at: completedAt.toISOString(),
    num_themes: state.themes.length,
    num_questions_total: numQuestionsTotal,
    num_correct_total: numCorrectTotal,
    themes: state.themes.map(t => {
      let correct = null, total = null;
      if (t.score) {
        const [c, q] = String(t.score).split('/');
        correct = Number(c);
        total = Number(q);
      }
      return {
        theme_id: t.id,
        theme_label: t.label,
        done: !!t.done,
        score: t.score, // ex: "3/5"
        correct_count: Number.isFinite(correct) ? correct : null,
        questions_total: Number.isFinite(total) ? total : null
      };
    })
  };
}

async function submitResults() {
  const payload = buildSessionPayload();
  if (!API_URL || API_URL.includes('{YOUR-WORKER-URL}') || API_URL.includes('{YOUR-TABLE-NAME}')) {
    console.warn('API_URL non configurée. Résultats non envoyés.', payload);
    return;
  }
  try {
    const res = await fetch(QCM_POST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    }
    // Optionnel: traiter la réponse
    // const data = await res.json().catch(() => null);
  } catch (e) {
    console.error('Echec envoi résultats:', e);
  }
}

// Modale
function openModal(html, title="Remédiation", onClose=null) {
  document.getElementById('modalTitle').textContent = title;
  modalBody.innerHTML = html;
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
  modalOpen = true;
  if (window.MathJax?.typesetPromise) MathJax.typesetPromise([modalBody]);
  const close = () => {
    overlay.style.display = 'none'; overlay.setAttribute('aria-hidden','true'); modalBody.innerHTML=''; modalOpen = false;
    btnClose.removeEventListener('click', close); overlay.removeEventListener('click', edge);
    if (onClose) onClose();
  };
  const edge = (e) => { if (e.target === overlay) close(); };
  btnClose.addEventListener('click', close); overlay.addEventListener('click', edge);
}

// Brancher boutons
// Mode examen: on ne garde que le bouton "Suivante" si besoin (il reste utile si on veut avancer sans répondre)
btnNext?.addEventListener('click', () => { if (!state.current) return; goToNextWithAnimation(); });

// Démarrage: affiche l'écran de thèmes
renderThemesHome();


