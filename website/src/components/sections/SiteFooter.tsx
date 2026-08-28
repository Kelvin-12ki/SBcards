import React from 'react';
import { BrandMark } from '../BrandMark';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
{
  title: 'Product',
  links: [
    { label: 'Digital cards', href: '#top' },
    { label: 'Card wallet', href: '#top' },
    { label: 'AI Match', href: '#top' },
    { label: 'QR & scanning', href: '#top' },
    { label: 'Organizations', href: '#top' },
  ],
},
{
  title: 'Company',
  links: [
    { label: 'About', href: '#top' },
    { label: 'Careers', href: '#top' },
    { label: 'Press kit', href: '#top' },
    { label: 'Contact', href: '#top' },
  ],
},
{
  title: 'Resources',
  links: [
    { label: 'Help centre', href: '#top' },
    { label: 'Networking playbook', href: '#top' },
    { label: 'API docs', href: '#top' },
    { label: 'Status', href: '#top' },
  ],
},
{
  title: 'Legal',
  links: [
    { label: 'Privacy', href: '#/privacy' },
    { label: 'Terms', href: '#/terms' },
    { label: 'Data export', href: '#top' },
    { label: 'Security', href: '#top' },
  ],
},
];


export function SiteFooter() {
  return (
    <footer className="border-t border-ink-600/70 bg-ink-900">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fog-400">
              Digital business cards and smart networking for people who meet too many people to
              remember them all.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) =>
            <div key={column.title}>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-fog-500">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) =>
                <li key={link.label}>
                      <a
                    href={link.href}
                    className="text-sm text-fog-300 transition-colors duration-150 ease-out hover:text-accent">
                    
                        {link.label}
                      </a>
                    </li>
                )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-600/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-fog-500">© 2026 NEXAS. Built in Nairobi.</p>
          <p className="text-xs text-fog-500">hello@nexas.app · +254 11307113</p>
        </div>
      </div>
    </footer>);

}