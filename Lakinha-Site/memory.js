(() => {
  const board = document.getElementById("board");
  if (!board) return;

  const pairsEl = document.getElementById("pairs");
  const pairsTotalEl = document.getElementById("pairsTotal");
  const movesEl = document.getElementById("moves");
  const timeEl  = document.getElementById("time");

  const restartBtn = document.getElementById("restartBtn");
  const winOverlay = document.getElementById("winOverlay");
  const playAgainBtn = document.getElementById("playAgainBtn");
  const closeWinBtn = document.getElementById("closeWinBtn");
  const continueBtn = document.getElementById("continueBtn");

  // CONFIG imagens
  const PAIRS = 10;
  const IMG_FOLDER = "AssetsMemory";
  const IMG_EXT = "jpg";          // se for webp: "webp"
  const LEADING_ZERO = true;      // 01..10

  // CONFIG SFX (Rain World UI)
  const SFX_BASE = "sfx";
  const SFX_EXT  = "mp3";         // troque pra "ogg" ou "wav" se necessário

  const SFX = {
    wood: [
      `UI_UIWood1.${SFX_EXT}`,
      `UI_UIWood2.${SFX_EXT}`,
      `UI_UIWood3.${SFX_EXT}`,
      `UI_UIWood4.${SFX_EXT}`,
      `UI_UIWood5.${SFX_EXT}`,
    ],
    woodHit: `UI_UIWoodHIT.${SFX_EXT}`,
    metal: [
      `UI_UIMetal1.${SFX_EXT}`,
      `UI_UIMetal2.${SFX_EXT}`,
      `UI_UIMetal3.${SFX_EXT}`,
    ],
    metalHit: `UI_UIMetalHIT.${SFX_EXT}`,
  };

  const vol = { wood: 0.25, metal: 0.35, hit: 0.45 };
  const audioCache = new Map();
  let sfxUnlocked = false;

  function unlockSfxOnce(){
    if (sfxUnlocked) return;
    sfxUnlocked = true;

    // tentar liberar áudio com 1 play/pause inaudível
    const a = new Audio(`${SFX_BASE}/${SFX.wood[0]}`);
    a.volume = 0.0001;
    a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
  }
  window.addEventListener("pointerdown", unlockSfxOnce, { once: true });

  function playSfxFile(filename, volume){
    const src = `${SFX_BASE}/${filename}`;
    let a = audioCache.get(src);
    if (!a){
      a = new Audio(src);
      a.preload = "auto";
      audioCache.set(src, a);
    }
    a.volume = volume;
    a.currentTime = 0;
    a.play().catch(() => {}); // se arquivo faltar, não quebra o jogo
  }

  function pickRandom(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function sfxWood(){ playSfxFile(pickRandom(SFX.wood), vol.wood); }
  function sfxMetal(){ playSfxFile(pickRandom(SFX.metal), vol.metal); }
  function sfxMetalHit(){ playSfxFile(SFX.metalHit, vol.hit); }
  function sfxWoodHit(){ playSfxFile(SFX.woodHit, vol.hit); }

  // Helpers
  const pad2 = (n) => String(n).padStart(2, "0");
  const imgPath = (i) => `${IMG_FOLDER}/${LEADING_ZERO ? pad2(i) : i}.${IMG_EXT}`;

  if (pairsTotalEl) pairsTotalEl.textContent = String(PAIRS);

  // Estado
  let deck = [];
  let flipped = [];
  let lock = false;
  let matched = 0;
  let moves = 0;

  // Timer
  let timerId = null;
  let startTime = null;
  let timerRunning = false;

  function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function formatTime(ms){
    const total = Math.floor(ms / 1000);
    const m = pad2(Math.floor(total / 60));
    const s = pad2(total % 60);
    return `${m}:${s}`;
  }

  function startTimer(){
    if (timerRunning) return;
    timerRunning = true;
    startTime = Date.now();
    timerId = setInterval(() => {
      if (timeEl) timeEl.textContent = formatTime(Date.now() - startTime);
    }, 250);
  }

  function stopTimer(){
    timerRunning = false;
    clearInterval(timerId);
    timerId = null;
  }

  function resetStats(){
    matched = 0;
    moves = 0;
    flipped = [];
    lock = false;

    if (pairsEl) pairsEl.textContent = "0";
    if (movesEl) movesEl.textContent = "0";
    if (timeEl)  timeEl.textContent  = "00:00";

    stopTimer();
  }

  function buildDeck(){
    const imgs = Array.from({ length: PAIRS }, (_, idx) => imgPath(idx + 1));
    const doubled = [...imgs, ...imgs];
    deck = shuffle(doubled.map((src, idx) => ({ id: idx, src, key: src })));
  }

  function createCard(src, key){
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.dataset.key = key;

    btn.innerHTML = `
      <div class="card-inner">
        <div class="face front"><span>⋯</span></div>
        <div class="face back">
          <img src="${src}" alt="Carta" loading="eager" decoding="async" />
        </div>
      </div>
    `;

    btn.addEventListener("click", () => flip(btn));
    return btn;
  }

  function render(){
    board.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const c of deck){
      frag.appendChild(createCard(c.src, c.key));
    }
    board.appendChild(frag);
  }

  function setMove(){
    moves += 1;
    if (movesEl) movesEl.textContent = String(moves);
  }

  function markMatched(a, b){
    a.classList.add("is-matched");
    b.classList.add("is-matched");
    a.disabled = true;
    b.disabled = true;
  }

  function unflip(a, b){
    a.classList.remove("is-flipped");
    b.classList.remove("is-flipped");
  }

  function showWin(){
    stopTimer();
    winOverlay?.classList.remove("hidden");
    // deixa o botão continuação ativo (heart.js vai cuidar do clique)
    continueBtn?.removeAttribute("disabled");
  }

  function flip(cardEl){
    if (lock) return;
    if (cardEl.classList.contains("is-flipped")) return;
    if (cardEl.classList.contains("is-matched")) return;

    startTimer();

    cardEl.classList.add("is-flipped");
    flipped.push(cardEl);

    if (flipped.length < 2) return;

    lock = true;
    setMove();

    const [a, b] = flipped;
    const match = a.dataset.key === b.dataset.key;

    if (match){
      matched += 1;
      if (pairsEl) pairsEl.textContent = String(matched);

      // acerto: metal + HIT
      sfxMetal();
      sfxMetalHit();

      markMatched(a, b);
      flipped = [];
      lock = false;

      if (matched === PAIRS){
        setTimeout(showWin, 450);
      }
    } else {
      // erro: wood (e opcionalmente HIT de madeira também)
      sfxWood();

      setTimeout(() => {
        unflip(a, b);
        flipped = [];
        lock = false;
      }, 700);
    }
  }

  function startGame(){
    winOverlay?.classList.add("hidden");
    resetStats();
    buildDeck();
    render();
  }

  restartBtn?.addEventListener("click", startGame);
  playAgainBtn?.addEventListener("click", startGame);
  closeWinBtn?.addEventListener("click", () => winOverlay?.classList.add("hidden"));

  startGame();
})();