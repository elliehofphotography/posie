import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Introduction',
    content: `Your privacy matters to us. This Privacy Policy explains how Posie collects, uses, and protects your information when you use our mobile application.\n\nBy using the app, you agree to this Privacy Policy.`,
  },
  {
    title: '2. Information We Collect',
    subsections: [
      {
        title: 'a. Information You Provide',
        content: `We may collect:\n• Photos you upload into the app\n• Notes, descriptions, and shot lists you create\n• Account information (such as email, if applicable)`,
      },
      {
        title: 'b. Payment Information',
        content: `All purchases of digital content within the app are processed through Apple In-App Purchases.\n\nWe do not have access to your full payment details (such as credit card numbers). Payment information is handled directly by Apple in accordance with their privacy policy.\n\nWe may receive limited information such as:\n• Purchase confirmation\n• Product purchased\n• Transaction status`,
      },
      {
        title: 'c. Automatically Collected Information',
        content: `We may collect:\n• Device type\n• App usage data\n• Crash logs and diagnostics`,
      },
    ],
  },
  {
    title: '3. How We Use Your Information',
    content: `We use your information to:\n• Provide and improve app functionality\n• Deliver purchased templates and features\n• Save and organize your shoot templates and photos\n• Enable optional sharing or community features\n• Improve performance and fix bugs`,
  },
  {
    title: '4. Offline Functionality',
    content: `The app is designed to work offline. Your photos, templates, and notes are stored locally on your device and remain accessible without an internet connection unless you choose to share or upload them.`,
  },
  {
    title: '5. Sharing Your Information',
    content: `We do not sell your personal data.\n\nWe may share information:\n• With Apple for processing in-app purchases\n• If you choose to share templates or content\n• With service providers (if used) to operate the app\n• If required by law`,
  },
  {
    title: '6. Data Storage and Security',
    content: `We take reasonable measures to protect your information, but no method of storage or transmission is 100% secure.\n\nYou are responsible for maintaining the security of your device.`,
  },
  {
    title: '7. Your Rights and Choices',
    content: `You can:\n• Delete your data within the app at any time\n• Uninstall the app to remove locally stored data\n• Choose whether to use sharing or community features`,
  },
  {
    title: '8. Third-Party Services',
    content: `We use Apple In-App Purchases to process payments for digital content. These services may collect and process data according to Apple's privacy policy.`,
  },
  {
    title: '9. Children\'s Privacy',
    content: `This app is not intended for children under 13. We do not knowingly collect data from children.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Changes will be posted with an updated effective date.`,
  },
  {
    title: '11. Contact Us',
    content: `If you have any questions about this Privacy Policy, contact us at:\nhelp.posie@gmail.com`,
  },
];

function renderContent(text) {
  return text.split('\n').map((line, i) => (
    <p key={i} className={`font-dm text-sm text-foreground leading-relaxed ${line.startsWith('•') ? 'ml-3' : ''}`}>
      {line}
    </p>
  ));
}

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-colors select-none"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-playfair text-lg font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Meta */}
        <div>
          <p className="font-dm text-xs text-muted-foreground">Effective Date: 18 March 2026</p>
          <p className="font-dm text-xs text-muted-foreground">App Name: Posie for Photographers</p>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="font-vina text-base text-primary tracking-wide">{section.title}</h2>
            {section.content && (
              <div className="space-y-1">{renderContent(section.content)}</div>
            )}
            {section.subsections && section.subsections.map((sub) => (
              <div key={sub.title} className="space-y-1 pl-1">
                <p className="font-dm text-sm font-semibold text-foreground">{sub.title}</p>
                <div className="space-y-1">{renderContent(sub.content)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}