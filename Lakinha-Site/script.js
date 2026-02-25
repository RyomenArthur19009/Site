(() => {
  const $ = (id) => document.getElementById(id);

  // Música
  const playlist = [
    "music/lovely_arps.mp3",
    "music/kairi.mp3",
    "music/zelda_lullaby.mp3",
  ];

  let trackIndex = 0;
  const player = $("player");
  const heartBtn = $("heartBtn");

  const absUrl = (p) => new URL(p, window.location.href).href;

  function setTrack(i){
    trackIndex = (i + playlist.length) % playlist.length;
    player.src = absUrl(playlist[trackIndex]);
    player.volume = 0.3;
  }

  async function playMusic(){
    if (!player.src) setTrack(0);
    try{
      await player.play();
      heartBtn?.classList.add("is-playing");
    }catch{
      // bloqueio de autoplay (normal)
    }
  }

  function pauseMusic(){
    player.pause();
    heartBtn?.classList.remove("is-playing");
  }

  async function toggleMusic(){
    if (!player.src){
      setTrack(0);
      await playMusic();
      return;
    }
    if (player.paused) await playMusic();
    else pauseMusic();
  }

  player.addEventListener("ended", () => {
    setTrack(trackIndex + 1);
    playMusic();
  });

  heartBtn?.addEventListener("click", toggleMusic);

  // Reveal
  let observer;
  function observeReveals(){
    if (!observer){
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries){
          if (entry.isIntersecting){
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        }
      }, { threshold: 0.15 });
    }
    document.querySelectorAll(".reveal:not(.show)").forEach((el) => observer.observe(el));
  }
  observeReveals();

  // Navegação
  const msgSection = $("mensagem");
  const gameSection = $("game");

  function showSection(sectionEl){
    if (!sectionEl) return;
    sectionEl.classList.remove("hidden");
    sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
    observeReveals();
  }

  $("openMsgBtn")?.addEventListener("click", () => showSection(msgSection));
  $("openGameBtn")?.addEventListener("click", () => showSection(gameSection));
  $("goGameFromMsgBtn")?.addEventListener("click", () => showSection(gameSection));

  $("backTopBtn")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Fechar vitória (o jogo abre)
  $("closeWinBtn")?.addEventListener("click", () => $("winOverlay")?.classList.add("hidden"));
})();