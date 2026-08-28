import React from 'react';
import { SiteHeader } from '../components/sections/SiteHeader';
import { SiteFooter } from '../components/sections/SiteFooter';
import { ScrollProgress } from '../components/motion/effects';

interface LegalBlock {
  heading?: string;
  headingId?: string;
  paragraphs: string[];
}

export type LegalDoc = 'privacy' | 'terms';

const COMPANY = 'NEXAS';
const EMAIL = 'hello@nexas.app';
const PHONE = '+254 11307113';
const SITE = 'nexas.app';
const EFFECTIVE = '27 August 2026';

const PRIVACY_BLOCKS: LegalBlock[] = [
  {
    heading: '1. Introduction',
    paragraphs: [
      `${COMPANY} ("we", "us", "our") operates the ${SITE} digital business card and smart networking platform. This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and the rights you have over it. By using the platform you agree to the practices described here.`,
    ],
  },
  {
    heading: '2. Data we collect',
    headingId: 'data-we-collect',
    paragraphs: [
      'Account and identity data: your name, email address, phone number, and login credentials used to create and access your account.',
      'Card and profile data: information you choose to put on your digital business cards, such as your job title, company, headline, bio, skills, interests, links, and any image or geometric avatar you use.',
      'Connection and networking data: records of cards you scan, connections you make, events you join, messages you send and receive, table assignments, check-ins, lead-qualification notes, and tags you apply to your connections.',
      'Usage and analytics data: how you interact with the platform, including pages visited, features used, device type, and approximate location where needed to provide venue or event features.',
      'Communication data: messages, follow-up reminders, notifications, and the metadata associated with them.',
    ],
  },
  {
    heading: '3. How we use your data',
    headingId: 'how-we-use',
    paragraphs: [
      'To provide and operate the platform: creating your account and cards, enabling QR scanning and sharing, powering connections, AI matching, messaging, and event features.',
      'To personalise and improve: matching you with relevant people and events, generating insights, relationship-strength scores and follow-up suggestions, and improving our algorithms and product.',
      'To communicate: sending notifications about matches, messages, events, and important service updates, and responding to your enquiries.',
      'To keep things safe: preventing fraud and abuse, securing your account, and complying with legal obligations.',
    ],
  },
  {
    heading: '4. Lawful basis (where applicable)',
    headingId: 'lawful-basis',
    paragraphs: [
      'Where data-protection law requires a lawful basis, we process personal data on the grounds of: (a) performance of a contract with you; (b) our legitimate interests in operating and improving the platform; (c) your consent where we ask for it and you can withdraw it at any time; and (d) compliance with legal obligations.',
    ],
  },
  {
    heading: '5. How we share data',
    headingId: 'how-we-share',
    paragraphs: [
      'We do not sell your personal data. We share it only with:',
      'Other users, to the extent you choose — for example, the public card page your QR code opens, and the connections and messages you send.',
      'Service providers who help run the platform (hosting, analytics, messaging, push notifications, email), who are bound by confidentiality and data-protection obligations.',
      'Authorities or third parties where required by law, legal process, or to protect rights, safety, or the security of the platform.',
      'A prospective buyer or partner in the event of a merger, acquisition, or sale of assets, with appropriate safeguards.',
    ],
  },
  {
    heading: '6. Data retention',
    headingId: 'retention',
    paragraphs: [
      `We keep your personal data only as long as needed for the purposes described in this policy or as required by law. If you close your account, we delete or anonymise your personal data unless we must keep it for legal, accounting, or security reasons.`,
    ],
  },
  {
    heading: '7. Your rights',
    headingId: 'your-rights',
    paragraphs: [
      'Depending on your location, you may have the right to access, correct, export, restrict, or delete your personal data, and to object to certain processing. You can manage much of this directly from your profile and wallet settings. For anything else, contact us and we will respond within applicable timeframes.',
    ],
  },
  {
    heading: '8. Security',
    headingId: 'security',
    paragraphs: [
      'We use appropriate technical and organisational measures to protect your data, including encryption in transit, access controls, and secure storage. No internet transmission or storage is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    heading: '9. Children',
    headingId: 'children',
    paragraphs: [
      'The platform is intended for adults aged 18 and over. We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us and we will delete it.',
    ],
  },
  {
    heading: '10. International transfers',
    headingId: 'transfers',
    paragraphs: [
      'Data may be processed outside your country of residence by our service providers. Where this happens, we apply appropriate safeguards to protect your data in line with this policy.',
    ],
  },
  {
    heading: '11. Changes to this policy',
    headingId: 'changes',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will notify you of material changes through the platform or by email. Continued use after changes take effect means you accept the updated policy.',
    ],
  },
  {
    heading: '12. Contact',
    headingId: 'contact',
    paragraphs: [
      `Questions, concerns, or requests can be sent to ${EMAIL} or ${PHONE}. Your privacy matters to us — ${COMPANY} is built in Nairobi and operates globally.`,
    ],
  },
];

