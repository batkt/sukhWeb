"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTsonkh } from "@/lib/useTsonkh";
import { HelpCircle, Info, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { useTour } from "@/context/TourContext";

type Props = {
  ajiltan?: any;
  baiguullaga?: any;
  token?: string;
  /** When true, renders in compact mode for navbar modal */
  compact?: boolean;
};

export default function TuslamjTokhirgoo(props: Props) {
  const { compact = false } = props;
  const pathname = usePathname();
  const { list: tsonkhList, loading: tsonkhLoading } = useTsonkh("sukh");
  const { disable, enable, disabled } = useTour();

  const currentTsonkh = useMemo(() => {
    const path = pathname?.replace(/\/$/, "") || "";
    if (!path) return null;

    if (path === "/zogsool/orshinSuugch" || path === "/geree/orshinSuugch") {
      return {
        _id: "resident-list-help-custom",
        ner: "Оршин суугчийн машин бүртгэл",
        zaavar: `<div class="space-y-4">
  <p><strong>Оршин суугч ба тээврийн хэрэгслийн бүртгэлийн хэсэг</strong> нь орон сууцны хотхон, барилгын оршин суугчид болон тэдгээрийн тээврийн хэрэгслийн мэдээллийг нэгдсэн байдлаар удирдах зориулалттай.</p>
  
  <div class="bg-theme/10 p-5 rounded-3xl border border-theme/30">
    <h4 class="font-medium text-brand mb-2">Үндсэн боломжууд:</h4>
    <ul class="list-disc pl-5 space-y-1.5 text-[color:var(--panel-text)]">
      <li>Шинээр оршин суугч болон түүний тээврийн хэрэгслийн дугаарыг бүртгэх</li>
      <li>Оршин суугчдын мэдээллийг харах, орц тоотоор болон машины дугаараар шүүх</li>
      <li>Оршин суугчийн нэр, утас, тоот болон машины дугаарын мэдээллийг засах</li>
      <li>Шаардлагагүй болсон бүртгэлийг системээс устгах</li>
    </ul>
  </div>

  <div class="mt-4">
    <h4 class="font-medium text-[color:var(--panel-text)] dark:text-white mb-2">Ажиллуулах зааварчилгаа:</h4>
    <ol class="list-decimal pl-5 space-y-2.5 text-[color:var(--panel-text)]">
      <li><strong>Нэмэх товч</strong> дээр дарж оршин суугчийн утасны дугаар, нэр, орц, тоот болон тээврийн хэрэгслийн улсын дугаарыг (жишээ нь: 1234УБҮ) бүртгэнэ.</li>
      <li>Жагсаалтаас хайлт хийхдээ дээд хэсэгт байрлах <strong>Хайх цонхыг</strong> ашиглан нэр, утас, орц, тоот эсвэл улсын дугаараар хайх боломжтой.</li>
      <li>Бүртгэлтэй оршин суугчийн мэдээллийг шинэчлэхийн тулд тухайн мөрний баруун талд байрлах <strong>Засах (Edit) товчлуур</strong> дээр дарна уу.</li>
    </ol>
  </div>
</div>`
      } as any;
    }

    const withZam = tsonkhList
      .map((t) => ({ t, zam: (t.zam || "").replace(/\/$/, "") }))
      .filter(({ zam }) => zam);
    withZam.sort((a, b) => b.zam.length - a.zam.length);

    // Try finding exact or prefix match first
    let found = withZam.find(
      ({ zam }) => path === zam || path.startsWith(zam + "/")
    );

    return found?.t ?? null;
  }, [pathname, tsonkhList]);

  const hasContent = !!(
    currentTsonkh &&
    (currentTsonkh.zaavar || currentTsonkh.tailbar || currentTsonkh.ner)
  );

  return (
    <div
      id="tuslamj-panel"
      className="flex w-full min-h-0 flex-col"
    >
      <div className={`${compact ? "p-4" : ""} flex flex-col flex-1 min-h-0 overflow-hidden`}>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[color:var(--surface-border)] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme/10 text-brand">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[16px] text-[color:var(--panel-text)]">
                {currentTsonkh?.ner || "Хуудасны зааварчилгаа"}
              </h2>
              <p className="text-[13px] text-[color:var(--muted-text)]">
                {currentTsonkh?.ner ? "Энэ хуудасны тухай дэлгэрэнгүй мэдээлэл" : "Мэдээлэл байхгүй байна"}
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 text-[14px] leading-relaxed ${compact ? "" : "max-h-[calc(100dvh-280px)]"}`}>
            {tsonkhLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[color:var(--muted-text)]">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand" />
                <p className="text-sm font-medium">Уншиж байна...</p>
              </div>
            ) : !currentTsonkh ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-20 w-20 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/5 flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-[color:var(--muted-text)]" />
                </div>
                <h3 className="text-base font-medium text-[color:var(--panel-text)] dark:text-white mb-2">Зааварчилгаа байхгүй</h3>
                <p className="text-sm text-[color:var(--muted-text)] max-w-xs mx-auto leading-relaxed">
                  Энэ хуудсанд одоогоор тусламжийн мэдээлэл ороогүй байна. Админ зааварчилгаа оруулснаар энд харагдах болно.
                </p>
              </div>
            ) : !hasContent ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-20 w-20 rounded-full bg-[color:var(--surface-hover)] dark:bg-white/5 flex items-center justify-center mb-6">
                  <Info className="w-10 h-10 text-[color:var(--muted-text)]" />
                </div>
                <h3 className="text-base font-medium text-[color:var(--panel-text)] dark:text-white mb-2">Агуулга байхгүй</h3>
                <p className="text-sm text-[color:var(--muted-text)] max-w-xs mx-auto leading-relaxed">
                  Хуудасны бүртгэл байгаа боловч зааварчилгааны агуулга хоосон байна.
                </p>
              </div>
            ) : (
              <div className="animate-fadeIn">
                {currentTsonkh.zaavar && (
                  <div
                    className="tsonkh-zaavar prose prose-slate dark:prose-invert max-w-none 
                      prose-headings:font-medium prose-headings:text-[color:var(--panel-text)] dark:prose-headings:text-white
                      prose-p:text-[color:var(--muted-text)] dark:prose-p:text-[color:var(--muted-text)] prose-p:leading-relaxed
                      prose-li:text-[color:var(--muted-text)] dark:prose-li:text-[color:var(--muted-text)]
                      prose-strong:text-[color:var(--panel-text)] dark:prose-strong:text-white
                      prose-img:rounded-2xl prose-img:shadow-lg"
                    dangerouslySetInnerHTML={{
                      __html: currentTsonkh.zaavar,
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div className="flex items-center justify-between gap-3 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-5 py-3">
            <div className="flex items-center gap-2 text-[13px] text-[color:var(--muted-text)]">
              <HelpCircle className="h-4 w-4" />
              <span>Ерөнхий тусламж</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => (e.target.checked ? disable() : enable())}
                className="h-[18px] w-[18px] rounded accent-[color:var(--theme)]"
              />
              <span className="text-[13px] text-[color:var(--panel-text)] transition-colors group-hover:text-brand">
                Дахин харуулахгүй
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
