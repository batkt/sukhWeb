"use client";

import React, { useState, useEffect, useRef, JSX } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useAuth } from "@/lib/useAuth";
import TuslamjTokhirgoo from "@/app/(shell)/tokhirgoo/TuslamjTokhirgoo";
import ResidentChatPanel from "@/components/ResidentChatPanel";
import { useTour } from "@/context/TourContext";
import {
  clampPos,
  LAUNCHER_SIZE,
  useChatLauncher,
  type LauncherPos,
} from "@/lib/useChatLauncher";

const BASE_API = "https://admin.zevtabs.mn/api/v1/chat";
const SOCKET_URL = "https://admin.zevtabs.mn";

interface MessageType {
  id: string;
  _id?: string;
  role: "user" | "bot" | "agent";
  text: string;
  createdAt?: string;
}

interface ChoiceType {
  label: string;
  answer?: string;
  choices?: ChoiceType[];
}

interface ChatConfigType {
  welcomeMessage?: string;
  startButtonLabel?: string;
  fallbackBotReply?: string;
  restartLabel?: string;
  rootChoices?: ChoiceType[];
}

interface ConversationType {
  id: string;
  _id?: string;
  guestId: string;
  project: string;
  humanMode?: boolean;
}

interface ChatWidgetProps {
  inline?: boolean;
}

