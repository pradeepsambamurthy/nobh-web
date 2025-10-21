// src/app/(protected)/messages/page.tsx
"use client";

import AppShell from "@/components/AppShell";
import Pusher from "pusher-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMe } from "@/hooks/useMe";

type ChatMsg = {
  id: string;
  text: string;
  at: string;   // ISO time
  from?: string;
};

export default function MessagesPage() {
  const { data: me } = useMe();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  // connect to Pusher on mount
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY!;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;
    const p = new Pusher(key, { cluster });

    const ch = p.subscribe("nobh-chat");
    const handler = (m: ChatMsg) => {
      setMsgs((prev) => [...prev, m]);
    };
    ch.bind("new-message", handler);

    return () => {
      ch.unbind("new-message", handler);
      p.unsubscribe("nobh-chat");
      p.disconnect();
    };
  }, []);

  const displayName = useMemo(() => {
    if (me && me.authenticated) {
      return me.name || me.email || "Me";
    }
    return "Me";
  }, [me]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    // optimistic
    const optimistic: ChatMsg = {
      id: "tmp-" + Date.now(),
      text,
      at: new Date().toISOString(),
      from: displayName,
    };
    setMsgs((prev) => [...prev, optimistic]);
    setInput("");

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      // revert optimistic on error (optional)
      setMsgs((prev) => prev.filter((m) => m.id !== optimistic.id));
      alert("Failed to send message.");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  return (
    <AppShell>
      <main className="p-6 h-[calc(100vh-48px)] flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Messenger</h1>

        <div className="flex-1 border rounded p-3 overflow-y-auto">
          {msgs.length === 0 && (
            <p className="text-sm text-muted-foreground">No messages yet. Say hi 👋</p>
          )}
          {msgs.map((m) => (
            <div key={m.id} className="mb-3">
              <div className="text-sm">
                <span className="font-semibold">{m.from || "Someone"}</span>
                <span className="text-gray-500 ml-2">
                  {new Date(m.at).toLocaleTimeString()}
                </span>
              </div>
              <div>{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            onClick={send}
            className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </main>
    </AppShell>
  );
}