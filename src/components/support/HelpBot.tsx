import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Headset,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { useHelpBot } from "../../contexts/HelpBotContext";
import { STARTER_TOPICS, SUPPORT, TOPICS } from "../../lib/helpBotKnowledge";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

const chipCls =
  "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-left text-xs font-semibold text-emerald-800 hover:bg-emerald-100";

const HANDOFF_TOPICS = [
  "Payments or money",
  "Withdrawals and payouts",
  "Sign in or account access",
  "Something isn't working",
  "Other",
];

function HandoffForm() {
  const { messages, phase, cancelHandoff, submitTicket } = useHelpBot();
  // Start the details with what the user already asked, so they don't repeat themselves
  const [details, setDetails] = useState(() =>
    messages
      .filter((m) => m.from === "user")
      .slice(-3)
      .map((m) => m.text)
      .join("\n"),
  );
  const [topic, setTopic] = useState(HANDOFF_TOPICS[0]);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const detailsOk = details.trim().length >= 10;
  const sending = phase === "sending";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emailOk && detailsOk) submitTicket({ topic, details: details.trim(), email });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <Headset className="size-5 text-emerald-700" aria-hidden="true" />
        <p className="text-sm font-bold">Talk to a customer representative</p>
      </div>
      <p className="text-xs text-slate-500">
        We'll send this conversation along so you don't have to repeat yourself.
        Replies usually come {SUPPORT.replyTime}.
      </p>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">
          What is it about?
        </span>
        <select
          className={`${inputCls} h-10`}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {HANDOFF_TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">
          What happened?
        </span>
        <textarea
          className={`${inputCls} min-h-24 py-2`}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Include amounts, dates and member names if it's about a payment."
        />
        {touched && !detailsOk && (
          <span className="mt-1 block text-xs text-red-600">
            Tell us a bit more (at least 10 characters).
          </span>
        )}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">
          Email for the reply
        </span>
        <input
          type="email"
          className={`${inputCls} h-10`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {touched && !emailOk && (
          <span className="mt-1 block text-xs text-red-600">
            Enter a valid email.
          </span>
        )}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cancelHandoff}
          disabled={sending}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold hover:border-slate-400"
        >
          Back to chat
        </button>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {sending && <Loader2 className="size-4 animate-spin" />} Send request
        </button>
      </div>
    </form>
  );
}

// The conversation itself. Used inside the floating panel and on the Settings page.
export function HelpChat({
  variant = "embedded",
  onNavigate,
}: {
  variant?: "floating" | "embedded";
  onNavigate?: () => void; // e.g. close the floating panel when an answer links to a page
}) {
  const { messages, typing, phase, send, askTopic, startHandoff, reset, setOpen } =
    useHelpBot();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const floating = variant === "floating";

  // Keep the newest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, phase]);

  useEffect(() => {
    if (floating) inputRef.current?.focus();
  }, [floating]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
    setText("");
  };

  const lastBotId = [...messages].reverse().find((m) => m.from === "bot")?.id;
  const showStarters = messages.length === 1;
  const handoff = phase !== "chat";

  return (
    <div
      className={`flex flex-col overflow-hidden bg-white ${
        floating ? "h-full" : "h-[34rem] rounded-2xl border border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-slate-200 bg-emerald-700 px-4 py-3 text-white">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">SaveCircle assistant</p>
          <p className="truncate text-xs text-white/85">
            Quick answers, or a person when you need one
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          aria-label="Start a new conversation"
          title="New conversation"
          className="rounded-lg p-2 text-white hover:bg-white/15"
        >
          <RotateCcw className="size-4" />
        </button>
        {floating && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close help"
            className="rounded-lg p-2 text-white hover:bg-white/15"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
        aria-live="polite"
      >
        {messages.map((m) =>
          m.from === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-emerald-700 px-3.5 py-2 text-sm text-white">
                {m.text}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <Bot className="size-4" aria-hidden="true" />
              </span>
              <div className="max-w-[85%] space-y-2">
                <p className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2 text-sm">
                  {m.text}
                </p>
                {m.link && (
                  <Link
                    to={m.link.to}
                    onClick={onNavigate}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {m.link.label} <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
                {m.id === lastBotId && !handoff && (
                  <>
                    {!!m.related?.length && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.related.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => askTopic(r.id)}
                            className={chipCls}
                          >
                            {r.title}
                          </button>
                        ))}
                      </div>
                    )}
                    {m.offerHandoff && (
                      <button
                        type="button"
                        onClick={startHandoff}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 text-sm font-bold text-white hover:bg-emerald-800"
                      >
                        <Headset className="size-4" aria-hidden="true" /> Talk to a
                        customer representative
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ),
        )}

        {showStarters && (
          <div className="flex flex-wrap gap-1.5 pl-9">
            {STARTER_TOPICS.map((id) => {
              const t = TOPICS.find((x) => x.id === id);
              return (
                t && (
                  <button
                    key={id}
                    type="button"
                    onClick={() => askTopic(id)}
                    className={chipCls}
                  >
                    {t.title}
                  </button>
                )
              );
            })}
          </div>
        )}

        {typing && (
          <div className="flex items-center gap-2 pl-9 text-xs text-slate-500">
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
            </span>
            Assistant is typing
          </div>
        )}

        {handoff && <HandoffForm />}
      </div>

      {!handoff && (
        <div className="border-t border-slate-200 bg-white p-3">
          <form onSubmit={submit} className="flex gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask a question"
              aria-label="Ask a question"
              maxLength={500}
              className={`${inputCls} h-11`}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Send"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
          <button
            type="button"
            onClick={startHandoff}
            className="mt-2 text-xs font-semibold text-slate-500 hover:text-emerald-700"
          >
            Need a person? Talk to a customer representative
          </button>
        </div>
      )}
    </div>
  );
}

// Floating button + panel, shown on every dashboard page.
export function HelpBotLauncher() {
  const { open, setOpen, launcher } = useHelpBot();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (launcher === "hidden") return null;
  const raised = launcher === "raised";

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Help assistant"
          className={`fixed inset-x-3 z-50 h-[min(36rem,calc(100dvh-8rem))] overflow-hidden rounded-2xl border border-slate-200 shadow-2xl sm:inset-x-auto sm:right-6 sm:w-96 ${
            raised ? "bottom-52 sm:bottom-40" : "bottom-24"
          }`}
        >
          <HelpChat variant="floating" onNavigate={() => setOpen(false)} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close help" : "Open help assistant"}
        aria-expanded={open}
        className={`fixed right-4 z-50 flex size-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition hover:scale-105 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 sm:right-6 ${
          raised ? "bottom-36 sm:bottom-24" : "bottom-5 sm:bottom-6"
        }`}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
