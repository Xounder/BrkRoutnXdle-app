import { useEffect, useCallback } from "react";

/**
 * Hook that warns users before leaving the page or navigating away
 * when there is an active preview with unsaved changes.
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  onBeforeNavigate?: () => boolean,
) {
  // Browser tab close / refresh protection
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Standard browser dialog
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // In-app navigation guard (for react-router or similar)
  const checkNavigation = useCallback((): boolean => {
    if (hasUnsavedChanges && onBeforeNavigate) {
      return onBeforeNavigate();
    }
    return true;
  }, [hasUnsavedChanges, onBeforeNavigate]);

  return { checkNavigation };
}
