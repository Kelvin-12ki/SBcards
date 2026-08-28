import React from 'react';
import {
  BellIcon,
  CheckIcon,
  CreditCardIcon,
  ScanLineIcon,
  UserPlusIcon,
  UsersIcon,
  SparklesIcon,
  CalendarIcon } from
'lucide-react';
import { DigitalCard, type CardData } from '../DigitalCard';
import { GeometricAvatar } from '../GeometricAvatar';
import { QrCode } from '../QrCode';
import { cn } from '../../utils/cn';
import {
  walkthroughYou as you,
  walkthroughThem as them } from
'../../data/site';
import { AppBar, Chip, Field, PrimaryButton, Rise, Tap, Toast } from './atoms';
import { easeOut, seg, typed } from './timeline';

const yourCard: CardData = {
  name: you.name,
  role: you.role,
  company: you.company,
  phone: you.phone,
  email: you.email,
  accent: 'cyan',
  seed: you.seed,
  isDefault: true
};

const theirCard: CardData = {
  name: them.name,
  role: them.role,
  company: them.company,
  phone: them.phone,
  email: them.email,
  accent: 'gold',
  seed: them.seed
};

interface SceneProps {p: number;}

/* ------------------------------------------------------------------ 1. Sign up */

export function SignupScene({ p }: SceneProps) {
  return (
    <div className="relative h-full px-5 pt-6">
      <Rise t={seg(p, 0, 0.08)}>
        <p className="text-lg font-bold text-strong">Create your account</p>
        <p className="mt-1 text-[11px] text-fog-400">
          One account, as many cards as you need.
        </p>
      </Rise>

      <div className="mt-6 space-y-3.5">
        <Rise t={seg(p, 0.04, 0.12)}>
          <Field
            label="Full Name"
            value={typed(you.name, p, 0.08, 0.24)}
            active={p > 0.08 && p < 0.24}
            valid={p >= 0.24} />

        </Rise>
        <Rise t={seg(p, 0.08, 0.16)}>
          <Field
            label="Email"
            value={typed(you.email, p, 0.26, 0.46)}
            active={p > 0.26 && p < 0.46}
            valid={p >= 0.46} />

        </Rise>
        <Rise t={seg(p, 0.12, 0.2)}>
          <Field
            label="Password"
            value={typed(you.password, p, 0.48, 0.62)}
            active={p > 0.48 && p < 0.62}
            masked
            valid={p >= 0.62} />

        </Rise>
        <Rise t={seg(p, 0.16, 0.24)}>
          <Field
            label="Confirm Password"
            value={typed(you.password, p, 0.63, 0.75)}
            active={p > 0.63 && p < 0.75}
            masked
            valid={p >= 0.75} />

        </Rise>
      </div>

      <div className="mt-6">
        <PrimaryButton press={p > 0.78 && p < 0.86} loading={p > 0.8 && p < 0.9}>
          Create Account
        </PrimaryButton>
      </div>

      <Tap t={seg(p, 0.76, 0.88)} x="50%" y={468} />
      <Toast t={seg(p, 0.88, 1)}>Account created — welcome to NEXAS.</Toast>
    </div>);

}

/* ------------------------------------------------------------------ 2. Sign in */

export function LoginScene({ p }: SceneProps) {
  const showHome = p > 0.66;
  return (
    <div className="relative h-full">
      {!showHome ?
      <div className="h-full px-5 pt-10">
          <Rise t={seg(p, 0, 0.08)}>
            <p className="text-lg font-bold text-strong">Welcome back</p>
            <p className="mt-1 text-[11px] text-fog-400">Sign in to your wallet.</p>
          </Rise>
          <div className="mt-8 space-y-3.5">
            <Field
            label="Email"
            value={typed(you.email, p, 0.05, 0.25)}
            active={p > 0.05 && p < 0.25}
            valid={p >= 0.25} />

            <Field
            label="Password"
            value={typed(you.password, p, 0.27, 0.45)}
            active={p > 0.27 && p < 0.45}
            masked
            valid={p >= 0.45} />

          </div>
          <div className="mt-6">
            <PrimaryButton press={p > 0.5 && p < 0.58} loading={p > 0.52 && p < 0.64}>
              Sign In
            </PrimaryButton>
          </div>
          <Tap t={seg(p, 0.48, 0.6)} x="50%" y={330} />
        </div> :

      <HomeScreen t={seg(p, 0.66, 1)} />}
    </div>);

}

