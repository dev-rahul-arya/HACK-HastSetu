// Reusable modal dialog. Closes on backdrop click or Escape; focuses itself on
// open and restores focus on close. Uses the .modal styles in components.css.

import { useEffect, useRef } from "react";

export default function Modal({ title, children, onClose, actions }) {
  const ref = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => {
    prevFocus.current = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}
        tabIndex={-1} ref={ref}>
        <h2 className="modal__title">{title}</h2>
        <div className="modal__body">{children}</div>
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
