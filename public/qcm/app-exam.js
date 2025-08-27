import { ThemeQuizEngine } from "./core/engine.js";
// utils non requis ici

// Les variables THEMES et state sont maintenant définies dans le HTML
// et accessibles globalement

// p5 integration (layout + drawing) est dans la page d'origine. On expose des hooks nécessaires.

// Rendu de la liste des thèmes (écran principal et panneau latéral)
window.renderThemesHome = function() {
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
    window.container.appendChild(home);
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
  for (const t of window.state.themes) {
    const disabled = t.done ? 'pointer-events:none; opacity:0.6; text-decoration:line-through;' : '';
    const div = document.createElement('div');
    div.setAttribute('role', 'button');
    div.style.cssText = `border:1px solid #e5e7eb; border-radius:12px; padding:22px 20px; font-weight:700; font-size:20px; cursor:pointer; background:#fff; width:100%; max-width:560px; align-self:center; text-align:center; transition:transform .05s ease, box-shadow .15s ease, background-color .15s ease; ${disabled}`;
    div.addEventListener('mouseenter', () => { if (!t.done) { div.style.background = '#f9fafb'; div.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; } });
    div.addEventListener('mouseleave', () => { div.style.background = '#fff'; div.style.boxShadow = 'none'; });
    div.textContent = t.label;
    if (!t.done) {
      div.addEventListener('click', () => window.startTheme(t.id));
    }
    grid.appendChild(div);
  }
  home.appendChild(header);
  home.appendChild(grid);
  // Masquer overlays et canvas
  const canvas = window.container.querySelector('canvas');
  if (canvas) canvas.style.display = 'none';
  if (window.questionOverlay) window.questionOverlay.style.display = 'none';
  if (window.answersOverlay) window.answersOverlay.style.display = 'none';
  if (window.btnNext) window.btnNext.style.visibility = 'hidden';
  window.renderThemesPanel();
}

window.renderThemesPanel = function() {
  if (!window.panel) return;
  // Injecte une section "Thèmes" au bas du panneau (non cliquable)
  let section = window.panel.querySelector('#themesSection');
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
    window.panel.appendChild(section);
  }
  const list = section.querySelector('#themesList');
  list.innerHTML = '';
  for (const t of window.state.themes) {
    const item = document.createElement('div');
    item.className = 'pill';
    item.style.cursor = 'default';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.textContent = '';
    const name = document.createElement('span');
    name.textContent = t.label;
    name.style.textDecoration = t.done ? 'line-through' : 'none';
    item.appendChild(name);
    list.appendChild(item);
  }
  if (window.panel.lastElementChild !== section) window.panel.appendChild(section);
}

