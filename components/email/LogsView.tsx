"use client";

import type { EmailLog } from "@/types/email";

type Props = {
  logs: (EmailLog & { template?: { name: string } | null })[];
};

export function LogsView({ logs }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "opened":
      case "clicked":
        return "var(--success)";
      case "sent":
      case "queued":
        return "var(--warning)";
      case "bounced":
      case "failed":
      case "complained":
        return "var(--error)";
      default:
        return "var(--text-muted)";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5";
      case "delivered":
        return "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
      case "opened":
        return "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z";
      case "clicked":
        return "M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5";
      case "bounced":
      case "failed":
        return "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z";
      default:
        return "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Email Activity</h2>
        <span className="text-sm text-[var(--text-muted)]">{logs.length} recent</span>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className="w-12 h-12 text-[var(--text-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[var(--text-muted)]">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-1)] transition-colors"
              >
                {/* Status Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${getStatusColor(log.status)}15` }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    style={{ color: getStatusColor(log.status) }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={getStatusIcon(log.status)} />
                  </svg>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {log.to_email}
                    </p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded capitalize"
                      style={{
                        backgroundColor: `${getStatusColor(log.status)}15`,
                        color: getStatusColor(log.status),
                      }}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {log.subject} · {log.template?.name || "Custom"}
                  </p>
                  {log.error_message && (
                    <p className="text-xs text-[var(--error)] mt-1 truncate">
                      {log.error_message}
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
