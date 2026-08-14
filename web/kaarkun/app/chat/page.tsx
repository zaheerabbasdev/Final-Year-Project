'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api, getFileUrl } from '../utils/api';
import {
  MessageSquare,
  Send,
  User as UserIcon,
  AlertCircle,
  Paperclip,
  X
} from 'lucide-react';

interface ChatItem {
  job_id: number;
  job_title: string;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  job_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}

function ChatContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialJobId = searchParams.get('jobId');
  const initialUserId = searchParams.get('userId');

  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [activeChat, setActiveChat] = useState<{jobId: number, userId: number} | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref mirrors selectedImage state so handleSendMessage always reads
  // the latest file even if React hasn't flushed the state update yet.
  const selectedImageRef = useRef<File | null>(null);

  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

  // Close lightbox on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    if (lightboxUrl) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxUrl, closeLightbox]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetchChatList();
    
    if (initialJobId && initialUserId) {
      setActiveChat({ 
        jobId: parseInt(initialJobId), 
        userId: parseInt(initialUserId) 
      });
    }
  }, [user, authLoading, router, initialJobId, initialUserId]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.jobId, activeChat.userId);
      // Mark as read
      api.put(`/messages/read/${activeChat.jobId}/${activeChat.userId}`).catch(console.error);

      // Simple polling for new messages every 5 seconds
      const interval = setInterval(() => {
        fetchMessages(activeChat.jobId, activeChat.userId, false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatList = async () => {
    try {
      const data = await api.get('/messages/list');
      setChatList(Array.isArray(data) ? data : data.chats || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load chat list.');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchMessages = async (jobId: number, otherUserId: number, showLoading = true) => {
    try {
      if (showLoading) setLoadingMessages(true);
      const data = await api.get(`/messages/${jobId}/${otherUserId}`);
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedImageRef.current = file;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const clearImage = () => {
    selectedImageRef.current = null;
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const imageToSend = selectedImageRef.current;
    if ((!newMessage.trim() && !imageToSend) || !activeChat || !user) return;

    setSending(true);
    setSendError(null);
    try {
      const formData = new FormData();
      formData.append('job_id', String(activeChat.jobId));
      formData.append('receiver_id', String(activeChat.userId));
      formData.append('content', newMessage);
      if (imageToSend) formData.append('image', imageToSend);

      await api.post('/messages/send', formData);
      setNewMessage('');
      clearImage();
      fetchMessages(activeChat.jobId, activeChat.userId, false);
      fetchChatList();
    } catch (err: any) {
      console.error(err);
      setSendError(err.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const activeChatDetails = chatList.find(c => c.job_id === activeChat?.jobId && c.other_user_id === activeChat?.userId);

  // Safe date formatter — returns empty string instead of "Invalid Date"
  const formatDate = (t: string | null | undefined) => {
    if (!t) return '';
    const d = new Date(t);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)] flex flex-col">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-grow flex bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm overflow-hidden min-h-[500px]">
        
        {/* Left Pane: Chat List */}
        <div className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400" />
              Messages
            </h2>
          </div>

          <div className="flex-grow overflow-y-auto">
            {loadingList ? (
              <div className="p-4 text-center text-zinc-500 text-sm">Loading chats...</div>
            ) : chatList.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">No active conversations.</div>
            ) : (
              chatList.map(chat => (
                <button
                  key={`${chat.job_id}-${chat.other_user_id}`}
                  onClick={() => setActiveChat({ jobId: chat.job_id, userId: chat.other_user_id })}
                  className={`w-full p-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left ${
                    activeChat?.jobId === chat.job_id && activeChat?.userId === chat.other_user_id 
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-l-2 border-l-indigo-500' 
                      : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {chat.other_user_avatar ? (
                      <img src={getFileUrl(chat.other_user_avatar)} alt={chat.other_user_name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={20} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">{chat.other_user_name}</h4>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {formatDate(chat.last_message_time)}
                      </span>
                    </div>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate mb-0.5">
                      {chat.job_title}
                    </p>
                    <p className={`text-xs truncate ${chat.unread_count > 0 ? 'font-semibold text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>
                      {chat.last_message}
                    </p>
                  </div>
                  {chat.unread_count > 0 && (
                    <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-2">
                      {chat.unread_count}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Chat History */}
        <div className={`flex-grow flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {!activeChat ? (
            <div className="flex-grow flex flex-col items-center justify-center text-zinc-500 p-6">
              <MessageSquare size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-3">
                <button 
                  className="md:hidden p-2 -ml-2 text-zinc-500"
                  onClick={() => setActiveChat(null)}
                >
                  &larr; Back
                </button>
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {activeChatDetails?.other_user_avatar ? (
                    <img src={getFileUrl(activeChatDetails.other_user_avatar)} alt={activeChatDetails?.other_user_name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={20} className="text-zinc-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                    {activeChatDetails?.other_user_name || 'Loading...'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {activeChatDetails?.job_title || `Job #${activeChat.jobId}`}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-zinc-50/30 dark:bg-zinc-950/20">
                {loadingMessages ? (
                  <div className="text-center text-zinc-500 text-sm mt-4">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm mt-10">No messages yet. Send a message to start the conversation!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isMine 
                            ? 'bg-indigo-600 text-white rounded-br-sm' 
                            : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          {msg.image_url && (
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(getFileUrl(msg.image_url!))}
                              className="mt-2 block rounded-lg overflow-hidden cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              title="Click to enlarge"
                            >
                              <img
                                src={getFileUrl(msg.image_url)}
                                alt="attachment"
                                className="max-h-48 object-cover hover:opacity-90 transition-opacity"
                              />
                            </button>
                          )}
                          <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-indigo-200' : 'text-zinc-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                {/* Image preview */}
                {imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="attachment preview"
                      className="h-24 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      disabled={sending}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center hover:bg-rose-600 disabled:opacity-50"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Send error — shown right above the input bar */}
                {sendError && (
                  <div className="mb-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{sendError}</span>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Attach button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="p-3 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 transition-colors shrink-0 disabled:opacity-50"
                    title="Attach image"
                  >
                    <Paperclip size={18} />
                  </button>

                  <div className="flex-grow">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={sending ? 'Sending...' : 'Type a message...'}
                      disabled={sending}
                      className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage) || sending}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-xl transition-colors shrink-0 disabled:opacity-60"
                  >
                    {sending
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send size={20} />
                    }
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>

          {/* Image — click on the image itself does NOT close (stops propagation) */}
          <img
            src={lightboxUrl}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-grow flex items-center justify-center">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
