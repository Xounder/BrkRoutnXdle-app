import React from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

interface EventContentArg {
  event: { id: string; title: string; extendedProps: Record<string, unknown> };
  view: { type: string };
  timeText: string;
}

export interface EventContentProps {
  arg: EventContentArg;
  showDelete: boolean;
  onDelete?: (id: string, title: string) => void;
}

export function EventContent({ arg, showDelete, onDelete }: EventContentProps) {
  const event = arg.event;
  const props = event.extendedProps;

  return (
    <div className="brk-event-content">
      {arg.view.type.startsWith("timeGrid") && (
        <span className="brk-event-time">{arg.timeText}</span>
      )}
      <span className="brk-event-title">{event.title}</span>
      {Boolean(props.isCompleted) && <IconCheck className="brk-event-check" aria-hidden />}
      {showDelete && (
        <Tooltip label="Delete event" withArrow>
          <ActionIcon
            className="brk-event-delete-btn"
            size="xs"
            variant="subtle"
            aria-label={`Delete ${event.title}`}
            onClick={(e) => {
              e.stopPropagation();
              if (e.detail > 1) return;
              onDelete?.(event.id, event.title);
            }}
          >
            <IconX size={12} />
          </ActionIcon>
        </Tooltip>
      )}
    </div>
  );
}
