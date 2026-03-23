"use client";

import { useState, useEffect } from "react";

const PHRASES = [
  "you can borrow.",
  "there's no catch.",
  "there's no interest.",
  "there's no liquidation.",
  "it's obligation free credit.",
];

const INTERVAL_MS = 2800;

export function OFCRolodex() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % PHRASES.length);
        setAnimating(false);
      }, 300);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="text-sm md:text-base flex items-center justify-center gap-2">
      <span className="text-accent font-semibold">OFC</span>
      <span className="relative h-6 overflow-hidden inline-grid items-center">
        {/* Invisible copies of all phrases to set the width to the longest one */}
        {PHRASES.map((phrase) => (
          <span key={phrase} className="invisible col-start-1 row-start-1 whitespace-nowrap">
            {phrase}
          </span>
        ))}
        {/* Visible animated phrase */}
        <span
          className={`col-start-1 row-start-1 text-secondary whitespace-nowrap transition-all duration-300 ease-in-out ${
            animating
              ? "-translate-y-full opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          {PHRASES[index]}
        </span>
      </span>
    </p>
  );
}
