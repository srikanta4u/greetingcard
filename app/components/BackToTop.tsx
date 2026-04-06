"use client";

import { useCallback, useEffect, useState } from "react";

const SHOW_AFTER_PX = 300;

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Back to top"
      className="fixed bottom-24 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 sm:bottom-8 sm:right-6"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M11.47 7.72a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 0 1-1.06-1.06l7.5-7.5Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
