import { test, expect } from "@playwright/test";
import { computeDiff } from "../src/services/diffCalculator";

/**
 * TASK-01 E2E Tests: Filter pending events before computeDiff matching
 *
 * These tests verify that:
 * 1. Inline-created tasks (pending events with local UUID) don't trigger PATCH/404 on save
 * 2. Synced Google Calendar events are still correctly PATCHed when updated (unit tests)
 */

// Helper to check if a string looks like a UUID v4 (local UUID format)
// Google Calendar event IDs are typically not UUID v4 format
function isUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Mock data for a Google-sourced synced event
const googleEvent = {
  id: "google-event-abc123",
  title: "Existing Google Task",
  start: "2026-09-08T10:00:00.000Z",
  end: "2026-09-08T11:00:00.000Z",
  isAllDay: false,
  isGenerated: true,
  taskId: "task-google-1",
  isCompleted: false,
  source: "google" as const,
};

// Mock user for auth
const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/avatar.png",
};

test.describe("TASK-01: Save flow pending event filtering", () => {
  test("pending event (inline-created task) should not trigger PATCH with local UUID on save", async ({
    page,
  }) => {
    // Track all API calls to /events
    const patchCalls: Array<{ id: string; url: string }> = [];
    const postCalls: string[] = [];

    // Track all requests for debugging
    page.on("request", (request) => {
      if (request.url().includes("/api/")) {
        console.log(`[TEST1 REQUEST] ${request.method()} ${request.url()}`);
      }
    });
    page.on("response", (response) => {
      if (response.url().includes("/api/")) {
        console.log(`[TEST1 RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    // Single comprehensive route handler for all API calls in this test
    await page.route("**/api/v1/**", async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      console.log(`[TEST1 ROUTE] Intercepted: ${method} ${url}`);

      if (url.includes("/auth/me")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: mockUser }),
        });
        return;
      }

      if (url.includes("/events")) {
        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: [googleEvent] }),
          });
          return;
        }

        if (method === "PATCH") {
          const match = url.match(/\/events\/([^/?]+)/);
          if (match) {
            patchCalls.push({ id: match[1], url });
            console.log(`[TEST1 PATCH] Recorded PATCH to event ID: ${match[1]}`);
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: { id: match?.[1] ?? "patched", ...route.request().postDataJSON() } }),
          });
          return;
        }

        if (method === "POST") {
          postCalls.push(url);
          console.log(`[TEST1 POST] Recorded POST to: ${url}`);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: { id: "google-created-new-event-456", ...route.request().postDataJSON() } }),
          });
          return;
        }

        if (method === "DELETE") {
          const match = url.match(/\/events\/([^/?]+)/);
          if (match) {
            console.log(`[TEST1 DELETE] Recorded DELETE to event ID: ${match[1]}`);
          }
          // Mock DELETE success to allow save to complete
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: { success: true } }),
          });
          return;
        }
      }

      // For any other API calls, continue to network
      await route.continue();
    });

    // Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for calendar to render (FullCalendar takes a moment)
    await page.waitForSelector(".fc-view-harness", { timeout: 15000 });

    // Wait for events to load - wait for loading banner to disappear
    await expect(page.locator("text=Loading calendar events...")).not.toBeVisible({ timeout: 10000 });

    // ---- Step 1: Click on an empty calendar slot to create an inline task ----
    // Find a time slot in the week view (timeGridWeek) - click around 2pm on a weekday
    const calendarGrid = page.locator(".fc-timegrid-slots").first();
    await expect(calendarGrid).toBeVisible({ timeout: 10000 });

    // Click on a specific time slot - let's target the 14:00 slot on the first weekday column
    const slot14 = page.locator(".fc-timegrid-slot:has-text('14:00')").first();
    if (await slot14.count() > 0) {
      await slot14.click();
    } else {
      // Fallback: click on the time grid body at a calculated position
      const timeGridBody = page.locator(".fc-timegrid-body").first();
      const box = await timeGridBody.boundingBox();
      if (box) {
        // Click around 14:00 (8 hours from 06:00 start, each hour = ~60px typically)
        await timeGridBody.click({ position: { x: 100, y: 8 * 60 + 30 } });
      }
    }

    // Wait for CreateActionModal to appear
    await expect(page.locator("text=Create in this slot")).toBeVisible({ timeout: 5000 });

    // Click "Create Task" button in the modal
    await page.click("button:has-text('Create Task')");

    // Fill in task name and submit
    await page.fill("#task-name", "New Inline Task");
    await page.selectOption("#task-duration", "60");
    await page.click('button[type="submit"]:has-text("Create Task")');

    // Modal should close, wait for it to disappear
    await expect(page.locator("text=Create in this slot")).toBeHidden({ timeout: 5000 });

    // ---- Step 2: Click "Calculate Week" ----
    await page.click("button:has-text('Calculate Week')");

    // Wait for preview to be generated (PreviewToolbar should appear)
    await expect(page.locator("text=Preview")).toBeVisible({ timeout: 10000 });

    // ---- Step 3: Click "Save to Calendar" ----
    // In preview mode, the save button says "Save to Calendar"
    await page.click("button:has-text('Save to Calendar')");

    // Wait for save to complete (success banner appears)
    await expect(page.locator("text=Schedule saved successfully!")).toBeVisible({ timeout: 15000 });

    // ---- Assertions ----
    // 1. NO PATCH request was made with a local UUID (v4 format)
    const uuidPatches = patchCalls.filter((call) => isUuid(call.id));
    expect(uuidPatches).toHaveLength(0);

    // 2. At least one POST was made to create the new event
    expect(postCalls.length).toBeGreaterThanOrEqual(1);

    // 3. Error banner "Failed to sync calendar events" never appears
    await expect(page.locator("text=Failed to sync calendar events")).not.toBeVisible();
  });
});

test.describe("TASK-01: computeDiff unit tests (deterministic)", () => {
  // Type definitions matching the module's internal types
  type GeneratedEvent = {
    id: string;
    taskId?: string;
    start: string;
    end: string;
    isAllDay?: boolean;
  };

  type CalendarEvent = {
    id: string;
    taskId?: string;
    start: string;
    end: string;
    source: "google" | "brkroutnxdle";
    isAllDay?: boolean;
    isGenerated?: boolean;
    isCompleted?: boolean;
    title?: string;
  };

  type Task = {
    id: string;
    title: string;
  };

  const baseTime = "2026-09-08T10:00:00.000Z";
  const endTime = "2026-09-08T11:00:00.000Z";
  const newStart = "2026-09-08T12:00:00.000Z";
  const newEnd = "2026-09-08T13:00:00.000Z";

  test("synced Google event is PATCHed with real id when start/end change", () => {
    const persisted: CalendarEvent[] = [
      {
        id: "google-abc",
        taskId: "t1",
        start: baseTime,
        end: endTime,
        source: "google",
        isGenerated: true,
      },
    ];
    const preview: GeneratedEvent[] = [
      {
        id: "google-abc",
        taskId: "t1",
        start: newStart,
        end: newEnd,
      },
    ];
    const tasks: Task[] = [{ id: "t1", title: "Test Task" }];

    const result = computeDiff(preview, persisted, tasks);

    expect(result.toCreate).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(1);
    expect(result.toUpdate[0].id).toBe("google-abc");
    expect(result.toUpdate[0].start).toBe(newStart);
    expect(result.toUpdate[0].end).toBe(newEnd);
    expect(result.toDelete).toHaveLength(0);
  });

  test("pending event never yields local-UUID in toUpdate", () => {
    const localUuid = "a1b2c3d4-5678-4abc-def0-123456789abc"; // valid UUID v4
    const persisted: CalendarEvent[] = [
      {
        id: localUuid,
        taskId: "t1",
        start: baseTime,
        end: endTime,
        source: "brkroutnxdle",
        isGenerated: true,
      },
    ];
    const preview: GeneratedEvent[] = [
      {
        id: "preview-id-different-from-persisted",
        taskId: "t1",
        start: newStart,
        end: newEnd,
      },
    ];
    const tasks: Task[] = [{ id: "t1", title: "Test Task" }];

    const result = computeDiff(preview, persisted, tasks);

    // The pending event should NOT be matched by taskId (excluded from byTaskId map)
    // So preview becomes a CREATE, not an UPDATE with the local UUID
    expect(result.toCreate).toHaveLength(1);
    expect(result.toCreate[0].taskId).toBe("t1");

    // toUpdate must NOT contain the local UUID
    const uuidUpdates = result.toUpdate.filter((u) => isUuid(u.id));
    expect(uuidUpdates).toHaveLength(0);

    // toDelete must NOT contain the local UUID (guarded by the new delete-loop fix)
    const uuidDeletes = result.toDelete.filter((id) => isUuid(id));
    expect(uuidDeletes).toHaveLength(0);
  });

  test("pending event never yields local-UUID in toDelete", () => {
    const localUuid = "b2c3d4e5-6789-4bcd-ef01-23456789abcd"; // valid UUID v4
    const persisted: CalendarEvent[] = [
      {
        id: localUuid,
        taskId: "t1",
        start: baseTime,
        end: endTime,
        source: "brkroutnxdle",
        isGenerated: true,
      },
    ];
    const preview: GeneratedEvent[] = []; // preview does NOT include the pending event
    const tasks: Task[] = [{ id: "t1", title: "Test Task" }];

    const result = computeDiff(preview, persisted, tasks);

    // The pending event is unmatched but must NOT be deleted (it doesn't exist remotely)
    expect(result.toDelete).toHaveLength(0);
    expect(result.toCreate).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(0);
  });

  test("synced Google event not in preview is still deleted", () => {
    const persisted: CalendarEvent[] = [
      {
        id: "google-xyz",
        taskId: "t1",
        start: baseTime,
        end: endTime,
        source: "google",
        isGenerated: true,
      },
      {
        id: "google-abc",
        taskId: "t2",
        start: baseTime,
        end: endTime,
        source: "google",
        isGenerated: true,
      },
    ];
    const preview: GeneratedEvent[] = [
      {
        id: "google-abc",
        taskId: "t2",
        start: baseTime,
        end: endTime,
      },
    ];
    const tasks: Task[] = [
      { id: "t1", title: "Task 1" },
      { id: "t2", title: "Task 2" },
    ];

    const result = computeDiff(preview, persisted, tasks);

    // google-xyz is not in preview -> should be deleted
    expect(result.toDelete).toContain("google-xyz");
    expect(result.toDelete).not.toContain("google-abc");
    expect(result.toCreate).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(0);
  });
});