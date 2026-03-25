import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, MessageCircle, BookOpen, Camera, Layers, Shuffle, ShoppingBag, Heart } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(v => !v)}
      className="w-full text-left border border-border rounded-2xl px-5 py-4 bg-card hover:bg-muted transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-dm text-sm font-medium text-foreground">{question}</p>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>
      {open && (
        <p className="font-dm text-sm text-muted-foreground mt-3 leading-relaxed">{answer}</p>
      )}
    </button>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex gap-4 p-4 bg-card border border-border rounded-2xl">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <p className="font-dm text-sm font-semibold text-foreground mb-0.5">{title}</p>
      <p className="font-dm text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

const FAQS = [
  {
    question: 'How do I create a new template?',
    answer: 'Tap the + button on the Home screen and select "New Template". Choose between a photo gallery (for inspiration images) or a shot list (for typed notes). Give it a name and you\'re ready to add photos.',
  },
  {
    question: 'How do I add photos to a template?',
    answer: 'Open a template and tap the + button inside it. You can upload a photo from your device, add details like pose category, lens suggestion, and lighting notes, then save it to the gallery.',
  },
  {
    question: 'What is Shoot Mode?',
    answer: 'Shoot Mode is a distraction-free view for your session. Swipe right to mark a shot as done, left to skip, or down to save for later. You can combine multiple galleries and a shot list into one session.',
  },
  {
    question: 'How do I use "Shoot Together"?',
    answer: 'On the Home screen tap "Select", choose two or more templates (at least one gallery), then tap "Shoot Together". This merges all selected galleries into a single Shoot Mode session.',
  },
  {
    question: 'What is the Discover feed?',
    answer: 'Discover is a community gallery where photographers share pose inspiration. You can browse, favorite posts, and save any image directly into one of your own galleries.',
  },
  {
    question: 'How do I share my photos to Discover?',
    answer: 'Go to the Discover tab and tap the + button. Upload your photo, add a title, category, and technical details, confirm you own the copyright, then submit.',
  },
  {
    question: 'What are Marketplace Guides?',
    answer: 'Guides are curated pose packs created by photographers. Free guides can be downloaded instantly. Premium guides require a one-time purchase. Downloaded guides appear on your Home screen.',
  },
  {
    question: 'How do I upgrade to Pro?',
    answer: 'Free accounts are limited to a set number of galleries. When you hit the limit a prompt will appear — tap "Upgrade" to choose a monthly or yearly Pro plan via Stripe. Pro unlocks unlimited galleries and photos.',
  },
  {
    question: 'Can I reorder photos inside a template?',
    answer: 'Yes! Open a template, tap the sort icon in the top bar, and choose your preferred order — by priority color, pose category, or random shuffle.',
  },
  {
    question: 'How do I delete a template or photo?',
    answer: 'On the Home screen tap "Select", choose templates, then tap Delete. Inside a template, long-press or tap the menu on a photo card to delete it individually.',
  },
];

const FEATURES = [
  { icon: Layers, title: 'Templates & Galleries', description: 'Organize shoot inspiration into named galleries with pose details, camera settings, and lighting notes.' },
  { icon: Camera, title: 'Shoot Mode', description: 'A focused session view — swipe through photos, mark shots done or skipped, and track progress in real time.' },
  { icon: Shuffle, title: 'Shoot Together', description: 'Combine multiple galleries and a shot list into one seamless shoot session.' },
  { icon: Heart, title: 'Discover', description: 'Browse community-shared poses, save favorites, and pull inspiration directly into your own galleries.' },
  { icon: ShoppingBag, title: 'Marketplace', description: 'Download free and premium pose guides curated by professional photographers.' },
  { icon: BookOpen, title: 'Shot Lists', description: 'Create typed shot lists alongside galleries and check items off during your shoot.' },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Help & Support" backTo="/Home" />

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-10">

        {/* Hero */}
        <div className="text-center">
          <h2 className="font-dm text-muted-foreground text-sm">Everything you need to know about Posie</h2>
        </div>

        {/* Features Overview */}
        <section>
          <h3 className="font-vina text-lg uppercase tracking-widest text-primary mb-4">Features</h3>
          <div className="space-y-3">
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h3 className="font-vina text-lg uppercase tracking-widest text-primary mb-4">FAQ</h3>
          <div className="space-y-2">
            {FAQS.map(faq => <FAQItem key={faq.question} {...faq} />)}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h3 className="font-vina text-lg uppercase tracking-widest text-primary mb-4">Contact Us</h3>
          <div className="space-y-3">
            <a
              href="mailto:help.posie@gmail.com"
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-dm text-sm font-semibold text-foreground">Email Support</p>
                <p className="font-dm text-xs text-muted-foreground">help.posie@gmail.com</p>
              </div>
            </a>
            <a
              href="https://instagram.com/posieapp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-dm text-sm font-semibold text-foreground">Instagram</p>
                <p className="font-dm text-xs text-muted-foreground">@posieapp</p>
              </div>
            </a>
          </div>
        </section>

        <p className="font-dm text-xs text-muted-foreground text-center pb-4">
          Posie © {new Date().getFullYear()} · Made for photographers, by photographers
        </p>
      </div>
    </div>
  );
}