"use client";

import { useEffect } from "react";

type UseModalHotkeysOptions = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  /**
   * Optional container to scope primary button lookup (data-modal-primary)
   */
  container?: HTMLElement | null;
  /**
   * Whether to allow Escape key to close the modal
   */
  allowEscape?: boolean;
};

/**
 * Global stack to track open modals for ESC handling
 */
const modalStack: (() => void)[] = [];

/**
 * Adds global key handlers when a modal is open.
 * - Escape closes the modal only if it's the topmost one
 * - Enter triggers submit (unless focused element is textarea or contentEditable)
 * - Looks for an element with [data-modal-primary] to click if onSubmit is not provided
 */
export function useModalHotkeys({
  isOpen,
  onClose,
  onSubmit,
  container,
  allowEscape = true,
}: UseModalHotkeysOptions) {
  useEffect(() => {
    if (isOpen) {
      modalStack.push(onClose);
    } else {
      const index = modalStack.indexOf(onClose);
      if (index > -1) modalStack.splice(index, 1);
    }
    return () => {
      const index = modalStack.indexOf(onClose);
      if (index > -1) modalStack.splice(index, 1);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();

      if (e.key === "Escape") {
        if (
          allowEscape &&
          modalStack.length > 0 &&
          modalStack[modalStack.length - 1] === onClose
        ) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === "Enter") {
        // Do not submit while typing multiline text or when explicitly opted out
        const isTextArea = tag === "textarea";
        const isContentEditable =
          !!target &&
          (target.getAttribute("contenteditable") === "" ||
            target.getAttribute("contenteditable") === "true");
        const preventEnter = target?.closest("[data-prevent-enter]");
        if (isTextArea || isContentEditable || preventEnter) return;

        // Allow native form submit if inside a form with submit button
        const form = target?.closest("form");
        if (form && (form as HTMLFormElement).checkValidity?.()) {
          // If the form has a submit button with type=submit, let the browser handle it
          // Otherwise, we'll manually trigger submit callback below
        }

        e.preventDefault();
        if (onSubmit) {
          onSubmit();
          return;
        }

        const scope: ParentNode = container || document;
        const primary = scope.querySelector<HTMLElement>(
          "[data-modal-primary]"
        );
        if (primary) primary.click();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, onSubmit, container, allowEscape]);
}

export default useModalHotkeys;
