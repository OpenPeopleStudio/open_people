import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import { PrintVoiceNote, VoiceModeProvider } from "./voice";
import { WalkBar, WalkthroughProvider } from "./depth";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <VoiceModeProvider>
      <WalkthroughProvider>
        <div className="relative min-h-screen bg-[var(--void)] text-[var(--ink)]">
          <SiteNav />
          <div className="relative z-10">{children}</div>
          <div className="relative z-10">
            <SiteFooter />
            <PrintVoiceNote />
          </div>
          <WalkBar />
        </div>
      </WalkthroughProvider>
    </VoiceModeProvider>
  );
}