// Fonction pour afficher les résultats finaux
window.showFinalResults = async function() {
  const studentName = document.getElementById('studentName')?.value || 'Étudiant non identifié';
  
  // Créer l'overlay des résultats finaux
  let resultsOverlay = document.getElementById('finalResultsOverlay');
  if (!resultsOverlay) {
    resultsOverlay = document.createElement('div');
    resultsOverlay.id = 'finalResultsOverlay';
    resultsOverlay.style.position = 'absolute';
    resultsOverlay.style.inset = '0';
    resultsOverlay.style.background = '#fff';
    resultsOverlay.style.borderRadius = '8px';
    resultsOverlay.style.display = 'flex';
    resultsOverlay.style.flexDirection = 'column';
    resultsOverlay.style.overflow = 'auto';
    window.container.appendChild(resultsOverlay);
  }
  
  // Masquer les autres éléments
  const canvas = window.container.querySelector('canvas');
  if (canvas) canvas.style.display = 'none';
  if (window.questionOverlay) window.questionOverlay.style.display = 'none';
  if (window.answersOverlay) window.answersOverlay.style.display = 'none';
  if (window.btnNext) window.btnNext.style.visibility = 'hidden';
  
  // Afficher un message de chargement
  resultsOverlay.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      <div style="text-align: center;">
        <div style="font-size: 18px; color: #6b7280; margin-bottom: 16px;">Chargement des résultats...</div>
        <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  try {
    // Récupérer tous les scores depuis l'API
    const response = await fetch(`/rest/scores/${encodeURIComponent(studentName)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la récupération des scores');
    }
    
    const scores = data.scores || [];
    
    // Calculer les statistiques globales
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const totalMaxScore = scores.reduce((sum, s) => sum + s.max_score, 0);
    const globalPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    
    // Déterminer le niveau global
    let globalLevel = '';
    let levelColor = '';
    if (globalPercentage >= 80) {
      globalLevel = 'Excellent';
      levelColor = '#10b981';
    } else if (globalPercentage >= 60) {
      globalLevel = 'Bon';
      levelColor = '#3b82f6';
    } else if (globalPercentage >= 40) {
      globalLevel = 'Moyen';
      levelColor = '#f59e0b';
    } else {
      globalLevel = 'À améliorer';
      levelColor = '#ef4444';
    }
    
    // Générer le HTML des résultats
    resultsOverlay.innerHTML = `
      <div style="padding: 24px; max-width: 800px; margin: 0 auto; width: 100%;">
        <!-- En-tête -->
        <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
          <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">Résultats du Positionnement</h1>
          <p style="font-size: 16px; color: #6b7280; margin: 0;">Étudiant: <strong>${studentName}</strong></p>
          <p style="font-size: 14px; color: #9ca3af; margin: 8px 0 0 0;">Session: Positionnement - BMC1 - Dijon</p>
        </div>
        
        <!-- Résumé global -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <div style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Score Global</div>
          <div style="font-size: 48px; font-weight: 800; color: ${levelColor}; margin-bottom: 8px;">${globalPercentage}%</div>
          <div style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px;">${globalLevel}</div>
          <div style="font-size: 16px; color: #6b7280;">
            ${totalScore} points sur ${totalMaxScore} (${scores.length} thème${scores.length > 1 ? 's' : ''})
          </div>
        </div>
        
        <!-- Détail par thème -->
        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Détail par thème</h2>
          <div style="display: grid; gap: 12px;">
            ${scores.map(score => {
              const percentage = Math.round((score.score / score.max_score) * 100);
              let themeLevel = '';
              let themeColor = '';
              if (percentage >= 80) {
                themeLevel = 'Excellent';
                themeColor = '#10b981';
              } else if (percentage >= 60) {
                themeLevel = 'Bon';
                themeColor = '#3b82f6';
              } else if (percentage >= 40) {
                themeLevel = 'Moyen';
                themeColor = '#f59e0b';
              } else {
                themeLevel = 'À améliorer';
                themeColor = '#ef4444';
              }
              
              return `
                <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">${score.theme_code}</div>
                    <div style="font-size: 14px; color: #6b7280;">${score.score}/${score.max_score} points</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 18px; font-weight: 700; color: ${themeColor}; margin-bottom: 2px;">${percentage}%</div>
                    <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">${themeLevel}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Actions -->
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <button id="btnRestart" style="
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-right: 12px;
          " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
            Recommencer
          </button>
        </div>
      </div>
    `;
    
    // Ajouter les événements pour les boutons
    document.getElementById('btnRestart')?.addEventListener('click', () => {
      // Réinitialiser complètement la session
      window.state.themes.forEach(t => t.done = false);
      window.state.current = null;
      success = 0; errors = 0; tries = 0;
      
      // Masquer les résultats et revenir à l'accueil
      resultsOverlay.remove();
      window.renderThemesHome();
    });
    
    document.getElementById('btnPrint')?.addEventListener('click', () => {
      window.print();
    });
    
  } catch (error) {
    console.error('Erreur lors du chargement des résultats:', error);
    resultsOverlay.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
        <div style="text-align: center;">
          <div style="font-size: 18px; color: #ef4444; margin-bottom: 16px;">Erreur lors du chargement des résultats</div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">${error.message}</div>
          <button onclick="window.showFinalResults()" style="
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
          ">Réessayer</button>
        </div>
      </div>
    `;
  }
}

window.startTheme = function(themeId) {
  if (window.state.current) return;
  const def = window.THEMES.find(t => t.id === themeId);
  if (!def) return;
  // Construire l'engine
  const engine = new ThemeQuizEngine(def.id, def.label, def.data, 5);
  window.state.current = { engine, id: def.id, label: def.label };
  // Réinitialiser le score à l'entrée d'un nouveau thème
  success = 0; errors = 0; tries = 0;
  // Initialiser l'UI quiz
  renderQuizFrame();
  loadQuestion(0);
  refreshStats();
  window.renderThemesPanel();
}

window.endTheme = async function() {
  if (!window.state.current) return;
  // Marque le thème comme fait et détruit l'engine
  const idx = window.state.themes.findIndex(t => t.id === window.state.current.id);
  if (idx !== -1) {
    window.state.themes[idx].done = true;
    // Enregistre le score final du thème
    window.state.themes[idx].score = `${success}/${window.state.current.engine.total}`;
    
    // Affichage dans la console du nom de l'étudiant, du thème et du score
    const studentName = document.getElementById('studentName')?.value || 'Étudiant non identifié';
    const themeName = window.state.current.label;
    const finalScore = success;
    console.log(`Étudiant: ${studentName} | Thème: ${themeName} | Score: ${finalScore}`);

    const payload = {
      external_id: studentName,
      session: "Positionnement - BMC1 - Dijon",
      theme_code: themeName,
      score: finalScore,
      max_score: 5
    }
    try{
      const res = await fetch('/rest/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(()=> ({}));

      if(!res.ok){
        const msg = data?.error || res.status + ' ' + res.statusText;
        console.log('Erreur: ' + msg);
      } else {
        const pct = (finalScore.split('/')[0]/5*100).toFixed(2);
        console.log(`OK — ${studentName} · ${themeName} = ${finalScore} (${pct}%)`);
      }
    } catch (err){
      console.error('Erreur réseau:', err.message);
    }
  }
  window.state.current = null;
  
  // Vérifier si tous les thèmes sont terminés
  const allThemesDone = window.state.themes.every(t => t.done);
  if (allThemesDone) {
    window.showFinalResults();
  } else {
    window.renderThemesHome();
  }
}

// Gestion du cadre quiz (canvas + overlays)
function renderQuizFrame() {
  // Affiche overlays et canvas, cache l'accueil
  const home = document.getElementById('themesHome');
  if (home) home.remove();
  const canvas = window.container.querySelector('canvas');
  if (canvas) canvas.style.display = '';
  if (window.questionOverlay) window.questionOverlay.style.display = '';
  if (window.answersOverlay) window.answersOverlay.style.display = '';
  // Ré-afficher le bouton "Suivante"
  if (window.btnNext) window.btnNext.style.visibility = 'visible';
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
       div.style.justifyContent = 'flex-start';
       div.style.fontSize = '24px';
       div.style.color = '#1f2937';
       div.style.paddingLeft = '14px';
       div.style.pointerEvents = 'none'; // Permettre les clics sur le canvas
      div.innerHTML = (c.id ? `<strong style="margin-right:6px">${c.id} —</strong>` : '') + c.text;
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
const autoAdvanceDelay = 350;
let pendingNextIndex = null;
let locked = false;

function refreshStats() {
  if (!window.state.current) return;
  if (window.statIndex) window.statIndex.textContent = String(qIndex + 1);
  if (window.statTotal) window.statTotal.textContent = String(window.state.current.engine.total);
}

function quizGet() {
  return window.state.current?.engine?.questions || [];
}

function quizPrepare(idx) {
  const engine = window.state.current.engine;
  const q = engine.questions[idx];
  return q.answers.map(a => ({ id: a.id, text: a.text, correct: !!a.correct, remediation: a.remediation || '', state:'idle', x:0, y:0, w:0, h:0 }));
}

function quizSetCards(list) { cards = list; }

function refreshQuestionOverlay() {
  if (!window.state.current) return;
  const qEl = document.getElementById('questionOverlay');
  if (qEl) {
    // Utiliser l'index UI courant pour garantir la synchro avec l'animation
    const q = window.state.current.engine.questions[qIndex];
    qEl.innerHTML = '';
    if (q && q.question != null) {
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';

      const parts = Array.isArray(q.question)
        ? q.question
        : String(q.question).split('\n');

      for (const part of parts) {
        const line = document.createElement('div');
        line.style.display = 'block';
        line.style.textAlign = 'center';
        line.style.margin = '4px 0';
        line.innerHTML = part;
        container.appendChild(line);
      }
      qEl.appendChild(container);
      if (window.MathJax?.typesetPromise) MathJax.typesetPromise([qEl]);
    }
  }
}

function loadQuestion(idx) {
  if (!window.state.current) return;
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
  if (!window.state.current) return null;
  return (qIndex + 1 < window.state.current.engine.total) ? qIndex + 1 : null;
}

function goToNextWithAnimation() {
  if (transitioning) return;
  const ni = nextIndex();
  if (ni === null) {
    // Fin du thème sans modal
    window.endTheme();
    return;
  }
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
    // Réinitialiser l'ombre au début de chaque frame
    p.drawingContext.shadowColor = 'transparent';
    p.drawingContext.shadowBlur = 0;
    p.drawingContext.shadowOffsetX = 0;
    p.drawingContext.shadowOffsetY = 0;
    
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
      
      // Effet de survol amélioré
      const mouseOver = p.mouseX >= c.x && p.mouseX <= c.x + c.w && p.mouseY >= c.y && p.mouseY <= c.y + c.h;
      if (mouseOver && c.state === 'idle') {
        bg = p.color(240, 249, 255); // Fond bleu très clair au survol
        border = p.color(59, 130, 246); // Bordure bleue
        txt = p.color(30, 58, 138); // Texte bleu foncé
        
        // Effet d'élévation avec ombre
        p.drawingContext.shadowColor = 'rgba(59, 130, 246, 0.25)';
        p.drawingContext.shadowBlur = 12;
        p.drawingContext.shadowOffsetX = 0;
        p.drawingContext.shadowOffsetY = 6;
        
        // Légère transformation pour effet 3D
        p.push();
        p.translate(0, -2);
      } else {
        // Pas d'ombre par défaut
        p.drawingContext.shadowColor = 'transparent';
        p.drawingContext.shadowBlur = 0;
        p.drawingContext.shadowOffsetX = 0;
        p.drawingContext.shadowOffsetY = 0;
      }
      
      // Une seule couleur bleue neutre pour les réponses cliquées (vraies ou fausses)
      if (c.state === 'wrong' || c.state === 'right') { 
        bg = p.color(100, 149, 237); 
        border = p.color(100, 149, 237); 
        txt = p.color(255); 
      }
      
      p.noStroke(); p.fill(bg); p.rect(c.x, c.y, c.w, c.h, 10);
      p.stroke(border); p.noFill(); p.rect(c.x, c.y, c.w, c.h, 10);
      
      // Restaurer la transformation si on était en mode survol
      if (mouseOver && c.state === 'idle') {
        p.pop();
      }
    }
  },
  mousePressed: (p, mx, my) => {
    if (locked || transitioning || !window.state.current) return;
    const i = (() => { for (let k=0;k<cards.length;k++){ const c=cards[k]; if (mx>=c.x && mx<=c.x+c.w && my>=c.y && my<=c.y+c.h) return k; } return -1; })();
    if (i === -1) return;
    tries++;
    const c = cards[i];
    if (c.correct) {
      c.state = 'right';
      locked = true;
      success++;
      refreshStats();
      setTimeout(goToNextWithAnimation, autoAdvanceDelay);
         } else {
       c.state = 'wrong';
       locked = true;
       errors++;
       refreshStats();
       setTimeout(goToNextWithAnimation, autoAdvanceDelay);
     }
  },
  
  mouseMoved: (p, mx, my) => {
    // Gérer le curseur au survol des cartes
    if (locked || transitioning || !window.state.current) {
      p.cursor(p.ARROW);
      return;
    }
    
    let isOverCard = false;
    for (const c of cards) {
      if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
        isOverCard = true;
        break;
      }
    }
    
    // Changer le curseur seulement si on survole une carte cliquable
    if (isOverCard) {
      p.cursor(p.HAND);
    } else {
      p.cursor(p.ARROW);
    }
  }
};

// Layout des cartes de réponses
function layoutCards() {
  const W = 1000, H = 600; // canvas taille
  const startY = 200;
  const Hc = Math.round(68 * 1.2), gap = 12, Wc = W - 48, x = 24; // Augmentation de 20% de la hauteur
  const total = cards.length * Hc + (cards.length - 1) * gap;
  let y = startY + Math.max(0, (H - startY - 40 - total)/2);
  for (const c of cards) { c.x = x; c.y = y; c.w = Wc; c.h = Hc; y += Hc + gap; }
  if (nextCards) {
    let y2 = startY + Math.max(0, (H - startY - 40 - total)/2);
    for (const c of nextCards) { c.x = x; c.y = y2; c.w = Wc; c.h = Hc; y2 += Hc + gap; }
  }
  renderAnswersGroups(cards, nextCards);
}

// Brancher boutons
window.btnReset?.addEventListener('click', () => {
  // Reset complet de la session
  window.state.themes.forEach(t => t.done = false);
  window.state.current = null;
  success = 0; errors = 0; tries = 0;
  window.renderThemesHome();
});

window.btnReveal?.addEventListener('click', () => {
  if (!window.state.current) return;
  for (const c of cards) c.state = c.correct ? 'right' : 'idle';
  // locked = true;
});

window.btnNext?.addEventListener('click', () => {
  if (!window.state.current) return;
  goToNextWithAnimation();
});

// Le démarrage est maintenant géré dans le HTML


