"use client";

import { useState } from "react";

import { HomeIcon, SparkleIcon } from "@/components/icons";
import Discover from "@/components/Discover";

type Tab = "home" | "discover";

export default function AppShell() {
  const [tab, setTab] = useState<Tab>("discover");

  return (
    <div className="app-shell">
      <main className="app-view">
        {tab === "discover" ? (
          <Discover />
        ) : (
          <div className="home-blank" aria-label="Home tab placeholder" />
        )}
      </main>

      <nav className="tabbar" aria-label="Main navigation">
        <button
          className={`tabbar__item ${tab === "home" ? "is-active" : ""}`}
          type="button"
          onClick={() => setTab("home")}
          aria-current={tab === "home" ? "page" : undefined}
        >
          <span className="tabbar__icon">
            <HomeIcon />
          </span>
          <span>Home</span>
        </button>

        <button
          className={`tabbar__item ${tab === "discover" ? "is-active" : ""}`}
          type="button"
          onClick={() => setTab("discover")}
          aria-current={tab === "discover" ? "page" : undefined}
        >
          <span className="tabbar__icon">
            <SparkleIcon />
          </span>
          <span>Discover</span>
        </button>
      </nav>
    </div>
  );
}
