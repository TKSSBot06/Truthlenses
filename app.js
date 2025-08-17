// Simple client-side TruthLens prototype behavior
// No uploads off-device. Fake-but-believable analysis flow with polls, quiz, early-exit branch.

(function () {
  // Page elements
  const pages = {
    cover: document.getElementById('page-cover'),
    purpose: document.getElementById('page-purpose'),
    choose: document.getElementById('page-choose'),
    photoUpload: document.getElementById('page-photo-upload'),
    videoUpload: document.getElementById('page-video-upload'),
    analyzing: document.getElementById('page-analyzing'),
    analysis: document.getElementById('page-analysis'),
    result: document.getElementById('page-result'),
  };

  // Buttons
  document.getElementById('btn-enter').onclick = () => show('purpose');
  document.getElementById('btn-purpose-continue').onclick = () => show('choose');
  document.getElementById('btn-purpose-back').onclick = () => show('cover');
  document.getElementById('btn-choose-back').onclick = () => show('purpose');

  document.getElementById('choose-photo').onclick = () => show('photoUpload');
  document.getElementById('choose-video').onclick = () => show('videoUpload');

  document.getElementById('btn-photo-back').onclick = () => show('choose');
  document.getElementById('btn-video-back').onclick = () => show('choose');

  // Inputs
  document.getElementById('input-photo').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    startAnalysis(f, false);
  });
  document.getElementById('input-video').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    // optional: check length -> but browsers cannot easily read duration without load
    startAnalysis(f, true);
  });

  // Skip button
  document.getElementById('btn-skip-analysis').onclick = () => show('analysis');
  document.getElementById('btn-analysis-back').onclick = () => show('analyzing');
  document.getElementById('btn-analysis-result').onclick = () => show('result');

  document.getElementById('btn-result-another').onclick = () => {
    resetToChoose();
  };
  document.getElementById('btn-result-home').onclick = () => {
    resetAll();
    show('cover');
  };

  // utility
  function hideAll() {
    Object.values(pages).forEach(p => p.classList.add('hidden'));
  }
  function show(name) {
    hideAll();
    pages[name].classList.remove('hidden');
  }

  // initial
  show('cover');

  // Polls and quiz data (same as prototype)
  const POLLS = [
    { q: 'Coffee ☕ or Tea 🍵?', opts: ['Coffee', 'Tea'] },
    { q: 'Shah Rukh Khan ❤️ or Salman Khan 🔥?', opts: ['SRK', 'Salman'] },
    { q: 'Cricket 🏏 or Football ⚽?', opts: ['Cricket', 'Football'] },
    { q: 'Paneer 🧀 or Chole 🍛?', opts: ['Paneer', 'Chole'] },
  ];
  const QUIZ = [
    { q: '12 + (6 ÷ 2) × 3 = ?', opts: ['18', '21', '15'], a: 0 },
    { q: 'Capital of Australia?', opts: ['Sydney', 'Canberra', 'Melbourne'], a: 1 },
    { q: 'Water boils at __ °C', opts: ['0', '50', '100'], a: 2 },
    { q: 'Who was first President of India?', opts: ['Nehru', 'Dr. Rajendra Prasad', 'Sardar Patel'], a: 1 },
  ];

  let progress = 0, pollIndex = 0, quizIndex = 0, quizScore = 0;
  const pollBlock = document.getElementById('poll-block');
  const quizBlock = document.getElementById('quiz-block');
  const progressFill = document.getElementById('progress-fill');
  const phaseText = document.getElementById('phase-text');
  const analysisCard = document.getElementById('analysis-card');
  const verdictStamp = document.getElementById('verdict-stamp');
  const resultSummary = document.getElementById('result-summary');
  const resultConfidence = document.getElementById('result-confidence');
  const resultClues = document.getElementById('result-clues');

  function renderPoll() {
    pollBlock.innerHTML = '';
    if (pollIndex >= POLLS.length) return;
    const p = POLLS[pollIndex];
    const h = document.createElement('div');
    h.className = 'bold';
    h.textContent = p.q;
    pollBlock.appendChild(h);
    const btns = document.createElement('div');
    btns.style.marginTop = '8px';
    p.opts.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'btn ghost';
      b.style.marginRight = '8px';
      b.textContent = opt;
      b.onclick = () => { pollIndex++; renderPoll(); };
      btns.appendChild(b);
    });
    pollBlock.appendChild(btns);
  }

  function renderQuiz() {
    quizBlock.innerHTML = '';
    const q = QUIZ[quizIndex];
    const h = document.createElement('div');
    h.className = 'bold';
    h.textContent = 'Mini Quiz: ' + q.q;
    quizBlock.appendChild(h);
    const opts = document.createElement('div');
    opts.style.marginTop = '8px';
    q.opts.forEach((opt, idx) => {
      const b = document.createElement('button');
      b.className = 'btn ghost';
      b.style.marginRight = '8px';
      b.textContent = opt;
      b.onclick = () => {
        if (idx === q.a) quizScore++;
        quizIndex = (quizIndex + 1) % QUIZ.length;
        renderQuiz();
      };
      opts.appendChild(b);
    });
    quizBlock.appendChild(opts);

    const score = document.createElement('div');
    score.className = 'muted small';
    score.textContent = 'Score: ' + quizScore;
    quizBlock.appendChild(score);
  }

  function startAnalysis(file, isVideo) {
    // Reset interactive UI
    progress = 6; pollIndex = 0; quizIndex = 0; quizScore = 0;
    renderPoll(); renderQuiz();
    progressFill.style.width = '6%';
    phaseText.textContent = 'Basic check…';
    show('analyzing');

    // fake progress + branching
    const interval = setInterval(() => {
      progress = Math.min(100, progress + Math.random() * 8 + 2);
      progressFill.style.width = progress + '%';
      if (progress < 35) phaseText.textContent = 'Basic check…';
      else if (progress < 85) phaseText.textContent = 'Deep check…';
      else phaseText.textContent = 'Cross-check…';
    }, 450);

    // decide early exit or deep
    setTimeout(() => {
      const earlyAI = Math.random() < 0.34; // 34% early detect
      clearInterval(interval);
      progressFill.style.width = '98%';
      setTimeout(() => {
        progressFill.style.width = '100%';
        // build analysis object
        let analysis;
        let verdict;
        if (earlyAI) {
          analysis = {
            basic: ['Repeating background texture', 'Unnatural eye reflections', 'Odd hand shapes'],
            deep: [],
            cross: ['Quick cross-check: model agrees (early exit)']
          };
          verdict = 'AI Positive';
        } else {
          const auth = Math.random() > 0.53;
          if (auth) {
            analysis = {
              basic: ['No obvious artifacts'],
              deep: ['Microtexture consistent', 'Specular highlights plausible', 'rPPG signal present'],
              cross: ['Model A: Authentic', 'Model B: Mild uncertainty']
            };
            verdict = 'Authentic';
          } else {
            analysis = {
              basic: ['Slight symmetry artifacts'],
              deep: ['Texture frequency mismatch', 'Lighting inconsistency'],
              cross: ['Ensemble: Synthetic likely']
            };
            verdict = 'AI Positive';
          }
        }

        // render analysis card
        renderAnalysisCard(analysis);
        // store result
        window.__truthlens_last = {analysis, verdict};
        // go to results page
        show('analysis');
      }, 700);
    }, 4200);
  }

  function renderAnalysisCard(analysis){
    analysisCard.innerHTML = '';
    if (!analysis) { analysisCard.textContent = 'No data'; return; }
    const s1 = document.createElement('div'); s1.className='bold'; s1.textContent = 'Step 1 — Basic';
    const list1 = document.createElement('ul'); analysis.basic.forEach(x => { const li=document.createElement('li'); li.textContent=x; list1.appendChild(li); });
    const s2 = document.createElement('div'); s2.className='bold'; s2.style.marginTop='8px'; s2.textContent='Step 2 — Deep';
    const list2 = document.createElement('ul'); (analysis.deep.length?analysis.deep:['(skipped)']).forEach(x => { const li=document.createElement('li'); li.textContent=x; list2.appendChild(li); });
    const s3 = document.createElement('div'); s3.className='bold'; s3.style.marginTop='8px'; s3.textContent='Step 3 — Cross-Check';
    const list3 = document.createElement('ul'); analysis.cross.forEach(x => { const li=document.createElement('li'); li.textContent=x; list3.appendChild(li); });

    analysisCard.appendChild(s1); analysisCard.appendChild(list1);
    analysisCard.appendChild(s2); analysisCard.appendChild(list2);
    analysisCard.appendChild(s3); analysisCard.appendChild(list3);
  }

  function resetToChoose(){
    // reset and show choose
    progressFill.style.width = '0%';
    pollBlock.innerHTML=''; quizBlock.innerHTML='';
    show('choose');
  }
  function resetAll(){
    progressFill.style.width='0%'; pollBlock.innerHTML=''; quizBlock.innerHTML=''; analysisCard.innerHTML=''; verdictStamp.textContent=''; resultClues.innerHTML=''; resultSummary.textContent=''; resultConfidence.textContent='';
  }

  // When user clicks "View Result" we read last stored analysis and show case file
  document.getElementById('btn-analysis-result').onclick = () => {
    const data = window.__truthlens_last || null;
    if (!data) {
      resultSummary.textContent = 'No result available.';
      resultConfidence.textContent = '—';
      resultClues.textContent = '';
      verdictStamp.textContent = 'UNDETERMINED';
      show('result');
      return;
    }
    const { analysis, verdict } = data;
    // summary & confidence (fake)
    if (verdict === 'Authentic') {
      resultSummary.textContent = 'No strong signs of synthesis detected.';
      resultConfidence.textContent = '88%';
      verdictStamp.textContent = '✔ AUTHENTIC';
      verdictStamp.style.color = '#16a34a';
    } else {
      resultSummary.textContent = 'Multiple signals indicate synthetic generation.';
      resultConfidence.textContent = '79%';
      verdictStamp.textContent = '✖ AI-GENERATED';
      verdictStamp.style.color = '#dc2626';
    }
    // clues list
    resultClues.innerHTML = '';
    const ul = document.createElement('ul');
    (analysis.basic || []).concat(analysis.deep || []).concat(analysis.cross || []).forEach(x => {
      const li = document.createElement('li'); li.textContent = x; ul.appendChild(li);
    });
    resultClues.appendChild(ul);

    show('result');
  };

})();
