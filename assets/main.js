(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  /* ---------- hero: per-letter PORTFOLIO + mouse parallax ---------- */
  const hero = $(".hero");
  $$(".hero-portfolio use").forEach((u, i) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "ch");
    g.style.setProperty("--i", i);
    u.replaceWith(g);
    g.appendChild(u);
    g.addEventListener("mouseenter", () => {
      g.classList.remove("is-bounce");
      void g.getBBox();
      g.style.animation = "none";
      requestAnimationFrame(() => { g.style.animation = ""; g.classList.add("is-bounce"); });
    });
  });
  if (finePointer && !reduced) {
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5) * 2);
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5) * 2);
    });
    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--mx", 0);
      hero.style.setProperty("--my", 0);
    });
  }

  /* ---------- nav, progress bar, scroll-linked textures ---------- */
  const nav = $(".nav");
  const bar = $(".progress span");
  const textures = $$(".concepts, .hop-main");
  const contact = $(".contact");
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--p", max > 0 ? y / max : 0);
    nav.classList.toggle("is-solid", y > innerHeight * .6);
    nav.classList.toggle("is-hidden", y > innerHeight && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove("is-hidden");
    lastY = y;
    if (reduced) return;
    textures.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = (innerHeight - r.top) / (innerHeight + r.height);
      if (p > -0.2 && p < 1.2) el.style.setProperty("--sy", (p - .5).toFixed(3));
    });
    const r = contact.getBoundingClientRect();
    contact.style.setProperty("--sy2", ((innerHeight - r.top) / (innerHeight + r.height) - .5).toFixed(3));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- counters ---------- */
  const fmt = (n, el) => {
    const dec = +(el.dataset.dec || 0);
    let s = dec ? n.toFixed(dec) : Math.round(n).toString();
    if (el.dataset.format === "comma") s = Math.round(n).toLocaleString("en-US");
    return s + (el.dataset.suffix || "");
  };
  const count = el => {
    const to = parseFloat(el.dataset.to);
    if (reduced) { el.textContent = fmt(to, el); return; }
    const dur = to > 1000 ? 2200 : 1400;
    const t0 = performance.now();
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - k, 4)), el);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      $$(".count", e.target).forEach(c => { if (!c.dataset.done) { c.dataset.done = 1; count(c); } });
      if (e.target.classList.contains("count") && !e.target.dataset.done) { e.target.dataset.done = 1; count(e.target); }
      io.unobserve(e.target);
    });
  }, { threshold: .18, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(el => io.observe(el));
  $$(".count").forEach(el => { if (!el.closest(".reveal")) io.observe(el); });

  /* ---------- skill chips light up their bullet ---------- */
  $$(".chips").forEach(group => {
    const list = $(`[data-chips="${group.dataset.for}"]`);
    $$(".chip", group).forEach(chip => {
      const li = $(`li[data-tag="${chip.dataset.tag}"]`, list);
      const on = v => { chip.classList.toggle("is-on", v); li && li.classList.toggle("is-lit", v); };
      chip.addEventListener("mouseenter", () => on(true));
      chip.addEventListener("mouseleave", () => on(false));
      chip.addEventListener("focus", () => on(true));
      chip.addEventListener("blur", () => on(false));
      chip.addEventListener("click", () => on(!chip.classList.contains("is-on")));
    });
  });

  /* ---------- 3D tilt ---------- */
  if (finePointer && !reduced) {
    $$("[data-tilt]").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.transition = "transform .15s";
        el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .7s cubic-bezier(.2,.7,.1,1)";
        el.style.transform = "";
      });
    });
  }

  /* ---------- zoom lens on the analytics screenshot ---------- */
  $$(".lens-wrap").forEach(wrap => {
    const img = $("img", wrap), lens = $(".lens", wrap), z = 2.4;
    const move = e => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      lens.style.left = x + "px";
      lens.style.top = y + "px";
      lens.style.backgroundImage = `url(${img.currentSrc || img.src})`;
      lens.style.backgroundSize = `${r.width * z}px ${r.height * z}px`;
      lens.style.backgroundPosition = `${-(x * z - 110)}px ${-(y * z - 110)}px`;
    };
    wrap.addEventListener("pointerenter", e => { wrap.classList.add("is-zooming"); move(e); });
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", () => wrap.classList.remove("is-zooming"));
  });

  /* ---------- live chat replay ---------- */
  const chat = $(".chat");
  if (chat) {
    const msgs = $$(".msg", chat), typing = $(".typing", chat), replay = $(".chat-replay", chat);
    const log = $(".chat-log", chat);
    let timers = [];
    const play = () => {
      timers.forEach(clearTimeout); timers = [];
      msgs.forEach(m => m.classList.remove("is-shown"));
      replay.classList.remove("is-on");
      let t = 300;
      msgs.forEach((m, i) => {
        timers.push(setTimeout(() => {
          typing.classList.toggle("is-out", m.classList.contains("out"));
          typing.classList.add("is-on");
          log.after(typing);
        }, t));
        t += reduced ? 0 : 900 + m.textContent.length * 12;
        timers.push(setTimeout(() => {
          typing.classList.remove("is-on");
          m.classList.add("is-shown");
          if (i === msgs.length - 1) replay.classList.add("is-on");
        }, t));
        t += 350;
      });
    };
    new IntersectionObserver((es, o) => {
      if (es[0].isIntersecting) { play(); o.disconnect(); }
    }, { threshold: .45 }).observe(chat);
    replay.addEventListener("click", play);
  }

  /* ---------- "chaotic." scatters on hover ---------- */
  $$("[data-chaos]").forEach(el => {
    el.innerHTML = [...el.textContent].map(c => `<span class="l">${c}</span>`).join("");
    const ls = $$(".l", el);
    el.addEventListener("mouseenter", () => {
      if (reduced) return;
      ls.forEach(l => {
        l.style.transform = `translate(${(Math.random() - .5) * 26}px, ${(Math.random() - .5) * 30}px) rotate(${(Math.random() - .5) * 50}deg)`;
      });
    });
    el.addEventListener("mouseleave", () => ls.forEach(l => (l.style.transform = "")));
  });

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$(".magnetic").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });
  }

  /* ---------- copy email ---------- */
  const toast = $(".toast");
  let toastTimer;
  const say = msg => {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  };
  $$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); say("Email copied ✓"); }
    catch { say(b.dataset.copy); }
  }));

  /* ---------- lightbox ---------- */
  const lb = $(".lightbox"), lbImg = $("img", lb), lbCap = $("figcaption", lb);
  let group = [], idx = 0, opener = null;
  const show = i => {
    idx = (i + group.length) % group.length;
    const el = group[idx];
    lbImg.src = el.dataset.src;
    lbImg.alt = $("img", el).alt;
    lbCap.textContent = `${$("img", el).alt}  ·  ${idx + 1} / ${group.length}`;
    $(".lb-prev", lb).hidden = $(".lb-next", lb).hidden = group.length < 2;
  };
  const open = el => {
    opener = el;
    group = $$(`[data-lb="${el.dataset.lb}"]`);
    show(group.indexOf(el));
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    $(".lb-close", lb).focus();
  };
  const close = () => {
    lb.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { lb.hidden = true; }, 250);
    opener && opener.focus();
  };
  $$("[data-lb]").forEach(el => el.addEventListener("click", () => open(el)));
  $(".lb-close", lb).addEventListener("click", close);
  $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
  $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", e => { if (e.target === lb || e.target.tagName === "FIGURE") close(); });
  addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
    if (e.key === "Tab") {
      const f = $$("button:not([hidden])", lb);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  let sx = null;
  lb.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });

  /* ---------- custom cursor ---------- */
  if (finePointer) {
    const cur = $(".cursor"), label = $(".cursor-label", cur);
    addEventListener("pointermove", e => {
      cur.style.setProperty("--cx", e.clientX + "px");
      cur.style.setProperty("--cy", e.clientY + "px");
      const t = e.target.closest("[data-cursor]");
      cur.classList.toggle("is-view", !!t && t.dataset.cursor === "view");
      cur.classList.toggle("is-zoom", !!t && t.dataset.cursor === "zoom");
      if (t) label.textContent = t.dataset.cursor === "view" ? "View" : "";
    }, { passive: true });
    document.addEventListener("pointerleave", () => cur.style.setProperty("--cx", "-100px"));
  }
})();
