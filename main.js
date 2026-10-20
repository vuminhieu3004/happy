const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HEART_COLORS = ["#ff5fa2", "#ff8fc4", "#ffc2df", "#c58cff", "#ffd98a"];

onload = () => {
  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");
    clearTimeout(c);
  }, 1000);

  initSky();
  setTimeout(startPetals, 3000);
  setTimeout(() => typeMessage(document.getElementById("message")), 5200);
  addEventListener("pointerdown", (e) => burstHearts(e.clientX, e.clientY));
};

// ---------- Night sky: twinkling stars, shooting stars, fireflies ----------
function initSky() {
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const mouse = { x: 0, y: 0 };
  let W, H, stars, sparks = [], shooters = [], nextShooter = 2000;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(350, Math.round((W * H) / 4500));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.8,
      r: Math.random() * 1.3 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.8,
      depth: Math.random(),
      color: Math.random() < 0.15 ? "255,190,225" : Math.random() < 0.1 ? "255,225,160" : "255,255,255",
    }));
  };

  const spawnSpark = () => {
    const vmin = Math.min(W, H) / 100;
    sparks.push({
      x: W / 2 + (Math.random() - 0.5) * 70 * vmin,
      y: H - Math.random() * 25 * vmin,
      r: Math.random() * 1.8 + 0.8,
      vy: 0.15 + Math.random() * 0.45,
      sway: Math.random() * Math.PI * 2,
      life: 0,
      max: 300 + Math.random() * 300,
      color: Math.random() < 0.6 ? "255,140,200" : "255,220,140",
    });
  };

  const spawnShooter = () => {
    const angle = Math.PI * (0.78 + Math.random() * 0.08);
    const speed = 9 + Math.random() * 6;
    shooters.push({
      x: W * (0.3 + Math.random() * 0.7),
      y: Math.random() * H * 0.25,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      max: 60 + Math.random() * 30,
    });
  };

  const draw = (t) => {
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(s.phase + (t / 1000) * s.speed);
      const fade = 1 - s.y / (H * 0.85);
      const x = s.x + mouse.x * 20 * s.depth;
      const y = s.y + mouse.y * 12 * s.depth;
      ctx.fillStyle = `rgba(${s.color},${(tw * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.2 && tw > 0.85) {
        ctx.fillStyle = `rgba(${s.color},${(0.15 * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (!reduceMotion && t > nextShooter) {
      spawnShooter();
      nextShooter = t + 2500 + Math.random() * 4500;
    }
    shooters = shooters.filter((s) => s.life++ < s.max);
    for (const s of shooters) {
      s.x += s.vx;
      s.y += s.vy;
      const a = Math.sin((s.life / s.max) * Math.PI);
      const tail = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 12, s.y - s.vy * 12);
      tail.addColorStop(0, `rgba(255,255,255,${a})`);
      tail.addColorStop(0.3, `rgba(255,170,220,${a * 0.5})`);
      tail.addColorStop(1, "rgba(255,170,220,0)");
      ctx.strokeStyle = tail;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 12, s.y - s.vy * 12);
      ctx.stroke();
    }

    if (!reduceMotion && sparks.length < 45 && Math.random() < 0.12) spawnSpark();
    sparks = sparks.filter((p) => p.life++ < p.max);
    ctx.globalCompositeOperation = "lighter";
    for (const p of sparks) {
      p.y -= p.vy;
      p.x += Math.sin(p.sway + p.life / 40) * 0.35;
      const a = Math.sin((p.life / p.max) * Math.PI) * (0.6 + 0.4 * Math.sin(p.life / 8));
      ctx.fillStyle = `rgba(${p.color},${(a * 0.18).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${p.color},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    requestAnimationFrame(draw);
  };

  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / W - 0.5;
    mouse.y = e.clientY / H - 0.5;
  });
  resize();
  requestAnimationFrame(draw);
}

// ---------- Falling petals & hearts ----------
function startPetals() {
  if (reduceMotion) return;
  const box = document.getElementById("petals");

  setInterval(() => {
    if (document.hidden || box.childElementCount > 28) return;
    const size = 10 + Math.random() * 14;
    const petal = document.createElement("div");
    petal.className = Math.random() < 0.25 ? "petal petal--heart" : "petal";
    petal.style.setProperty("--x", `${Math.random() * 100}vw`);
    petal.style.setProperty("--s", `${size}px`);
    petal.style.setProperty("--t", `${9 + Math.random() * 7}s`);
    petal.style.setProperty("--drift", `${(Math.random() - 0.5) * 30}vw`);
    petal.style.setProperty("--spin", `${2 + Math.random() * 3}s`);
    petal.appendChild(document.createElement("i"));
    petal.addEventListener("animationend", (e) => e.target === petal && petal.remove());
    box.appendChild(petal);
  }, 420);
}

function burstHearts(x, y) {
  const count = reduceMotion ? 4 : 12;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 60 + Math.random() * 90;
    const heart = document.createElement("div");
    heart.className = "burst";
    heart.style.setProperty("--x", `${x}px`);
    heart.style.setProperty("--y", `${y}px`);
    heart.style.setProperty("--s", `${12 + Math.random() * 16}px`);
    heart.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    heart.style.setProperty("--dy", `${Math.sin(angle) * dist - 40}px`);
    heart.style.setProperty("--r", `${(Math.random() - 0.5) * 90}deg`);
    heart.style.setProperty("--c", HEART_COLORS[i % HEART_COLORS.length]);
    heart.addEventListener("animationend", () => heart.remove());
    document.body.appendChild(heart);
  }
}

// ---------- Typewriter wish ----------
function typeMessage(el) {
  const chars = Array.from(el.dataset.text);
  let i = 0;
  el.classList.add("typing");

  const tick = () => {
    el.textContent = chars.slice(0, ++i).join("");
    if (i < chars.length) {
      setTimeout(tick, 45 + Math.random() * 45);
    } else {
      setTimeout(() => {
        el.classList.remove("typing");
        document.querySelector(".hint").classList.add("hint--show");
      }, 1200);
    }
  };
  tick();
}
