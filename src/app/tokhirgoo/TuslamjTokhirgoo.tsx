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
        ner: "Оршин суугч",
        zaavar: `<div class="space-y-4">
  <p><strong>Оршин суугчдын бүртгэлийн хэсэг</strong> нь орон сууцны хотхон, барилгын оршин суугчид болон тэдгээрийн тээврийн хэрэгслийн мэдээллийг нэгдсэн байдлаар удирдах зориулалттай.</p>
  
  <div class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30">
    <h4 class="font-bold text-blue-900 dark:text-blue-400 mb-2">Үндсэн боломжууд:</h4>
    <ul class="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
      <li>Шинээр оршин суугч болон түүний тээврийн хэрэгслийн дугаарыг бүртгэх</li>
      <li>Оршин суугчдын мэдээллийг харах, шүүх болон засах</li>
      <li>Шаардлагагүй болсон бүртгэлийг системээс устгах</li>
      <li>Орц, тоотоор шүүлт хийж мэдээллийг хурдан олох</li>
    </ul>
  </div>

  <div class="mt-4">
    <h4 class="font-bold text-slate-900 dark:text-white mb-2">Ажиллуулах зааварчилгаа:</h4>
    <ol class="list-decimal pl-5 space-y-2.5 text-slate-700 dark:text-slate-300">
      <li><strong>Нэмэх товч</strong> дээр дарж оршин суугчийн нэр, утасны дугаар, орц, тоот болон тээврийн хэрэгслийн улсын дугаарыг бүртгэнэ.</li>
      <li>Жагсаалтаас хайлт хийхдээ дээд хэсэгт байрлах <strong>Хайх цонхыг</strong> ашиглан нэр, утас эсвэл улсын дугаараар хайх боломжтой.</li>
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
      className={`flex flex-col min-h-0 ${compact ? "w-full" : "xxl:col-span-9 col-span-12 lg:col-span-12"}`}
      style={compact ? {} : { height: "calc(100vh - 220px)" }}
    >
      <div className={`${compact ? "p-4" : "p-4 md:p-6"} flex flex-col flex-1 min-h-0 overflow-hidden`}>
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-900/50 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentTsonkh?.ner || "Хуудасны зааварчилгаа"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentTsonkh?.ner ? "Энэ хуудасны тухай дэлгэрэнгүй мэдээлэл" : "Мэдээлэл байхгүй байна"}
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
            {tsonkhLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                <p className="text-sm font-medium">Уншиж байна...</p>
              </div>
            ) : !currentTsonkh ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Зааварчилгаа байхгүй</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Энэ хуудсанд одоогоор тусламжийн мэдээлэл ороогүй байна. Админ зааварчилгаа оруулснаар энд харагдах болно.
                </p>
              </div>
            ) : !hasContent ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                  <Info className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Агуулга байхгүй</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Хуудасны бүртгэл байгаа боловч зааварчилгааны агуулга хоосон байна.
                </p>
              </div>
            ) : (
              <div className="animate-fadeIn">
                {currentTsonkh.zaavar && (
                  <div
                    className="tsonkh-zaavar prose prose-slate dark:prose-invert max-w-none 
                      prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                      prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                      prose-li:text-slate-600 dark:prose-li:text-slate-300
                      prose-strong:text-slate-900 dark:prose-strong:text-white
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
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              <HelpCircle className="w-3 h-3" />
              <span>Ерөнхий тусламж</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => (e.target.checked ? disable() : enable())}
                className="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-theme focus:ring-theme"
              />
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-theme transition-colors">
                Дахин харуулахгүй
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
