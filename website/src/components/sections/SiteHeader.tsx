import React, { useState } from 'react';
import { MenuIcon, PlusIcon, XIcon } from 'lucide-react';
import { navLinks } from '../../data/site';
import { BrandMark } from '../BrandMark';
import { LinkButton } from '../ui/Button';
import { cn } from '../../utils/cn';
import { appLinkProps, appRoutes } from '../../config/app';
import { ThemeToggle } from '../../theme/ThemeToggle';
import { useScrolled } from '../motion/effects';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(16);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-all duration-500 ease-smooth',
        scrolled ?
        'border-ink-600/80 bg-ink-900/80 shadow-panel backdrop-blur-xl supports-[backdrop-filter]:bg-ink-900/65' :
        'border-transparent bg-transparent'
      )}>
      
      <div
        className={cn(
          'mx-auto flex w-full max-w-[1240px] items-center gap-6 px-5 transition-[height] duration-500 ease-smooth sm:px-8',
          scrolled ? 'h-14' : 'h-16'
        )}>
        <a href="#top" aria-label="NEXAS home">
          <BrandMark />
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) =>
            <li key={link.href}>
                <a
                href={link.href}
                className="relative inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-fog-300 transition-all duration-300 ease-smooth hover:bg-ink-700 hover:text-strong">
                
                  {link.label}
                </a>
              </li>
            )}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 xl:flex">
          <ThemeToggle className="mr-1" />
          <LinkButton href={appRoutes.login} variant="ghost" size="md" {...appLinkProps}>
            Sign in
          </LinkButton>
          <LinkButton href={appRoutes.dashboard} variant="outline" size="md" {...appLinkProps}>
            Open App
          </LinkButton>
          <LinkButton href={appRoutes.createCard} variant="primary" size="md" {...appLinkProps}>
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Create New Card
          </LinkButton>
        </div>

        <ThemeToggle className="ml-auto xl:hidden" />

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg p-2 text-fog-300 transition-colors duration-150 ease-out hover:bg-ink-700 hover:text-strong xl:hidden">
          
          {open ? <XIcon className="h-5 w-5" aria-hidden="true" /> : <MenuIcon className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open &&
      <div className="animate-fade-up border-t border-ink-600/80 bg-ink-850 xl:hidden">
          <nav aria-label="Mobile" className="mx-auto max-w-[1240px] px-5 py-4 sm:px-8">
            <ul className="space-y-1">
              {navLinks.map((link) =>
            <li key={link.href}>
                  <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-fog-200 transition-colors duration-150 ease-out hover:bg-ink-700 hover:text-strong">
                
                    {link.label}
                  </a>
                </li>
            )}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <LinkButton
                href={appRoutes.createCard}
                variant="primary"
                size="md"
                {...appLinkProps}
                onClick={() => setOpen(false)}>
                Create New Card
              </LinkButton>
              <LinkButton
                href={appRoutes.login}
                variant="outline"
                size="md"
                {...appLinkProps}
                onClick={() => setOpen(false)}>
                Sign in
              </LinkButton>
            </div>
          </nav>
        </div>
      }
    </header>);

}