/** Landing screen after sign-in. */
function HomeScreen({ t }: {t: number;}) {
  const actions = [
  { icon: CreditCardIcon, label: 'My Cards' },
  { icon: ScanLineIcon, label: 'Scan' },
  { icon: UsersIcon, label: 'Connections' },
  { icon: SparklesIcon, label: 'AI Match' }];

  return (
    <div className="h-full px-5 pt-4">
      <Rise t={seg(t, 0, 0.3)}>
        <div className="flex items-center gap-3">
          <GeometricAvatar seed={you.seed} name={you.name} size={34} />
          <div className="min-w-0">
            <p className="text-[11px] text-fog-400">Good morning</p>
            <p className="truncate text-[13px] font-bold text-strong">{you.name}</p>
          </div>
          <span className="relative ml-auto grid h-8 w-8 place-items-center rounded-lg border border-ink-500 bg-ink-800 text-fog-400">
            <BellIcon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </Rise>

      <Rise t={seg(t, 0.2, 0.55)} className="mt-5">
        <div className="rounded-xl border border-dashed border-ink-500 bg-ink-850/60 p-4 text-center">
          <CreditCardIcon className="mx-auto h-5 w-5 text-fog-500" aria-hidden="true" />
          <p className="mt-2 text-[11px] font-semibold text-fog-200">
            You don’t have a card yet
          </p>
          <p className="mt-0.5 text-[10px] text-fog-400">Create one to start sharing.</p>
        </div>
      </Rise>

      <Rise t={seg(t, 0.4, 0.8)} className="mt-5">
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action) =>
          <span
            key={action.label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-ink-600 bg-ink-850 py-2.5">

              <action.icon className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-[8px] font-semibold text-fog-300">{action.label}</span>
            </span>
          )}
        </div>
      </Rise>
    </div>);

}

/* ------------------------------------------------------------- 3. Build a card */

const SKILLS = ['Threat modelling', 'AppSec', 'Zero trust'];
const ACCENTS: Array<{id: CardData['accent'];hex: string;}> = [
{ id: 'cyan', hex: '#00E5FF' },
{ id: 'gold', hex: '#EAB308' },
{ id: 'violet', hex: '#A78BFA' },
{ id: 'mint', hex: '#34D399' }];


