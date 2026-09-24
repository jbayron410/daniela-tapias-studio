import { useState, useEffect, useRef, useCallback } from 'react';

export function useNearScreen({ rootMargin = '300px' } = {}) {
  const [isNear, setIsNear] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (isNear) return;
    const element = elementRef.current;
    if (!element) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsNear(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsNear(true);
        observer.disconnect();
      }
    }, { rootMargin });

    observer.observe(element);

    return () => observer.disconnect();
  }, [isNear, rootMargin]);

  const trigger = useCallback(() => {
    setIsNear(true);
  }, []);

  return [isNear, elementRef, trigger];
}

export default useNearScreen;
