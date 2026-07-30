'use client';
import React, { useState, useEffect, useRef } from 'react';
import { userService } from '@/services/userService'; // ADJUST PATH if your alias differs
import { chatService } from '../../services/chatService';
import type { ChatThread, ChatMessage } from '../../services/chatService';

function formatTime(sentAt: string): string {
  return new Date(sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Simple polling every 5s while a thread is open — this is a REST-based chat,
// not WebSockets/real-time push. Messages appear within ~5s, not instantly.
// Swap this for STOMP/SockJS later if instant delivery becomes a requirement.
const POLL_INTERVAL_MS = 5000;

export default function MessagesSection() {
  const [role, setRole] = useState<'admin' | 'pastor' | 'member' | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    init();
  }, []);

  async function init() {
    setLoadingThreads(true);
    try {
      const me = await userService.getCurrentUser();
      const currentRole = me.role.toLowerCase() as 'admin' | 'pastor' | 'member';
      setRole(currentRole);

      const list =
        currentRole === 'admin' || currentRole === 'pastor'
          ? await chatService.getAllThreads()
          : await chatService.getMyThreads();

      setThreads(list);
      if (list.length > 0) {
        setSelectedThreadId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThreads(false);
    }
  }

  useEffect(() => {
    if (selectedThreadId == null) return;

    // eslint-disable-next-line react-hooks/immutability
    loadMessages(selectedThreadId);
    const interval = setInterval(() => loadMessages(selectedThreadId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages(threadId: number) {
    try {
      const data = await chatService.getMessages(threadId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend() {
    if (!messageInput.trim() || selectedThreadId == null) return;
    setSending(true);
    try {
      const sent = await chatService.sendMessage(selectedThreadId, messageInput.trim());
      setMessages((prev) => [...prev, sent]);
      setMessageInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  if (loadingThreads) {
    return (
      <div className="card p-8 text-center text-sm text-muted-foreground">
        Loading conversations…
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-base font-bold text-foreground mb-1">No conversations yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {role === 'admin' || role === 'pastor'
            ? 'A conversation opens automatically here once you approve a member\u2019s prayer request.'
            : 'Once one of your prayer requests is approved, a conversation with the church team will appear here.'}
        </p>
      </div>
    );
  }

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  return (
    <div className="card p-0 overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr] h-[600px]">
      {/* Thread list */}
      <div className="border-r border-border overflow-y-auto scrollbar-thin">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Messages</h2>
        </div>
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => setSelectedThreadId(thread.id)}
            className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
              thread.id === selectedThreadId ? 'bg-primary/5' : 'hover:bg-muted/30'
            }`}
          >
            <p className="text-xs font-semibold text-foreground truncate">
              {role === 'admin' || role === 'pastor'
                ? `${thread.member.firstName} ${thread.member.lastName}`
                : 'Church Team'}
            </p>
            {thread.prayerRequest && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                Re: {thread.prayerRequest.title}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(thread.createdAt)}</p>
          </button>
        ))}
      </div>

      {/* Message view */}
      <div className="flex flex-col">
        {selectedThread ? (
          <>
            <div className="px-5 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">
                {role === 'admin' || role === 'pastor'
                  ? `${selectedThread.member.firstName} ${selectedThread.member.lastName}`
                  : 'Church Team'}
              </p>
              {selectedThread.prayerRequest && (
                <p className="text-xs text-muted-foreground mt-0.5">Re: {selectedThread.prayerRequest.title}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
              {loadingMessages && messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">Loading messages…</p>
              )}
              {messages.length === 0 && !loadingMessages && (
                <p className="text-xs text-muted-foreground text-center">
                  No messages yet — say hello.
                </p>
              )}
              {messages.map((msg) => {
                const isMine = role === 'admin' || role === 'pastor'
                  ? msg.sender.role?.toLowerCase() !== 'member'
                  : msg.sender.role?.toLowerCase() === 'member';
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isMine ? 'bg-primary text-white' : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {msg.sender.firstName} · {formatTime(msg.sentAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-5 py-3 border-t border-border flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message…"
                className="input-field flex-1 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={sending || !messageInput.trim()}
                className="btn-primary text-sm"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}