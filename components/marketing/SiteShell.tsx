import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import { PrintVoiceNote, VoiceModeProvider } from "./voice";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <VoiceModeProvider>
      <div className="relative min-h-screen bg-[var(--void)] text-[var(--text-primary)]">
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(min(900px,140vw) 520px at 50% -8%, rgba(232,137,60,.07), transparent 70%)",
          }}
          aria-hidden
        />
        <SiteNav />
        <div className="relative z-10">{children}</div>
        <div className="relative z-10">
          <SiteFooter />
          <PrintVoiceNote />
        </div>
      </div>
    </VoiceModeProvider>
  );
}
