import React from 'react';
import {
  ActivityIcon,
  MessageSquareIcon,
  SearchIcon,
  SparklesIcon,
  UploadIcon,
  WalletIcon } from
'lucide-react';
import { heroCard } from '../../data/site';
import { DigitalCard } from '../DigitalCard';
import { GeometricAvatar } from '../GeometricAvatar';
import { QrCode } from '../QrCode';

const QUICK = [
{ label: 'Messages', hint: '4 unread', icon: MessageSquareIcon },
{ label: 'Activity Feed', hint: '7 today', icon: ActivityIcon },
{ label: 'Card Wallet', hint: '148 cards', icon: WalletIcon },
{ label: 'AI Insights', hint: '6 signals', icon: SparklesIcon }];


const EVENTS = [
{ day: '03', month: 'Sep', title: 'Solfest on the Road', meta: '10:00 · Sarit Expo Centre', joined: false },
{ day: '11', month: 'Sep', title: 'WOMEN IN STEM AFRICAN SUMMIT', meta: '08:30 · Radisson Blu', joined: true }];


export function DashboardScreen() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink-600/80 bg-ink-700 p-4">
        <p className="text-[10px] font-semibold text-accent">Tuesday · 25 August</p>
        <p className="mt-1 text-lg font-extrabold tracking-tight text-strong">Welcome back, Amara!</p>
        <p className="mt-1 text-[11px] text-fog-400">
          37 cards collected this month · 3 connection requests waiting
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {QUICK.map((item) =>
        <div
          key={item.label}
          className="flex items-center gap-2 rounded-xl border border-ink-600/80 bg-ink-700 p-2.5">
          
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-ink-500 bg-ink-600 text-fog-300">
              <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold text-strong">{item.label}</span>
              <span className="block truncate text-[10px] text-fog-500">{item.hint}</span>
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div>
          <p className="mb-2 text-[11px] font-bold text-strong">Your default card</p>
          <DigitalCard card={heroCard} size="sm" />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold text-strong">Upcoming events</p>
          <ul className="space-y-2">
            {EVENTS.map((event) =>
            <li
              key={event.title}
              className="flex items-center gap-3 rounded-xl border border-ink-600/80 bg-ink-700 p-2.5">
              
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ink-500 bg-ink-800 text-center leading-none">
                  <span className="block text-[8px] font-bold uppercase text-fog-500">{event.month}</span>
                  <span className="block text-xs font-bold text-strong">{event.day}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-strong">{event.title}</span>
                  <span className="block truncate text-[10px] text-fog-500">{event.meta}</span>
                </span>
                <span
                className={
                event.joined ?
                'shrink-0 rounded-md border border-ink-500 px-2 py-1 text-[10px] font-bold text-fog-300' :
                'shrink-0 rounded-md bg-gold px-2 py-1 text-[10px] font-bold text-onaccent'
                }>
                
                  {event.joined ? 'Joined' : 'Join'}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>);

}

const WALLET = [
{ name: 'Tunde Adeyemi', role: 'Head of Platform · Paysure', via: 'QR scan · today', seed: 12 },
{ name: 'Leila Mwangi', role: 'Product Designer · Dispatchr', via: 'Event · yesterday', seed: 33 },
{ name: 'Kwame Osei', role: 'CTO · Verdant Labs', via: 'Card scan · 2 days ago', seed: 54 },
{ name: 'Fatima Zahra', role: 'Investment Associate · Baobab Capital', via: 'Link · 4 days ago', seed: 88 }];


export function WalletScreen() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-ink-600/80 bg-ink-700 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fog-500">Total cards</p>
          <p className="text-xl font-extrabold text-strong">148</p>
        </div>
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fog-500"
            aria-hidden="true" />
          
          <div className="flex h-10 items-center rounded-xl border border-ink-600 bg-ink-800 pl-9 text-[11px] text-fog-500">
            Search by name, company, or title...
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {WALLET.map((person) =>
        <li
          key={person.name}
          className="flex items-center gap-3 rounded-xl border border-ink-600/80 bg-ink-700 p-3">
          
            <GeometricAvatar seed={person.seed} name={person.name} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-bold text-strong">{person.name}</span>
              <span className="block truncate text-[10px] text-fog-400">{person.role}</span>
            </span>
            <span className="hidden shrink-0 text-[10px] text-fog-500 sm:block">{person.via}</span>
            <span className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">
              Scan to share
            </span>
          </li>
        )}
      </ul>
    </div>);

}

const FILTERS = ['All', 'Relationships', 'Suggestions', 'Follow-ups', 'Common', 'Interests', 'Tips'];

