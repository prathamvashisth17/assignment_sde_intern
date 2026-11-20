"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  HeartIcon,
  HeartStackIcon,
  SparkleIcon,
  XIcon,
} from "@/components/icons";
import MatchModal from "@/components/MatchModal";
import MatchesSheet from "@/components/MatchesSheet";
import SwipeCard from "@/components/SwipeCard";
import type { PublicMatch, PublicProfile, SwipeDirection } from "@/lib/types";

type FeedResponse = {
  profiles: PublicProfile[];
  remaining: number;
};

type MatchesResponse = {
  matches: PublicMatch[];
  count: number;
};

type SwipeResponse = {
  matched: boolean;
  match: PublicMatch | null;
  alreadySwiped?: boolean;
  error?: string;
};

type ToastState = {
  id: number;
  kind: "like" | "pass" | "error";
  text: string;
};

export default function Discover() {
  const [feed, setFeed] = useState<PublicProfile[]>([]);
  const [matches, setMatches] = useState<PublicMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [exit, setExit] = useState<{
    id: string;
    direction: SwipeDirection;
  } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [matchModal, setMatchModal] = useState<PublicMatch | null>(null);
  const [matchesOpen, setMatchesOpen] = useState(false);

  const busyRef = useRef(false);
  const toastId = useRef(0);
  const currentProfile = feed[0] ?? null;

  function showToast(kind: ToastState["kind"], text: string) {
    toastId.current += 1;
    setToast({ id: toastId.current, kind, text });
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadDiscover() {
      setLoading(true);
      setLoadError(null);

      try {
        const [feedResponse, matchesResponse] = await Promise.all([
          fetch("/api/feed", { cache: "no-store", signal: controller.signal }),
          fetch("/api/matches", { cache: "no-store", signal: controller.signal }),
        ]);

        if (!feedResponse.ok) {
          throw new Error("The feed could not be loaded.");
        }

        const feedData = (await feedResponse.json()) as FeedResponse;
        setFeed(Array.isArray(feedData.profiles) ? feedData.profiles : []);

        if (matchesResponse.ok) {
          const matchesData = (await matchesResponse.json()) as MatchesResponse;
          setMatches(Array.isArray(matchesData.matches) ? matchesData.matches : []);
        }

        setLoading(false);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setLoadError(
          error instanceof Error ? error.message : "The feed could not be loaded.",
        );
        setLoading(false);
      }
    }

    loadDiscover();

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 2100);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const refreshMatches = useCallback(async () => {
    try {
      const response = await fetch("/api/matches", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as MatchesResponse;
      if (Array.isArray(data.matches)) setMatches(data.matches);
    } catch {
      // A stale list is fine; the next successful request will replace it.
    }
  }, []);

  const openMatches = useCallback(() => {
    setMatchesOpen(true);
    void refreshMatches();
  }, [refreshMatches]);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      const profile = feed[0];
      if (!profile || busyRef.current) return;

      busyRef.current = true;
      setBusy(true);
      setExit({ id: profile.id, direction });

      const minimumAnimation = new Promise((resolve) =>
        window.setTimeout(resolve, 340),
      );

      try {
        const response = await fetch("/api/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: profile.id, direction }),
        });

        const data = (await response.json()) as SwipeResponse;
        await minimumAnimation;

        if (!response.ok) {
          throw new Error(data.error || "That swipe could not be saved.");
        }

        setFeed((previous) => previous.filter((item) => item.id !== profile.id));
        setExit(null);

        if (data.matched && data.match) {
          setMatches((previous) => [
            data.match as PublicMatch,
            ...previous.filter(
              (match) => match.profile.id !== data.match?.profile.id,
            ),
          ]);
          setMatchModal(data.match);
        } else {
          showToast(
            direction === "like" ? "like" : "pass",
            direction === "like"
              ? `You liked ${profile.name}`
              : `You passed on ${profile.name}`,
          );
        }
      } catch (error) {
        await minimumAnimation;
        setExit(null);
        showToast(
          "error",
          error instanceof Error
            ? error.message
            : "That swipe could not be saved. Try again.",
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [feed],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (matchesOpen || matchModal) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (!currentProfile || busyRef.current) return;

      event.preventDefault();
      void handleSwipe(event.key === "ArrowLeft" ? "pass" : "like");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentProfile, handleSwipe, matchModal, matchesOpen]);

  return (
    <section className="discover">
      <header className="discover__header">
        <div className="wordmark" aria-label="coy">
          coy<span aria-hidden="true">.</span>
        </div>
        <button
          className="matches-button"
          type="button"
          onClick={openMatches}
          aria-label={`View matches${matches.length ? `, ${matches.length} total` : ""}`}
        >
          <HeartStackIcon />
          <span className="matches-button__label">Matches</span>
          {matches.length > 0 ? (
            <span className="matches-button__count">{matches.length}</span>
          ) : null}
        </button>
      </header>

      <div className="discover__stage" aria-busy={loading}>
        {loading ? (
          <div className="skeleton-card" aria-label="Loading profiles">
            <div className="skeleton-card__shine" />
            <div className="skeleton-card__content">
              <span className="skeleton-line skeleton-line--short" />
              <span className="skeleton-line skeleton-line--title" />
              <span className="skeleton-line skeleton-line--body" />
              <span className="skeleton-line skeleton-line--chips" />
            </div>
          </div>
        ) : loadError ? (
          <div className="state-card" role="alert">
            <div className="state-card__icon">
              <SparkleIcon />
            </div>
            <p className="eyebrow">Off the radar</p>
            <h2>Discover is taking a break</h2>
            <p>{loadError} Make sure the app server is running, then try again.</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </button>
          </div>
        ) : feed.length === 0 ? (
          <div className="state-card state-card--empty">
            <div className="empty-art" aria-hidden="true">
              <div className="empty-art__card empty-art__card--back" />
              <div className="empty-art__card empty-art__card--middle" />
              <div className="empty-art__card empty-art__card--front">
                <HeartIcon />
              </div>
              <span className="empty-art__spark empty-art__spark--one">✦</span>
              <span className="empty-art__spark empty-art__spark--two">✦</span>
            </div>
            <p className="eyebrow">All caught up</p>
            <h2>You&apos;re all caught up</h2>
            <p>
              You&apos;ve seen everyone in Discover for now. Check back later for new
              people, or revisit the connections you&apos;ve already made.
            </p>
            <button className="primary-button" type="button" onClick={openMatches}>
              View matches
              {matches.length > 0 ? (
                <span className="primary-button__count">{matches.length}</span>
              ) : null}
            </button>
          </div>
        ) : (
          <div className="card-stack">
            {feed.slice(0, 3).map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                index={index}
                exitDirection={exit?.id === profile.id ? exit.direction : null}
                disabled={busy}
                onSwipe={handleSwipe}
              />
            ))}
            <p className="sr-only" aria-live="polite">
              {feed.length} {feed.length === 1 ? "profile" : "profiles"} remaining
            </p>
          </div>
        )}

        {toast ? (
          <div
            key={toast.id}
            className={`toast toast--${toast.kind}`}
            role="status"
            aria-live="polite"
          >
            <span className="toast__icon">
              {toast.kind === "like" ? (
                <HeartIcon filled />
              ) : toast.kind === "pass" ? (
                <XIcon />
              ) : (
                <SparkleIcon />
              )}
            </span>
            <span>{toast.text}</span>
          </div>
        ) : null}
      </div>

      {!loading && !loadError && feed.length > 0 ? (
        <div className="discover__actions">
          <div className="action-row">
            <button
              className="action-button action-button--pass"
              type="button"
              onClick={() => void handleSwipe("pass")}
              disabled={busy || !currentProfile}
              aria-label={currentProfile ? `Pass on ${currentProfile.name}` : "Pass"}
              title="Pass"
            >
              <XIcon />
            </button>
            <button
              className="action-button action-button--like"
              type="button"
              onClick={() => void handleSwipe("like")}
              disabled={busy || !currentProfile}
              aria-label={currentProfile ? `Like ${currentProfile.name}` : "Like"}
              title="Like"
            >
              <HeartIcon filled />
            </button>
          </div>
          <p className="action-hint">
            <span className="action-hint__mobile">Swipe left to pass · right to like</span>
            <span className="action-hint__desktop">Drag the card or use ← → keys</span>
          </p>
        </div>
      ) : null}

      <MatchesSheet
        open={matchesOpen}
        matches={matches}
        onClose={() => setMatchesOpen(false)}
        onViewDiscover={() => setMatchesOpen(false)}
      />

      {matchModal ? (
        <MatchModal
          match={matchModal}
          onClose={() => setMatchModal(null)}
          onViewMatches={() => {
            setMatchModal(null);
            openMatches();
          }}
        />
      ) : null}
    </section>
  );
}
