import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getBotReply, SUPPORT, TOPICS, type HelpTopic } from "../lib/helpBotKnowledge";

export interface ChatMessage {
  id: number;
  from: "bot" | "user";
  text: string;
  link?: HelpTopic["link"];
  related?: { id: string; title: string }[]; // follow-up topics shown as chips
  offerHandoff?: boolean; // show the "talk to a representative" button
}

export interface TicketInput {
  topic: string;
  details: string;
  email: string;
}

type Phase = "chat" | "handoff" | "sending";

interface HelpBotContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: ChatMessage[];
  typing: boolean;
  phase: Phase;
  ticketRef: string | null;
  send: (text: string) => void;
  askTopic: (id: string) => void;
  startHandoff: () => void;
  cancelHandoff: () => void;
  submitTicket: (input: TicketInput) => Promise<void>;
  reset: () => void;
  // Lets a page move the floating button out of the way, or hide it when the chat is already on screen
  launcher: "normal" | "raised" | "hidden";
  setLauncher: (mode: "normal" | "raised" | "hidden") => void;
}

const HelpBotContext = createContext<HelpBotContextValue | null>(null);

const WELCOME: ChatMessage = {
  id: 0,
  from: "bot",
  text: "Hi! I'm the SaveCircle assistant. Ask me how to do something in the app. If it's something I can't sort out, I'll connect you with a customer representative.",
};

const TYPING_DELAY = 500;

export function HelpBotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState<Phase>("chat");
  const [ticketRef, setTicketRef] = useState<string | null>(null);
  const [launcher, setLauncher] = useState<"normal" | "raised" | "hidden">("normal");
  const nextId = useRef(1);
  const misses = useRef(0);

  const push = useCallback((msg: Omit<ChatMessage, "id">) => {
    setMessages((m) => [...m, { ...msg, id: nextId.current++ }]);
  }, []);

  const botSays = useCallback(
    (msg: Omit<ChatMessage, "id" | "from">) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        push({ from: "bot", ...msg });
      }, TYPING_DELAY);
    },
    [push],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      push({ from: "user", text });

      const reply = getBotReply(text);
      switch (reply.kind) {
        case "answer":
          misses.current = 0;
          botSays({
            text: reply.topic.answer,
            link: reply.topic.link,
            related: reply.related.map(({ id, title }) => ({ id, title })),
          });
          break;
        case "greeting":
          botSays({ text: "Hello! What can I help you with today?" });
          break;
        case "thanks":
          botSays({ text: "You're welcome. Anything else I can help with?" });
          break;
        case "escalate":
          misses.current = 0;
          botSays({
            text:
              reply.reason === "asked"
                ? "Sure. I'll pass you to a customer representative. Tell them what's going on and they'll get back to you."
                : "That sounds like something a person should look into, so I don't give you a wrong answer. A customer representative can check your account and fix it.",
            offerHandoff: true,
          });
          break;
        case "unknown":
          misses.current += 1;
          botSays({
            text:
              misses.current >= 2
                ? "I'm still not able to answer that one. A customer representative can help you properly."
                : reply.suggestions.length
                  ? "I'm not sure I understood. Did you mean one of these? You can also talk to a customer representative."
                  : "Sorry, I can only help with simple questions about using SaveCircle. Try rephrasing, or talk to a customer representative.",
            related: reply.suggestions.map(({ id, title }) => ({ id, title })),
            offerHandoff: true,
          });
          break;
      }
    },
    [push, botSays],
  );

  const askTopic = useCallback(
    (id: string) => {
      const topic = TOPICS.find((t) => t.id === id);
      if (!topic) return;
      misses.current = 0;
      push({ from: "user", text: topic.title });
      botSays({ text: topic.answer, link: topic.link });
    },
    [push, botSays],
  );

  const startHandoff = useCallback(() => setPhase("handoff"), []);
  const cancelHandoff = useCallback(() => setPhase("chat"), []);

  // TODO: POST /support/tickets { topic, details, email, transcript, page }
  const submitTicket = useCallback(
    async (input: TicketInput) => {
      setPhase("sending");
      await new Promise((r) => setTimeout(r, 900));
      const ref = `SC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setTicketRef(ref);
      setPhase("chat");
      push({ from: "user", text: `Request for a representative: ${input.topic}` });
      push({
        from: "bot",
        text: `Done. Your request ${ref} is with our customer team. A representative will reply to ${input.email} ${SUPPORT.replyTime} (${SUPPORT.hours}). You can also email ${SUPPORT.email} and quote ${ref}.`,
      });
    },
    [push],
  );

  const reset = useCallback(() => {
    misses.current = 0;
    setMessages([WELCOME]);
    setPhase("chat");
    setTicketRef(null);
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      messages,
      typing,
      phase,
      ticketRef,
      send,
      askTopic,
      startHandoff,
      cancelHandoff,
      submitTicket,
      reset,
      launcher,
      setLauncher,
    }),
    [open, messages, typing, phase, ticketRef, send, askTopic, startHandoff, cancelHandoff, submitTicket, reset, launcher],
  );

  return <HelpBotContext.Provider value={value}>{children}</HelpBotContext.Provider>;
}

export function useHelpBot() {
  const ctx = useContext(HelpBotContext);
  if (!ctx) throw new Error("useHelpBot must be used inside <HelpBotProvider>");
  return ctx;
}