export function AiMatchScreen() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter, index) =>
        <span
          key={filter}
          className={
          index === 0 ?
          'rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent' :
          'rounded-full border border-ink-500 bg-ink-700/60 px-2.5 py-1 text-[10px] font-semibold text-fog-400'
          }>
          
            {filter}
          </span>
        )}
        <span className="ml-auto rounded-lg bg-gold px-2.5 py-1.5 text-[10px] font-bold text-onaccent">
          Generate Insights
        </span>
      </div>

      <div className="rounded-2xl border border-ink-600/80 bg-ink-700 p-4">
        <div className="flex items-start gap-3">
          <GeometricAvatar seed={54} name="Kwame Osei" size={38} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-strong">Your connection with Kwame is cooling</p>
            <p className="mt-1 text-[10px] leading-relaxed text-fog-400">
              No exchange in 34 days after three quick replies. A short check-in keeps the Verdant Labs
              audit conversation alive.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[10px] font-bold text-gold">34/100</span>
              <span className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-500">
                <span className="block h-full w-[34%] rounded-full bg-gold" />
              </span>
              <span className="rounded-full border border-ink-500 px-2 py-0.5 text-[10px] font-semibold text-fog-300">
                4 mutual
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg bg-accent px-2.5 py-1.5 text-[10px] font-bold text-onaccent">
                Send Message
              </span>
              <span className="rounded-lg border border-ink-500 px-2.5 py-1.5 text-[10px] font-semibold text-fog-200">
                Snooze
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {[
        { name: 'Fatima Zahra', role: 'Baobab Capital', score: 92, action: 'Connect', seed: 88 },
        { name: 'Samuel Kiptoo', role: 'Safaricom', score: 78, action: 'Connect', seed: 77 }].
        map((match) =>
        <div
          key={match.name}
          className="flex items-center gap-3 rounded-xl border border-ink-600/80 bg-ink-700 p-3">
          
            <GeometricAvatar seed={match.seed} name={match.name} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-bold text-strong">{match.name}</span>
              <span className="block truncate text-[10px] text-fog-400">{match.role}</span>
            </span>
            <span className="shrink-0 text-[11px] font-extrabold text-accent">{match.score}</span>
            <span className="shrink-0 rounded-md border border-ink-500 px-2 py-1 text-[10px] font-semibold text-fog-200">
              {match.action}
            </span>
          </div>
        )}
      </div>
    </div>);

}

export function ScanScreen() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
      <div className="relative overflow-hidden rounded-2xl border border-ink-600/80 bg-ink-950">
        <div className="flex h-full min-h-[260px] items-center justify-center p-6">
          <div className="relative h-44 w-44">
            {[
            'left-0 top-0 border-l-2 border-t-2 rounded-tl-lg',
            'right-0 top-0 border-r-2 border-t-2 rounded-tr-lg',
            'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg',
            'right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg'].
            map((position) =>
            <span
              key={position}
              className={`absolute h-8 w-8 border-accent ${position}`}
              aria-hidden="true" />

            )}
            <span className="absolute left-2 right-2 top-1/2 h-px bg-accent/70" aria-hidden="true" />
            <span className="absolute inset-6 grid place-items-center rounded-lg border border-dashed border-ink-500 text-[10px] text-fog-500">
              Align the QR code
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-ink-600/70 bg-ink-900 px-4 py-3">
          <p className="text-[10px] text-fog-400">Camera · rear</p>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-500 px-2.5 py-1.5 text-[10px] font-semibold text-fog-200">
            <UploadIcon className="h-3 w-3" aria-hidden="true" />
            Upload QR Code
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-ink-600/80 bg-ink-700 p-3">
          <p className="mb-2 text-[11px] font-bold text-strong">My QR code</p>
          <span className="block h-[132px] w-[132px]">
            <QrCode seed={71} />
          </span>
          <p className="mt-2 text-[10px] text-fog-400">Barak Imani · nexas</p>
          <span className="mt-2 inline-block rounded-lg bg-accent px-2.5 py-1.5 text-[10px] font-bold text-onaccent">
            Share QR Code
          </span>
        </div>
        <div className="rounded-2xl border border-ink-600/80 bg-ink-700 p-3">
          <p className="text-[11px] font-bold text-strong">Last scan</p>
          <p className="mt-1 text-[10px] leading-relaxed text-fog-400">
            Tunde Adeyemi saved to your wallet, tagged “Solfest on the Road”.
          </p>
        </div>
      </div>
    </div>);

}