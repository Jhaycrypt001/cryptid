import { Logo } from "./Logo";
import { AppTabs } from "./AppTabs";
import { ConnectButton } from "./ConnectButton";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3.5">
        <Logo />
        <div className="flex items-center gap-3">
          <AppTabs />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
