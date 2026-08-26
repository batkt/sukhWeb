"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Хөвөгч чат товчны хэрэглэгчийн тохиргоо (харагдах эсэх + байрлал).
 *
 * ChatWidget товчийг зурдаг, Topbar-ийн профайл цэс түүнийг асаадаг/унтраадаг
 * бөгөөд хоёулаа өөр өөр модуль тул context биш, localStorage + custom event
 * дээр суурилсан жижиг store ашиглав. Ингэснээр аль ч мод дээр нэмэлт provider
 * ороохгүйгээр хоёр тал шууд синк болно.
 */

const HIDDEN_KEY = "chatLauncher.hidden";
const POS_KEY = "chatLauncher.pos";
const EVENT = "chatlauncher:change";

export const LAUNCHER_SIZE = 56;
/** Товчийг цонхны ирмэгээс хэр зайд барих вэ. */
export const LAUNCHER_MARGIN = 24;

export interface LauncherPos {
  x: number;
  y: number;
}

function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function readPos(): LauncherPos | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as LauncherPos).x === "number" &&
      typeof (parsed as LauncherPos).y === "number"
    ) {
      return parsed as LauncherPos;
    }
    return null;
  } catch {
    return null;
  }
}

/** Товч цонхны гадна үлдэхээс сэргийлж хязгаарлана. */
export function clampPos(pos: LauncherPos): LauncherPos {
  if (typeof window === "undefined") return pos;
  const maxX = Math.max(0, window.innerWidth - LAUNCHER_SIZE - 8);
  const maxY = Math.max(0, window.innerHeight - LAUNCHER_SIZE - 8);
  return {
    x: Math.min(Math.max(pos.x, 8), maxX),
    y: Math.min(Math.max(pos.y, 8), maxY),
  };
}

/** Байрлал хадгалаагүй үед ашиглах анхны байрлал — баруун доод булан. */
export function defaultPos(): LauncherPos {
  if (typeof window === "undefined") {
    return { x: LAUNCHER_MARGIN, y: LAUNCHER_MARGIN };
  }
  return {
    x: window.innerWidth - LAUNCHER_SIZE - LAUNCHER_MARGIN,
    y: window.innerHeight - LAUNCHER_SIZE - LAUNCHER_MARGIN,
  };
}

function broadcast() {
  window.dispatchEvent(new Event(EVENT));
}

export function setLauncherHidden(hidden: boolean) {
  try {
    localStorage.setItem(HIDDEN_KEY, hidden ? "1" : "0");
  } catch {
    /* private mode */
  }
  broadcast();
}

export function setLauncherPos(pos: LauncherPos) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  } catch {
    /* private mode */
  }
  broadcast();
}

/**
 * SSR үед үргэлж `false`-ээр эхэлж, mount болсны дараа localStorage-оос уншина.
 * Ингэснээр сервер болон клиентийн эхний render зөрөхгүй (hydration алдаагүй).
 */
export function useChatLauncher() {
  const [hydrated, setHydrated] = useState(false);
  const [hidden, setHiddenState] = useState(false);
  const [pos, setPosState] = useState<LauncherPos | null>(null);

  useEffect(() => {
    const sync = () => {
      setHiddenState(readHidden());
      setPosState(readPos());
    };
    sync();
    setHydrated(true);

    window.addEventListener(EVENT, sync);
    // Өөр таб дээр солигдвол мөн дагаж шинэчилнэ.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHidden = useCallback(() => {
    setLauncherHidden(!readHidden());
  }, []);

  return { hydrated, hidden, pos, toggleHidden, setHidden: setLauncherHidden, setPos: setLauncherPos };
}
