"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useSocket } from "@/context/SocketContext";
import { useBuilding } from "@/context/BuildingContext";
import { hasPermission } from "@/lib/permissionUtils";

export interface MedegdelItem {
  _id: string;
  title?: string;
  message?: string;
  turul?: string;
  createdAt?: string;
  kharsanEsekh?: boolean;
  status?: string;
}

const isSanal = (t?: string) => {
  const x = (t ?? "").toLowerCase().trim();
  return x === "sanal" || x === "санал";
};
const isGomdol = (t?: string) => {
  const x = (t ?? "").toLowerCase().trim();
  return x === "gomdol" || x === "гомдол";
};

const revalidate = (prefix: string) =>
  mutate((k: unknown) => Array.isArray(k) && k[0] === prefix, undefined, {
    revalidate: true,
  });

/**
 * Every piece of notification / licence / storage data the shell needs.
 *
 * This used to live inline in golContent, which was mounted separately by each
 * route-group layout — so all of it was torn down and refetched on every
 * cross-section navigation. The shell now mounts once, so these run once.
 */
export function useShellNotifications(listEnabled: boolean) {
  const router = useRouter();
  const { ajiltan, token } = useAuth();
  const socket = useSocket();
  const { selectedBuildingId } = useBuilding();

  const baiguullagiinId = ajiltan?.baiguullagiinId;

  const canSeeSanalKhuselt = useMemo(
    () =>
      hasPermission(ajiltan, "medegdel") ||
      hasPermission(ajiltan, "/medegdel") ||
      hasPermission(ajiltan, "medegdel.sanalKhuselt") ||
      hasPermission(ajiltan, "/medegdel/sanalKhuselt") ||
      ajiltan?.erkh?.toLowerCase() === "admin",
    [ajiltan],
  );

  const { data: storageInfo } = useSWR(
    token && baiguullagiinId ? ["/storageInfo", token, baiguullagiinId] : null,
    async ([url, tkn, bId]: [string, string, string]) => {
      const res = await uilchilgee(tkn).get(url, {
        params: { baiguullagiinId: bId },
      });
      return res.data;
    },
    { revalidateOnFocus: false, refreshInterval: 600000 },
  );

  const { data: sanalUnreadData } = useSWR(
    token && baiguullagiinId && canSeeSanalKhuselt
      ? ["/medegdel/unreadCount", token, baiguullagiinId, selectedBuildingId]
      : null,
    async ([url, tkn, bId, barId]: [string, string, string, string | null]) => {
      const res = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
        },
      });
      return res.data;
    },
    { revalidateOnFocus: false, refreshInterval: 300000 },
  );

  // Only fetched while the panel is actually open.
  const { data: sanalUnreadListData } = useSWR(
    token && baiguullagiinId && canSeeSanalKhuselt && listEnabled
      ? ["/medegdel/unreadList", token, baiguullagiinId, selectedBuildingId]
      : null,
    async ([url, tkn, bId, barId]: [string, string, string, string | null]) => {
      const res = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
        },
      });
      return res.data;
    },
  );

  const { sanalList, medegdelList, unreadSanalCount, unreadMedegdelCount } =
    useMemo(() => {
      const raw = (sanalUnreadListData?.data ?? []) as MedegdelItem[];
      const sanal = raw.filter((i) => isSanal(i.turul) || isGomdol(i.turul));
      const med = raw.filter((i) => !isSanal(i.turul) && !isGomdol(i.turul));
      return {
        sanalList: sanal,
        medegdelList: med,
        unreadSanalCount: sanal.filter(
          (i) => i.status === "pending" && !i.kharsanEsekh,
        ).length,
        unreadMedegdelCount: med.filter((i) => !i.kharsanEsekh).length,
      };
    }, [sanalUnreadListData]);

  // The bell badge counts sanal/gomdol only — medegdel and tulult items are
  // auto-marked read, so counting them would leave a badge that never clears.
  const bellBadgeCount = Number(sanalUnreadData?.count ?? 0) || 0;

  const markRead = useCallback(
    async (item: MedegdelItem) => {
      if (item.kharsanEsekh || !token) return;
      const url = `/medegdel/${item._id}/kharsanEsekh`;
      const config = { params: { baiguullagiinId } };
      try {
        try {
          await uilchilgee(token).post(url, {}, config);
        } catch (postErr) {
          const status = (postErr as { response?: { status?: number } })
            ?.response?.status;
          if (status === 404 || status === 405) {
            await uilchilgee(token).patch(url, {}, config);
          } else {
            throw postErr;
          }
        }
        revalidate("/medegdel/unreadCount");
        revalidate("/medegdel/unreadList");
      } catch (e) {
        console.warn("Failed to mark medegdel as read on click", e);
      }
    },
    [token, baiguullagiinId],
  );

  const openMedegdel = useCallback(
    async (item: MedegdelItem) => {
      await markRead(item);
      router.push(`/medegdel/medegdel?tab=tulult&id=${item._id}`);
    },
    [markRead, router],
  );

  // Real-time toasts. Registered once per session now that the shell survives
  // navigation, instead of being re-registered on every route change.
  useEffect(() => {
    if (!socket || !baiguullagiinId || !canSeeSanalKhuselt) return;
    const event = "baiguullagiin" + baiguullagiinId;

    const handler = (payload: any) => {
      const type = payload?.type;

      if (type === "medegdelNew") {
        const turul = (payload?.data?.turul ?? "").trim();
        const isOutboundByMe = ["App", "Мессеж", "Mail"].includes(turul);
        if (!isOutboundByMe) {
          toast("Таны шинэ мэдэгдэл ирлээ", {
            description: "Шинэ мэдэгдэл харахын тулд жагсаалтыг шалгана уу.",
            duration: 4000,
            action: {
              label: "Харах",
              onClick: () => router.push("/medegdel/medegdel?tab=tulult"),
            },
          });
        }
        revalidate("/medegdel/unreadCount");
      }

      if (type === "medegdelUserReply") {
        const replyId = payload?.data?._id || payload?.data?.medegdelId;
        toast("Шинэ чат мессеж ирлээ", {
          description: "Харилцаанд шинэ хариу орсон байна.",
          duration: 4000,
          action: {
            label: "Харах",
            onClick: () =>
              router.push(
                replyId
                  ? `/medegdel/sanalKhuselt?id=${replyId}`
                  : "/medegdel/sanalKhuselt",
              ),
          },
        });
        revalidate("/medegdel/unreadCount");
      }

      if (type === "medegdelAdminReply") {
        const replyId =
          payload?.data?._id != null ? String(payload.data._id) : null;
        const medId = payload?.data?.medegdelId || replyId;
        const sentBy = payload?.sentBy ? String(payload.sentBy) : null;
        const myId = ajiltan?._id ? String(ajiltan._id) : null;
        const sentByMe =
          (sentBy && myId && sentBy === myId) ||
          (replyId &&
            typeof window !== "undefined" &&
            (window as any).__medegdelLastSentReplyId === replyId);
        if (!sentByMe) {
          toast("Шинэ чат мессеж ирлээ", {
            description: "Харилцаанд шинэ хариу орсон байна.",
            duration: 4000,
            action: {
              label: "Харах",
              onClick: () =>
                router.push(
                  medId
                    ? `/medegdel/sanalKhuselt?id=${medId}`
                    : "/medegdel/sanalKhuselt",
                ),
            },
          });
        }
        revalidate("/medegdel/unreadCount");
      }

      if (type === "medegdelSeen") {
        revalidate("/medegdel/unreadCount");
        revalidate("/medegdel/unreadList");
      }

      if (type === "blogNew") {
        toast("Шинэ нийтлэл ирлээ", {
          description: payload.message || "Шинэ мэдээлэл орлоо",
          duration: 4000,
        });
        revalidate("/blog");
      }

      if (type === "blogReactionUpdate") revalidate("/blog");

      if (type === "qpayPayment") {
        const d = payload.data ?? {};
        toast("QPay төлбөр орлоо", {
          description: `${d.toot ? d.toot + " тоот, " : ""}${d.ner || ""} ${
            d.amount?.toLocaleString() || 0
          }₮ төллөө.`,
          duration: 8000,
          action: {
            label: "Түүх харах",
            onClick: () => router.push("/tulbur/guilgeeTuukh"),
          },
        });
      }
    };

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, baiguullagiinId, canSeeSanalKhuselt, ajiltan?._id, router]);

  const remainingDays = useMemo(() => {
    if (!ajiltan?.salbaruud || !selectedBuildingId) return null;
    const salbar = ajiltan.salbaruud.find(
      (s) => String(s.salbariinId) === String(selectedBuildingId),
    );
    if (!salbar?.duusakhOgnoo) return null;
    const diff = new Date(salbar.duusakhOgnoo).getTime() - Date.now();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [ajiltan?.salbaruud, selectedBuildingId]);

  const storageLabel = useMemo(() => {
    const bytes = storageInfo?.total?.dataSize;
    if (!storageInfo?.total || bytes == null) return null;
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${bytes}B`;
  }, [storageInfo]);

  return {
    canSeeSanalKhuselt,
    bellBadgeCount,
    sanalList,
    medegdelList,
    unreadSanalCount,
    unreadMedegdelCount,
    openMedegdel,
    remainingDays,
    storageLabel,
  };
}
