import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuditEvents } from "@/hooks/useAuditEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function AuditLogPage() {
  const { projectId } = useParams();
  const [eventType, setEventType] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters = useMemo(
    () => ({
      eventType: eventType || undefined,
      sessionId: sessionId || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [eventType, sessionId, from, to]
  );

  const { events, loading, refresh } = useAuditEvents(projectId, filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Trace agent activity and system events in this project.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Event type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        />
        <Input
          placeholder="Session ID"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <Input
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <div>
        <Button variant="outline" onClick={() => refresh()}>Apply Filters</Button>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events found.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="border rounded-md p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{event.eventType}</Badge>
                {event.sessionId && <Badge variant="outline">{event.sessionId}</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
              {event.payload && (
                <pre className="text-xs bg-muted/30 text-foreground border rounded-md p-3 overflow-auto">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