export default function ChatWidget({ inline = false }: ChatWidgetProps): JSX.Element {
  const { baiguullaga, ajiltan } = useAuth();
  const { start, disable, enable, disabled } = useTour();
  const [isOpen, setIsOpen] = useState<boolean>(inline);
  // "chat" = систем хариуцсан ажилтан, "resident" = СӨХ ↔ оршин суугч,
  // "help" = ерөнхий тусламж
  const [activeTab, setActiveTab] = useState<"chat" | "resident" | "help">(
    "chat",
  );
  const [guestId, setGuestId] = useState<string>("");
  const [conversation, setConversation] = useState<ConversationType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lang, setLang] = useState<"mn" | "en">("mn");
  const [chatConfig, setChatConfig] = useState<ChatConfigType | null>(null);
  const [currentChoices, setCurrentChoices] = useState<ChoiceType[]>([]);
  const [operatorLoading, setOperatorLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const prevMsgCountRef = useRef<number>(0);

  // ── Хөвөгч товчны байрлал / нуулт ───────────────────────────────────────
  const { hydrated, hidden, pos, setHidden, setPos } = useChatLauncher();
  const [dragPos, setDragPos] = useState<LauncherPos | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [hoverBtn, setHoverBtn] = useState<boolean>(false);
  // Хүрэлтийн төхөөрөмж дээр hover гэж байхгүй тул "×"-ийг байнга харуулна.
  const [coarsePointer, setCoarsePointer] = useState<boolean>(false);
  // Чирсэн эсэхийг onPointerUp дээр шалгаж, чирсэн бол чатыг нээхгүй.
  const dragStateRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  const effectivePos: LauncherPos | null = dragPos ?? pos;

  useEffect(() => {
    const mq = window.matchMedia?.("(hover: none)");
    if (!mq) return;
    const apply = () => setCoarsePointer(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Resize сонсогч нэг л удаа бүртгэгдэхийн тулд байрлалыг ref-ээр уншина.
  const readPosRef = useRef<LauncherPos | null>(null);
  readPosRef.current = pos;

  // Цонхны хэмжээ өөрчлөгдвөл товч гадагшаа гарахаас сэргийлнэ.
  useEffect(() => {
    if (inline) return;
    const onResize = () => {
      const current = readPosRef.current;
      if (!current) return;
      const next = clampPos(current);
      if (next.x !== current.x || next.y !== current.y) setPos(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [inline, setPos]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      moved: false,
    };
    setDragPos({ x: rect.left, y: rect.top });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStateRef.current;
    if (!st) return;
    const next = clampPos({ x: e.clientX - st.dx, y: e.clientY - st.dy });
    // Богино хугацааны чичрэлтийг дарах босго — үүнгүй бол энгийн даралт
    // чирэлт болж, чат нээгдэхээ болино.
    if (!st.moved) {
      const start = dragPos;
      if (
        start &&
        Math.abs(next.x - start.x) < 4 &&
        Math.abs(next.y - start.y) < 4
      ) {
        return;
      }
      st.moved = true;
      setDragging(true);
    }
    setDragPos(next);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStateRef.current;
    dragStateRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* аль хэдийн суларсан */
    }
    if (st?.moved && dragPos) {
      setPos(dragPos);
    } else if (st) {
      setIsOpen(true);
    }
    setDragging(false);
    setDragPos(null);
  };

  const t = (key: string): string => {
    const translations: Record<"mn" | "en", Record<string, string>> = {
      mn: {
        help: "Ерөнхий тусламж",
        loading: "Чат холбогдож байна...",
        placeholder: "Мессеж бичих...",
        connectError: "Чат холбогдоход алдаа гарлаа: ",
        noConnection: "Чат холбогдоогүй байна. Түр хүлээнэ үү.",
        sendError: "Мессеж илгээхэд алдаа гарлаа",
        operator: "Оператор",
        bot: "Чатбот",
        guest: "Та"
      },
      en: {
        help: "Help & Support",
        loading: "Connecting chat...",
        placeholder: "Type a message...",
        connectError: "Connection failed: ",
        noConnection: "Chat not connected yet. Please wait.",
        sendError: "Failed to send message",
        operator: "Agent",
        bot: "Assistant",
        guest: "You"
      }
    };
    return translations[lang][key] || key;
  };

  useEffect(() => {
    let gid: string | null;
    if (ajiltan?._id) {
      gid = `employee_${ajiltan._id}`;
    } else {
      gid = localStorage.getItem("chat_guest_id");
      if (!gid) {
        gid = "guest_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("chat_guest_id", gid);
      }
    }
    setGuestId(gid || "");
    setConversation(null);
    setMessages([]);
  }, [ajiltan?._id]);

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) setLang(savedLang === "en" ? "en" : "mn");
  }, []);

  useEffect(() => {
    if (inline) {
      setIsOpen(true);
    }
  }, [inline]);

  useEffect(() => {
    if (messages.length === 0) return;
    const isNewMessage = messages.length > prevMsgCountRef.current;
    const behavior = prevMsgCountRef.current === 0 ? "auto" : (isNewMessage ? "smooth" : "auto");
    messagesEndRef.current?.scrollIntoView({ behavior });
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      prevMsgCountRef.current = 0;
    }
  }, [isOpen]);

  const fetchConfig = async (): Promise<void> => {
    try {
      const res = await axios.get(`${BASE_API}/config?project=sukh`);
      setChatConfig(res.data.data);
      setCurrentChoices(res.data.data.rootChoices || []);
    } catch (err) {
      console.error("Failed to fetch chat config", err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChoiceClick = async (choice: ChoiceType): Promise<void> => {
    const idevkhtei = await kharilstaaBelenBolgoyo();
    if (!idevkhtei) return;
    try {
      const text = choice.label;
      const res = await axios.post(`${BASE_API}/conversations/${idevkhtei.id}/messages`, {
        text,
        guestId,
        project: "sukh",
        baiguullagaName: baiguullaga?.ner,
        ajiltniiNer: ajiltan?.ner,
        displayName: ajiltan?.ner || "Зочин"
      });

      const { userMsg, botMsg } = res.data.data;
      setMessages(prev => {
        const next = [...prev];
        if (userMsg && !next.some(m => m.id === userMsg.id)) next.push(userMsg);
        if (botMsg && !next.some(m => m.id === botMsg.id)) next.push(botMsg);
        return next;
      });

      // Update choices level
      if (choice.choices && choice.choices.length > 0) {
        setCurrentChoices(choice.choices);
      } else {
        if (chatConfig) setCurrentChoices(chatConfig.rootChoices || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartClick = (): void => {
    if (chatConfig) {
      setCurrentChoices(chatConfig.rootChoices || []);
    }
  };

  const handleConnectOperator = async (): Promise<void> => {
    const idevkhtei = await kharilstaaBelenBolgoyo();
    if (!idevkhtei) return;
    try {
      setOperatorLoading(true);
      const res = await axios.post(`${BASE_API}/conversations/${idevkhtei.id}/operator`, {
        guestId
      });
      setConversation(res.data.data.conversation);
      if (res.data.data.botMsg) {
        setMessages(prev => {
          if (prev.some(m => m.id === res.data.data.botMsg.id)) return prev;
          return [...prev, res.data.data.botMsg];
        });
      }
    } catch (err) {
      console.error("Failed to connect operator", err);
    } finally {
      setOperatorLoading(false);
    }
  };

  /**
   * Системийн дэмжлэгийн харилцаа ҮҮСГЭНЭ.
   *
   * ЗӨВХӨН ажилтан үнэхээр мессеж илгээх (эсвэл оператор дуудах) үед л
   * дуудагдана. Өмнө нь виджет нээгдмэгц дуудагддаг байсан тул "Оршин суугч"
   * табыг нээхэд ч хоосон харилцаа үүсгээд, дэмжлэгийн талд хоосон чат
   * хуримтлуулдаг байв.
   */
  const initChat = async (): Promise<ConversationType | null> => {
    if (!guestId) return null;
    try {
      setLoading(true);
      try {
        const configRes = await axios.get(`${BASE_API}/config?project=sukh`);
        setChatConfig(configRes.data.data);
        setCurrentChoices(configRes.data.data.rootChoices || []);
      } catch (e) {
        console.error("Error fetching config on init:", e);
      }

      const res = await axios.post(`${BASE_API}/conversations`, {
        guestId,
        project: "sukh",
        baiguullagaName: baiguullaga?.ner,
        ajiltniiNer: ajiltan?.ner,
        displayName: ajiltan?.ner || "Зочин"
      });
      const shine: ConversationType = res.data.data;
      setConversation(shine);

      const msgRes = await axios.get(`${BASE_API}/conversations/${shine.id}/messages?guestId=${guestId}`);
      setMessages(msgRes.data.data);
      return shine;
    } catch (err) {
      console.error("Failed to init chat", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /** Харилцаа байхгүй бол энэ мөчид үүсгэнэ (lazy) */
  const kharilstaaBelenBolgoyo =
    async (): Promise<ConversationType | null> => {
      if (conversation) return conversation;
      return await initChat();
    };

  useEffect(() => {
    if (!conversation) return;

    const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = s;

    s.emit("join", { conversationId: conversation.id, guestId });

    s.on("message:new", (payload: { conversationId: string; message: MessageType }) => {
      if (payload?.conversationId === conversation.id && payload?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      }
    });

    return () => {
      s.emit("leave", { conversationId: conversation.id });
      s.disconnect();
    };
  }, [conversation]);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;
    // Харилцааг ЭНД үүсгэнэ - виджет нээгдэх төдийд биш
    const idevkhtei = await kharilstaaBelenBolgoyo();
    if (!idevkhtei) {
      alert(t("noConnection"));
      return;
    }

    try {
      const text = input.trim();
      setInput("");

      const res = await axios.post(`${BASE_API}/conversations/${idevkhtei.id}/messages`, {
        text,
        guestId,
        project: "sukh",
        baiguullagaName: baiguullaga?.ner,
        ajiltniiNer: ajiltan?.ner,
        displayName: ajiltan?.ner || "Зочин"
      });

      const { userMsg, botMsg } = res.data.data;

      setMessages(prev => {
        const next = [...prev];
        if (userMsg && !next.some(m => m.id === userMsg.id)) next.push(userMsg);
        if (botMsg && !next.some(m => m.id === botMsg.id)) next.push(botMsg);
        return next;
      });

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Хөвөгч товч — чирж зөөнө, hover үед гарах "×"-ээр нуугдана.
          `hydrated` болтол зурахгүй: localStorage дээрх нуултыг мэдэхээс өмнө
          зурвал нуусан товч агшин зуур анивчина. */}
      {!inline && hydrated && !hidden && (
        <div
          style={{
            position: "fixed",
            left: effectivePos ? `${effectivePos.x}px` : undefined,
            top: effectivePos ? `${effectivePos.y}px` : undefined,
            right: effectivePos ? undefined : "24px",
            bottom: effectivePos ? undefined : "24px",
            zIndex: 9999,
            display: isOpen ? "none" : "block",
            height: `${LAUNCHER_SIZE}px`,
            width: `${LAUNCHER_SIZE}px`,
            touchAction: "none"
          }}
          onMouseEnter={() => setHoverBtn(true)}
          onMouseLeave={() => setHoverBtn(false)}
        >
          <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="Чат нээх (чирж зөөж болно)"
            title="Чат — чирж зөөнө"
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: dragging ? "#34d399" : "#059669",
              color: "#ffffff",
              boxShadow: dragging
                ? "0 12px 32px rgba(5, 150, 105, 0.55)"
                : "0 8px 24px rgba(5, 150, 105, 0.4)",
              border: "none",
              cursor: dragging ? "grabbing" : "grab",
              transform: dragging ? "scale(1.08)" : "scale(1)",
              // Чирэх үед transform-ыг шилжүүлбэл товч хулганаас хоцорно.
              transition: dragging
                ? "background-color 0.2s ease"
                : "transform 0.2s ease, background-color 0.2s ease",
              outline: "none",
              touchAction: "none"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          {/* Устгах товч — профайл цэснээс буцааж асаана. */}
          {(hoverBtn || coarsePointer) && !dragging && (
            <button
              type="button"
              onClick={() => setHidden(true)}
              aria-label="Чат товчийг нуух"
              title="Нуух — профайл цэснээс буцааж гаргана"
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                height: "20px",
                width: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Chat Window with Glassmorphic Premium UI */}
      {(isOpen || inline) && (
        <div
          style={inline ? {
            display: "flex",
            height: "500px",
            width: "100%",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif"
          } : {
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            // Оршин суугчийн чат жагсаалт + мессеж агуулдаг тул илүү өргөн,
            // харин жижиг дэлгэц дээр хэтрэхгүйн тулд max-аар хязгаарлана.
            height: "min(640px, calc(100dvh - 48px))",
            width: activeTab === "resident" ? "460px" : "380px",
            maxWidth: "calc(100vw - 32px)",
            transition: "width 0.2s ease",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: "18px",
            backgroundColor: "#ffffff",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif"
          }}
        >
          {/* Header */}
          {!inline && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#059669",
                padding: "14px 18px",
                color: "#ffffff"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#52c41a", boxShadow: "0 0 8px #52c41a" }}></div>
                <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#ffffff" }}>{t("help")}</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => {
                    const nLang = lang === "mn" ? "en" : "mn";
                    setLang(nLang);
                    localStorage.setItem("language", nLang);
                  }}
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.25)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"}
                >
                  {lang === "mn" ? "EN" : "MN"}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    borderRadius: "50%",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Tab Selector inside bottom right widget */}
          {!inline && (
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                backgroundColor: "#f8fafc",
                padding: "6px 8px",
                gap: "4px"
              }}
            >
              <button
                onClick={() => setActiveTab("chat")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: activeTab === "chat" ? "#ffffff" : "transparent",
                  color: activeTab === "chat" ? "#059669" : "#64748b",
                  boxShadow: activeTab === "chat" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                💬 Систем
              </button>
              <button
                onClick={() => setActiveTab("resident")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor:
                    activeTab === "resident" ? "#ffffff" : "transparent",
                  color: activeTab === "resident" ? "#059669" : "#64748b",
                  boxShadow:
                    activeTab === "resident"
                      ? "0 2px 8px rgba(0,0,0,0.06)"
                      : "none",
                  transition: "all 0.2s ease",
                }}
              >
                🏢 Оршин суугч
              </button>
              <button
                onClick={() => setActiveTab("help")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: activeTab === "help" ? "#ffffff" : "transparent",
                  color: activeTab === "help" ? "#059669" : "#64748b",
                  boxShadow: activeTab === "help" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                📘 Тусламж
              </button>
            </div>
          )}

          {!inline && activeTab === "resident" ? (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <ResidentChatPanel />
            </div>
          ) : !inline && activeTab === "help" ? (
            <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#ffffff", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Header */}
              <div style={{ textAlign: "center", borderBottom: "1px solid rgba(0, 0, 0, 0.06)", paddingBottom: "16px", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 4px 0" }}>Тусламж</h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Системийн заавар болон тусламжийг эндээс аваарай</p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Replay button */}
                <button
                  type="button"
                  onClick={() => {
                    start();
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "16px",
                    backgroundColor: "#f0f7ff",
                    border: "1px solid #e0f2fe",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: "#3b82f6",
                    color: "#ffffff"
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Дахин үзүүлэх</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Хуудасны зааварчилгааг эхлүүлэх</div>
                  </div>
                </button>

                {/* Enable / Disable toggle button */}
                {disabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      enable();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "16px",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #d1fae5",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: "#10b981",
                      color: "#ffffff"
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Дахин идэвхжүүлэх</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Тусламжийн функцийг нээх</div>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      disable();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "16px",
                      backgroundColor: "#fff1f2",
                      border: "1px solid #ffe4e6",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: "#f43f5e",
                      color: "#ffffff"
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a13.19 13.19 0 0 1 2.18-3.18m5.64-5.64A10.06 10.06 0 0 1 12 4c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Дахиж харуулахгүй</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Зааварчилгааг нуух</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                {loading && (
                  <div style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", marginTop: "40px" }}>
                    {t("loading")}
                  </div>
                )}

                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "8px" }}>
                      {!isUser && (
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: m.role === "agent" ? "#e6f4ff" : "#f6ffed",
                            color: m.role === "agent" ? "#0958d9" : "#389e0d",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: "bold",
                            flexShrink: 0
                          }}
                        >
                          {m.role === "agent" ? "A" : "B"}
                        </div>
                      )}
                      <div
                        style={{
                          maxWidth: "70%",
                          borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                          padding: "10px 14px",
                          fontSize: "13px",
                          lineHeight: "1.4",
                          boxShadow: isUser ? "0 2px 8px rgba(5, 150, 105, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
                          backgroundColor: isUser ? "#059669" : "#ffffff",
                          color: isUser ? "#ffffff" : "#1e293b",
                          border: isUser ? "none" : "1px solid rgba(0,0,0,0.05)"
                        }}
                      >
                        <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</p>
                        {m.createdAt && (
                          <p
                            style={{
                              fontSize: "9px",
                              marginTop: "4px",
                              marginBottom: 0,
                              textAlign: "right",
                              opacity: 0.6,
                              color: isUser ? "#ffffff" : "#64748b"
                            }}
                          >
                            {new Date(m.createdAt).toLocaleTimeString(lang === "mn" ? "mn-MN" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Choices Area */}
              {!loading && conversation && !conversation.humanMode && (
                <div style={{ padding: "10px 14px", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(0,0,0,0.06)", flexShrink: 0, maxHeight: "150px", overflowY: "auto" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {currentChoices.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChoiceClick(c)}
                        style={{
                          fontSize: "11.5px",
                          padding: "5px 10px",
                          borderRadius: "12px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #059669",
                          color: "#059669",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          outline: "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#059669";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          e.currentTarget.style.color = "#059669";
                        }}
                      >
                        {c.label}
                      </button>
                    ))}

                    {/* Restart / Back to start button if not at root choices */}
                    {chatConfig && currentChoices !== chatConfig.rootChoices && (
                      <button
                        onClick={handleRestartClick}
                        style={{
                          fontSize: "11.5px",
                          padding: "5px 10px",
                          borderRadius: "12px",
                          backgroundColor: "#f1f5f9",
                          border: "1px solid #94a3b8",
                          color: "#475569",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          outline: "none"
                        }}
                      >
                        🔙 {chatConfig.restartLabel || "Эхлэл рүү буцах"}
                      </button>
                    )}

                    {/* Default Connect to Operator Button */}
                    <button
                      onClick={handleConnectOperator}
                      disabled={operatorLoading}
                      style={{
                        fontSize: "11.5px",
                        padding: "5px 10px",
                        borderRadius: "12px",
                        backgroundColor: "#f6ffed",
                        border: "1px solid #52c41a",
                        color: "#52c41a",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        outline: "none"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#52c41a";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f6ffed";
                        e.currentTarget.style.color = "#52c41a";
                      }}
                    >
                      💬 Оператортой холбох
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#ffffff",
                  borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={t("placeholder")}
                  style={{
                    flex: 1,
                    borderRadius: "20px",
                    border: "1px solid #cbd5e1",
                    padding: "8px 16px",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#059669"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#cbd5e1"}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  style={{
                    height: "36px",
                    width: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#059669",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.2s, opacity 0.2s",
                    opacity: input.trim() ? 1 : 0.5
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
