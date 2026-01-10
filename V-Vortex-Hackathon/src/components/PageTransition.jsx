import { useEffect, useRef } from "react";
import "../styles/transition.css";

export default function PageTransition({ videoSrc, onFinished }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Block all keyboard controls during transition
    const blockKeyboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    window.addEventListener('keydown', blockKeyboard, true);
    window.addEventListener('keyup', blockKeyboard, true);
    window.addEventListener('keypress', blockKeyboard, true);

    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      onFinished(); // ← THIS UNBLOCKS ROUTING
    };

    // ✅ MUST be muted for autoplay
    video.muted = true;
    video.currentTime = 0;

    const playPromise = video.play();

    // ❗ autoplay blocked → exit anyway
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        finish();
      });
    }

    video.addEventListener("ended", finish);

    // 🛡 ABSOLUTE SAFETY NET (never get stuck)
    const timeout = setTimeout(finish, 2800);

    return () => {
      clearTimeout(timeout);
      video.removeEventListener("ended", finish);
      // Remove keyboard blockers
      window.removeEventListener('keydown', blockKeyboard, true);
      window.removeEventListener('keyup', blockKeyboard, true);
      window.removeEventListener('keypress', blockKeyboard, true);
    };
  }, [onFinished]);

  return (
    <div className="transitionOverlay">
      <video
        ref={videoRef}
        className="transitionVideo"
        playsInline
        muted
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  );
}

