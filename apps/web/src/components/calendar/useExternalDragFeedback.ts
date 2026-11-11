import { useEffect, useRef, useState } from "react";

/** FullCalendar does not dispatch `drop` for every rejected external hit.
 * Track a real task-card pointer gesture so a rejected release still gets feedback. */
export function useExternalDragFeedback(previewActive: boolean) {
  const calendarRoot = useRef<HTMLDivElement>(null);
  const taskDrag = useRef(false);
  const [dropError, setDropError] = useState<string | null>(null);

  useEffect(() => {
    const start = (event: PointerEvent) => {
      taskDrag.current = event.target instanceof Element &&
        !!event.target.closest('[data-task-drag="true"]');
    };
    const release = (event: MouseEvent) => {
      if (taskDrag.current && calendarRoot.current?.contains(event.target as Node)) {
        setDropError(previewActive ? "Discard the preview before placing tasks." :
          "This time is unavailable. Choose a future, free working-hours slot.");
      }
      taskDrag.current = false;
    };
    document.addEventListener("pointerdown", start);
    document.addEventListener("mouseup", release);
    return () => {
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("mouseup", release);
    };
  }, [previewActive]);

  return { calendarRoot, dropError, setDropError,
    clearExternalRejection: () => { taskDrag.current = false; } };
}
