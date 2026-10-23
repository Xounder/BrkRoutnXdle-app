import { expect, test } from "@playwright/test";

const user = { id: "calendar-qa", email: "qa@example.com", name: "Calendar QA" };

test("week grid hierarchy and event card contrast survive theme and narrow layout", async ({ page }, testInfo) => {
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60_000);

  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ json: { data: user } })
  );
  await page.route("**/api/v1/events**", (route) =>
    route.fulfill({ json: { data: [{
      id: "qa-event", title: "Calendar readability check", start: start.toISOString(),
      end: end.toISOString(), source: "google", isGenerated: false,
      isAllDay: false, isCompleted: false,
    }] } })
  );
  await page.goto("/");
  const calendar = page.locator(".brk-calendar-google:has(> .fc)");
  await expect(calendar.locator(".fc-timegrid-slot-minor").first()).toBeVisible();
  await expect(calendar.locator(".fc-event.brk-external").first()).toBeVisible();

  for (const theme of ["light", "dark"] as const) {
    await page.locator("html").evaluate((html, value) => html.setAttribute("data-mantine-color-scheme", value), theme);
    for (const width of [1440, 760]) {
      await page.setViewportSize({ width, height: 900 });
      const metrics = await calendar.evaluate((root) => {
        const css = (selector: string) => getComputedStyle(root.querySelector<HTMLElement>(selector)!);
        const rgb = (color: string) => {
          const values = color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
          return color.startsWith("color(srgb ") ? values.map((value) => value * 255) : values;
        };
        // Today's header tint is translucent. Compare text with the painted surface,
        // not the uncomposited RGB channels returned by getComputedStyle.
        const paintedBackground = (foreground: string, under: string) => {
          const alpha = foreground.match(/[\d.]+/g)!.map(Number)[3] ?? 1;
          return `rgb(${rgb(foreground).map((channel, i) =>
            Math.round(channel * alpha + rgb(under)[i] * (1 - alpha))
          ).join(", ")})`;
        };
        const distance = (a: string, b: string) =>
          rgb(a).reduce((sum, channel, i) => sum + Math.abs(channel - rgb(b)[i]), 0);
        const luminance = (value: number) => {
          const s = value / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        const contrast = (a: string, b: string) => {
          const lightness = (color: string) => rgb(color).reduce(
            (sum, channel, i) => sum + luminance(channel) * [0.2126, 0.7152, 0.0722][i], 0
          );
          const [light, dark] = [lightness(a), lightness(b)].sort((x, y) => y - x);
          return (light + 0.05) / (dark + 0.05);
        };
        const major = css(".fc-timegrid-slot:not(.fc-timegrid-slot-minor)");
        const minor = css(".fc-timegrid-slot-minor");
        const surface = css(".fc").backgroundColor;
        const event = css(".fc-event.brk-external");
        const title = css(".fc-event.brk-external .brk-event-title");
        const headerContrast = (selector: string) => {
          const cell = css(selector);
          const text = css(`${selector} .fc-col-header-cell-cushion`);
          return contrast(text.color, paintedBackground(cell.backgroundColor, surface));
        };
        return {
          majorDelta: distance(major.borderTopColor, surface),
          minorDelta: distance(minor.borderTopColor, surface),
          titleContrast: contrast(title.color, event.backgroundColor),
          headerContrast: headerContrast(".fc-col-header-cell:not(.fc-day-today)"),
          todayContrast: headerContrast(".fc-col-header-cell.fc-day-today"),
          eventRadius: parseFloat(event.borderTopLeftRadius),
        };
      });
      expect(metrics.majorDelta).toBeGreaterThan(metrics.minorDelta);
      expect(metrics.titleContrast).toBeGreaterThanOrEqual(4.5);
      expect(metrics.headerContrast).toBeGreaterThanOrEqual(4.5);
      expect(metrics.todayContrast).toBeGreaterThanOrEqual(4.5);
      expect(metrics.eventRadius).toBeGreaterThanOrEqual(6);
      console.log(`TASK-06 ${theme} ${width}px: event ${metrics.titleContrast.toFixed(2)}:1, header ${metrics.headerContrast.toFixed(2)}:1, today ${metrics.todayContrast.toFixed(2)}:1`);
      await testInfo.attach(`calendar-${theme}-${width}`, {
        body: await calendar.screenshot(), contentType: "image/png",
      });
    }
  }

  await calendar.locator(".fc-event.brk-external").first().click();
  await expect(page.getByText("Calendar readability check").first()).toBeVisible();
});
