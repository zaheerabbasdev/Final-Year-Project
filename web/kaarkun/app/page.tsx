'use client';

import React from 'react';
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
  ShieldCheck
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Plumbing Experts', desc: 'Leaky pipes, faucet installs, complete drain cleaning.', icon: Wrench, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  { name: 'Electrical Work', desc: 'Wiring repair, fan fitting, socket installs, panel work.', icon: Bolt, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  { name: 'Carpentry', desc: 'Furniture repair, door fitting, custom wood crafting.', icon: Hammer, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
  { name: 'Painting & Decor', desc: 'Wall painting, room touch-ups, commercial paint.', icon: Paintbrush, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
  { name: 'Deep Cleaning', desc: 'Home deep cleaning, sofa and rug washing.', icon: Trash2, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
  { name: 'Gardening & Lawn', desc: 'Lawn trimming, plant planting, weed control.', icon: Flower2, color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
  { name: 'AC Services', desc: 'AC installation, gas charging, filter wash.', icon: Wind, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' },
  { name: 'Appliance Repair', desc: 'Refrigerator, oven, washing machine troubleshooting.', icon: Tv, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' },
];

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 w-full overflow-x-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40 border-b border-zinc-100 dark:border-zinc-900">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 dark:opacity-10 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-72 h-72 bg-violet-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-8 border border-blue-100 dark:border-blue-900/30 shadow-sm transition-transform hover:scale-105">
            <ShieldCheck size={14} className="text-blue-500" />
            Pakistan's #1 Service Marketplace
          </span>
          
          <h1 className="text-5xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-6xl lg:text-7xl leading-tight max-w-4xl mx-auto">
            Find the right <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Professional</span> for any job, instantly.
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            From emergency plumbing to a full home renovation, connect with thousands of verified Kaarkuns. Post a job for free and hire the best bidder.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register?role=customer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-transparent text-base font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5">
              Hire a Professional
              <ArrowRight size={18} />
            </Link>
            <Link href="/register?role=provider" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-zinc-200 dark:border-zinc-800 text-base font-bold rounded-2xl text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all hover:-translate-y-0.5">
              Join as a Provider
            </Link>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No hidden fees</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> CNIC Verified profiles</div>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section id="services" className="py-24 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
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
                <div 
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
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Feature Blocks (How it Works) */}
      <section id="why-choose-us" className="py-24 border-t border-b border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Why Choose Kaarkun?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <UserCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Verified Specialists</h3>
              <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                All providers submit CNIC details and rigorous certifications, checked by administration to guarantee user safety and supreme quality.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Quick Turnaround</h3>
              <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Submit details and start receiving bids in minutes. Instantly chat, negotiate, and choose based on price and availability.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <Star size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Review Verified Work</h3>
              <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Check real client reviews and statistical scorecards to make educated hiring choices, ensuring a premium service experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer Section */}
      <footer className="bg-zinc-950 text-white py-16 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  K
                </div>
                <h1 className="font-extrabold text-2xl tracking-tight">
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
              <h4 className="font-bold text-lg mb-6">For Customers</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><Link href="/register?role=customer" className="hover:text-blue-400 transition-colors">Post a Job</Link></li>
                <li><Link href="/register?role=customer" className="hover:text-blue-400 transition-colors">How to Hire</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Customer Support</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Trust & Safety</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">For Providers</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><Link href="/register?role=provider" className="hover:text-blue-400 transition-colors">Join as a Professional</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Provider Guidelines</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Success Stories</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Provider Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
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
