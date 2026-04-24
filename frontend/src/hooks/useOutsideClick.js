import { useEffect } from 'react';

export function useOutsideClick(refsWithHandlers) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      refsWithHandlers.forEach(({ ref, onOutsideClick }) => {
        if (ref.current && !ref.current.contains(event.target)) {
          onOutsideClick();
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refsWithHandlers]);
}
