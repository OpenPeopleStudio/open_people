"use client";

import type { EmailMessage } from "@/types/email";

type Props = {
  messages: EmailMessage[];
  selectedMessage: EmailMessage | null;
  onSelectMessage: (message: EmailMessage) => void;
  onStar: (message: EmailMessage) => void;
  viewType: string;
};

export function InboxView({
  messages,
  selectedMessage,
  onSelectMessage,
  onStar,
  viewType,
}: Props) {
  const getViewTitle = () => {
    switch (viewType) {
      case "inbox": return "Inbox";
      case "sent": return "Sent";
      case "starred": return "Starred";
      case "drafts": return "Drafts";
      case "archive": return "Archive";
      case "spam": return "Spam";
      case "trash": return "Trash";
      default: return "Messages";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 border-b border-[var(--border-subtle)]">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)]">{getViewTitle()}</h2>
        <span className="text-xs md:text-sm text-[var(--text-muted)]">{messages.length} messages</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 md:p-8">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-[var(--text-muted)] mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <p className="text-sm md:text-base text-[var(--text-muted)]">No messages</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => onSelectMessage(message)}
                className={`flex items-start gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 cursor-pointer transition-colors active:bg-[var(--surface-2)] ${
                  selectedMessage?.id === message.id
                    ? "bg-[var(--electric-lime)]/5"
                    : "hover:bg-[var(--surface-1)]"
                } ${!message.is_read ? "bg-[var(--surface-1)]" : ""}`}
              >
                {/* Star Button - hidden on very small screens */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStar(message);
                  }}
                  aria-label={message.is_starred ? "Unstar message" : "Star message"}
                  aria-pressed={message.is_starred}
                  className="hidden sm:block mt-1 p-1 rounded hover:bg-[var(--surface-2)] transition-colors shrink-0"
                >
                  <svg
                    className={`w-4 h-4 ${
                      message.is_starred
                        ? "fill-[var(--warning)] text-[var(--warning)]"
                        : "text-[var(--text-muted)]"
                    }`}
                    fill={message.is_starred ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* Unread indicator on mobile */}
                      {!message.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)] shrink-0 sm:hidden" />
                      )}
                      <p className={`text-sm truncate ${!message.is_read ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                        {message.direction === "outbound" 
                          ? `To: ${message.to_addresses?.[0]?.email || "Unknown"}`
                          : message.from_name || message.from_address
                        }
                      </p>
                    </div>
                    <span className="text-[10px] md:text-xs text-[var(--text-muted)] whitespace-nowrap shrink-0">
                      {formatDate(message.received_at || message.sent_at || message.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${!message.is_read ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                    {message.subject || "(No subject)"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-1 line-clamp-1 md:line-clamp-none">
                    {message.body_preview || ""}
                  </p>
                </div>

                {/* Indicators - desktop */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {message.has_attachments && (
                    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                  )}
                  {!message.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
                  )}
                </div>

                {/* Mobile attachment indicator */}
                {message.has_attachments && (
                  <svg className="sm:hidden w-4 h-4 text-[var(--text-muted)] shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
