"use client";

import { useEffect } from "react";

const EDITABLE_SELECTOR = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"])',
  "textarea",
  "select",
  '[contenteditable="true"]',
].join(",");

function isEditableElement(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.matches(EDITABLE_SELECTOR);
}

export function MobileViewportGuard() {
  useEffect(() => {
    const viewport = window.visualViewport;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;

    const updateViewportHeight = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${Math.round(height)}px`,
      );
    };

    const revealActiveField = () => {
      const activeElement = document.activeElement;

      if (!isEditableElement(activeElement)) {
        return;
      }

      const rect = activeElement.getBoundingClientRect();
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
      const margin = 24;

      if (
        rect.top < viewportTop + margin ||
        rect.bottom > viewportBottom - margin
      ) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    };

    const scheduleReveal = () => {
      if (revealTimer) {
        clearTimeout(revealTimer);
      }

      revealTimer = setTimeout(revealActiveField, 250);
    };

    const handleViewportChange = () => {
      updateViewportHeight();
      scheduleReveal();
    };

    updateViewportHeight();

    window.addEventListener("resize", handleViewportChange);
    document.addEventListener("focusin", scheduleReveal);
    viewport?.addEventListener("resize", handleViewportChange);
    viewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      if (revealTimer) {
        clearTimeout(revealTimer);
      }

      window.removeEventListener("resize", handleViewportChange);
      document.removeEventListener("focusin", scheduleReveal);
      viewport?.removeEventListener("resize", handleViewportChange);
      viewport?.removeEventListener("scroll", handleViewportChange);
      document.documentElement.style.removeProperty("--visual-viewport-height");
    };
  }, []);

  return null;
}
