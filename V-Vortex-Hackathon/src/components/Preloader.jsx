import { useRef, useState, useEffect } from "react";
import "../styles/preloader.css";

export default function Preloader({ onFinished }) {
  const [stage, setStage] = useState("tap"); // "tap" | "playing"
  const videoRef = useRef(null);
  const enterRef = useRef(null);
  const flashRef = useRef(null);
  const tappedRef = useRef(false);
  const finishedRef = useRef(false); // Prevent calling onFinished multiple times

  // Make sure playsinline attribute exists for mobile browsers
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      // ensure iOS Safari plays inline
      vid.setAttribute("playsinline", "");
      vid.setAttribute("webkit-playsinline", "");
    }
  }, []);

  // Block all keyboard controls during the preloader video
  useEffect(() => {
    if (stage === "playing") {
      const blockKeyboard = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      window.addEventListener('keydown', blockKeyboard, true);
      window.addEventListener('keyup', blockKeyboard, true);
      window.addEventListener('keypress', blockKeyboard, true);
      
      return () => {
        window.removeEventListener('keydown', blockKeyboard, true);
        window.removeEventListener('keyup', blockKeyboard, true);
        window.removeEventListener('keypress', blockKeyboard, true);
      };
    }
  }, [stage]);

  const handleTap = (e) => {
    // Prevent double/triple triggers (pointerdown + click, etc)
    if (tappedRef.current) return;
    tappedRef.current = true;

    // Small safety for touch events
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    // Add zoom/glitch animation to entry screen
    if (enterRef.current) {
      enterRef.current.classList.add("tapZoom");
    }

    // Keep the UX snappy on mobile: short delay before switching to video
    setTimeout(() => {
      setStage("playing");

      // Start video after a tiny delay to allow DOM updates/animations to run
      setTimeout(async () => {
        const vid = videoRef.current;
        if (!vid) return;

        // Start with muted to maximize compatibility on mobile; we'll try to unmute after play
        try {
          vid.muted = true;
          vid.volume = 0;
          vid.currentTime = 0;
          // Try to play; if browser blocks unmuted autoplay, playing muted will usually succeed
          await vid.play();
          // Attempt to unmute (allowed because this handler originates from user gesture)
          try {
            vid.muted = false;
            // fade volume in
            let vol = 0;
            vid.volume = 0;
            const fade = setInterval(() => {
              if (vol >= 1) {
                clearInterval(fade);
              } else {
                vol = Math.min(1, vol + 0.05);
                vid.volume = vol;
              }
            }, 120);
          } catch (unmuteErr) {
            // Unmuting failed — keep muted but keep playing (better than nothing)
            vid.muted = true;
          }
        } catch (playErr) {
          // Some browsers refuse to play even after a gesture — fallback: try setting muted true then play
          try {
            vid.muted = true;
            vid.currentTime = 0;
            await vid.play();
          } catch (err) {
            // Give up — still transition after a short delay
            console.warn("Intro video could not play:", err);
            setTimeout(() => onFinished(), 800);
          }
        }
      }, 300);
    }, 500);
  };

  const handleEnd = () => {
    if (finishedRef.current) return; // Prevent double-trigger
    finishedRef.current = true;

    if (flashRef.current) flashRef.current.classList.add("flashVisible");

    // small stagger: fade out video slightly after flash starts
    setTimeout(() => {
      const vid = videoRef.current;
      if (vid) vid.classList.add("videoFadeOut");
    }, 200);

    setTimeout(() => onFinished(), 1200);
  };

  // Add safety timeout for mobile browsers where onEnded might not fire
  useEffect(() => {
    if (stage === "playing") {
      const safetyTimeout = setTimeout(() => {
        console.warn("Intro video timeout safety net triggered on mobile");
        handleEnd();
      }, 8000); // Video is ~6-7 seconds, this gives buffer

      return () => clearTimeout(safetyTimeout);
    }
  }, [stage]);

  // If user rotates device, ensure layout stays full-screen (optional improvement)
  useEffect(() => {
    const onRotate = () => {
      // Force reflow for some mobile browsers so the video covers the viewport
      const vid = videoRef.current;
      if (vid) {
        vid.style.width = "100%";
        vid.style.height = "100%";
      }
    };
    window.addEventListener("orientationchange", onRotate);
    return () => window.removeEventListener("orientationchange", onRotate);
  }, []);

  return (
    <>
      {/* Scanline overlay */}
      <div className="scanlines" />

      {/* Flash transition */}
      <div id="flash" ref={flashRef} />

      {/* TAP SCREEN */}
      {stage === "tap" && (
        <div
          id="enterScreen"
          ref={enterRef}
          // pointerdown covers mouse/touch/pen and fires earlier than click (better UX on mobile)
          onPointerDown={handleTap}
          // keep onClick as fallback on some older browsers
          onClick={handleTap}
          role="button"
          tabIndex={0}
          aria-label="Enter the vortex"
        >
          <div id="enterText">DARE TO ENTER THE VORTEX? .. TAP / CLICK HERE ..</div>
          <div id="arrow">▼</div>

          {/* Glitch overlay */}
          <div className="glitchLayer" />
        </div>
      )}

      {/* VIDEO */}
      {stage === "playing" && (
        <video
          id="introVideo"
          className="introVideo"
          ref={videoRef}
          playsInline
          // Start muted to maximize mobile compatibility; component code will try to unmute after play
          muted
          preload="auto"
          onEnded={handleEnd}
          onLoadedData={(e) => {
            // smooth opacity fade-in once video data is ready
            setTimeout(() => {
              if (e && e.target) e.target.style.opacity = 1;
            }, 100);
          }}
          // Disable all video controls
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          // Prevent pause and other interactions
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => e.preventDefault()}
          onDoubleClick={(e) => e.preventDefault()}
          onPause={(e) => {
            // If user somehow pauses, immediately resume
            if (videoRef.current && !finishedRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          src="/secondpart_fixed.mp4"
        />
      )}
    </>
  );
}
