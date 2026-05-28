import { useEffect, useRef, useState } from 'react';

export function useDismissablePopover(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((current) => !current);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      const clickedPopover = popoverRef.current?.contains(target);
      const clickedTrigger = triggerRef.current?.contains(target);

      if (!clickedPopover && !clickedTrigger) {
        close();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return {
    close,
    isOpen,
    open,
    popoverRef,
    setIsOpen,
    toggle,
    triggerRef,
  };
}
