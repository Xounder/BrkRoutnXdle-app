import { test, expect } from "@playwright/test";

/**
 * TASK-02 E2E Tests: Sidebar task creation adds CalendarEvent
 *
 * These tests verify that:
 * 1. Creating a task from the sidebar Tasks panel appends a CalendarEvent
 * 2. The created task appears on the calendar immediately
 * 3. Saving/re-rendering does not duplicate the CalendarEvent
 * 4. Inline slot creation and sidebar creation both produce single events
 * 5. Editing a task does not create a second CalendarEvent
 *
 * Tests mock authentication by intercepting /api/v1/auth/me
 * All API responses must be wrapped in { data: ... } because apiFetch returns json.data
 */

const TEST_USER = {
  id: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  picture: "",
};

test.describe("TASK-02: Sidebar task creation adds CalendarEvent", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication endpoint - must return { data: ... }
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: TEST_USER }),
      });
    });

    // Mock calendar events fetch to return empty array initially
    // IMPORTANT: apiFetch returns json.data, so response must be { data: [...] }
    await page.route("**/api/v1/events**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Expand the Tasks section in the sidebar (sections are collapsed by default)
    // The Sidebar renders a "Tasks" button that must be clicked to reveal the TaskPanel
    await page.click('button:has-text("Tasks")');
    // Wait for TaskPanel to be visible - it shows "Tasks (N)"
    await expect(page.locator("text=Tasks (0)")).toBeVisible({ timeout: 10000 });
  });

  test("creating a task from sidebar Tasks panel shows event on calendar", async ({ page }) => {
    // Click "+ New" button in the Tasks panel
    await page.click('button:has-text("+ New")');

    // Wait for TaskModal to appear - heading is "New Task"
    await expect(page.locator("text=New Task")).toBeVisible();

    // Fill in task name - placeholder is "e.g., Exercise, Reading, Practice"
    await page.fill('input[placeholder="e.g., Exercise, Reading, Practice"]', "Sidebar Test Task");

    // Select duration - options are "30 min", "60 min", etc. (label says "Duration (minutes)")
    // Scope by the label to avoid picking the Priority select
    await page.selectOption('label:has-text("Duration (minutes)") select', "60");

    // Click Create button (text is exactly "Create" in create mode)
    await page.click('button:has-text("Create")');

    // Wait for modal to close
    await expect(page.locator("text=New Task")).toBeHidden();

    // Verify the task appears in the Tasks panel
    await expect(page.locator("text=Tasks (1)")).toBeVisible();
    // Scope to the TaskPanel area (sidebar) to avoid matching calendar event
    const sidebarTaskName = page.locator("aside").locator("text=Sidebar Test Task");
    await expect(sidebarTaskName).toBeVisible();

    // Verify the event appears on the calendar (FullCalendar renders events as .fc-event)
    // The event should be visible in the week view at the default work start hour (8am)
    await expect(page.locator(".fc-event:has-text('Sidebar Test Task')")).toBeVisible({ timeout: 10000 });
  });

  test("sidebar-created task event is not duplicated on re-render", async ({ page }) => {
    // First create a task via sidebar
    await page.click('button:has-text("+ New")');
    await expect(page.locator("text=New Task")).toBeVisible();
    await page.fill('input[placeholder="e.g., Exercise, Reading, Practice"]', "Idempotency Test");
    await page.selectOption('label:has-text("Duration (minutes)") select', "30");
    await page.click('button:has-text("Create")');
    await expect(page.locator("text=New Task")).toBeHidden();

    // Verify initial event count on calendar
    const initialEvents = await page.locator(".fc-event:has-text('Idempotency Test')").count();
    expect(initialEvents).toBe(1);

    // Trigger a re-render by changing view and back
    // View buttons are in Header with text "Day", "Week", "Month"
    await page.click('button:has-text("Day")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Week")');
    await page.waitForTimeout(500);

    // Verify event count is still 1 (no duplication)
    const eventsAfterRerender = await page.locator(".fc-event:has-text('Idempotency Test')").count();
    expect(eventsAfterRerender).toBe(1);

    // Also verify Tasks panel still shows only 1 task
    await expect(page.locator("text=Tasks (1)")).toBeVisible();
  });

  test("inline slot creation and sidebar creation both produce single events (no duplicates)", async ({ page }) => {
    // 1. Create a task via sidebar
    await page.click('button:has-text("+ New")');
    await expect(page.locator("text=New Task")).toBeVisible();
    await page.fill('input[placeholder="e.g., Exercise, Reading, Practice"]', "Sidebar Task");
    await page.selectOption('label:has-text("Duration (minutes)") select', "60");
    await page.click('button:has-text("Create")');
    await expect(page.locator("text=New Task")).toBeHidden();

    // Verify sidebar task event exists
    await expect(page.locator(".fc-event:has-text('Sidebar Task')")).toBeVisible();

    // 2. Create a task inline using the PROVEN approach from TASK-01.spec.ts
    // Click on a specific time slot to trigger the "Create in this slot" modal
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

    // Click "Create Task" button in the modal menu
    await page.click("button:has-text('Create Task')");

    // Fill in task name in the form - uses #task-name and #task-duration selectors
    await page.fill("#task-name", "Inline Slot Task");
    await page.selectOption("#task-duration", "30");
    await page.click('button[type="submit"]:has-text("Create Task")');

    // Wait for modal to close
    await expect(page.locator("text=Create in this slot")).toBeHidden({ timeout: 10000 });

    // Verify both events exist on calendar (no duplicates)
    const sidebarEvents = await page.locator(".fc-event:has-text('Sidebar Task')").count();
    const inlineEvents = await page.locator(".fc-event:has-text('Inline Slot Task')").count();

    expect(sidebarEvents).toBe(1);
    expect(inlineEvents).toBe(1);

    // Verify Tasks panel shows 2 tasks
    await expect(page.locator("text=Tasks (2)")).toBeVisible();
  });

  test("editing an existing sidebar task does not create a second CalendarEvent", async ({ page }) => {
    // Create a task via sidebar
    await page.click('button:has-text("+ New")');
    await expect(page.locator("text=New Task")).toBeVisible();
    await page.fill('input[placeholder="e.g., Exercise, Reading, Practice"]', "Editable Task");
    await page.selectOption('label:has-text("Duration (minutes)") select', "60");
    await page.click('button:has-text("Create")');
    await expect(page.locator("text=New Task")).toBeHidden();

    // Verify initial event count
    const initialEvents = await page.locator(".fc-event:has-text('Editable Task')").count();
    expect(initialEvents).toBe(1);

    // Click on the event to edit it
    await page.click(".fc-event:has-text('Editable Task')");

    // Wait for Edit Task modal - heading is "Edit Task"
    await expect(page.locator("text=Edit Task")).toBeVisible();

    // Change the name - placeholder is still "e.g., Exercise, Reading, Practice"
    await page.fill('input[placeholder="e.g., Exercise, Reading, Practice"]', "Edited Task");

    // Click Save (button text is "Save" in edit mode) - it's a type="submit" button in the form
    await page.click('form button[type="submit"]:has-text("Save")');
    
    // Wait for modal to close and state to update
    await expect(page.locator("text=Edit Task")).toBeHidden();
    await page.waitForTimeout(500); // Allow state propagation

    // Verify only one event exists (no duplicate created)
    const eventsAfterEdit = await page.locator(".fc-event:has-text('Edited Task')").count();
    expect(eventsAfterEdit).toBe(1);

    // Verify no old event remains
    const oldEvents = await page.locator(".fc-event:has-text('Editable Task')").count();
    expect(oldEvents).toBe(0);
  });
});