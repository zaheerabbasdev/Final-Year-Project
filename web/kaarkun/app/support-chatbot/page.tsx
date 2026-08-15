'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import {
  Send,
  Bot,
  User as UserIcon,
  ChevronLeft,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { FullPageSpinner } from '../components/ui';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function SupportChatbotPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Add initial welcome message
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: `${t('chatbot.welcome')} ${user.full_name}!`,
        timestamp: new Date()
      }
    ]);
  }, [user, authLoading, router]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessageText = inputText.trim();
    setInputText('');

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userMessageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Map current messages to format expected by backend history context
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const response = await api.post('/ai/support-chatbot', {
        message: userMessageText,
        history
      });

      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'bot',
        text: response.response || "I'm sorry, I couldn't process that response. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chatbot API error', err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to the support servers right now. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear chat history?')) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: `${t('chatbot.welcome')} ${user?.full_name}!`,
          timestamp: new Date()
        }
      ]);
    }
  };

  if (authLoading) {
    return (
      <FullPageSpinner />
    );
  }

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header Panel */}
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-t-2xl shadow-sm p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center text-sky-750 dark:text-sky-400">
            <Bot size={22} className="animate-bounce-slow" />
          </div>
          <div>
            <h1 className="font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight text-base flex items-center gap-1.5">
              {t('chatbot.title')}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-sky-100 text-sky-850 dark:bg-sky-950/50 dark:text-sky-400 rounded-full uppercase">
                <Sparkles size={8} className="fill-current" />
                AI
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400">{t('chatbot.onlineAgent')}</p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          title="Reset Conversation"
          className="p-2 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-grow bg-zinc-50/50 dark:bg-zinc-950/10 border-x border-zinc-200/60 dark:border-zinc-800/80 p-6 overflow-y-auto space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-[80%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${m.sender === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/50'
              }`}>
              {m.sender === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
            </div>

            <div className="space-y-1">
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.sender === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-55 border border-zinc-200/40 dark:border-zinc-800/80 rounded-tl-none'
                }`}>
                {m.text}
              </div>
              <span className={`text-[9px] text-zinc-400 block px-1 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <Bot size={14} className="text-sky-750 dark:text-sky-400" />
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <form
        onSubmit={handleSend}
        className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-b-2xl shadow-sm p-4 flex gap-3 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          placeholder={t('chatbot.placeholder')}
          className="flex-grow px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white disabled:text-zinc-400 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold transition-all shadow-sm shrink-0"
        >
          <Send size={16} />
          {t('chatbot.send')}
        </button>
      </form>
    </div>
  );
}
