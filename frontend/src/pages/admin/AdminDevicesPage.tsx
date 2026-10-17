import React, { useCallback, useEffect, useState } from 'react';
import { getDevices } from '@/api/security';
import type { Device, DevicesFilter, PaginatedDevices } from '@/types/security';
import { showApiError } from '@/utils/errorHandler';

const PAGE_SIZE = 50;

// Mirrors the exact strings returned by backend parseUserAgent(). The parser
// stores nothing when a UA is unrecognised (the cell renders "—"), so there is
// deliberately no "Unknown" option: selecting it would match zero rows.
const OS_OPTIONS = [
  'Windows',
  'Android',
  'iOS',
  'macOS',
  'ChromeOS',
  'Linux',
];

const BROWSER_OPTIONS = [
  'Chrome',
  'Safari',
  'Firefox',
  'Edge',
  'Opera',
  'Samsung Internet',
  'Script',
];

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const AdminDevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<PaginatedDevices | null>(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<DevicesFilter>({
    page: 1,
    limit: PAGE_SIZE,
  });
  const [userIdInput, setUserIdInput] = useState('');
  const [ipInput, setIpInput] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDevices(filters)
      .then((data) => {
        if (!cancelled) setDevices(data);
      })
      .catch((err) => {
        if (!cancelled) showApiError(err, 'Failed to load devices.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const patch = useCallback((next: Partial<DevicesFilter>) => {
    setFilters((prev) => ({ ...prev, ...next, page: next.page ?? 1 }));
  }, []);

  const applyTextFilters = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      patch({ userId: userIdInput.trim(), ip: ipInput.trim() });
    },
    [patch, userIdInput, ipInput],
  );

  if (loading && !devices) return <Spinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Registered devices</h1>
        <p className="text-text-tertiary mt-1">
          One row per device a user has signed in from. A device is recorded the
          first time it authenticates and refreshed on every sign-in after that.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Devices</h2>
            <p className="text-sm text-text-tertiary">
              {devices ? `${devices.total.toLocaleString()} matching devices` : '—'}
            </p>
          </div>

          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={applyTextFilters}
          >
            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">
                Owner (user id)
              </span>
              <input
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="MongoDB user id"
                className="w-56 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              />
            </label>

            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">OS</span>
              <select
                value={filters.os ?? ''}
                onChange={(e) => patch({ os: e.target.value || undefined })}
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">All</option>
                {OS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">Browser</span>
              <select
                value={filters.browser ?? ''}
                onChange={(e) => patch({ browser: e.target.value || undefined })}
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">All</option>
                {BROWSER_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">
                Last IP
              </span>
              <input
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="e.g. 102.217.1.4"
                className="w-40 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              />
            </label>

            <button
              type="submit"
              className="rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-semibold text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setUserIdInput('');
                setIpInput('');
                setFilters({ page: 1, limit: PAGE_SIZE });
              }}
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
            >
              Reset
            </button>
          </form>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-text-tertiary">
            Loading…
          </div>
        ) : !devices || devices.data.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-tertiary">
            No devices match these filters. Devices appear here after a user
            signs in from them.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-text-tertiary border-b border-border-subtle">
                    <th className="py-3 pr-4">Owner</th>
                    <th className="py-3 pr-4">Device</th>
                    <th className="py-3 pr-4">Device ID</th>
                    <th className="py-3 pr-4">Last IP</th>
                    <th className="py-3 pr-4">First seen</th>
                    <th className="py-3 pr-4">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.data.map((device: Device) => (
                    <tr
                      key={device.id}
                      className="border-b border-border-subtle/60 align-top"
                    >
                      <td className="py-3 pr-4">
                        <span className="block text-text-primary">
                          {device.user?.displayName ||
                            device.user?.email ||
                            '—'}
                        </span>
                        <span className="block text-xs text-text-tertiary">
                          {device.user?.email ?? device.userId}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {[device.os, device.browser].filter(Boolean).join(' · ') ||
                          '—'}
                        {device.platform && (
                          <span className="block text-xs text-text-tertiary">
                            {device.platform}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-text-tertiary">
                        <span
                          className="block max-w-[14rem] truncate"
                          title={device.deviceId}
                        >
                          {device.deviceId}
                        </span>
                        {device.fingerprint && (
                          <span className="block max-w-[14rem] truncate" title={device.fingerprint}>
                            fp {device.fingerprint}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
                        {device.lastIp || '—'}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
                        {new Date(device.firstSeenAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
                        {new Date(device.lastSeenAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 mt-5">
              <p className="text-xs text-text-tertiary">
                Page {devices.page} of {devices.totalPages} · showing{' '}
                {devices.data.length} of {devices.total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => patch({ page: (filters.page ?? 1) - 1 })}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={(filters.page ?? 1) >= devices.totalPages}
                  onClick={() => patch({ page: (filters.page ?? 1) + 1 })}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDevicesPage;
