"use client";

import Image from "next/image";
import { useEffect } from "react";

import { HeartIcon } from "@/components/icons";
import type { PublicMatch } from "@/lib/types";

type MatchModalProps = {
  match: PublicMatch;
  onClose: () => void;
  onViewMatches: () => void;
};

const confetti = [
  { left: "8%", top: "17%", delay: "0.05s", size: 9, color: "coral" },
  { left: "17%", top: "36%", delay: "0.35s", size: 6, color: "gold" },
  { left: "6%", top: "62%", delay: "0.2s", size: 5, color: "ink" },
  { left: "19%", top: "84%", delay: "0.55s", size: 8, color: "coral" },
  { left: "92%", top: "16%", delay: "0.1s", size: 7, color: "gold" },
  { left: "85%", top: "34%", delay: "0.45s", size: 8, color: "coral" },
  { left: "94%", top: "60%", delay: "0.25s", size: 6, color: "ink" },
  { left: "79%", top: "82%", delay: "0.65s", size: 7, color: "coral" },
] as const;

export default function MatchModal({
  match,
  onClose,
  onViewMatches,
}: MatchModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="match-backdrop" onClick={onClose} role="presentation">
      <section
        className="match-modal"
        aria-modal="true"
        aria-labelledby="match-title"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="match-modal__halo" aria-hidden="true" />

        {confetti.map((piece, index) => (
          <span
            key={index}
            className={`confetti confetti--${piece.color}`}
            style={{
              left: piece.left,
              top: piece.top,
              width: piece.size,
              height: piece.size,
              animationDelay: piece.delay,
            }}
            aria-hidden="true"
          />
        ))}

        <p className="eyebrow eyebrow--light">The feeling is mutual</p>
        <h2 id="match-title" className="match-modal__title">
          It&apos;s a match!
        </h2>
        <p className="match-modal__copy">
          You and <strong>{match.profile.name}</strong> liked each other.
        </p>

        <div className="match-avatars">
          <div className="match-avatar match-avatar--profile">
            <Image
              src={match.profile.photo}
              alt={`${match.profile.name}'s profile photo`}
              fill
              sizes="124px"
              priority
            />
          </div>
          <span className="match-avatars__heart" aria-hidden="true">
            <HeartIcon filled />
          </span>
          <div className="match-avatar match-avatar--you" aria-label="You">
            <span>Y</span>
            <small>You</small>
          </div>
        </div>

        <p className="match-modal__detail">
          {match.profile.city} · {match.profile.interests.slice(0, 2).join(" · ")}
        </p>

        <div className="match-modal__actions">
          <button className="primary-button" type="button" onClick={onClose}>
            Keep swiping
          </button>
          <button className="text-button" type="button" onClick={onViewMatches}>
            See your matches
          </button>
        </div>
      </section>
    </div>
  );
}
