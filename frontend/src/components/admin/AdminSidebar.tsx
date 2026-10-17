import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/helpers';
import { getOrganizerRequests, type OrganizerRequest } from '@/api/admin';
import { getReports } from '@/api/moderation';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const DashboardIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const EventsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const RequestsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

const SecurityIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const DevicesIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
  </svg>
);

const ReportsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3.75A.75.75 0 013.75 3h2.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75h-2.5a.75.75 0 01-.75-.75V3.75zM7.5 4.5A.75.75 0 018.25 3.75h6.75a.75.75 0 01.75.75v15a.75.75 0 01-1.125.65L11.25 17.4l-3.375 2.025A.75.75 0 016.75 18.75V4.5z" />
  </svg>
);

const ChatsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const adminNavLinks = [
  { to: '/admin', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/admin/users', label: 'Users', icon: UsersIcon, end: false },
  { to: '/admin/events', label: 'Events', icon: EventsIcon, end: false },
  { to: '/admin/organizer-requests', label: 'Organizer Requests', icon: RequestsIcon, end: false },
  { to: '/admin/analytics', label: 'Analytics', icon: AnalyticsIcon, end: false },
  { to: '/admin/chats', label: 'Chats', icon: ChatsIcon, end: false },
  { to: '/admin/reports', label: 'Reports', icon: ReportsIcon, end: false },
  { to: '/admin/security', label: 'Security', icon: SecurityIcon, end: false },
  { to: '/admin/security/devices', label: 'Devices', icon: DevicesIcon, end: false },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const [pendingCount, setPendingCount] = React.useState(0);
  const [openReports, setOpenReports] = React.useState(0);

  React.useEffect(() => {
    // Both counts are badges only — a failed fetch must not break navigation.
    getReports({ status: 'open', limit: 1 })
      .then((data) => setOpenReports(data.total))
      .catch(() => {});
    getOrganizerRequests()
      .then((requests: OrganizerRequest[]) => {
        const pending = requests.filter(
          (r) => r.organizerRequest?.status === 'pending',
        ).length;
        setPendingCount(pending);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={(
          'fixed left-0 z-40 flex w-64 flex-col border-r border-border-subtle bg-surface-1 shadow-2xl transition-transform duration-300 ease-in-out ' +
          'lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ' +
          'top-0 h-full ' +
          (isOpen ? 'translate-x-0' : '-translate-x-full')
        )}
      >
        {/* Desktop-only menu label */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <span className="font-display text-base font-bold text-gradient-gold">Admin Panel</span>
          <span className="text-[10px] uppercase tracking-wider text-gold px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
            Admin
          </span>
        </div>

        {/* Mobile close button */}
        <div className="flex items-center justify-end px-4 py-2 lg:hidden">
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            aria-label="Close sidebar menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable nav links */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-1">
            {adminNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-gold/20 to-amber-500/10 text-gold border border-gold/20 shadow-lg shadow-gold/10'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                  )
                }
              >
                <link.icon />
                <span className="flex-1">{link.label}</span>
                {link.to === '/admin/organizer-requests' && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    {pendingCount}
                  </span>
                )}
                {link.to === '/admin/reports' && openReports > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {openReports}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
