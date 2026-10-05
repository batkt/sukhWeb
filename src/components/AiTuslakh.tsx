"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Send, Sparkles, Square, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import { getApiUrl } from "@/lib/uilchilgee";
import { useBuilding } from "@/context/BuildingContext";

/**
 * AI туслах — системийн хэрэглээ, ерөнхий асуулт, байгууллагын өгөгдлийн
 * (ажилтны эрхийн хүрээнд, зөвхөн унших) асуултад хариулдаг хөвөгч цонх.
 * Backend `/aiTuslakh` нь хариуг text/plain хэлбэрээр stream хийнэ.
 */

type Unelgee = 1 | -1;
type Messej = {
  role: "user" | "assistant";
  content: string;
  /** Backend-ийн `X-Ai-Log-Id` — үнэлгээ илгээхэд хэрэглэнэ. */
  logId?: string;
  /** Хэрэглэгчийн үнэлгээ (👍 = 1, 👎 = -1). */
  unelgee?: Unelgee;
  /** Хариу алдаагаар тасарсан — үнэлгээ харуулахгүй. */
  aldaa?: boolean;
};

const NUUSAN_KEY = "aiTuslakhNuusan";
const TUUKH_KEY = "aiTuslakhTuukh";
const NUULT_EVENT = "ai-tuslakh-nuult";

const JISHEE_ASUULTUUD = [
  "Хамгийн их өртэй 10 айл хэн бэ?",
  "Өнөөдөр зогсоолоос хэдэн төгрөгийн орлого орсон бэ?",
  "Энэ сарын нэхэмжлэхийн хэд нь төлөгдөөгүй байна?",
  "Хөнгөлөлт яаж бүртгэх вэ?",
  "Ус тасрах тухай оршин суугчдад зар бичээд өгөөч",
];

