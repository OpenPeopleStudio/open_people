import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import { PrintVoiceNote, VoiceModeProvider } from "./voice";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <VoiceModeProvider>
      <div className="relative min-h-screen bg-[var(--void)] text-[var(--text-primary)]">
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