export function CreateCardScene({ p }: SceneProps) {
  // The preview fills in from the same windows that drive the form fields.
  const preview: CardData = {
    ...yourCard,
    name: typed(you.name, p, 0.04, 0.16) || ' ',
    role: typed(you.role, p, 0.42, 0.52),
    company: typed(you.company, p, 0.31, 0.41),
    email: typed(you.email, p, 0.53, 0.63),
    phone: '',
    accent: p > 0.82 ? 'cyan' : p > 0.78 ? 'violet' : 'cyan'
  };

  return (
    <div className="relative h-full overflow-hidden px-5 pt-2">
      <AppBar title="Create card" />

      <Rise t={seg(p, 0, 0.06)}>
        <div style={{ transform: 'scale(0.92)', transformOrigin: 'top center' }}>
          <DigitalCard card={preview} size="sm" />
        </div>
      </Rise>

      <div className="mt-3 space-y-2.5">
        <Rise t={seg(p, 0.02, 0.1)}>
          <Field
            label="Full Name *"
            value={typed(you.name, p, 0.04, 0.16)}
            active={p > 0.04 && p < 0.16}
            valid={p >= 0.16} />

        </Rise>
        <Rise t={seg(p, 0.06, 0.14)}>
          <Field
            label="Headline"
            value={typed(you.headline, p, 0.17, 0.3)}
            active={p > 0.17 && p < 0.3}
            valid={p >= 0.3} />

        </Rise>
        <Rise t={seg(p, 0.1, 0.18)}>
          <Field
            label="Company"
            value={typed(you.company, p, 0.31, 0.41)}
            active={p > 0.31 && p < 0.41}
            valid={p >= 0.41} />

        </Rise>
        <Rise t={seg(p, 0.14, 0.22)}>
          <Field
            label="Role"
            value={typed(you.role, p, 0.42, 0.52)}
            active={p > 0.42 && p < 0.52}
            valid={p >= 0.52} />

        </Rise>
      </div>

      {/* skills land one at a time */}
      <div className="mt-3">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-fog-400">
          Skills
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.map((skill, index) => {
            const t = seg(p, 0.64 + index * 0.04, 0.7 + index * 0.04);
            return (
              <span
                key={skill}
                style={{
                  opacity: easeOut(t),
                  transform: `scale(${0.7 + easeOut(t) * 0.3})`
                }}>

                <Chip tone="accent">{skill}</Chip>
              </span>);

          })}
        </div>
      </div>

      {/* accent picker */}
      <div className="mt-3.5">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-fog-400">
          Accent
        </p>
        <div className="flex gap-2">
          {ACCENTS.map((accent) =>
          <span
            key={accent.id}
            className={cn(
              'h-6 w-6 rounded-full border-2 transition-all',
              preview.accent === accent.id && p > 0.78 ?
              'scale-110 border-white' :
              'border-transparent'
            )}
            style={{ background: accent.hex }} />

          )}
        </div>
      </div>

      <div className="mt-4">
        <PrimaryButton press={p > 0.88 && p < 0.94} loading={p > 0.89 && p < 0.95}>
          Save card
        </PrimaryButton>
      </div>

      <Tap t={seg(p, 0.76, 0.86)} x={38} y={454} />
      <Tap t={seg(p, 0.86, 0.96)} x="50%" y={520} />
      <Toast t={seg(p, 0.95, 1)}>Card saved and set as your default.</Toast>
    </div>);

}

/* ------------------------------------------------------------- 4. Show your QR */

export function ShareScene({ p }: SceneProps) {
  const breathe = 1 + Math.sin(p * Math.PI * 4) * 0.012;
  return (
    <div className="relative h-full px-5 pt-2">
      <AppBar title="Your QR code" />

      <Rise t={seg(p, 0, 0.18)}>
        <div style={{ transform: 'scale(0.92)', transformOrigin: 'top center' }}>
          <DigitalCard card={yourCard} size="sm" />
        </div>
      </Rise>

      <Rise t={seg(p, 0.12, 0.4)} className="mt-5">
        <div
          className="mx-auto w-[170px] rounded-2xl border border-ink-500 bg-white p-3"
          style={{ transform: `scale(${breathe})` }}>

          <QrCode seed={you.seed} label="" />
        </div>
      </Rise>

      <Rise t={seg(p, 0.35, 0.6)} className="mt-5 text-center">
        <p className="text-[12px] font-bold text-strong">Show this to connect</p>
        <p className="mt-1 px-4 text-[10px] leading-relaxed text-fog-400">
          Any phone camera opens your public card. They only need the app if they
          want a wallet of their own.
        </p>
      </Rise>

      <Rise t={seg(p, 0.55, 0.8)} className="mt-4">
        <div className="flex items-center justify-center gap-1.5">
          <Chip>nexas.app/amara</Chip>
        </div>
      </Rise>
    </div>);

}

/* ------------------------------------------------------- 5. Scan another member */

