"use client";

import { ActivityCalendar } from "react-activity-calendar";

interface HeatmapData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ProfileHeatmapProps {
  data: HeatmapData[];
}

export function ProfileHeatmap({ data }: ProfileHeatmapProps) {
  // Ensure we have at least some data, fill gaps if needed
  const calendarData =
    data.length > 0
      ? data
      : [{ date: new Date().toISOString().split("T")[0], count: 0, level: 0 as const }];

  return (
    <div className="overflow-x-auto">
      <ActivityCalendar
        data={calendarData}
        theme={{
          dark: [
            "hsl(0, 0%, 15%)",  // level 0 — no activity
            "hsl(160, 50%, 20%)", // level 1
            "hsl(160, 60%, 30%)", // level 2 — one problem
            "hsl(160, 70%, 40%)", // level 3
            "hsl(160, 80%, 50%)", // level 4 — both problems
          ],
        }}
        colorScheme="dark"
        blockSize={12}
        blockMargin={3}
        fontSize={12}
        labels={{
          totalCount: "{{count}} points earned in the last year",
        }}
      />
    </div>
  );
}
