import React, { useEffect, useRef } from "react";

export default function VortexCanvas() {
  const canvasRef = useRef(null);
  const state = useRef({
    digits: [],
    width: 0,
    height: 0,
    ARMS: 10,
    POINTS: 40,
    SPIRAL: 0.28,
    speed: 0.00045,
    speedMultiplier: 1,
    targetSpeedMultiplier: 1,
    angle: 0,
    last: 0,
    running: true,
    rotateFactor: 0.6, // << new: global scene rotation multiplier
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const s = state.current;

    let rafId = null;

    function resize() {
      s.width = canvas.width = window.innerWidth;
      s.height = canvas.height = window.innerHeight;
      initDigits();
    }

    function randomDigit() {
      return Math.random() < 0.5 ? "0" : "1";
    }

    function initDigits() {
      s.digits = [];
      const maxR = Math.min(s.width, s.height) * 0.9;
      const minR = maxR * 0.06;

      for (let arm = 0; arm < s.ARMS; arm++) {
        const offset = (Math.PI * 2 * arm) / s.ARMS;

        for (let i = 0; i < s.POINTS; i++) {
          const t = i / (s.POINTS - 1);
          const radius = minR + t * maxR;
          const angle = offset + radius * s.SPIRAL;
          const depth = t;

          s.digits.push({
            char: randomDigit(),
            radius: radius + (Math.random() - 0.5) * 8,
            angle: angle + (Math.random() - 0.5) * 0.06,
            depth,
            size: 12 + depth * 24,
            opacity: 0.2 + (1 - depth) * 0.8,
          });
        }
      }
    }

    resize();
    window.addEventListener("resize", resize);

    // listen for vortex engage
    const engageHandler = (e) => {
      s.targetSpeedMultiplier = e?.detail?.intensity || 25;
      setTimeout(() => (s.targetSpeedMultiplier = 1), 2000);
    };
    window.addEventListener("vortex:engage", engageHandler);

    function animate(time) {
      if (!s.last) s.last = time;
      const dt = time - s.last;
      s.last = time;

      if (!s.running) return; // stop anim when unmounted

      s.speedMultiplier +=
        (s.targetSpeedMultiplier - s.speedMultiplier) * 0.04;

      s.angle += s.speed * s.speedMultiplier * dt;

      ctx.fillStyle = "rgba(2, 6, 23, 0.18)";
      ctx.fillRect(0, 0, s.width, s.height);

      const cx = s.width / 2;
      const cy = s.height / 2;

      // compute global rotation for the whole scene
      const globalRotation = s.angle * s.rotateFactor;

      // apply global rotation around center
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(globalRotation);

      s.digits.forEach((d) => {
        const swirl =
          Math.sin(time * 0.0005 + d.radius * 0.008) * 6;
        const r = d.radius + swirl;
        const a =
          d.angle + s.angle * (0.7 + 0.6 * (1 - d.depth));

        // compute positions relative to center (since context is translated to center)
        const lx = Math.cos(a) * r;
        const ly = Math.sin(a) * r;

        ctx.save();
        ctx.translate(lx, ly);

        ctx.scale(1, 0.7 + (1 - d.depth) * 0.6);
        ctx.rotate(a + Math.PI / 2);

        ctx.font = `${d.size}px monospace`;
        const o = d.opacity;

        // apply themed color to shadows and fill
        ctx.shadowColor = `rgba(0,255,191,${o})`;
        ctx.shadowBlur = 20;

        ctx.fillStyle = `rgba(0,255,191,${o})`;
        ctx.fillText(d.char, 0, 0);
        ctx.restore();

        if (Math.random() < 0.002) d.char = randomDigit();
      });

      ctx.restore(); // restore after rotating the scene

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      s.running = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("vortex:engage", engageHandler);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="vortexCanvas"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1, // move canvas behind page content so UI is visible over the vortex
      }}
    />
  );
}
