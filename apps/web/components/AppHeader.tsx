import { Logo } from "./Logo";
import { AppTabs } from "./AppTabs";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Logo />
        <AppTabs />
      </div>
    </header>
  );
}
