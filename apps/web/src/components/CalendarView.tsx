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
  validateDrop?: (startStr: string, endStr: string) => boolean;
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
        textColor: "#666",
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
    const taskEvents = events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      classNames: e.isGenerated ? ["brk-generated"] : ["brk-external"],
      backgroundColor: e.isGenerated ? "#2BA8A2" : "#5DADE2",
      borderColor: e.isGenerated ? "#1E8C86" : "#3498DB",
      textColor: "#fff",
      extendedProps: { isGenerated: e.isGenerated, isCompleted: e.isCompleted },
    }));

    const previewMapped = previewEvents.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      classNames: ["brk-preview"],
      backgroundColor: "#14b8a6",
      borderColor: "#0d9488",
      textColor: "#fff",
      display: "auto" as const,
      editable: false,
      extendedProps: { isPreview: true },
    }));

    return [...taskEvents, ...previewMapped, ...fcBlockEvents];
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

  const handleEventAllow = (dropInfo: any, _draggedEvent: any): boolean => {
    return validateDrop?.(dropInfo.startStr, dropInfo.endStr) ?? true;
  };

  const handleEventDidMount = (info: any) => {
    if (!onDeleteRequest) return;
    const props = info.event.extendedProps;
    if (!props.isGenerated) return;

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
      zIndex: "5",
    });
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      onDeleteRequest(info.event.id, info.event.title);
    };
    el.appendChild(deleteBtn);
  };

  return (
    <div style={{ padding: "8px", height: "100%" }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={VIEW_MAP[currentView] ?? "timeGridWeek"}
        events={fcEvents}
        headerToolbar={false}
        height="100%"
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        slotDuration="00:30:00"
        allDaySlot={false}
        nowIndicator={true}
        editable={true}
        selectable={true}
        selectOverlap={false}
        select={handleSelect}
        scrollTime={scrollTime}
        eventClick={handleEventClick}
        eventDrop={(info) => onEventDrop?.(info)}
        eventResize={(info) => onEventResize?.(info)}
        eventDragStart={handleEventDragStart}
        eventDragStop={handleEventDragStop}
        eventAllow={handleEventAllow}
        datesSet={handleDatesSet}
        eventDidMount={handleEventDidMount}
      />
    </div>
  );
}
