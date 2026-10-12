import { createTimeline, stagger, svg } from "./vendor/animejs-4.5.0.esm.js";
import "./vendor/motion-14.1.0.js";

const { animate, inView, scroll, springValue, styleEffect } = globalThis.Motion;
const spring = { stiffness: 190, damping: 23, mass: 0.7 };

export function initMotion() {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const controls = document.querySelector(".scene-controls");
  const replay = document.querySelector("#replay-scene");
  const toggle = document.querySelector("#toggle-motion");
  const label = toggle.querySelector(".motion-control-label");
  const icon = toggle.querySelector(".motion-control-icon");
  const root = document.documentElement;
  const seen = new WeakSet();
  const listeners = new AbortController();
  let userPaused = false;
  let introPlayed = false;
  let failed = false;
  let disposeEffects = () => {};
  let replayScene = () => {};

  function syncMode() {
    disposeEffects();
    disposeEffects = () => {};
    replayScene = () => {};
    const paused = userPaused;
    root.dataset.motion = paused ? "paused" : "running";
    toggle.setAttribute("aria-pressed", String(userPaused));
    replay.disabled = paused;
    label.textContent = paused ? "Resume motion" : "Pause motion";
    icon.textContent = paused ? "▷" : "Ⅱ";
    if (paused || document.hidden || failed) return;

    const cleanup = [];
    disposeEffects = () => {
      for (let i = cleanup.length - 1; i >= 0; i--) cleanup[i]();
      cleanup.length = 0;
    };
    try {
      replayScene = startEffects(cleanup, seen, finePointer, !introPlayed);
      introPlayed = true;
    } catch {
      disposeEffects();
      failed = true;
      controls.hidden = true;
      root.dataset.motion = "paused";
    }
  }

  toggle.addEventListener("click", () => {
    userPaused = !userPaused;
    syncMode();
  }, { signal: listeners.signal });
  replay.addEventListener("click", () => replayScene(), { signal: listeners.signal });
  finePointer.addEventListener("change", syncMode, { signal: listeners.signal });
  document.addEventListener("visibilitychange", syncMode, { signal: listeners.signal });
  window.addEventListener("pagehide", () => disposeEffects(), { signal: listeners.signal });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) syncMode();
  }, { signal: listeners.signal });

  controls.hidden = false;
  syncMode();
  return () => {
    disposeEffects();
    listeners.abort();
    controls.hidden = true;
    delete root.dataset.motion;
  };
}

