import { useEffect, useRef } from "react";
import "../vortex.css";

export default function VortexBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const DIGITS = [];
    const ARMS = 14; // More arms = denser vortex
    const POINTS = 60; 
    const SPIRAL_TIGHTNESS = 0.22;

    function randomDigit() {
      return Math.random() < 0.5 ? "0" : "1";
    }

    function init() {
      DIGITS.length = 0;
      const maxR = Math.min(w, h) * 0.9;
      const minR = maxR * 0.05;

      for (let arm = 0; arm < ARMS; arm++) {
        const offset = (Math.PI * 2 * arm) / ARMS;

        for (let i = 0; i < POINTS; i++) {
          const t = i / (POINTS - 1);
          const r = minR + t * maxR;
          const angle = offset + r * SPIRAL_TIGHTNESS;

          DIGITS.push({
            char: randomDigit(),
            baseRadius: r + (Math.random() - 0.5) * 12,
            baseAngle: angle + (Math.random() - 0.5) * 0.05,
            depth: t,
            size: 12 + t * 24,
            hueShift: Math.random() < 0.5 ? 200 : 300,
            flickerOffset: Math.random() * 1000,
            opacityBase: 0.4 + (1 - t) * 0.9
          });
        }
      }
    }

    init();

    let rot = 0;

function draw(t) {
  ctx.fillStyle = "rgba(0, 0, 20, 0.22)";
  ctx.fillRect(0, 0, w, h);

  // speed & global rotation
  rot += 0.0015;  // increase for stronger rotation

  const cx = w / 2;
  const cy = h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot); // 🔥 spin whole canvas
  ctx.translate(-cx, -cy);

  DIGITS.forEach((d) => {
    const pulse = Math.sin(t * 0.001 + d.baseRadius * 0.01) * 10;

    const radius = d.baseRadius + pulse;
    const angle = d.baseAngle;

    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    ctx.save();
    ctx.translate(x, y);

    const flicker =
      0.8 +
      Math.sin((t + d.flickerOffset) * 0.01 + d.depth * 5) * 0.3;

    const opacity = d.opacityBase * flicker;

    const hue = d.hueShift + Math.sin(t * 0.0002) * 20;

    ctx.font = `${d.size}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.shadowColor = `hsla(${hue},100%,70%,${opacity})`;
    ctx.shadowBlur = 16 * (1 - d.depth);

    ctx.fillStyle = `hsla(${hue},100%,70%,${opacity})`;
    ctx.fillText(d.char, 0, 0);

    ctx.restore();

    if (Math.random() < 0.002) d.char = randomDigit();
  });

  ctx.restore(); // 🔥 undo rotation

  requestAnimationFrame(draw);
}


    requestAnimationFrame(draw);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="vortexCanvas" />;
}
