export {
  fetchEvents,
  fetchEventsFromCalendar,
  createEvent,
  updateEvent,
  deleteEvent,
  setCompletionStatus,
} from "./public/operations.js";
export { normalizeEvents } from "./internal/normalizer.js";
export type { CreateEventPayload } from "./internal/types.js";