(() => {
  const $ = (id) => document.getElementById(id);

  const winOverlay = $("winOverlay");
  const continueBtn = $("continueBtn");

  const heartOverlay = $("heartOverlay");
  const heartCloseBtn = $("heartCloseBtn");
  const yesBtn = $("yesBtn");
  const noBtn = $("noBtn");

  const resultOverlay = $("resultOverlay");
  const resultTitle = $("resultTitle");
  const resultDesc = $("resultDesc");
  const resultGif = $("resultGif");
  const resultCloseBtn = $("resultCloseBtn");
  const particles = $("particles");

  function show(el){ el?.classList.remove("hidden"); }
  function hide(el){ el?.classList.add("hidden"); }

  function clearParticles(){
    if (!particles) return;
    particles.innerHTML = "";
  }

  function spawnParticles(kind){
    // kind: "fire" | "rain"
    clearParticles();
    if (!particles) return;

    const count = kind === "fire" ? 26 : 38;

    for (let i = 0; i < count; i++){
      const p = document.createElement("div");
      p.className = `particle ${kind === "fire" ? "spark" : "drop"}`;

      const x = Math.random() * 100;
      const dur = (kind === "fire" ? 900 : 1200) + Math.random() * 900;

      p.style.setProperty("--x", `${x}%`);
      p.style.setProperty("--dur", `${dur}ms`);
      p.style.setProperty("--anim", kind === "fire" ? "rise" : "fall");

      // começa em lugares diferentes
      p.style.left = `${x}%`;
      p.style.top  = kind === "fire" ? `${70 + Math.random() * 20}%` : `${-5 - Math.random() * 10}%`;

      particles.appendChild(p);

      // remover depois
      setTimeout(() => p.remove(), dur + 200);
    }
  }

  function openProposal(){
    // fecha win overlay e abre coração
    hide(winOverlay);
    show(heartOverlay);
  }

  function closeProposal(){
    hide(heartOverlay);
  }

  function openResult({ title, desc, gif, mode }){
    closeProposal();
    if (resultTitle) resultTitle.textContent = title;
    if (resultDesc) resultDesc.textContent = desc;
    if (resultGif)  resultGif.src = gif;

    show(resultOverlay);

    if (mode === "fire") spawnParticles("fire");
    if (mode === "rain") spawnParticles("rain");
  }

  function closeResult(){
    hide(resultOverlay);
    clearParticles();
  }

  // Clique em "Continuação"
  continueBtn?.addEventListener("click", openProposal);

  // Fechar coração
  heartCloseBtn?.addEventListener("click", closeProposal);

  // SIM
  yesBtn?.addEventListener("click", () => {
    openResult({
      title: "AAAAA 💛💛💛",
      desc: "Eu prometo cuidar disso com carinho. Obrigado por existir, Beca.",
      gif: "assets/rain-world-casal.gif",
      mode: "fire",
    });
  });

  // NÃO
  noBtn?.addEventListener("click", () => {
    openResult({
      title: "Tudo bem… 😳",
      desc: "Sem pressão. Eu gosto de você do mesmo jeito. 💛",
      gif: "assets/rain-world-timido.gif",
      mode: "rain",
    });
  });

  resultCloseBtn?.addEventListener("click", closeResult);

  // ESC fecha overlays (qualidade de vida)
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!heartOverlay?.classList.contains("hidden")) closeProposal();
    if (!resultOverlay?.classList.contains("hidden")) closeResult();
  });
})();