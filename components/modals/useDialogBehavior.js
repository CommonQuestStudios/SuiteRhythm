'use client';

import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function visibleFocusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => {
    if (el.closest('.hidden')) return false;
    return el.offsetParent !== null || el === document.activeElement;
  });
}

/**
 * Native-feeling dialog behavior for engine controlled modals.
 *
 * The engine opens and closes these by toggling the `hidden` class, so this
 * hook watches that class and, while the dialog is open: moves focus inside,
 * keeps Tab cycling within it, closes on Escape, and restores focus to the
 * element that opened it. Nothing here changes what the engine does; it only
 * layers the keyboard contract that `role="dialog"` promises.
 *
 * @param {string} id          element id of the dialog container
 * @param {{ initialFocus?: string, closeOnEscape?: boolean }} [opts]
 *   initialFocus: css selector inside the dialog to focus first
 */
export function useDialogBehavior(id, { initialFocus, closeOnEscape = true } = {}) {
  useEffect(() => {
    const dialog = document.getElementById(id);
    if (!dialog || typeof MutationObserver === 'undefined') return undefined;

    let open = false;
    let opener = null;

    const onKeyDown = (event) => {
      if (!open) return;
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        dialog.classList.add('hidden');
        return;
      }
      if (event.key !== 'Tab') return;
      const items = visibleFocusables(dialog);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleOpen = () => {
      open = true;
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.addEventListener('keydown', onKeyDown, true);
      // Defer so the engine can finish populating the dialog first.
      requestAnimationFrame(() => {
        if (!open) return;
        const preferred = initialFocus ? dialog.querySelector(initialFocus) : null;
        const target = preferred || visibleFocusables(dialog)[0] || dialog.querySelector('.modal-content, .overlay-content');
        if (target) {
          if (!target.hasAttribute('tabindex') && !target.matches(FOCUSABLE)) target.setAttribute('tabindex', '-1');
          try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
        }
      });
    };

    const handleClose = () => {
      open = false;
      document.removeEventListener('keydown', onKeyDown, true);
      if (opener && document.contains(opener) && dialog.contains(document.activeElement)) {
        try { opener.focus({ preventScroll: true }); } catch (_) {}
      }
      opener = null;
    };

    const sync = () => {
      const isHidden = dialog.classList.contains('hidden');
      if (!isHidden && !open) handleOpen();
      else if (isHidden && open) handleClose();
    };

    const observer = new MutationObserver(sync);
    observer.observe(dialog, { attributes: true, attributeFilter: ['class'] });
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [id, initialFocus, closeOnEscape]);
}
