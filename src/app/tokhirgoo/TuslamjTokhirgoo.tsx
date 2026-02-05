"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTsonkh } from "@/lib/useTsonkh";

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

  // Find tsonkh matching current path - only show help for the page user is on
  // Prefer most specific match (e.g. /tailan/orlogo-avlaga over /tailan when on that page)
  const currentTsonkh = useMemo(() => {
    const path = pathname?.replace(/\/$/, "") || "";
    if (!path) return null;
    const withZam = tsonkhList
      .map((t) => ({ t, zam: (t.zam || "").replace(/\/$/, "") }))
      .filter(({ zam }) => zam);
    // Sort by zam length descending so we match most specific first
    withZam.sort((a, b) => b.zam.length - a.zam.length);
    const found = withZam.find(
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
      className={`flex flex-col min-h-0 ${compact ? "" : "xxl:col-span-9 col-span-12 lg:col-span-12"}`}
      style={compact ? {} : { height: "calc(100vh - 220px)" }}
    >
      <div className="allow-overflow p-4 md:p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
          <div className="p-5 border-b border-[color:var(--surface-border)] flex-shrink-0">
            
            <p className="text-md font-semibold text-theme">
              {currentTsonkh?.ner
                ? `${currentTsonkh.ner}`
                : "Одоогийн хуудсанд тусламж байхгүй байна"}
            </p>
          </div>
          <div className="p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {tsonkhLoading ? (
              <div className="text-theme py-8 text-center">
                Уншиж байна...
              </div>
            ) : !currentTsonkh ? (
              <div className="text-themepy-8 text-center text-theme">
                Энэ хуудсанд тусламж тохируулаагүй байна. Админ тусламж нэмж
                зааварчилгаа оруулна уу.
              </div>
            ) : !hasContent ? (
              <div className="text-theme py-8 text-center">
                Тусламж байхгүй байна. Админ зааварчилгаа нэмснээр энд харагдана.
              </div>
            ) : (
              <div className="space-y-4">
                {currentTsonkh.tailbar && (
                  <p className="text-sm text-theme">{currentTsonkh.tailbar}</p>
                )}
                {currentTsonkh.zaavar && (
                  <div
                    className="tsonkh-zaavar prose prose-sm max-w-none text-theme prose-headings:text-theme prose-p:text-theme/90 prose-a:text-theme"
                    dangerouslySetInnerHTML={{
                      __html: currentTsonkh.zaavar,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