function nuusanUnshikh(): boolean {
  try {
    return localStorage.getItem(NUUSAN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Хөвөгч товчийг нуух / гаргах — Topbar-ын цэснээс ч дуудна. */
export function useAiTuslakhNuult() {
  const [nuusan, setNuusanState] = useState(false);
  useEffect(() => {
    setNuusanState(nuusanUnshikh());
    const sonsogch = () => setNuusanState(nuusanUnshikh());
    window.addEventListener(NUULT_EVENT, sonsogch);
    return () => window.removeEventListener(NUULT_EVENT, sonsogch);
  }, []);
  const setNuusan = useCallback((v: boolean) => {
    try {
      if (v) localStorage.setItem(NUUSAN_KEY, "1");
      else localStorage.removeItem(NUUSAN_KEY);
    } catch {
      /* private горимд хадгалахгүй ч ажиллана */
    }
    setNuusanState(v);
    window.dispatchEvent(new Event(NUULT_EVENT));
  }, []);
  return { nuusan, setNuusan };
}

/** **тод**, 1. жагсаалт, - жагсаалт — HTML оруулахгүйгээр энгийн дүрслэл. */
function Tod({ text }: { text: string }) {
  const khesguud = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {khesguud.map((k, i) =>
        k.startsWith("**") && k.endsWith("**") ? (
          <strong key={i}>{k.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{k}</React.Fragment>
        ),
      )}
    </>
  );
}

function Khariu({ text }: { text: string }) {
  const murnuud = text.split("\n");
  const blokuud: React.ReactNode[] = [];
  let jagsaalt: { turul: "ol" | "ul"; mur: string[] } | null = null;
  const jagsaaltKhaakh = () => {
    if (!jagsaalt) return;
    const Tag = jagsaalt.turul;
    blokuud.push(
      <Tag key={blokuud.length} className={`ai-list ai-${Tag}`}>
        {jagsaalt.mur.map((m, i) => (
          <li key={i}>
            <Tod text={m} />
          </li>
        ))}
      </Tag>,
    );
    jagsaalt = null;
  };
  murnuud.forEach((mur) => {
    const ol = mur.match(/^\s*\d+[.)]\s+(.*)$/);
    const ul = mur.match(/^\s*[-•*]\s+(.*)$/);
    if (ol || ul) {
      const turul = ol ? "ol" : "ul";
      if (jagsaalt && jagsaalt.turul !== turul) jagsaaltKhaakh();
      if (!jagsaalt) jagsaalt = { turul, mur: [] };
      jagsaalt.mur.push((ol || ul)![1]);
      return;
    }
    jagsaaltKhaakh();
    const tseverkhen = mur.replace(/^#+\s*/, "");
    if (tseverkhen.trim()) {
      blokuud.push(
        <p key={blokuud.length} className={mur.startsWith("#") ? "font-semibold" : ""}>
          <Tod text={tseverkhen} />
        </p>,
      );
    }
  });
  jagsaaltKhaakh();
  return <div className="ai-khariu">{blokuud}</div>;
}

export default function AiTuslakh() {
  const { token } = useAuth();
  const pathname = usePathname();
  const { nuusan, setNuusan } = useAiTuslakhNuult();
  const { selectedBuildingId } = useBuilding();
  const [neelttei, setNeelttei] = useState(false);
  const [messejuud, setMessejuud] = useState<Messej[]>([]);
  const [oruulga, setOruulga] = useState("");
  const [khariulj, setKhariulj] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);
  // 👎 дарсны дараах «Юу буруу байсан бэ?» оруулга (мессежийн индекс)
  const [tailbarIndex, setTailbarIndex] = useState<number | null>(null);
  const [tailbar, setTailbar] = useState("");
  const zogsookhRef = useRef<AbortController | null>(null);
  const jagsaaltRef = useRef<HTMLDivElement>(null);
  const oruulgaRef = useRef<HTMLTextAreaElement>(null);

  // Хуудас шилжихэд яриа алдагдахгүйн тулд sessionStorage-д хадгална.
  useEffect(() => {
    try {
      const khadgalsan = sessionStorage.getItem(TUUKH_KEY);
      if (khadgalsan) setMessejuud(JSON.parse(khadgalsan));
    } catch {
      /* хоосон эхэлнэ */
    }
  }, []);
  useEffect(() => {
    if (khariulj) return;
    try {
      sessionStorage.setItem(TUUKH_KEY, JSON.stringify(messejuud.slice(-30)));
    } catch {
      /* хадгалахгүй ч ажиллана */
    }
  }, [messejuud, khariulj]);

  useEffect(() => {
    const el = jagsaaltRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messejuud, neelttei, aldaa]);

  useEffect(() => {
    if (!neelttei) return;
    const id = window.setTimeout(() => oruulgaRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNeelttei(false);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [neelttei]);

  useEffect(() => () => zogsookhRef.current?.abort(), []);

  const ilgeekh = useCallback(
    async (asuult?: string) => {
      const text = (asuult ?? oruulga).trim();
      if (!text || khariulj || !token) return;
      setAldaa(null);
      setOruulga("");
      const shine: Messej[] = [...messejuud, { role: "user", content: text }];
      setMessejuud([...shine, { role: "assistant", content: "" }]);
      setKhariulj(true);
      setTailbarIndex(null);

      const tasalgch = new AbortController();
      zogsookhRef.current = tasalgch;
      let khuleen = "";
      try {
        const khuudasniiNer =
          document.querySelector(".shell-title")?.textContent?.trim() || "";
        const resp = await fetch(`${getApiUrl().replace(/\/+$/, "")}/aiTuslakh`, {
          method: "POST",
          signal: tasalgch.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: shine.map(({ role, content }) => ({ role, content })),
            khuudas: pathname,
            khuudasniiNer,
            barilgiinId: selectedBuildingId || undefined,
          }),
        });
        const logId = resp.headers.get("X-Ai-Log-Id") || undefined;
        if (!resp.ok || !resp.body) {
          const data = await resp.json().catch(() => null);
          // Жинхэнэ шалтгааныг (жишээ "503 UNAVAILABLE: model overloaded") хамт харуулна.
          const undsen = data?.message || `AI туслах хариу өгч чадсангүй (${resp.status}).`;
          throw new Error(data?.aldaa ? `${undsen}\n${data.aldaa}` : undsen);
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          khuleen += decoder.decode(value, { stream: true });
          const odoo = khuleen;
          setMessejuud((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: odoo, logId };
            return next;
          });
        }
        if (!khuleen.trim()) throw new Error("AI туслах хариу өгсөнгүй. Дахин оролдоно уу.");
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // Зогсоосон — ирсэн хэсгийг нь үлдээнэ.
          if (!khuleen.trim()) setMessejuud((prev) => prev.slice(0, -1));
        } else {
          // Хоосон хариуг хасаж, асуултыг буцааж оруулгад тавина.
          if (khuleen.trim()) {
            // Хэсэгчлэн ирсэн хариуг үлдээх боловч үнэлгээ авахгүй.
            setMessejuud((prev) => {
              const next = [...prev];
              const suuld = next[next.length - 1];
              if (suuld?.role === "assistant") next[next.length - 1] = { ...suuld, aldaa: true };
              return next;
            });
          } else {
            setMessejuud((prev) => prev.slice(0, -2));
          }
          if (!khuleen.trim()) setOruulga(text);
          setAldaa(err?.message || "Алдаа гарлаа. Дахин оролдоно уу.");
        }
      } finally {
        setKhariulj(false);
        zogsookhRef.current = null;
      }
    },
    [oruulga, khariulj, token, messejuud, pathname, selectedBuildingId],
  );

  const unelgeeIlgeekh = useCallback(
    async (logId: string, unelgee: Unelgee | 0, tailbarText?: string) => {
      const resp = await fetch(`${getApiUrl().replace(/\/+$/, "")}/aiTuslakhUnelgee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          logId,
          unelgee,
          ...(tailbarText ? { tailbar: tailbarText } : {}),
        }),
      });
      if (!resp.ok) throw new Error(String(resp.status));
    },
    [token],
  );

  const unelgeeSoligh = useCallback(
    async (index: number, utga: Unelgee) => {
      const m = messejuud[index];
      if (!m?.logId) return;
      const umnukh = m.unelgee;
      const shine: Unelgee | 0 = umnukh === utga ? 0 : utga;
      const tavikh = (u: Unelgee | undefined) =>
        setMessejuud((prev) =>
          prev.map((x, j) => (j === index && x.logId === m.logId ? { ...x, unelgee: u } : x)),
        );
      tavikh(shine === 0 ? undefined : shine);
      if (shine === -1) {
        setTailbarIndex(index);
        setTailbar("");
      } else if (tailbarIndex === index) {
        setTailbarIndex(null);
      }
      try {
        await unelgeeIlgeekh(m.logId, shine);
      } catch {
        tavikh(umnukh);
        setTailbarIndex((t) => (t === index ? null : t));
        toast.error("Үнэлгээ илгээж чадсангүй.");
      }
    },
    [messejuud, tailbarIndex, unelgeeIlgeekh],
  );

  const tailbarIlgeekh = useCallback(async () => {
    const index = tailbarIndex;
    const text = tailbar.trim().slice(0, 500);
    setTailbarIndex(null);
    setTailbar("");
    if (index === null || !text) return;
    const m = messejuud[index];
    if (!m?.logId || m.unelgee !== -1) return;
    try {
      await unelgeeIlgeekh(m.logId, -1, text);
      toast.success("Баярлалаа!");
    } catch {
      toast.error("Тайлбар илгээж чадсангүй.");
    }
  }, [tailbarIndex, tailbar, messejuud, unelgeeIlgeekh]);

  if (!token) return null;

  return (
    <>
      {!neelttei && !nuusan && (
        <div className="ai-launcher-wrap">
          <button
            type="button"
            onClick={() => setNeelttei(true)}
            className="ai-launcher"
            aria-label="AI туслах нээх"
            title="AI туслах"
          >
            <Sparkles className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setNuusan(true)}
            className="ai-launcher-x"
            aria-label="AI туслах товч нуух"
            title="Нуух (хэрэглэгчийн цэснээс буцааж гаргана)"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {neelttei && (
        <div role="dialog" aria-label="AI туслах" className="ai-panel">
          <header className="ai-head">
            <span className="ai-head-icon">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold leading-tight">AI туслах</h2>
              <p className="text-[12px] leading-tight text-[color:var(--muted-text)]">
                Систем, өгөгдөл, ерөнхий асуулт — юу ч асуугаарай
              </p>
            </div>
            {messejuud.length > 0 && !khariulj && (
              <button
                type="button"
                onClick={() => {
                  setMessejuud([]);
                  setAldaa(null);
                  setTailbarIndex(null);
                }}
                className="ai-icon-btn"
                aria-label="Яриаг цэвэрлэх"
                title="Шинэ яриа"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setNeelttei(false)}
              className="ai-icon-btn"
              aria-label="Хаах"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </header>

          <div ref={jagsaaltRef} className="ai-body" aria-live="polite">
            {messejuud.length === 0 && (
              <div className="ai-empty">
                <p className="text-[15px] font-semibold">Сайн байна уу! 👋</p>
                <p className="mt-1 text-[13px] text-[color:var(--muted-text)]">
                  Системийг хэрхэн ашиглахыг тайлбарлаж, таны эрхийн хүрээнд өр, үлдэгдэл, нэхэмжлэх,
                  зогсоолын орлогыг хэлж, зар мэдэгдэл бичихэд тусална. Жишээ нь:
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {JISHEE_ASUULTUUD.map((a) => (
                    <button key={a} type="button" onClick={() => ilgeekh(a)} className="ai-jishee">
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messejuud.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ai-msg ai-msg-user">
                  {m.content}
                </div>
              ) : (
                <React.Fragment key={i}>
                  <div className="ai-msg ai-msg-bot">
                    {m.content ? (
                      <Khariu text={m.content} />
                    ) : (
                      <span className="ai-typing" aria-label="Бичиж байна">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </div>
                  {m.logId &&
                    m.content.trim() &&
                    !m.aldaa &&
                    !(khariulj && i === messejuud.length - 1) && (
                      <div className="ai-unelgee">
                        <button
                          type="button"
                          onClick={() => unelgeeSoligh(i, 1)}
                          className={`ai-unelgee-btn${m.unelgee === 1 ? " is-active" : ""}`}
                          aria-label="Хариу тус болсон"
                          aria-pressed={m.unelgee === 1}
                          title="Тус болсон"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => unelgeeSoligh(i, -1)}
                          className={`ai-unelgee-btn${m.unelgee === -1 ? " is-active is-muu" : ""}`}
                          aria-label="Хариу буруу эсвэл тус болоогүй"
                          aria-pressed={m.unelgee === -1}
                          title="Тус болоогүй"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  {tailbarIndex === i && m.unelgee === -1 && (
                    <form
                      className="ai-tailbar"
                      onSubmit={(e) => {
                        e.preventDefault();
                        tailbarIlgeekh();
                      }}
                    >
                      <input
                        autoFocus
                        value={tailbar}
                        onChange={(e) => setTailbar(e.target.value.slice(0, 500))}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.stopPropagation();
                            setTailbarIndex(null);
                          }
                        }}
                        placeholder="Юу буруу байсан бэ? (заавал биш)"
                        className="ai-tailbar-input"
                      />
                      <button
                        type="submit"
                        disabled={!tailbar.trim()}
                        className="ai-tailbar-send"
                        aria-label="Тайлбар илгээх"
                      >
                        <Send className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTailbarIndex(null)}
                        className="ai-tailbar-skip"
                      >
                        Алгасах
                      </button>
                    </form>
                  )}
                </React.Fragment>
              ),
            )}

            {aldaa && (
              <div className="ai-aldaa" role="alert">
                {aldaa}
              </div>
            )}
          </div>

          <footer className="ai-foot">
            <textarea
              ref={oruulgaRef}
              value={oruulga}
              onChange={(e) => setOruulga(e.target.value.slice(0, 2000))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  ilgeekh();
                }
              }}
              rows={1}
              placeholder="Асуултаа бичнэ үү..."
              className="ai-input"
            />
            {khariulj ? (
              <button
                type="button"
                onClick={() => zogsookhRef.current?.abort()}
                className="ai-send"
                aria-label="Зогсоох"
                title="Зогсоох"
              >
                <Square className="h-4 w-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => ilgeekh()}
                disabled={!oruulga.trim()}
                className="ai-send"
                aria-label="Илгээх"
              >
                <Send className="h-4 w-4" strokeWidth={2.2} />
              </button>
            )}
          </footer>
          <p className="ai-note">AI алдаа гаргаж болно. Чухал зүйлийг шалгаарай.</p>
        </div>
      )}
    </>
  );
}
