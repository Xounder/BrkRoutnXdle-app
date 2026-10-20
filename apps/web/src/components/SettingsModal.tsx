import { useMemo } from "react";
import {
  Button, Checkbox, Fieldset, Group, Modal, NativeSelect, NumberInput, Stack, Text,
} from "@mantine/core";
import { useSettings } from "../contexts/SettingsContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fallbackTimezones = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Europe/Moscow", "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata",
  "Australia/Sydney", "Pacific/Auckland",
];

function getTimezoneOffset(tz: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" });
    return formatter.formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

const clampHour = (value: number): number => Math.max(0, Math.min(23, value));
const to12h = (hour: number) => `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const timezoneOptions = useMemo(() => {
    let timezones: string[];
    try {
      timezones = Intl.supportedValuesOf("timeZone");
    } catch {
      timezones = fallbackTimezones;
    }
    // Intl.supportedValuesOf omits UTC even though it is a valid saved default.
    return [...new Set([settings.timezone, "UTC", ...timezones])].map((tz) => {
      const offset = getTimezoneOffset(tz);
      return { value: tz, label: offset ? `${tz} (${offset})` : tz };
    });
  }, [settings.timezone]);

  return (
    <Modal opened={isOpen} onClose={onClose} title="Settings" centered size="md">
      <Stack gap="lg">
        <Checkbox
          label="Use 12-hour format (AM/PM)"
          checked={settings.use12h}
          onChange={(event) => updateSettings({ use12h: event.currentTarget.checked })}
        />
        <Group grow align="flex-start">
          <Stack gap="xs">
            <NumberInput
              label="Available Start Hour" min={0} max={23} allowDecimal={false}
              value={settings.workStartHour}
              onChange={(value) => {
                if (typeof value !== "number") return;
                const clamped = clampHour(value);
                updateSettings({ workStartHour: clamped, workEndHour: Math.max(clamped, settings.workEndHour) });
              }}
            />
            {settings.use12h && <Text size="sm" c="dimmed">{to12h(settings.workStartHour)}</Text>}
          </Stack>
          <Stack gap="xs">
            <NumberInput
              label="Available End Hour" min={0} max={23} allowDecimal={false}
              value={settings.workEndHour}
              onChange={(value) => {
                if (typeof value !== "number") return;
                const clamped = clampHour(value);
                updateSettings({ workEndHour: clamped, workStartHour: Math.min(clamped, settings.workStartHour) });
              }}
            />
            {settings.use12h && <Text size="sm" c="dimmed">{to12h(settings.workEndHour)}</Text>}
          </Stack>
        </Group>
        <Group grow align="flex-start">
          <NumberInput
            label="Max Tasks Per Day" min={1} max={20} allowDecimal={false}
            value={settings.maxTasksPerDay}
            onChange={(value) => {
              if (typeof value === "number") updateSettings({ maxTasksPerDay: value });
            }}
          />
          <NativeSelect
            label="Default Task Duration (min)" value={settings.defaultTaskDuration}
            onChange={(event) => updateSettings({ defaultTaskDuration: parseInt(event.currentTarget.value, 10) })}
            data={[30, 60, 90, 120, 150, 180].map((d) => ({ value: String(d), label: `${d} min` }))}
          />
        </Group>
        <Fieldset legend="Work Days">
          <Group gap="sm">
            {days.map((day, i) => (
              <Checkbox
                key={day} label={day} checked={settings.workDays.includes(i)}
                onChange={() => {
                  const next = settings.workDays.includes(i)
                    ? settings.workDays.filter((d) => d !== i)
                    : [...settings.workDays, i].sort();
                  updateSettings({ workDays: next });
                }}
              />
            ))}
          </Group>
        </Fieldset>
        {/* Native select avoids rendering 400+ items into a non-virtualized dropdown. */}
        <NativeSelect
          label="Timezone" value={settings.timezone}
          onChange={(event) => updateSettings({ timezone: event.currentTarget.value })}
          data={timezoneOptions}
        />
        <Group justify="space-between">
          <Button variant="outline" onClick={resetSettings}>Reset to Defaults</Button>
          <Button onClick={onClose}>Done</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
