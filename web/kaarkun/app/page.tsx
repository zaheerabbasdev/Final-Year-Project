'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Bolt,
  Paintbrush,
  Trash2,
  Flower2,
  Wind,
  Tv,
  Hammer,
  UserCheck,
  Clock,
  Star,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Brain,
  MessageSquare,
  TrendingUp,
  ShieldAlert,
  KeyRound,
  Zap,
  ClipboardList,
  Handshake,
  ThumbsUp,
  Users,
  Briefcase,
  MapPinned,
  ChevronDown,
  Quote,
  MapPin,
  DollarSign,
  BadgeCheck,
  MessageCircle
} from 'lucide-react';
import LandingNavbar from './components/LandingNavbar';

const CATEGORIES = [
  { name: 'Plumbing Experts', desc: 'Leaky pipes, faucet installs, complete drain cleaning.', icon: Wrench, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  { name: 'Electrical Work', desc: 'Wiring repair, fan fitting, socket installs, panel work.', icon: Bolt, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  { name: 'Carpentry', desc: 'Furniture repair, door fitting, custom wood crafting.', icon: Hammer, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
  { name: 'Painting & Decor', desc: 'Wall painting, room touch-ups, commercial paint.', icon: Paintbrush, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
  { name: 'Deep Cleaning', desc: 'Home deep cleaning, sofa and rug washing.', icon: Trash2, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
  { name: 'Gardening & Lawn', desc: 'Lawn trimming, plant planting, weed control.', icon: Flower2, color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
  { name: 'AC Services', desc: 'AC installation, gas charging, filter wash.', icon: Wind, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' },
  { name: 'Appliance Repair', desc: 'Refrigerator, oven, washing machine troubleshooting.', icon: Tv, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
];

const STATS = [
  { label: 'Verified Providers', value: '500+', icon: UserCheck, color: 'text-blue-500' },
  { label: 'Jobs Completed', value: '2,000+', icon: Briefcase, color: 'text-emerald-500' },
  { label: 'Cities Covered', value: '15+', icon: MapPinned, color: 'text-sky-500' },
  { label: 'Average Rating', value: '4.8★', icon: Star, color: 'text-amber-500' },
];

const STEPS = [
  { title: 'Post Your Job', desc: 'Describe what you need done, set a budget, and submit it in under a minute — completely free.', icon: ClipboardList },
  { title: 'Get Competitive Bids', desc: 'Verified providers near you respond with quotes. Our AI even suggests a fair price range.', icon: TrendingUp },
  { title: 'Chat & Hire', desc: 'Message bidders directly, compare ratings and past reviews, then hire the best fit.', icon: MessageSquare },
  { title: 'Confirm & Review', desc: 'Verify arrival with a secure PIN handshake, get the job done, then rate your experience.', icon: ThumbsUp },
];

const AI_FEATURES = [
  { title: 'Smart Job Matching', desc: 'AI ranks open jobs by your skills, location, and track record so providers see the best-fit work first.', icon: Brain, color: 'from-blue-500 to-sky-500' },
  { title: 'Instant Bid Pricing', desc: 'Get a data-driven suggested price range based on historical bids before you quote a job.', icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
  { title: '24/7 AI Assistant', desc: 'A built-in support chatbot answers platform questions and resolves disputes instantly, any time of day.', icon: Sparkles, color: 'from-emerald-500 to-teal-500' },
  { title: 'Fraud Detection', desc: 'Suspicious bidding patterns and listings are automatically flagged for admin review to keep the marketplace safe.', icon: ShieldAlert, color: 'from-rose-500 to-orange-500' },
];

const TESTIMONIALS = [
  { name: 'Ayesha K.', role: 'Homeowner, Lahore', quote: 'Posted a plumbing job at night and had three bids by morning. Hired someone within the hour — incredibly smooth.', rating: 5 },
  { name: 'Bilal R.', role: 'Electrician, Karachi', quote: 'The AI bid suggestions actually match what jobs end up paying. I stopped under-quoting my work after using it.', rating: 5 },
  { name: 'Sana M.', role: 'Customer, Islamabad', quote: 'The arrival PIN feature gave me real peace of mind — I knew exactly who was at my door before letting them in.', rating: 4.5 },
];

const FAQS = [
  { q: 'How are providers verified before they can bid?', a: 'Every provider submits their CNIC and profile details during signup. Our admin team manually reviews and approves each account before it can place bids or accept jobs.' },
  { q: 'Is posting a job really free?', a: 'Yes. Posting a job and receiving bids costs nothing. You only agree to a price once you choose and hire a provider.' },
  { q: 'What happens for emergency jobs?', a: 'Emergency jobs let verified providers instantly accept and book the job without going through the bidding process, so urgent issues get help faster.' },
  { q: 'How does the arrival PIN work?', a: 'Once you confirm a booking, the provider generates a one-time PIN. You enter it when they arrive to confirm their identity and officially start the job.' },
  { q: 'Can I message a provider before hiring them?', a: 'Yes, you can chat with any bidder directly from the job page to ask questions before deciding who to hire.' },
];

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-200/70 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-zinc-400 transition-transform duration-300 ${open ? 'rotate-180 text-blue-500' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} style={{ display: 'grid' }}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 w-full overflow-x-hidden">
      <LandingNavbar />

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 border-b border-zinc-100 dark:border-zinc-900">
        {/* Decorative background layer — dot grid + glows, never holds real content */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-grid-dots [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,white_60%,transparent_100%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 dark:opacity-10 animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-sky-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-8 border border-blue-100 dark:border-blue-900/30 shadow-sm transition-transform hover:scale-105">
                <ShieldCheck size={14} className="text-blue-500" />
                Pakistan's #1 Service Marketplace
              </span>

              <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl leading-tight">
                Find the right Professional for any job, instantly.
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                From emergency plumbing to a full home renovation, connect with thousands of verified Kaarkuns. Post a job for free and hire the best bidder — powered by AI matching.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link href="/register?role=customer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-transparent text-base font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5">
                  Hire a Professional
                  <ArrowRight size={18} />
                </Link>
                <Link href="/register?role=provider" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-zinc-200 dark:border-zinc-800 text-base font-bold rounded-2xl text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all hover:-translate-y-0.5">
                  Join as a Provider
                </Link>
              </div>

              {/* Avatar stack social proof */}
              <div className="mt-9 flex items-center justify-center lg:justify-start gap-3">
                <div className="flex -space-x-3">
                  {['bg-gradient-to-br from-blue-500 to-sky-500', 'bg-gradient-to-br from-emerald-500 to-teal-500', 'bg-gradient-to-br from-amber-500 to-orange-500', 'bg-gradient-to-br from-rose-500 to-pink-500'].map((g, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full ${g} border-2 border-white dark:border-zinc-950 flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                      {['A', 'B', 'S', 'R'][i]}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Joined by 500+ verified providers</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No hidden fees</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> CNIC Verified profiles</div>
              </div>
            </div>

            {/* Right: app mockup visual */}
            <div className="relative hidden lg:block">
              <div className="relative max-w-md mx-auto">
                {/* Main mock card */}
                <div className="relative rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 shadow-2xl shadow-blue-900/10 overflow-hidden">
                  <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-white/[0.02]">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-3 text-[11px] font-semibold text-zinc-400">kaarkun.app</span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Urgent: Kitchen pipe leak</h4>
                        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1"><MapPin size={11} /> DHA Phase 5, Lahore</p>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-full uppercase">
                        <Zap size={10} /> Emergency
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1"><DollarSign size={10} /> Budget</p>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">Rs. 2,500</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1"><Clock size={10} /> Posted</p>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">2 min ago</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white text-[10px] font-bold">F</div>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white text-[10px] font-bold">H</div>
                          <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-[10px] font-bold">+6</div>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium">bids received</span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                      </span>
                    </div>

                    <button className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm">
                      View Bids
                    </button>
                  </div>
                </div>

                {/* Floating chip: verified */}
                <div className="animate-float absolute -top-6 -left-8 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                    <BadgeCheck size={14} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">CNIC Verified</p>
                    <p className="text-[9px] text-zinc-400">Provider checked</p>
                  </div>
                </div>

                {/* Floating chip: rating */}
                <div className="animate-float animation-delay-2000 absolute top-1/3 -right-10 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">4.9 Rating</p>
                    <p className="text-[9px] text-zinc-400">312 reviews</p>
                  </div>
                </div>

                {/* Floating chip: message */}
                <div className="animate-float animation-delay-4000 absolute -bottom-8 left-6 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <MessageCircle size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">New bid: Rs. 2,200</p>
                    <p className="text-[9px] text-zinc-400">from Faisal R.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Stats Band */}
      <section className="relative -mt-px border-b border-zinc-100 dark:border-zinc-900 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Icon size={20} className="text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">{value}</p>
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-blue-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Simple Process</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              How Kaarkun Works
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              From posting a job to getting it done — four simple steps.
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-200 via-sky-200 to-blue-200 dark:from-blue-900 dark:via-sky-900 dark:to-blue-900" />
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 w-20 h-20 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-blue-100 dark:border-blue-900/50 flex items-center justify-center mb-5 shadow-sm">
                    <Icon size={26} className="text-blue-600 dark:text-blue-400" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-md">
                      {idx + 1}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Popular Categories */}
      <section id="services" className="py-24 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">What We Offer</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Explore Services
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Whatever you need done, we have a specialized expert ready to help.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  href="/register?role=customer"
                  key={idx}
                  className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className={`inline-flex p-4 rounded-2xl ${cat.color} mb-6 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={24} />
                    </span>
                    <h3 className="font-bold text-xl text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform duration-300">
                    Post a Job <ArrowRight size={16} className="ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. AI-Powered Features */}
      <section id="ai-features" className="relative py-24 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              <Sparkles size={13} /> Built-in Intelligence
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Powered by AI, end to end
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Kaarkun isn't just a listings board — AI works behind the scenes to make hiring faster and safer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AI_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group p-6 rounded-3xl bg-white dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.08] shadow-sm hover:shadow-xl dark:hover:bg-white/[0.07] hover:-translate-y-1 transition-all duration-300">
                  <span className={`inline-flex p-3.5 rounded-2xl bg-gradient-to-br ${f.color} mb-5 shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </span>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">{f.title}</h3>
                  <p className="mt-2.5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Emergency Services Banner */}
      <section className="py-16 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 to-orange-600 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-rose-600/20">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <Zap size={26} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white!">Got an emergency?</h3>
                <p className="text-rose-100 text-sm mt-1 max-w-md">
                  Skip the bidding queue — emergency jobs let nearby verified providers instantly accept and rush to help.
                </p>
              </div>
            </div>
            <Link
              href="/register?role=customer"
              className="relative shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 font-bold rounded-2xl shadow-lg hover:bg-rose-50 transition-all hover:-translate-y-0.5"
            >
              Post Emergency Job <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Why Choose Us */}
      <section id="why-choose-us" className="py-24 border-t border-b border-zinc-200/50 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Trust & Safety</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Why Choose Kaarkun?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <UserCheck size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Verified Specialists</h3>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Every provider submits CNIC details checked by our admin team before they can bid, guaranteeing user safety.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <Clock size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Quick Turnaround</h3>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Submit details and start receiving bids in minutes. Instantly chat, negotiate, and choose your provider.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <KeyRound size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Secure Arrival PIN</h3>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Confirm a provider's identity on arrival with a one-time PIN handshake before any work begins.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <Star size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Verified Reviews</h3>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Check real client reviews and rating scorecards to make educated, confident hiring choices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Real Feedback</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Loved by customers and providers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="relative p-7 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <Quote size={28} className="text-blue-200 dark:text-blue-900/60 mb-4" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{t.name}</p>
                    <p className="text-xs text-zinc-400">{t.role}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5 text-amber-500 shrink-0">
                    <Star size={13} fill="currentColor" />
                    <span className="text-xs font-bold">{t.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="py-24 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Got Questions?</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f, idx) => (
              <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={idx === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* 10. Final CTA */}
      <section className="py-20 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-10 sm:p-16 text-center shadow-2xl shadow-blue-600/20">
            <div className="absolute -top-10 -left-10 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <Handshake size={40} className="text-white/80 mx-auto mb-6 relative" />
            <h2 className="relative text-3xl sm:text-4xl font-black text-white! max-w-2xl mx-auto leading-tight">
              Ready to get your job done — or start earning?
            </h2>
            <p className="relative mt-4 text-blue-100 max-w-xl mx-auto">
              Join thousands of customers and verified professionals already using Kaarkun across Pakistan.
            </p>
            <div className="relative mt-9 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register?role=customer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl text-blue-700 bg-white hover:bg-blue-50 shadow-lg transition-all hover:-translate-y-0.5">
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link href="/register?role=provider" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl text-white border border-white/30 hover:bg-white/10 transition-all hover:-translate-y-0.5">
                <Users size={18} /> Become a Provider
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Footer Section */}
      <footer className="bg-zinc-950 text-white py-16 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  K
                </div>
                <h1 className="font-extrabold text-2xl tracking-tight text-white!">
                  Kaarkun
                </h1>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Bridging the gap between skilled local professionals and homeowners in need of reliable services.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-zinc-400 text-sm font-medium">
                <a href="#" className="hover:text-white transition-colors">Facebook</a>
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                <a href="#" className="hover:text-white transition-colors">Instagram</a>
                <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white!">For Customers</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><Link href="/register?role=customer" className="hover:text-blue-400 transition-colors">Post a Job</Link></li>
                <li><Link href="#how-it-works" className="hover:text-blue-400 transition-colors">How to Hire</Link></li>
                <li><Link href="/support-chatbot" className="hover:text-blue-400 transition-colors">Customer Support</Link></li>
                <li><Link href="#why-choose-us" className="hover:text-blue-400 transition-colors">Trust & Safety</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white!">For Providers</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><Link href="/register?role=provider" className="hover:text-blue-400 transition-colors">Join as a Professional</Link></li>
                <li><Link href="#how-it-works" className="hover:text-blue-400 transition-colors">Provider Guidelines</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Success Stories</Link></li>
                <li><Link href="/support-chatbot" className="hover:text-blue-400 transition-colors">Provider Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white!">Company</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link href="#faq" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

          </div>

          <div className="mt-16 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
            <p>© {new Date().getFullYear()} Kaarkun. All rights reserved.</p>
            <p>Designed with excellence for the local marketplace.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
