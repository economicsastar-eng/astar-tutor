import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  listConversations,
  getConversation,
  sendTutorMessage,
  getTutorUsage,
  type TutorMessage,
} from "@/lib/tutor.functions";
import { toast } from "sonner";
import { Plus, Send, Menu } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "Tutor — EconAStar" }] }),
  component: TutorPage,
});

type ConvSummary = { id: string; title: string; updated_at: string };

function TutorPage() {
  const listFn = useServerFn(listConversations);
  const getFn = useServerFn(getConversation);
  const sendFn = useServerFn(sendTutorMessage);
  const usageFn = useServerFn(getTutorUsage);

  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [plan, setPlan] = useState("free");
  const [used, setUsed] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshUsage = async () => {
    const u = await usageFn();
    setPlan(u.plan);
    setUsed(u.used);
  };

  const refreshList = async () => {
    const { conversations: c } = await listFn();
    setConversations(c as ConvSummary[]);
  };

  useEffect(() => {
    refreshUsage();
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const selectConversation = async (id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
    const { conversation } = await getFn({ data: { conversationId: id } });
    setMessages(conversation?.messages ?? []);
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setDrawerOpen(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic: TutorMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    try {
      const res = await sendFn({ data: { message: text, conversationId: activeId } });
      if (!res.ok) {
        toast.error(res.error);
        setMessages((m) => m.slice(0, -1));
        await refreshUsage();
        return;
      }
      setActiveId(res.conversationId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.response, timestamp: new Date().toISOString() },
      ]);
      await refreshList();
      await refreshUsage();
    } catch {
      toast.error("Tutor unavailable. Try again.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const isFree = plan === "free";
  const exhausted = isFree && used >= 5;

  const sidebar = (
    <div className="flex flex-col h-full bg-[#0f1c2e]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between gap-2">
        <h2 className="font-display font-bold text-white">Conversations</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={newChat}
          className="border-emerald/40 text-emerald bg-transparent hover:bg-emerald/10"
        >
          <Plus className="size-4 mr-1" /> New
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-xs text-slate-500 p-3 text-center">No conversations yet.</p>
        )}
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                active
                  ? "bg-emerald/15 border-l-2 border-emerald text-white pl-[10px]"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <p className="truncate font-medium">{c.title || "New conversation"}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {new Date(c.updated_at).toLocaleDateString()}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <AppLayout title="Your Economics Tutor">
      <div className="flex gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
        <aside className="hidden md:flex w-[280px] shrink-0 rounded-xl border border-white/5 overflow-hidden">
          {sidebar}
        </aside>

        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="w-[280px] h-full border-r border-white/10">{sidebar}</div>
            <button
              className="flex-1 bg-black/60 cursor-pointer"
              aria-label="Close"
              onClick={() => setDrawerOpen(false)}
            />
          </div>
        )}

        <section className="flex-1 flex flex-col rounded-xl bg-[#1a2744] border border-white/5 overflow-hidden min-w-0">
          <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-white/5">
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-slate-300 cursor-pointer p-2"
              aria-label="Open conversations"
            >
              <Menu className="size-5" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={newChat}
              className="border-emerald/40 text-emerald bg-transparent hover:bg-emerald/10"
            >
              <Plus className="size-4 mr-1" /> New
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !sending && (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-slate-400 max-w-md">
                  Ask any economics question to get started. I'm here to help you nail your A-Level.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                    m.role === "user"
                      ? "bg-emerald/10 text-white"
                      : "bg-[#0f1c2e] border border-white/5 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{m.content}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#0f1c2e] border border-white/5 rounded-xl px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/5 p-3 space-y-2">
            {exhausted ? (
              <div className="rounded-lg bg-gold/10 border border-gold/30 p-3 text-center space-y-2">
                <p className="text-sm text-gold">
                  You've used your free messages today. Upgrade for unlimited.
                </p>
                <Button asChild className="bg-gold text-[#0f1c2e] hover:bg-gold/90 font-semibold">
                  <Link to="/account">Upgrade</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask any economics question..."
                    className="min-h-[44px] max-h-40 bg-[#0f1c2e] border-white/10 text-white resize-none"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="bg-emerald hover:bg-emerald-hover text-white h-11 w-11 p-0 shrink-0"
                    aria-label="Send"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                {isFree && (
                  <p className="text-xs text-slate-400 text-center">
                    {Math.max(0, 5 - used)}/5 free messages today
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="size-2 rounded-full bg-emerald animate-bounce [animation-delay:-0.3s]" />
      <span className="size-2 rounded-full bg-emerald animate-bounce [animation-delay:-0.15s]" />
      <span className="size-2 rounded-full bg-emerald animate-bounce" />
    </span>
  );
}