export function ScanScene({ p }: SceneProps) {
  const locked = p >= 0.45;
  const sweep = seg(p, 0.06, 0.45);
  const showCard = p > 0.5;

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 bg-ink-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            background:
            'radial-gradient(120% 80% at 50% 40%, rgba(0,229,255,0.10), transparent 70%)'
          }} />


        <div
          className={cn(
            'absolute left-1/2 top-[150px] h-[170px] w-[170px] -translate-x-1/2 rounded-2xl border-2 transition-colors duration-300',
            locked ? 'border-success' : 'border-accent/50'
          )}>

          {!locked &&
          <span
            aria-hidden="true"
            className="absolute inset-x-2 h-0.5 rounded-full bg-accent shadow-glow"
            style={{ top: `${8 + sweep * 150}px` }} />}


          {locked &&
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-success px-2 py-0.5 text-[9px] font-bold text-onaccent">
              Card found
            </span>}

        </div>

        <p className="absolute inset-x-0 top-[90px] text-center text-[11px] font-semibold text-fog-300">
          {locked ? 'NEXAS member' : 'Point at an NEXAS QR code'}
        </p>
      </div>

      {showCard &&
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-ink-500 bg-ink-900 px-4 pb-6 pt-4"
        style={{
          transform: `translateY(${(1 - easeOut(seg(p, 0.5, 0.68))) * 260}px)`
        }}>

          <span
          aria-hidden="true"
          className="mx-auto mb-3 block h-1 w-10 rounded-full bg-ink-500" />

          <DigitalCard card={theirCard} size="sm" />

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip>Met at Solfest 2026</Chip>
            <Chip tone="accent">3 mutual connections</Chip>
          </div>

          <div className="mt-3">
            <PrimaryButton press={p > 0.74 && p < 0.82}>
              <UserPlusIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Connect
            </PrimaryButton>
          </div>
        </div>}


      <Tap t={seg(p, 0.72, 0.84)} x="50%" y={506} />
      <Toast t={seg(p, 0.85, 1)}>Connection request sent to {them.name}.</Toast>
    </div>);

}

/* ------------------------------------------------------------- 6. Connected */

export function ConnectedScene({ p }: SceneProps) {
  return (
    <div className="relative h-full px-5 pt-2">
      <AppBar title="Connections" />

      <Rise t={seg(p, 0.02, 0.2)}>
        <div className="flex items-center gap-2.5 rounded-xl border border-success/40 bg-success/[0.08] px-3 py-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success text-onaccent">
            <CheckIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-[10px] font-semibold leading-snug text-fog-100">
            {them.name} accepted your request.
          </p>
        </div>
      </Rise>

      <Rise t={seg(p, 0.22, 0.45)} className="mt-4">
        <div className="rounded-xl border border-ink-600 bg-ink-850 p-3">
          <div className="flex items-center gap-3">
            <GeometricAvatar seed={them.seed} name={them.name} size={38} />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-strong">{them.name}</p>
              <p className="truncate text-[10px] text-gold">{them.role}</p>
              <p className="truncate text-[10px] text-fog-400">{them.company}</p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span style={{ opacity: easeOut(seg(p, 0.45, 0.55)) }}>
              <Chip>
                <CalendarIcon className="mr-1 inline h-2.5 w-2.5" aria-hidden="true" />
                Solfest 2026
              </Chip>
            </span>
            <span style={{ opacity: easeOut(seg(p, 0.5, 0.6)) }}>
              <Chip tone="accent">Payments</Chip>
            </span>
          </div>
        </div>
      </Rise>

      <Rise t={seg(p, 0.62, 0.85)} className="mt-4">
        <div className="rounded-xl border border-accent/30 bg-accent/[0.05] p-3">
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-accent">
              Suggested follow-up
            </p>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-fog-200">
            You both spoke on the payments track. Send a note in the next two days
            while the conversation is fresh.
          </p>
          <div className="mt-2.5 flex gap-2">
            <span className="rounded-lg bg-accent px-2.5 py-1 text-[9px] font-bold text-onaccent">
              Send message
            </span>
            <span className="rounded-lg border border-ink-500 px-2.5 py-1 text-[9px] font-semibold text-fog-300">
              Remind me
            </span>
          </div>
        </div>
      </Rise>

      <Rise t={seg(p, 0.8, 1)} className="mt-4">
        <p className="text-center text-[10px] text-fog-500">
          1 connection · 1 card · wallet is live
        </p>
      </Rise>
    </div>);

}

/* ------------------------------------------------------------------ registry */

export const sceneById: Record<string, React.ComponentType<SceneProps>> = {
  signup: SignupScene,
  login: LoginScene,
  card: CreateCardScene,
  share: ShareScene,
  scan: ScanScene,
  connected: ConnectedScene
};
