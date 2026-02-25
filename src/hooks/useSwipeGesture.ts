import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  edgeOnly?: boolean;
  edgeWidth?: number;
  /** Require horizontal dominance: |dx| >= minHorizontalRatio * |dy| (default 2). */
  minHorizontalRatio?: number;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  edgeOnly = false,
  edgeWidth = 24,
  minHorizontalRatio = 2,
}: SwipeGestureOptions) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const hasMoved = useRef<boolean>(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if ((e.touches?.length ?? 1) > 1) return;
      
      const touch = e.changedTouches[0];
      touchStartX.current = touch.screenX;
      touchStartY.current = touch.screenY;
      hasMoved.current = false;
      
      // Block if edgeOnly and not starting from edge
      (e as any)._swipeBlocked = edgeOnly && touchStartX.current > (edgeWidth ?? 24);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if ((e.touches?.length ?? 1) > 1) return;
      
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.screenX - touchStartX.current);
      const dy = Math.abs(touch.screenY - touchStartY.current);
      
      // Mark as moved if gesture exceeds minimum threshold (prevents tap from triggering)
      if (dx > 5 || dy > 5) {
        hasMoved.current = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Ignore if no actual movement (prevents tap from opening)
      if (!hasMoved.current) return;
      
      const blocked = (e as any)._swipeBlocked === true;
      const touch = e.changedTouches[0];
      const dx = touch.screenX - touchStartX.current;
      const dy = Math.abs(touch.screenY - touchStartY.current);
      const horizontalDominant = Math.abs(dx) >= (minHorizontalRatio * dy);

      // Swipe left to close
      if (onSwipeLeft && dx <= -minSwipeDistance && horizontalDominant) {
        onSwipeLeft();
      }
      // Swipe right to open (only if started at edge when edgeOnly=true)
      if (onSwipeRight && dx >= minSwipeDistance && horizontalDominant && (!edgeOnly || !blocked)) {
        onSwipeRight();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart as any);
      document.removeEventListener('touchmove', handleTouchMove as any);
      document.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance, edgeOnly, edgeWidth, minHorizontalRatio]);
};