function startEffects(cleanup, seen, finePointer, playIntro) {
  const scene = document.querySelector(".hero-art");
  const route = document.querySelector(".scene-route");
  const dialog = document.querySelector("#car-dialog");
  const events = new AbortController();
  const finiteAnimations = new Set();
  const snapshot = new Map();
  const attributes = ["style", "opacity", "pathLength", "draw", "stroke-dasharray", "stroke-dashoffset"];

  function preserve(element) {
    if (!snapshot.has(element)) {
      snapshot.set(element, attributes.map((name) => [name, element.getAttribute(name)]));
    }
    return element;
  }

  cleanup.push(() => {
    for (const [element, saved] of snapshot) {
      for (const [name, value] of saved) {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      }
    }
  });
  cleanup.push(() => events.abort());
  cleanup.push(() => {
    for (const animation of finiteAnimations) animation.cancel();
    finiteAnimations.clear();
  });

  function run(target, keyframes, options) {
    const elements = target instanceof Element ? [target] : [...target];
    elements.forEach(preserve);
    const animation = animate(elements, keyframes, options);
    finiteAnimations.add(animation);
    animation.then(() => finiteAnimations.delete(animation));
    return animation;
  }

  const titleLines = document.querySelectorAll(".headline-line > span, .headline-line > em");
  const landscape = document.querySelector(".scene-backdrop");
  const car = document.querySelector(".hero-car");
  const halo = document.querySelector(".scene-halo");
  const birds = document.querySelector(".scene-birds");
  const stamp = document.querySelector(".scene-stamp svg");
  const captions = document.querySelectorAll(".scene-caption > span");
  [...titleLines, landscape, car, route, halo, birds, stamp, ...captions].forEach(preserve);
  const drawable = svg.createDrawable(route, 0, 1);
  const timeline = createTimeline({ autoplay: false, defaults: { ease: "out(4)" } });
  cleanup.push(() => timeline.revert());
  timeline
    .add(titleLines, { y: [65, 0], rotate: [3, 0], opacity: [0.2, 1], duration: 1000, delay: stagger(110) }, 0)
    .add(landscape, { scale: [1.16, 1], duration: 2100 }, 0)
    .add(drawable, { draw: ["0 0", "0 1"], duration: 1800, ease: "inOut(2)" }, 350)
    .add(car, { x: ["-125%", "0%"], y: ["14%", "0%"], rotate: [-4, 0], opacity: [0, 1], duration: 1550 }, 350)
    .add(halo, { scale: [0.6, 1], opacity: [0, 0.6], duration: 1600 }, 150)
    .add(birds, { x: [-75, 0], y: [12, 0], opacity: [0, 1], duration: 1800 }, 350)
    .add(stamp, { rotate: [-100, 0], duration: 1500 }, 200)
    .add(captions, { y: [24, 0], opacity: [0, 1], duration: 750, delay: stagger(100) }, 1450);

  const bounds = scene.getBoundingClientRect();
  if (playIntro && bounds.bottom > 0 && bounds.top < innerHeight) timeline.play();
  else timeline.seek(timeline.duration);
  let resumeScene = false;
  cleanup.push(inView(scene, () => {
    if (resumeScene) timeline.play();
    return () => {
      resumeScene = !timeline.paused && timeline.currentTime < timeline.duration;
      timeline.pause();
    };
  }));

  for (const element of document.querySelectorAll("[data-reveal]")) {
    cleanup.push(inView(element, () => {
      if (seen.has(element)) return;
      seen.add(element);
      const index = element.classList.contains("car-card") ? [...element.parentElement.children].indexOf(element) : 0;
      run(element, { opacity: [0.25, 1], transform: ["translateY(55px) rotateX(5deg)", "translateY(0px) rotateX(0deg)"] }, { duration: 0.75, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] });
    }, { amount: 0.12 }));
  }

  function bindScroll(element, transforms, options) {
    preserve(element);
    const animation = animate(element, { transform: transforms }, { ease: "linear" });
    cleanup.push(() => animation.cancel());
    cleanup.push(scroll(animation, options));
  }
  bindScroll(document.querySelector(".reading-progress"), ["scaleX(0)", "scaleX(1)"]);
  bindScroll(document.querySelector(".scene-scroll"), ["translateY(0px) scale(1.04)", "translateY(65px) scale(1.24)"], { target: scene, offset: ["start start", "end start"] });

  if (finePointer.matches) {
    const layer = preserve(document.querySelector(".scene-layer"));
    const drift = preserve(document.querySelector(".hero-car-drift"));
    bindPointer(scene, [
      { element: layer, properties: { x: [0, -22], y: [0, -14] } },
      { element: drift, properties: { x: [0, 25], y: [0, 13] } },
    ]);
    for (const card of document.querySelectorAll(".car-card")) {
      bindPointer(card, [
        { element: preserve(card.querySelector(".car-art")), properties: { rotateX: [0, -13], rotateY: [0, 16], y: [0, -8, "lift"] } },
        { element: preserve(card.querySelector(".car-shine")), properties: { "--shine-x": ["50%", 100], "--shine-y": ["35%", 100] } },
      ]);
    }
  }

  function bindPointer(surface, targets) {
    const values = [];
    let rectangle = null;
    for (const target of targets) {
      const effects = {};
      for (const [property, [initial, distance, mode]] of Object.entries(target.properties)) {
        const value = springValue(initial, spring);
        effects[property] = value;
        values.push({ value, initial, distance, mode, property });
        cleanup.push(() => value.destroy());
      }
      cleanup.push(styleEffect(target.element, effects));
    }
    function reset() {
      rectangle = null;
      for (const entry of values) entry.value.set(entry.initial);
    }
    surface.addEventListener("pointerenter", () => {
      rectangle = surface.getBoundingClientRect();
    }, { signal: events.signal });
    surface.addEventListener("pointermove", (event) => {
      if (!rectangle) rectangle = surface.getBoundingClientRect();
      const x = Math.max(-0.5, Math.min(0.5, (event.clientX - rectangle.left) / rectangle.width - 0.5));
      const y = Math.max(-0.5, Math.min(0.5, (event.clientY - rectangle.top) / rectangle.height - 0.5));
      for (const entry of values) {
        if (entry.mode === "lift") entry.value.set(entry.distance);
        else if (entry.property.startsWith("--shine")) entry.value.set(`${50 + (entry.property.endsWith("x") ? x : y) * entry.distance}%`);
        else entry.value.set((entry.property === "rotateX" || entry.property === "y" ? y : x) * entry.distance);
      }
    }, { signal: events.signal });
    surface.addEventListener("pointerleave", reset, { signal: events.signal });
    window.addEventListener("scroll", reset, { signal: events.signal, passive: true });
    window.addEventListener("resize", reset, { signal: events.signal });
    surface.addEventListener("focusin", () => {
      for (const entry of values) if (entry.mode === "lift") entry.value.set(entry.distance);
    }, { signal: events.signal });
    surface.addEventListener("focusout", reset, { signal: events.signal });
  }

  let dialogAnimations = [];
  function cancelDialogAnimations() {
    for (const animation of dialogAnimations) {
      animation.cancel();
      finiteAnimations.delete(animation);
    }
    dialogAnimations = [];
  }
  dialog.addEventListener("car-details-open", () => {
    cancelDialogAnimations();
    dialogAnimations = [
      run(dialog, { opacity: [0, 1], transform: ["translateY(38px) scale(0.95)", "translateY(0px) scale(1)"] }, { type: "spring", duration: 0.5, bounce: 0.17 }),
      run(document.querySelector("#detail-image"), { transform: ["translateX(-42px)", "translateX(0px)"] }, { type: "spring", duration: 0.55, bounce: 0.15, delay: 0.08 }),
      run(document.querySelectorAll(".specifications > div"), { opacity: [0.3, 1], transform: ["translateY(12px)", "translateY(0px)"] }, { duration: 0.3, delay: globalThis.Motion.stagger(0.055, { startDelay: 0.12 }) }),
    ];
  }, { signal: events.signal });
  dialog.addEventListener("close", cancelDialogAnimations, { signal: events.signal });
  cleanup.push(cancelDialogAnimations);
  return () => timeline.restart();
}
