"use client";

import { useState } from "react";
import { useTuslamj } from "@/lib/useTuslamj";
import { getAdminFileUrl } from "@/lib/uilchilgee";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

type Props = {
  ajiltan?: any;
  baiguullaga?: any;
  token?: string;
};

export default function TuslamjTokhirgoo(props: Props) {
  const { list: tuslamjList, loading: tuslamjLoading, error: tuslamjError } =
    useTuslamj("sukh");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div
      id="tuslamj-panel"
      className="xxl:col-span-9 col-span-12 lg:col-span-12 flex flex-col min-h-0"
      style={{ height: "calc(100vh - 220px)" }}
    >
      <div className="neu-panel allow-overflow p-4 md:p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
          <div className="p-5 border-b border-[color:var(--surface-border)] flex-shrink-0">
            <h3 className="text-lg text-theme">Тусламж</h3>
            <p className="text-xs text-[color:var(--muted-text)]">
              Админ нэмсэн тусламж, зааварчилгаа
            </p>
          </div>
          <div className="p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {tuslamjLoading ? (
              <div className="text-theme/70 py-8 text-center">
                Уншиж байна...
              </div>
            ) : tuslamjError ? (
              <div className="text-red-500 py-4 text-center">
                Тусламж ачааллахад алдаа: {tuslamjError}
              </div>
            ) : tuslamjList.length === 0 ? (
              <div className="text-theme/60 py-8 text-center">
                Тусламж байхгүй байна. Админ тусламж нэмснээр энд харагдана.
              </div>
            ) : (
              <div className="space-y-2">
                {tuslamjList.map((t) => {
                  const hasAlkhamuud =
                    Array.isArray(t.alkhamuud) && t.alkhamuud.length > 0;
                  const isExpanded = expandedId === t._id;

                  return (
                    <div
                      key={t._id}
                      className="rounded-xl border border-[color:var(--surface-border)] overflow-hidden bg-[color:var(--surface-bg)]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : t._id)
                        }
                        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[color:var(--surface-hover)] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-theme">
                            {t.garchig || "Тусламж"}
                          </div>
                          {!hasAlkhamuud && t.tailbar && (
                            <div className="text-sm text-theme/70 mt-1 line-clamp-2">
                              {t.tailbar}
                            </div>
                          )}
                        </div>
                        {hasAlkhamuud && (
                          <span className="flex-shrink-0 text-theme/60">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </span>
                        )}
                      </button>

                      {isExpanded && hasAlkhamuud && (
                        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-[color:var(--surface-border)]">
                          {t.zurgiinId && (
                            <div className="pt-2">
                              <img
                                src={getAdminFileUrl(t.zurgiinId)}
                                alt={t.garchig || ""}
                                className="max-w-full h-auto rounded-lg border border-[color:var(--surface-border)] object-contain max-h-64"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          {t.tailbar && (
                            <p className="text-sm text-theme/80 pt-2">
                              {t.tailbar}
                            </p>
                          )}
                          {t.alkhamuud!.map((a, i) => (
                            <div
                              key={i}
                              className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg bg-[color:var(--surface-hover)]/50"
                            >
                              {a.zurgiinId && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={getAdminFileUrl(a.zurgiinId)}
                                    alt={a.garchig || ""}
                                    className="max-w-full sm:max-w-48 h-auto rounded-lg border border-[color:var(--surface-border)] object-contain max-h-48"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-theme text-sm">
                                  {a.garchig || `#${i + 1}`}
                                </div>
                                {a.tailbar && (
                                  <div className="text-sm text-theme/70 mt-0.5">
                                    {a.tailbar}
                                  </div>
                                )}
                              </div>
                              {a.link && (
                                <a
                                  href={a.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 text-theme/80 hover:text-theme"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {isExpanded && !hasAlkhamuud && (
                        <div className="px-4 pb-4 pt-0 border-t border-[color:var(--surface-border)]">
                          {t.zurgiinId && (
                            <div className="pt-2">
                              <img
                                src={getAdminFileUrl(t.zurgiinId)}
                                alt={t.garchig || ""}
                                className="max-w-full h-auto rounded-lg border border-[color:var(--surface-border)] object-contain max-h-64"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                          )}
                          {t.tailbar && (
                            <p className="text-sm text-theme/80 pt-2 whitespace-pre-wrap">
                              {t.tailbar}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
