import React, { useRef, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ViewType, BlockType } from "@brkroutnxdle/shared";
import type { CalendarEvent, BlockedSlot } from "@brkroutnxdle/shared";

interface CalendarViewProps {
  events: CalendarEvent[];
  previewEvents: CalendarEvent[];
  blocks?: BlockedSlot[];
  use12h?: boolean;
  currentView: ViewType;
  currentDate: Date;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onSelect?: (info: { start: string; end: string }) => void;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  onDeleteRequest?: (id: string, title: string) => void;
  onEventDragStart?: (info: any) => void;
  onEventDragStop?: (info: any) => void;
  onExternalDrop?: (info: { dateStr: string; allDay: boolean; dragData: any }) => void;
  validateDrop?: (startStr: string, endStr: string, draggedEventId?: string) => boolean;
  scrollTime?: string;
  slotMinTime?: string;
  slotMaxTime?: string;
}

const VIEW_MAP: Record<ViewType, string> = {
  day: "timeGridDay",
  week: "timeGridWeek",
  month: "dayGridMonth",
};

const REVERSE_VIEW_MAP: Record<string, ViewType> = {
  timeGridDay: ViewType.Day,
  timeGridWeek: ViewType.Week,
  dayGridMonth: ViewType.Month,
};

export function CalendarView({
  events,
  previewEvents,
  blocks,
  use12h = false,
  currentView,
  currentDate,
  onViewChange,
  onDateChange,
  onEventClick,
  onSelect,
  onEventDrop,
  onEventResize,
  onDeleteRequest,
  onEventDragStart,
  onEventDragStop,
  onExternalDrop,
  validateDrop,
  scrollTime = "06:00:00",
  slotMinTime = "00:00:00",
  slotMaxTime = "24:00:00",
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const isSyncingRef = useRef(false);

  // Sync currentView changes to FullCalendar API (controlled prop)
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      const fcViewName = VIEW_MAP[currentView];
      if (fcViewName && api.view.type !== fcViewName) {
        isSyncingRef.current = true;
        api.changeView(fcViewName);
        isSyncingRef.current = false;
      }
    }
  }, [currentView]);

  // Sync currentDate changes to FullCalendar API (controlled prop)
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      isSyncingRef.current = true;
      api.gotoDate(currentDate);
      isSyncingRef.current = false;
    }
  }, [currentDate]);

  // Map BlockedSlot[] to FullCalendar event format
  const fcBlockEvents: any[] = useMemo(() => {
    if (!blocks || blocks.length === 0) return [];

    return blocks.flatMap((block): any[] => {
      const base: any = {
        id: `block-${block.id}`,
        title: block.title || "Blocked",
        classNames: ["brk-block"],
        display: "auto",
        extendedProps: { isBlock: true, blockId: block.id, blockType: block.blockType },
      };

      switch (block.blockType) {
        case BlockType.SingleDay: {
          // startDate is expected as full ISO datetime for SingleDay
          let start = block.startDate;
          let end = block.endDate;
          if (!end) {
            const d = new Date(start);
            d.setHours(d.getHours() + 1);
            end = d.toISOString();
          }
          return [{ ...base, start, end }];
        }

        case BlockType.RecurringWeekday: {
          return [
            {
              ...base,
              daysOfWeek: block.daysOfWeek,
              startTime: block.startTime ? `${block.startTime}:00` : undefined,
              endTime: block.endTime ? `${block.endTime}:00` : undefined,
              startRecurring: block.startDate,
            },
          ];
        }

        case BlockType.RecurringPeriod: {
          return [
            {
              ...base,
              daysOfWeek: block.daysOfWeek,
              startTime: block.startTime ? `${block.startTime}:00` : undefined,
              endTime: block.endTime ? `${block.endTime}:00` : undefined,
              startRecurring: block.startDate,
              endRecurring: block.endDate,
            },
          ];
        }

        default:
          return [];
      }
    });
  }, [blocks]);

  // Map CalendarEvent[] + BlockedSlot[] to FullCalendar event format
  const fcEvents: any[] = useMemo(() => {
    const now = Date.now();

    const taskEvents = events.map((e) => {
      const eventEnd = e.end
        ? new Date(e.end).getTime()
        : new Date(e.start).getTime() + 30 * 60000;
      const isPast = eventEnd < now;
      return {
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        classNames: e.isGenerated ? ["brk-generated"] : ["brk-external"],
        extendedProps: {
          isGenerated: e.isGenerated,
          isCompleted: e.isCompleted,
          isPast,
        },
        eventStartEditable: !isPast,
        eventDurationEditable: !isPast,
      };
    });

    const previewMapped = previewEvents.map((e) => {
      const eventEnd = e.end
        ? new Date(e.end).getTime()
        : new Date(e.start).getTime() + 30 * 60000;
      const isPast = eventEnd < now;
      return {
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        classNames: ["brk-preview"],
        display: "auto" as const,
        extendedProps: {
          isPreview: true,
          isPast,
        },
        eventStartEditable: !isPast,
        eventDurationEditable: !isPast,
      };
    });

    const blockMapped = fcBlockEvents.map((block: any) => {
      // SingleDay blocks have explicit start/end — compute isPast
      if (block.start && block.end) {
        const blockEnd = new Date(block.end).getTime();
        const isPast = blockEnd < now;
        return {
          ...block,
          extendedProps: { ...block.extendedProps, isPast },
          eventStartEditable: !isPast,
          eventDurationEditable: !isPast,
        };
      }
      // Recurring blocks: FC renders each occurrence individually,
      // so editable is left as default (true) — defense-in-depth in callbacks
      return block;
    });

    return [...taskEvents, ...previewMapped, ...blockMapped];
  }, [events, previewEvents, fcBlockEvents]);

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      const props = info.event.extendedProps;
      onEventClick({
        id: info.event.id,
        title: info.event.title,
        start: info.event.startStr,
        end: info.event.endStr,
        isAllDay: info.event.allDay,
        isGenerated: props.isGenerated ?? false,
        isCompleted: props.isCompleted ?? false,
        isBlock: props.isBlock ?? false,
        source: props.isGenerated ? "brkroutnxdle" : "google",
      });
    }
  };

  const handleSelect = (info: any) => {
    if (onSelect) {
      onSelect({
        start: info.startStr,
        end: info.endStr,
      });
    }
  };

  const handleDatesSet = (info: any) => {
    // Ignore datesSet events triggered by our own sync effects
    if (isSyncingRef.current) return;

    // Report view type change back to parent
    const fcViewType = info.view.type;
    const mappedView = REVERSE_VIEW_MAP[fcViewType];
    if (mappedView && mappedView !== currentView) {
      onViewChange(mappedView);
    }

    // Report date change back to parent
    if (onDateChange) {
      onDateChange(info.start);
    }
  };

  const handleEventDragStart = (info: any) => {
    onEventDragStart?.(info);
  };

  const handleEventDragStop = (info: any) => {
    onEventDragStop?.(info);
  };

  const handleExternalDrop = (info: any) => {
    const jsEvent = info.jsEvent as DragEvent;
    const rawData = jsEvent.dataTransfer?.getData("application/json");
    if (!rawData) return;
    const dragData = JSON.parse(rawData);
    onExternalDrop?.({ dateStr: info.dateStr, allDay: info.allDay, dragData });
  };

  const handleEventAllow = (dropInfo: any, draggedEvent: any): boolean => {
    return validateDrop?.(dropInfo.startStr, dropInfo.endStr, draggedEvent?.id) ?? true;
  };

  const handleEventDidMount = (info: any) => {
    if (!onDeleteRequest) return;
    const props = info.event.extendedProps;
    if (!props.isGenerated && !props.isBlock && !props.isPreview) return;

    // Hide × button for past events
    if (props.isPast) return;

    // Runtime past check for events without isPast (e.g., recurring blocks)
    const endMs = info.event.endStr
      ? new Date(info.event.endStr).getTime()
      : new Date(info.event.startStr).getTime() + 30 * 60000;
    if (endMs < Date.now()) return;

    const el = info.el as HTMLElement;
    el.style.position = "relative";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "×";
    Object.assign(deleteBtn.style, {
      position: "absolute",
      top: "2px",
      right: "2px",
      cursor: "pointer",
      background: "rgba(0,0,0,0.3)",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      width: "18px",
      height: "18px",
      fontSize: "14px",
      lineHeight: "18px",
      textAlign: "center",
      padding: "0",
      zIndex: "15",
      pointerEvents: "auto",
      userSelect: "none",
    });
    deleteBtn.className = "brk-event-delete-btn";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      // Guard against double-click — event.detail > 1 means multi-click
      if (e.detail > 1) return;
      onDeleteRequest(info.event.id, info.event.title);
    };
    el.appendChild(deleteBtn);
  };

  const handleEventWillUnmount = (info: any) => {
    const el = info.el as HTMLElement;
    const deleteBtn = el.querySelector<HTMLButtonElement>(".brk-event-delete-btn");
    if (deleteBtn) {
      deleteBtn.remove();
    }
  };

  return (
    <div className="brk-calendar-google" style={{ padding: "8px", height: "100%" }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={VIEW_MAP[currentView] ?? "timeGridWeek"}
        events={fcEvents}
        headerToolbar={false}
        height="100%"
        timeZone="local"
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        slotDuration="00:30:00"
        allDaySlot={true}
        allDayText="All day"
        nowIndicator={true}
        editable={true}
        selectable={true}
        weekNumbers={true}
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: use12h }}
        dayHeaderFormat={{ weekday: 'short', month: 'short', day: 'numeric' }}
        selectMinDistance={0}
        selectOverlap={false}
        select={handleSelect}
        scrollTime={scrollTime}
        eventClick={handleEventClick}
        eventDrop={(info) => onEventDrop?.(info)}
        eventResize={(info) => onEventResize?.(info)}
        eventDragStart={handleEventDragStart}
        eventDragStop={handleEventDragStop}
        droppable={true}
        drop={handleExternalDrop}
        eventAllow={handleEventAllow}
        datesSet={handleDatesSet}
        eventDidMount={handleEventDidMount}
        eventWillUnmount={handleEventWillUnmount}
      />
    </div>
  );
}
