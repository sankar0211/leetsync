import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const updates = [
  {
    date: new Date(), // Today
    version: "v1.1.0",
    title: "Security, Scheduling, and Flexibility",
    description: "Major updates to problem setting and user security based on your feedback.",
    changes: [
      {
        type: "Feature",
        content: "Forgot Password Recovery: Set up security questions in your Profile to easily recover your password if you ever forget it.",
      },
      {
        type: "Feature",
        content: "Advance Problem Scheduling: Setters can now pick tomorrow's problem a day early! It remains hidden from the rest of the team until midnight.",
      },
      {
        type: "Feature",
        content: "Edit Active Problems: Problem setters and Admins can now edit the current day's problem after it's been set.",
      },
      {
        type: "Fix",
        content: "Fixed infinite loading state when attempting to verify an unsolved problem.",
      },
      {
        type: "Fix",
        content: "Improved URL matching for LeetCode problems (e.g., properly handles 'pascals-triangle').",
      },
    ],
  },
  {
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // A week ago roughly
    version: "v1.0.0",
    title: "Initial Launch",
    description: "Welcome to LeetSync! Stay accountable and track your LeetCode progress.",
    changes: [
      {
        type: "Feature",
        content: "Create and join teams to compete with your friends.",
      },
      {
        type: "Feature",
        content: "Daily rotating problem setter.",
      },
      {
        type: "Feature",
        content: "Leaderboards and completion tracking.",
      },
    ],
  }
];

export default function UpdatesPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Updates & Changelog</h1>
        <p className="text-muted-foreground mt-2">
          See what's new in LeetSync. We're constantly improving the platform based on your feedback.
        </p>
      </div>

      <div className="space-y-8 mt-8">
        {updates.map((update, index) => (
          <div key={index} className="relative pl-8 border-l border-border/50 pb-8 last:pb-0">
            <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[6.5px] top-2" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{update.title}</h2>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {update.version}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                {format(update.date, "MMMM d, yyyy")}
              </span>
            </div>
            
            <p className="text-muted-foreground mb-6">
              {update.description}
            </p>

            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  {update.changes.map((change, i) => (
                    <li key={i} className="flex gap-3">
                      <Badge 
                        variant="secondary" 
                        className={`mt-0.5 h-fit shrink-0 ${
                          change.type === "Feature" 
                            ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" 
                            : change.type === "Fix"
                            ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                            : ""
                        }`}
                      >
                        {change.type}
                      </Badge>
                      <span className="text-sm leading-relaxed">{change.content}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
