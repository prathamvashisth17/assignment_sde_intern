"use client";

import Image from "next/image";
import { useEffect } from "react";

import { CloseIcon, HeartIcon } from "@/components/icons";
import type { PublicMatch } from "@/lib/types";

type MatchesSheetProps = {
  open: boolean;
  matches: PublicMatch[];
  onClose: () => void;
  onViewDiscover: () => void;
};

function formatMatchTime(value: string): string {
  const matchedAt = new Date(value).getTime();
  if (Number.isNaN(matchedAt)) return "Matched recently";

  const diff = Math.max(0, Date.now() - matchedAt);
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Matched just now";
  if (minutes < 60) return `Matched ${minutes}m ago`;
  if (hours < 24) return `Matched ${hours}h ago`;
  if (days < 7) return `Matched ${days}d ago`;

  return `Matched ${new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(matchedAt))}`;
}

export default function MatchesSheet({
  open,
  matches,
  onClose,
  onViewDiscover,
}: MatchesSheetProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <section
        className="matches-sheet"
        aria-modal="true"
        aria-labelledby="matches-title"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="matches-sheet__handle" aria-hidden="true" />
        <header className="matches-sheet__header">
          <div>
            <p className="eyebrow">Mutual likes</p>
            <h2 id="matches-title">Your matches</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close matches">
            <CloseIcon />
          </button>
        </header>

        <p className="matches-sheet__intro">
          These are the people you both liked. Nobody else can see who liked them first.
        </p>

        {matches.length === 0 ? (
          <div className="matches-empty">
            <div className="matches-empty__icon" aria-hidden="true">
              <HeartIcon />
            </div>
            <h3>No matches yet</h3>
            <p>When you and someone else both swipe right, they will show up here.</p>
            <button className="primary-button" type="button" onClick={onViewDiscover}>
              Back to Discover
            </button>
          </div>
        ) : (
          <ul className="matches-list">
            {matches.map((match) => (
              <li className="match-row" key={match.profile.id}>
                <div className="match-row__photo">
                  <Image
                    src={match.profile.photo}
                    alt={`${match.profile.name}'s profile photo`}
                    fill
                    sizes="72px"
                  />
                </div>
                <div className="match-row__info">
                  <p className="match-row__name">
                    {match.profile.name}
                    <span>{match.profile.age}</span>
                  </p>
                  <p className="match-row__meta">
                    {match.profile.city} · {formatMatchTime(match.matchedAt)}
                  </p>
                </div>
                <span className="match-row__heart" aria-hidden="true">
                  <HeartIcon filled />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