const TERMS_BLOCKS: LegalBlock[] = [
  {
    heading: '1. Acceptance of terms',
    paragraphs: [
      `Welcome to ${COMPANY}. These Terms and Conditions ("Terms") govern your access to and use of the ${SITE} platform, including the website, mobile experience, and related services. By creating an account or using the platform you agree to be bound by these Terms.`,
    ],
  },
  {
    heading: '2. Your account',
    headingId: 'account',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.',
      'You must provide accurate information and keep it up to date. You must be at least 18 years old to use the platform.',
      'You agree not to share your credentials or allow others to use your account.',
    ],
  },
  {
    heading: '3. Acceptable use',
    headingId: 'acceptable-use',
    paragraphs: [
      'You agree not to misuse the platform, including by:',
      'Using it unlawfully or in a way that infringes others rights.',
      'Uploading false, misleading, defamatory, or infringing content.',
      'Harassing, stalking, or spamming other users.',
      'Attempting to gain unauthorised access, scraping data at scale, or interfering with the platform.',
      'Sharing content that is illegal or that you do not have the right to share.',
    ],
  },
  {
    heading: '4. Your content and cards',
    headingId: 'content',
    paragraphs: [
      'You retain ownership of the content you upload, including the details on your business cards. You grant us a limited licence to host, store, and display that content to provide the service and to the other users you share it with.',
      'You are responsible for ensuring your content is accurate and that you have the rights to it.',
    ],
  },
  {
    heading: '5. AI matching and features',
    headingId: 'ai-features',
    paragraphs: [
      `${COMPANY} provides AI-assisted features including matching, recommendations, insights, and table seating. These are provided "as is" to assist your networking. They are recommendations only and do not guarantee outcomes. You remain responsible for your decisions and interactions.`,
    ],
  },
  {
    heading: '6. Subscriptions and payments',
    headingId: 'payments',
    paragraphs: [
      'Some features are free; others require a paid subscription. Prices are shown before purchase. Where payment applies, you authorise us to charge the applicable fees, and payments are processed by secure third-party payment providers.',
      'Subscriptions renew until cancelled. You can cancel in your settings, and cancellation takes effect at the end of the current billing period, except where law requires earlier.',
    ],
  },
  {
    heading: '7. Intellectual property',
    headingId: 'ip',
    paragraphs: [
      `The ${COMPANY} platform, including its design, software, trademarks, and content, is owned by ${COMPANY} or its licensors. You may not copy, modify, distribute, or reverse-engineer it except as permitted by law.`,
    ],
  },
  {
    heading: '8. Third-party services',
    headingId: 'third-party',
    paragraphs: [
      'The platform may link to or integrate with third-party services (such as payment providers, calendar or event services). We are not responsible for those services and their own terms and policies apply.',
    ],
  },
  {
    heading: '9. Disclaimers and limitation of liability',
    headingId: 'limitation',
    paragraphs: [
      'The platform is provided "as is" and "as available" without warranties of any kind, express or implied, including fitness for a particular purpose. To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages, or for loss of data or profits, arising from your use of the platform.',
      'Our total liability to you is limited to the amount you paid us in the twelve months before the event giving rise to the claim, or a nominal amount where no payment was made.',
    ],
  },
  {
    heading: '10. Termination',
    headingId: 'termination',
    paragraphs: [
      'You may stop using the platform and close your account at any time. We may suspend or terminate your access if you breach these Terms or if we reasonably believe your use threatens the safety or integrity of the platform.',
    ],
  },
  {
    heading: '11. Governing law',
    headingId: 'governing-law',
    paragraphs: [
      `These Terms are governed by the laws of the Republic of Kenya, without regard to conflict-of-law rules. You agree to submit to the exclusive jurisdiction of the courts of Kenya for any disputes arising from these Terms. This does not limit your consumer rights under any mandatory law of your country of residence.`,
    ],
  },
  {
    heading: '12. Changes to these terms',
    headingId: 'changes',
    paragraphs: [
      'We may revise these Terms from time to time. We will notify you of material changes. Continued use of the platform after changes take effect means you accept the revised Terms.',
    ],
  },
  {
    heading: '13. Contact',
    headingId: 'contact',
    paragraphs: [
      `Questions about these Terms can be sent to ${EMAIL} or ${PHONE}.`,
    ],
  },
];

function Block({ prefix, block }: { prefix: string; block: LegalBlock }) {
  const id = block.headingId ? `${prefix}-${block.headingId}` : undefined;
  return (
    <section id={id} className="scroll-mt-24">
      {block.heading && <h2 className="mt-10 text-xl font-bold tracking-tight text-strong">{block.heading}</h2>}
      {block.paragraphs.map((para, index) => (
        <p key={index} className="mt-3 max-w-3xl text-[15px] leading-relaxed text-fog-300">
          {para}
        </p>
      ))}
    </section>
  );
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const isPrivacy = doc === 'privacy';
  const blocks = isPrivacy ? PRIVACY_BLOCKS : TERMS_BLOCKS;
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
  const prefix = isPrivacy ? 'privacy' : 'terms';

  return (
    <div className="min-h-screen w-full bg-ink-900">
      <ScrollProgress />
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-16 sm:px-8">
        <a href="#/" className="text-sm font-semibold text-accent hover:text-strong">
          ← Back to home
        </a>
        <header className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Legal</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-strong sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-3 text-sm text-fog-500">
            Effective: {EFFECTIVE} · {COMPANY} · {SITE}
          </p>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <nav aria-label="Contents" className="hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-fog-500">Contents</p>
            <ul className="mt-3 space-y-1.5">
              {blocks.filter((b) => b.headingId).map((block) => (
                <li key={block.headingId}>
                  <a href={`#${prefix}-${block.headingId}`} className="text-sm text-fog-300 transition-colors duration-150 hover:text-accent">
                    {block.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            {blocks.map((block, index) => (
              <Block key={index} prefix={prefix} block={block} />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
