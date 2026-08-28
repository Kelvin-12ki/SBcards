import React from "react";
import { BellIcon, BrainCircuitIcon, CreditCardIcon, LayoutDashboardIcon, MessageSquareIcon, ScanLineIcon, WalletIcon, type LucideIcon } from "lucide-react";
import { GeometricAvatar } from "../GeometricAvatar";
import { cn } from "../../utils/cn";
const RAIL: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}> = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboardIcon
}, {
  id: 'messages',
  label: 'Messages',
  icon: MessageSquareIcon,
  badge: 4
}, {
  id: 'wallet',
  label: 'Wallet',
  icon: WalletIcon
}, {
  id: 'cards',
  label: 'My Cards',
  icon: CreditCardIcon
}, {
  id: 'ai',
  label: 'AI Match',
  icon: BrainCircuitIcon
}, {
  id: 'scan',
  label: 'Scan QR',
  icon: ScanLineIcon
}];

/** Chrome for the in-page product tour: fixed nav rail, app header, and a content well. */
export function AppFrame({
  activeId,
  title,
  children




}: {activeId: string;title: string;children: React.ReactNode;}) {
  return <div data-theme="dark" className="overflow-hidden rounded-3xl border border-ink-600/80 bg-ink-850 shadow-panel">
      <div className="flex items-center gap-2 border-b border-ink-600/70 bg-ink-800 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-500" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-500" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-500" aria-hidden="true" />
        <span className="mx-auto rounded-md bg-ink-700 px-3 py-0.5 text-[10px] font-medium text-fog-500">
          app.nexas.app/{activeId}
        </span>
      </div>

      <div className="flex min-h-[440px]">
        <nav aria-hidden="true" className="hidden w-[168px] shrink-0 flex-col gap-1 border-r border-ink-600/70 bg-ink-900 p-3 sm:flex">
          {RAIL.map((item) => {
          const active = item.id === activeId;
          return <span key={item.id} className={cn('flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[11px]', active ? 'border-accent/40 bg-accent/[0.07] font-semibold text-strong shadow-glow' : 'border-transparent text-fog-400')}>
                <item.icon className={cn('h-3.5 w-3.5', active ? 'text-accent' : 'text-fog-500')} />
                <span className="truncate">{item.label}</span>
                {item.badge && <span className="ml-auto rounded-full bg-gold px-1.5 text-[9px] font-bold text-onaccent">
                    {item.badge}
                  </span>}
              </span>;
        })}
        </nav>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 border-b border-ink-600/70 px-4 py-3">
            <p className="truncate text-xs font-bold text-strong">{title}</p>
            <span className="ml-auto flex items-center gap-2">
              <span className="relative grid h-7 w-7 place-items-center rounded-lg border border-ink-500 bg-ink-800 text-fog-400">
                <BellIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-gold text-[8px] font-bold text-onaccent">
                  7
                </span>
              </span>
              <GeometricAvatar seed={71} name="Barak Imani" size={26} />
            </span>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>;
}