"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { PinIcon } from "@/components/icons";
import type { PublicProfile, SwipeDirection } from "@/lib/types";

const SWIPE_THRESHOLD = 105;

type SwipeCardProps = {
  profile: PublicProfile;
  index: number;
  exitDirection: SwipeDirection | null;
  disabled: boolean;
  onSwipe: (direction: SwipeDirection) => void;
};

export default function SwipeCard({
  profile,
  index,
  exitDirection,
  disabled,
  onSwipe,
}: SwipeCardProps) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);

  const isTop = index === 0;
  const isLeaving = Boolean(exitDirection);
  const likeOpacity =
    exitDirection === "like"
      ? 1
      : Math.min(Math.max(drag.x / SWIPE_THRESHOLD, 0), 1);
  const passOpacity =
    exitDirection === "pass"
      ? 1
      : Math.min(Math.max(-drag.x / SWIPE_THRESHOLD, 0), 1);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isTop || disabled || event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    setDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    setDrag({
      x: event.clientX - start.x,
      y: event.clientY - start.y,
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    pointerStart.current = null;
    setDragging(false);
    setDrag({ x: 0, y: 0 });

    if (deltaX > SWIPE_THRESHOLD) {
      onSwipe("like");
    } else if (deltaX < -SWIPE_THRESHOLD) {
      onSwipe("pass");
    }

    // A tiny vertical drag should not block anything, but resetting here keeps
    // the next gesture centred.
    if (Math.abs(deltaY) > 200) {
      setDrag({ x: 0, y: 0 });
    }
  }

  function cancelDrag() {
    pointerStart.current = null;
    setDragging(false);
    setDrag({ x: 0, y: 0 });
  }

  let transform: string;
  if (exitDirection) {
    const direction = exitDirection === "like" ? 1 : -1;
    transform = `translate3d(${direction * 125}%, ${direction * 20}px, 0) rotate(${direction * 18}deg)`;
  } else if (isTop) {
    transform = `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.x / 22}deg)`;
  } else {
    transform = `translateY(${index * 11}px) scale(${1 - index * 0.045})`;
  }

  return (
    <div
      className={[
        "swipe-card",
        isTop ? "is-top" : "is-behind",
        exitDirection ? "is-leaving" : "",
        dragging ? "is-dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelDrag}
      style={{
        transform,
        opacity: isLeaving ? 0 : 1,
        zIndex: 30 - index,
        transition: isLeaving
          ? "transform 340ms cubic-bezier(0.2, 0.7, 0.3, 1), opacity 300ms ease"
          : dragging
            ? "none"
            : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease",
      }}
      aria-hidden={!isTop}
    >
      <Image
        className="swipe-card__photo"
        src={profile.photo}
        alt={`${profile.name}'s profile photo`}
        fill
        priority={isTop}
        sizes="(max-width: 520px) 100vw, 460px"
        draggable={false}
      />
      <div className="swipe-card__wash" />
      <div className="swipe-card__gradient" />

      <div className="swipe-card__stamp swipe-card__stamp--like" style={{ opacity: likeOpacity }}>
        LIKE
      </div>
      <div className="swipe-card__stamp swipe-card__stamp--pass" style={{ opacity: passOpacity }}>
        PASS
      </div>

      <div className="swipe-card__content">
        <p className="swipe-card__meta">
          <PinIcon className="swipe-card__pin" />
          <span>{profile.city}</span>
          {profile.college ? (
            <>
              <span className="swipe-card__meta-dot" aria-hidden="true" />
              <span>{profile.college}</span>
            </>
          ) : null}
        </p>

        <div className="swipe-card__name-row">
          <h2>{profile.name}</h2>
          <span className="swipe-card__age">{profile.age}</span>
        </div>

        <p className="swipe-card__bio">{profile.bio}</p>

        <ul className="swipe-card__interests" aria-label="Interests">
          {profile.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
