"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { notification } from "antd";
import { mutate } from "swr";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { useSocket } from "@/context/SocketContext";
import uilchilgee, { getApiUrl } from "@/lib/uilchilgee";
import {
  CheckCircle,
  CheckCheck,
  Clock,
  XCircle,
  MessageSquare,
  Calendar,
  AlertCircle,
  ChevronRight,
  Search,
  ArrowLeft,
  X,
  RefreshCw,
  Send,
  ImagePlus,
  Mic,
  Square,
  User,
  Home,
  Phone,
  Loader2,
} from "lucide-react";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";
import FilterSelect from "@/components/ui/FilterSelect";
import FilterDatePicker from "@/components/ui/FilterDatePicker";

/** Normalize zurag/duu to API path "baiguullagiinId/filename". Handles full server paths (e.g. /root/sukhBack/public/medegdel/.../file.jpg) and relative paths. */
function normalizeMedegdelAssetPath(p: string | null | undefined): string {
  if (p == null || !p.trim()) return "";
  const s = p
    .trim()
    .replace(/^\/+/, "")
    .replace(/^public\/medegdel\/?/i, "")
    .replace(/^public\/?/i, "");
  const parts = s.split("/").filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join("/");
  if (parts.length === 1) return parts[0];
  return s || p.trim();
}

interface MedegdelItem {
  _id: string;
  parentId?: string | null;
  status: string;
  orshinSuugchId: string | null;
  baiguullagiinId: string;
  barilgiinId: string;
  title: string;
  message: string;
  kharsanEsekh: boolean;
  turul: string;
  ognoo?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  repliedAt?: string;
  repliedBy?: string;
  tailbar?: string;
  zurag?: string;
  duu?: string; // voice message path
}

export default function SanalKhuselt() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("id");
  const { ajiltan, token } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const socket = useSocket();

  const tourSteps = useTourSteps("feedback");
  useRegisterTourSteps("/medegdel/sanalKhuselt", tourSteps);

  const [medegdelList, setMedegdelList] = useState<MedegdelItem[]>([]);
  const [selectedMedegdel, setSelectedMedegdel] = useState<MedegdelItem | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    newStatus: string;
    oldStatus: string;
  } | null>(null);
  const [tailbarText, setTailbarText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  /** Client-side createdAt range filter (YYYY-MM-DD, inclusive). */
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [residentsMap, setResidentsMap] = useState<
    Record<string, { ner: string; toot: string; utas: string }>
  >({});
  const [threadMessages, setThreadMessages] = useState<MedegdelItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [replyVoiceBlob, setReplyVoiceBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const replyImageInputRef = useRef<HTMLInputElement>(null);
  const selectedMedegdelRef = useRef<MedegdelItem | null>(null);
  selectedMedegdelRef.current = selectedMedegdel ?? null;
  /** When refetching list after socket, keep this root selected (avoids jump when admin sends reply). */
  const keepSelectionRootIdRef = useRef<string | null>(null);
  /** Reply id we just sent from this tab; skip adding it again when we receive the same id via socket. */
  const lastSentAdminReplyIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (ajiltan?.baiguullagiinId && token) {
      fetchMedegdelData(ajiltan.baiguullagiinId);
    }
  }, [ajiltan, token]);

  const fetchThread = async (rootId: string) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      console.warn(
        "[sanalKhuselt] fetchThread skip (missing token/baiguullagiinId) rootId=",
        rootId,
      );
      return;
    }
    setThreadLoading(true);
    try {
      const params: {
        baiguullagiinId: string;
        tukhainBaaziinKholbolt?: string;
      } = { baiguullagiinId: ajiltan.baiguullagiinId };
      if (ajiltan.tukhainBaaziinKholbolt)
        params.tukhainBaaziinKholbolt = ajiltan.tukhainBaaziinKholbolt;
      const res = await uilchilgee(token).get(`/medegdel/thread/${rootId}`, {
        params,
      });
      if (res.data?.data && Array.isArray(res.data.data)) {
        setThreadMessages(res.data.data);
        console.log(
          "[sanalKhuselt] fetchThread ok rootId=",
          rootId,
          "count=",
          res.data.data.length,
        );

        // Fetch any missing residents in thread messages
        const threadIds = [
          ...new Set(
            res.data.data
              .map((it: MedegdelItem) => it.orshinSuugchId)
              .filter(Boolean),
          ),
        ] as string[];
        const missingIds = threadIds.filter((id) => !residentsMap[id]);
        if (missingIds.length > 0 && ajiltan?.baiguullagiinId) {
          const newMap: Record<
            string,
            { ner: string; toot: string; utas: string }
          > = {};
          await Promise.all(
            missingIds.map(async (id) => {
              let r: any = null;
              try {
                const rRes = await uilchilgee(token || undefined).get(
                  `/orshinSuugch/${id}`,
                  {
                    params: { baiguullagiinId: ajiltan.baiguullagiinId },
                  },
                );
                console.log(
                  "[sanalKhuselt] thread orshinSuugch raw",
                  id,
                  rRes.data,
                );
                r = rRes.data;
              } catch {
                // ignore, try fallback
              }
              if (!r || !r._id) {
                try {
                  const rRes = await uilchilgee(token || undefined).get(
                    `/khariltsagch/${id}`,
                    {
                      params: { baiguullagiinId: ajiltan.baiguullagiinId },
                    },
                  );
                  console.log(
                    "[sanalKhuselt] thread khariltsagch raw",
                    id,
                    rRes.data,
                  );
                  r = rRes.data;
                } catch {
                  // ignore
                }
              }
              if (r && r._id) {
                const ner = `${r.ovog || ""} ${r.ner || ""}`.trim();
                const toot =
                  Array.isArray(r.toots) && r.toots.length > 0
                    ? r.toots.map((t: any) => t.toot || t).join(", ")
                    : r.toot || "";
                const utas = Array.isArray(r.utas)
                  ? r.utas[0] || ""
                  : r.utas || "";
                newMap[String(r._id)] = { ner, toot, utas };
              }
            }),
          );
          if (Object.keys(newMap).length > 0) {
            setResidentsMap((prev) => ({ ...prev, ...newMap }));
          }
        }
      } else {
        setThreadMessages([]);
      }
    } catch (e) {
      console.warn("[sanalKhuselt] fetchThread error rootId=", rootId, e);
      setThreadMessages([]);
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedMedegdel || !token || !ajiltan?.baiguullagiinId) {
      setThreadMessages([]);
      return;
    }
    const rootId =
      (selectedMedegdel as MedegdelItem).parentId || selectedMedegdel._id;
    fetchThread(rootId);
  }, [selectedMedegdel?._id]);

  useEffect(() => {
    if (preselectedId && medegdelList.length > 0) {
      const found = medegdelList.find((it) => it._id === preselectedId);
      if (found) setSelectedMedegdel(found);
    }
  }, [preselectedId, medegdelList]);

  const displayMessages = useMemo(() => {
    if (threadMessages.length > 0) {
      const hasRoot = threadMessages.some(
        (m) => String(m._id) === String(selectedMedegdel?._id),
      );
      if (!hasRoot && selectedMedegdel) {
        return [selectedMedegdel, ...threadMessages];
      }
      return threadMessages;
    }
    return selectedMedegdel ? [selectedMedegdel] : [];
  }, [threadMessages, selectedMedegdel]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [selectedMedegdel?._id, scrollToBottom]);

  useEffect(() => {
    if (displayMessages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [displayMessages.length, scrollToBottom]);

  const markedSeenRootIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const markAsSeen = async (item: MedegdelItem) => {
      if (!item || !token || !ajiltan?.baiguullagiinId) return;
      const rootId = String(item.parentId || item._id);
      if (markedSeenRootIds.current.has(rootId)) return;
      if (item.status !== "pending" || item.kharsanEsekh) return;

      try {
        try {
          await uilchilgee(token).post(
            `/medegdel/${item._id}/kharsanEsekh`,
            {},
            {
              params: { baiguullagiinId: ajiltan.baiguullagiinId },
            },
          );
        } catch (postErr: any) {
          if (postErr?.response?.status === 404 || postErr?.response?.status === 405) {
            await uilchilgee(token).patch(
              `/medegdel/${item._id}/kharsanEsekh`,
              {},
              {
                params: { baiguullagiinId: ajiltan.baiguullagiinId },
              },
            );
          } else {
            throw postErr;
          }
        }
        markedSeenRootIds.current.add(rootId);
        // Backend marks root + all replies in thread; update all list rows that belong to this thread
        setMedegdelList((prev) =>
          prev.map((it) =>
            String(it.parentId || it._id) === rootId
              ? { ...it, kharsanEsekh: true }
              : it,
          ),
        );
        setSelectedMedegdel((prev) =>
          prev && String((prev as MedegdelItem).parentId || prev._id) === rootId
            ? { ...prev, kharsanEsekh: true }
            : prev,
        );
        // Update thread messages so "seen" shows without refetch
        setThreadMessages((prev) =>
          prev.map((m) => ({ ...m, kharsanEsekh: true })),
        );
        // Fetch fresh unread count and update cache directly (same params as the shell notification hook)
        const countRes = await uilchilgee(token).get("/medegdel/unreadCount", {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            ...(selectedBuildingId ? { barilgiinId: selectedBuildingId } : {}),
          },
        });
        const unreadKey = [
          "/medegdel/unreadCount",
          token,
          ajiltan.baiguullagiinId,
          selectedBuildingId,
        ];
        mutate(unreadKey, countRes.data, { revalidate: false });
        // Revalidate unread list so dropdown shows updated kharsanEsekh
        mutate(
          (k) => Array.isArray(k) && k[0] === "/medegdel/unreadList",
          undefined,
          { revalidate: true },
        );
      } catch {
        // Ignore - don't block UI
      }
    };

    if (selectedMedegdel) markAsSeen(selectedMedegdel);
  }, [selectedMedegdel?._id, selectedMedegdel, token, ajiltan]);

  const fetchMedegdelData = async (
    baiguullagiinId: string,
    options?: { keepSelection?: boolean },
  ) => {
    console.log(
      "[sanalKhuselt] fetchMedegdelData start baiguullagiinId=",
      baiguullagiinId,
    );
    setLoading(true);
    try {
      const response = await uilchilgee(token || undefined).get("/medegdel", {
        params: {
          baiguullagiinId,
          barilgiinId: ajiltan?.barilgiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
        },
      });

      if (response.data.success) {
        // Filter for "sanal" and "gomdol" types (checking both Latin's and Cyrillic)
        const filteredData = response.data.data.filter((item: MedegdelItem) => {
          const turul = item.turul?.toLowerCase() || "";
          return (
            turul === "sanal" ||
            "санал" === turul ||
            turul === "gomdol" ||
            turul === "гомдол"
          );
        });
        // Sort by last activity (updatedAt) so last replied chat is on top
        filteredData.sort(
          (a: any, b: any) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
        );
        setMedegdelList(filteredData);

        // Fetch resident info for each unique orshinSuugchId individually
        const uniqueIds = [
          ...new Set(
            filteredData
              .map((it: MedegdelItem) => it.orshinSuugchId)
              .filter(Boolean),
          ),
        ] as string[];
        if (uniqueIds.length > 0) {
          const map: Record<
            string,
            { ner: string; toot: string; utas: string }
          > = {};
          await Promise.all(
            uniqueIds.map(async (id) => {
              let r: any = null;
              // Try /orshinSuugch first (same pattern as useGereeActions.ts)
              try {
                const rRes = await uilchilgee(token || undefined).get(
                  `/orshinSuugch/${id}`,
                  {
                    params: { baiguullagiinId },
                  },
                );
                console.log("[sanalKhuselt] orshinSuugch raw", id, rRes.data);
                r = rRes.data;
              } catch {
                // ignore, try fallback
              }
              // Fallback to /khariltsagch
              if (!r || !r._id) {
                try {
                  const rRes = await uilchilgee(token || undefined).get(
                    `/khariltsagch/${id}`,
                    {
                      params: { baiguullagiinId },
                    },
                  );
                  console.log("[sanalKhuselt] khariltsagch raw", id, rRes.data);
                  r = rRes.data;
                } catch {
                  // ignore
                }
              }
              if (r && r._id) {
                const ner = `${r.ovog || ""} ${r.ner || ""}`.trim();
                const toot =
                  Array.isArray(r.toots) && r.toots.length > 0
                    ? r.toots.map((t: any) => t.toot || t).join(", ")
                    : r.toot || "";
                const utas = Array.isArray(r.utas)
                  ? r.utas[0] || ""
                  : r.utas || "";
                map[String(r._id)] = { ner, toot, utas };
              }
            }),
          );
          setResidentsMap(map);
        }

        console.log(
          "[sanalKhuselt] fetchMedegdelData ok count=",
          filteredData.length,
        );
        const rootIdToKeep = keepSelectionRootIdRef.current;
        if (
          options?.keepSelection &&
          (rootIdToKeep != null || selectedMedegdelRef.current)
        ) {
          // Prefer explicit root we stored (e.g. when socket fired); else use current selection
          const rootId =
            rootIdToKeep ??
            String(
              ((selectedMedegdelRef.current as MedegdelItem)?.parentId ||
                selectedMedegdelRef.current?._id) ??
              "",
            );
          keepSelectionRootIdRef.current = null;
          const fresh = filteredData.find(
            (it: MedegdelItem) => String(it._id) === String(rootId),
          );
          if (fresh) setSelectedMedegdel(fresh);
        } else if (filteredData.length > 0) {
          const toSelect = preselectedId
            ? filteredData.find((it: MedegdelItem) => it._id === preselectedId)
            : null;
          setSelectedMedegdel(toSelect || filteredData[0]);
        }
      } else {
        notification.error({ message: t("Өгөгдөл татахад алдаа гарлаа") });
      }
    } catch (error) {
      console.error("[sanalKhuselt] fetchMedegdelData error", error);
      notification.error({ message: t("Өгөгдөл татахад алдаа гарлаа") });
    } finally {
      setLoading(false);
    }
  };

  // Real-time: new medegdel from app, user reply, or admin reply. Refetch list/thread; toast is shown globally from the app shell.
  useEffect(() => {
    if (!socket || !ajiltan?.baiguullagiinId) return;
    const event = "baiguullagiin" + ajiltan.baiguullagiinId;
    const bId = ajiltan.baiguullagiinId;
    console.log("[sanalKhuselt] SUBSCRIBE socket event=", event);
    const handler = (payload: {
      type?: string;
      data?: { parentId?: unknown; rootId?: string };
    }) => {
      console.log(
        "[sanalKhuselt] RECV socket",
        event,
        "payload.type=",
        payload?.type,
        "payload=",
        payload,
      );
      // Real-time seen: update list, selection, and thread so "seen" shows without refresh
      if (payload?.type === "medegdelSeen") {
        const rootId =
          payload?.data?.rootId != null ? String(payload.data.rootId) : null;
        if (rootId) {
          setMedegdelList((prev) =>
            prev.map((it) =>
              String(it._id) === rootId || String(it.parentId) === rootId
                ? { ...it, kharsanEsekh: true }
                : it,
            ),
          );
          setSelectedMedegdel((prev) => {
            if (!prev) return prev;
            const prevRootId = String(
              (prev as MedegdelItem).parentId || prev._id,
            );
            return prevRootId === rootId
              ? { ...prev, kharsanEsekh: true }
              : prev;
          });
          const sel = selectedMedegdelRef.current;
          const currentRootId = sel
            ? String((sel as MedegdelItem).parentId || sel._id)
            : null;
          if (currentRootId === rootId) {
            setThreadMessages((prev) =>
              prev.map((m) => ({ ...m, kharsanEsekh: true })),
            );
          }
          mutate(
            (k: unknown) =>
              Array.isArray(k) && k[0] === "/medegdel/unreadCount",
            undefined,
            { revalidate: true },
          );
          mutate(
            (k: unknown) => Array.isArray(k) && k[0] === "/medegdel/unreadList",
            undefined,
            { revalidate: true },
          );
        }
      }
      // Toast is shown globally from the app shell so it appears on any page; here we only refetch and update list/thread
      if (payload?.type === "medegdelNew") {
        fetchMedegdelData(bId);
        mutate(
          (k) => Array.isArray(k) && k[0] === "/medegdel/unreadCount",
          undefined,
          { revalidate: true },
        );
      }
      if (payload?.type === "medegdelUserReply") {
        const replyData = payload?.data as MedegdelItem | undefined;
        const replyParentId =
          replyData?.parentId != null ? String(replyData.parentId) : null;
        const sel = selectedMedegdelRef.current;
        const currentRootId = sel
          ? String((sel as MedegdelItem).parentId || sel._id)
          : null;
        const isForOpenThread =
          replyParentId !== null &&
          currentRootId !== null &&
          replyParentId === currentRootId;
        if (isForOpenThread && replyData) {
          setThreadMessages((prev) => [
            ...prev,
            { ...replyData, parentId: replyParentId },
          ]);
        }
        if (currentRootId) keepSelectionRootIdRef.current = currentRootId;
        fetchMedegdelData(bId, { keepSelection: true });
        mutate(
          (k) => Array.isArray(k) && k[0] === "/medegdel/unreadCount",
          undefined,
          { revalidate: true },
        );
      }
      if (payload?.type === "medegdelAdminReply") {
        const replyData = payload?.data as MedegdelItem | undefined;
        const replyId = replyData?._id != null ? String(replyData._id) : null;
        if (replyId && replyId === lastSentAdminReplyIdRef.current) {
          lastSentAdminReplyIdRef.current = null;
          const sel = selectedMedegdelRef.current;
          if (sel)
            keepSelectionRootIdRef.current = String(
              (sel as MedegdelItem).parentId || sel._id,
            );
          fetchMedegdelData(bId, { keepSelection: true });
          return;
        }
        const replyParentId =
          replyData?.parentId != null ? String(replyData.parentId) : null;
        const sel = selectedMedegdelRef.current;
        const currentRootId = sel
          ? String((sel as MedegdelItem).parentId || sel._id)
          : null;
        const isForOpenThread =
          replyParentId !== null &&
          currentRootId !== null &&
          replyParentId === currentRootId;
        if (isForOpenThread && replyData) {
          setThreadMessages((prev) => {
            if (replyId && prev.some((m) => String(m._id) === replyId))
              return prev;
            return [...prev, { ...replyData, parentId: replyParentId }];
          });
        }
        // Pin which root to keep selected so refetch doesn’t jump to another chat
        if (currentRootId) keepSelectionRootIdRef.current = currentRootId;
        fetchMedegdelData(bId, { keepSelection: true });
      }
    };
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, ajiltan?.baiguullagiinId, fetchMedegdelData, fetchThread]);

  /** Compress image client-side to avoid 413 (Nginx body size). Max width 1280, JPEG 0.82. */
  const compressImageForChat = (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) return Promise.resolve(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = 1280;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > max || h > max) {
          if (w > h) {
            h = Math.round((h * max) / w);
            w = max;
          } else {
            w = Math.round((w * max) / h);
            h = max;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob)
              resolve(
                new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, ".jpg") || "image.jpg",
                  { type: "image/jpeg" },
                ),
              );
            else resolve(file);
          },
          "image/jpeg",
          0.82,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  };

  const uploadChatFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("baiguullagiinId", ajiltan!.baiguullagiinId);
    form.append("file", file);
    const res = await uilchilgee(token ?? undefined).post<{
      success: boolean;
      path: string;
    }>("/medegdel/uploadChatFile", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!res.data?.path) throw new Error("Upload failed");
    return res.data.path;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.length)
          setReplyVoiceBlob(
            new Blob(chunks, { type: mr.mimeType || "audio/webm" }),
          );
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error(err);
      notification.error({ message: t("Дуу бичих эрх олдсонгүй") });
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAdminReply = async () => {
    const rootId = selectedMedegdel
      ? String(
        (selectedMedegdel as MedegdelItem).parentId || selectedMedegdel._id,
      )
      : null;
    const hasText = replyInput.trim().length > 0;
    const hasImage = !!replyImage;
    const hasVoice = !!replyVoiceBlob;
    if (!rootId || (!hasText && !hasImage && !hasVoice)) {
      notification.warning({ message: t("Хариу эсвэл зураг/дуу оруулна уу") });
      return;
    }
    if (!token || !ajiltan?.baiguullagiinId) {
      notification.error({ message: t("Нэвтрэх эрх эсвэл байгууллага алга") });
      return;
    }
    keepSelectionRootIdRef.current = rootId;
    setReplySending(true);
    if (typeof window !== "undefined")
      (window as any).__medegdelSendingReply = true;
    try {
      let zuragPath: string | undefined;
      let voicePath: string | undefined;
      if (replyImage) {
        const toUpload = await compressImageForChat(replyImage);
        zuragPath = await uploadChatFile(toUpload);
        setReplyImage(null);
      }
      if (replyVoiceBlob) {
        const voiceFile = new File([replyVoiceBlob], "voice.webm", {
          type: replyVoiceBlob.type,
        });
        voicePath = await uploadChatFile(voiceFile);
        setReplyVoiceBlob(null);
      }
      const body: {
        parentId: string;
        message: string;
        baiguullagiinId: string;
        ajiltanId?: string;
        tukhainBaaziinKholbolt?: string;
        zurag?: string;
        voiceUrl?: string;
      } = {
        parentId: rootId,
        message: replyInput.trim() || "",
        baiguullagiinId: ajiltan.baiguullagiinId,
        ajiltanId: ajiltan._id ? String(ajiltan._id) : undefined,
      };
      if (zuragPath) body.zurag = zuragPath;
      if (voicePath) body.voiceUrl = voicePath;
      if (ajiltan.tukhainBaaziinKholbolt)
        body.tukhainBaaziinKholbolt = ajiltan.tukhainBaaziinKholbolt;
      const res = await uilchilgee(token).post<{
        success: boolean;
        data: MedegdelItem;
      }>("/medegdel/adminReply", body);
      setReplyInput("");
      const newReply = res.data?.data;
      if (newReply) {
        const replyId = newReply._id != null ? String(newReply._id) : null;
        if (replyId) {
          lastSentAdminReplyIdRef.current = replyId;
          // So the app shell can skip the "new message" toast when this client sent the reply
          if (typeof window !== "undefined")
            (window as any).__medegdelLastSentReplyId = replyId;
          setTimeout(() => {
            if (typeof window !== "undefined")
              (window as any).__medegdelLastSentReplyId = null;
          }, 5000);
        }
        const item = {
          ...newReply,
          parentId: newReply.parentId ? String(newReply.parentId) : rootId,
        };
        setThreadMessages((prev) => {
          if (replyId && prev.some((m) => String(m._id) === replyId))
            return prev;
          return [...prev, item];
        });
      }
    } catch (e) {
      console.error("[sanalKhuselt] sendAdminReply error", e);
      notification.error({ message: t("Хариу илгээхэд алдаа гарлаа") });
    } finally {
      if (typeof window !== "undefined")
        (window as any).__medegdelSendingReply = false;
      setReplySending(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const s = status || "pending";
    switch (s) {
      case "pending":
        return {
          label: t("Хүлээгдэж байна"),
          pill: "bg-warning/10 text-warning",
          dot: "bg-warning",
          icon: <Clock className="h-3.5 w-3.5" />,
        };
      case "done":
        return {
          label: t("Шийдэгдсэн"),
          pill: "bg-success/10 text-success",
          dot: "bg-success",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
        };
      case "rejected":
        return {
          label: t("Татгалзсан"),
          pill: "bg-danger/10 text-danger",
          dot: "bg-danger",
          icon: <XCircle className="h-3.5 w-3.5" />,
        };
      default:
        return {
          label: t("Тодорхойгүй"),
          pill: "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]",
          dot: "bg-[color:var(--muted-text)]",
          icon: <AlertCircle className="h-3.5 w-3.5" />,
        };
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!selectedMedegdel) return;
    setTailbarText(selectedMedegdel.tailbar || "");
    setPendingStatusChange({
      id: selectedMedegdel._id,
      newStatus,
      oldStatus: selectedMedegdel.status || "pending",
    });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    try {
      // Find the current item to get its data
      const currentItem = medegdelList.find(
        (item) => item._id === pendingStatusChange.id,
      );
      if (!currentItem) return;

      const response = await uilchilgee(token || undefined).put(
        `/medegdel/${pendingStatusChange.id}`,
        {
          baiguullagiinId: ajiltan?.baiguullagiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
          barilgiinId: ajiltan?.barilgiinId,
          orshinSuugchId: currentItem.orshinSuugchId,
          title: currentItem.title,
          message: currentItem.message,
          kharsanEsekh: currentItem.kharsanEsekh,
          status: pendingStatusChange.newStatus,
          tailbar: tailbarText.trim() || undefined,
          repliedBy: ajiltan?._id,
          updatedAt: new Date().toISOString(),
        },
      );

      if (response.data.success) {
        setMedegdelList((prev) =>
          prev.map((item) =>
            item._id === pendingStatusChange.id
              ? { ...item, status: pendingStatusChange.newStatus }
              : item,
          ),
        );
        setSelectedMedegdel((prev) =>
          prev
            ? {
              ...prev,
              status: pendingStatusChange.newStatus,
              tailbar: tailbarText.trim() || prev.tailbar,
            }
            : null,
        );
        setMedegdelList((prev) =>
          prev.map((item) =>
            item._id === pendingStatusChange.id
              ? { ...item, tailbar: tailbarText.trim() || item.tailbar }
              : item,
          ),
        );
        notification.success({ message: t("Төлөв амжилттай шинэчлэгдлээ") });
      }
    } catch (error) {
      notification.error({ message: t("Төлөв шинэчлэхэд алдаа гарлаа") });
    } finally {
      setPendingStatusChange(null);
      setTailbarText("");
    }
  };

  const turulToLabel = (turul: string | undefined): string => {
    const t = (turul ?? "").toLowerCase().trim();
    if (t === "sanal" || t === "санал") return "Санал";
    if (t === "gomdol" || t === "гомдол") return "Гомдол";
    if (
      t === "app" ||
      t === "мессеж" ||
      t === "mail" ||
      t === "мэдэгдэл" ||
      t === "medegdel"
    )
      return "Мэдэгдэл";
    return turul ?? "";
  };

  const isSanal = (t: string | undefined) => {
    const x = (t ?? "").toLowerCase().trim();
    return x === "sanal" || x === "санал";
  };
  const isGomdol = (t: string | undefined) => {
    const x = (t ?? "").toLowerCase().trim();
    return x === "gomdol" || x === "гомдол";
  };
  const rootList = medegdelList.filter(
    (item) => (item.turul ?? "").toLowerCase() !== "user_reply",
  );
  const statusOf = (i: MedegdelItem) => i.status || "pending";
  const dashboardCounts = {
    all: rootList.length,
    pending: rootList.filter((i) => statusOf(i) === "pending").length,
    unread: rootList.filter((i) => statusOf(i) === "pending" && !i.kharsanEsekh)
      .length,
    done: rootList.filter((i) => statusOf(i) === "done").length,
    rejected: rootList.filter((i) => statusOf(i) === "rejected").length,
    gomdol: rootList.filter((i) => isGomdol(i.turul)).length,
    sanal: rootList.filter((i) => isSanal(i.turul)).length,
  };

  const kpiCards: {
    id: string;
    key: "all" | "pending" | "done" | "rejected";
    label: string;
    value: number;
    sub?: string;
    dot?: string;
  }[] = [
    {
      id: "feedback-filter-all",
      key: "all",
      label: t("Нийт хүсэлт"),
      value: dashboardCounts.all,
      sub: `${t("Санал")} ${dashboardCounts.sanal} · ${t("Гомдол")} ${dashboardCounts.gomdol}`,
    },
    {
      id: "feedback-filter-pending",
      key: "pending",
      label: t("Хүлээгдэж байна"),
      value: dashboardCounts.pending,
      sub:
        dashboardCounts.unread > 0
          ? `${dashboardCounts.unread} ${t("шинэ")}`
          : undefined,
      dot: "bg-warning",
    },
    {
      id: "feedback-filter-done",
      key: "done",
      label: t("Шийдэгдсэн"),
      value: dashboardCounts.done,
      dot: "bg-success",
    },
    {
      id: "feedback-filter-rejected",
      key: "rejected",
      label: t("Татгалзсан"),
      value: dashboardCounts.rejected,
      dot: "bg-danger",
    },
  ];

  const setDashboardFilter = (key: "all" | "pending" | "done" | "rejected") => {
    if (key === "all") {
      setFilterType("all");
      setFilterStatus("all");
      return;
    }
    setFilterStatus((prev) => (prev === key ? "all" : key));
  };

  const residentOf = (item: MedegdelItem | null | undefined) =>
    item?.orshinSuugchId ? residentsMap[item.orshinSuugchId] : undefined;

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filterType !== "all" ||
    filterStatus !== "all" ||
    !!dateRange;

  const filteredList = medegdelList.filter((item) => {
    // Don't show user_reply as separate list rows (they appear in thread view)
    const type = item.turul?.toLowerCase() || "";
    if (type === "user_reply") return false;

    const q = searchTerm.trim().toLowerCase();
    const res = residentOf(item);
    const matchesSearch =
      !q ||
      [item.title, item.message, res?.ner, res?.toot, res?.utas].some((v) =>
        (v || "").toLowerCase().includes(q),
      );

    // Type Filter
    const matchesType =
      filterType === "all"
        ? true
        : filterType === "sanal"
          ? type.includes("sanal") || type.includes("санал")
          : type.includes("gomdol") || type.includes("гомдол");

    // Status Filter
    const status = item.status || "pending";
    const matchesStatus =
      filterStatus === "all" ? true : status === filterStatus;

    // Date Filter (createdAt, inclusive)
    let matchesDate = true;
    if (dateRange) {
      const created = moment(item.createdAt);
      matchesDate =
        !created.isBefore(moment(dateRange[0]).startOf("day")) &&
        !created.isAfter(moment(dateRange[1]).endOf("day"));
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterStatus("all");
    setDateRange(null);
  };

  const initialsOf = (name?: string) => {
    const n = (name || "").trim();
    if (!n) return "";
    const parts = n.split(/\s+/);
    return (parts.length > 1 ? parts[parts.length - 1][0] : n[0]).toUpperCase();
  };

  const formatListTime = (d: string) => {
    const m = moment(d);
    if (m.isSame(moment(), "day")) return m.format("HH:mm");
    if (m.isSame(moment(), "year")) return m.format("MM/DD");
    return m.format("YYYY-MM-DD");
  };

  const formatDayLabel = (d: string) => {
    const m = moment(d);
    if (m.isSame(moment(), "day")) return t("Өнөөдөр");
    if (m.isSame(moment().subtract(1, "day"), "day")) return t("Өчигдөр");
    return m.format("YYYY-MM-DD");
  };

  const statusOptions: { value: string; label: string; icon: React.ReactNode; active: string }[] = [
    {
      value: "pending",
      label: t("Хүлээгдэж байна"),
      icon: <Clock className="h-3.5 w-3.5" />,
      active: "bg-warning/10 text-warning",
    },
    {
      value: "done",
      label: t("Шийдэгдсэн"),
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      active: "bg-success/10 text-success",
    },
    {
      value: "rejected",
      label: t("Татгалзсан"),
      icon: <XCircle className="h-3.5 w-3.5" />,
      active: "bg-danger/10 text-danger",
    },
  ];

  const selectedResident = residentOf(selectedMedegdel);
  const currentStatusValue = selectedMedegdel
    ? pendingStatusChange?.id === selectedMedegdel._id
      ? pendingStatusChange.newStatus
      : selectedMedegdel.status || "pending"
    : "pending";

  const typePill = (turul: string | undefined) =>
    isSanal(turul)
      ? "bg-theme/10 text-brand"
      : isGomdol(turul)
        ? "bg-danger/10 text-danger"
        : "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]";

  const iconBtn =
    "btn-minimal inline-flex h-9 w-9 shrink-0 items-center justify-center text-[color:var(--muted-text)] hover:text-brand disabled:opacity-50";

  return (
    <>
    <div className="flex w-full flex-col gap-3 pb-14 text-[color:var(--panel-text)]">
      {/* Toolbar */}
      <div className={`flex-wrap items-center gap-2 ${showDetail ? "hidden md:flex" : "flex"}`}>
        <label id="feedback-search" className="filter-field w-full sm:w-[280px]">
          <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
          <input
            type="text"
            aria-label={t("Хайх")}
            placeholder={t("Гарчиг, нэр, тоот, утас...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label={t("Хайлт цэвэрлэх")}
              className="shrink-0 rounded p-0.5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
        <div id="feedback-filters" className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <FilterSelect
            id="feedback-filter-type-select"
            label={t("Төрөл")}
            value={filterType === "all" ? "" : filterType}
            onChange={(v) => setFilterType(v || "all")}
            options={[
              { value: "sanal", label: t("Санал") },
              { value: "gomdol", label: t("Гомдол") },
            ]}
            className="max-w-[220px]"
          />
          <FilterSelect
            id="feedback-filter-status-select"
            label={t("Төлөв")}
            value={filterStatus === "all" ? "" : filterStatus}
            onChange={(v) => setFilterStatus(v || "all")}
            options={[
              { value: "pending", label: t("Хүлээгдэж байна") },
              { value: "done", label: t("Шийдэгдсэн") },
              { value: "rejected", label: t("Татгалзсан") },
            ]}
            className="max-w-[240px]"
          />
          <FilterDatePicker
            value={dateRange}
            onChange={(_dates, strs) =>
              setDateRange(strs && strs[0] && strs[1] ? [strs[0], strs[1]] : null)
            }
            className="w-full sm:w-[260px]"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="btn-minimal inline-flex h-9 items-center gap-1.5 !px-3 text-[13px]"
            >
              <X className="h-3.5 w-3.5" />
              {t("Цэвэрлэх")}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              ajiltan?.baiguullagiinId &&
              fetchMedegdelData(ajiltan.baiguullagiinId, { keepSelection: true })
            }
            disabled={loading}
            className="btn-minimal inline-flex h-9 items-center gap-1.5 !px-3 text-[13px] disabled:opacity-50"
            title={t("Шинэчлэх")}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("Шинэчлэх")}</span>
          </button>
        </div>
      </div>

      {/* KPI cards: click to filter by status */}
      <div
        id="feedback-stats"
        className={`grid-cols-2 gap-3 lg:grid-cols-4 ${showDetail ? "hidden md:grid" : "grid"}`}
      >
        {kpiCards.map((k) => {
          const active =
            k.key === "all"
              ? filterStatus === "all" && filterType === "all"
              : filterStatus === k.key;
          return (
            <button
              key={k.key}
              id={k.id}
              type="button"
              onClick={() => setDashboardFilter(k.key)}
              className={`rounded-2xl border bg-[color:var(--surface-bg)] px-5 py-4 text-left shadow-[var(--ctl-shadow)] transition-colors cursor-pointer ${
                active && k.key !== "all"
                  ? "border-theme ring-2 ring-theme/20"
                  : "border-[color:var(--ctl-border)] hover:border-[color:var(--ctl-border-hover)]"
              }`}
            >
              <div className="text-2xl font-medium leading-tight tabular-nums text-[color:var(--panel-text)]">
                {loading && medegdelList.length === 0 ? (
                  <span className="inline-block h-7 w-10 animate-pulse rounded-md bg-[color:var(--surface-hover)]" />
                ) : (
                  k.value
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[color:var(--muted-text)]">
                {k.dot && <span className={`h-1.5 w-1.5 rounded-full ${k.dot}`} />}
                <span>{k.label}</span>
                {k.sub && (
                  <span className="text-[11px] text-[color:var(--muted-text)] opacity-80">
                    · {k.sub}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Master / detail */}
      <div className="flex min-h-0 gap-3 md:h-[calc(100vh-17rem)] md:min-h-[520px]">
        {/* List */}
        <div
          className={`w-full md:w-[340px] lg:w-[380px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] shadow-[var(--ctl-shadow)] ${showDetail ? "hidden md:flex" : "flex"}`}
        >
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[color:var(--ctl-border)] px-4">
            <span className="text-[13px] font-medium">{t("Хүсэлтүүд")}</span>
            <span className="text-xs tabular-nums text-[color:var(--muted-text)]">
              {filteredList.length}
              {hasActiveFilters ? ` / ${dashboardCounts.all}` : ""}
            </span>
          </div>
          <div
            id="sanal-list"
            className="custom-scrollbar flex-1 overflow-y-auto md:min-h-0"
          >
            {loading && medegdelList.length === 0 ? (
              <div className="divide-y divide-[color:var(--ctl-border)]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3.5">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[color:var(--surface-hover)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-[color:var(--surface-hover)]" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-[color:var(--surface-hover)]" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-[color:var(--surface-hover)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-hover)]">
                  <MessageSquare className="h-5 w-5 text-[color:var(--muted-text)]" />
                </div>
                <div className="text-[13px] text-[color:var(--muted-text)]">
                  {hasActiveFilters ? t("Илэрц олдсонгүй") : t("Санал хүсэлт ирээгүй байна")}
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn-minimal h-9 !px-3 text-[13px]"
                  >
                    {t("Шүүлтүүр цэвэрлэх")}
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--ctl-border)]">
                {filteredList.map((item) => {
                  const status = getStatusInfo(item.status);
                  const isSelected = selectedMedegdel?._id === item._id;
                  const res = residentOf(item);
                  const isNew = statusOf(item) === "pending" && !item.kharsanEsekh;
                  return (
                    <li key={item._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMedegdel(item);
                          setShowDetail(true);
                        }}
                        className={`relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-theme/10"
                            : "hover:bg-[color:var(--surface-hover)]"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-theme" />
                        )}
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-medium ${
                            isGomdol(item.turul) ? "bg-danger/10 text-danger" : "bg-theme/10 text-brand"
                          }`}
                        >
                          {initialsOf(res?.ner) || <User className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`min-w-0 flex-1 truncate text-[13px] ${isNew ? "font-medium" : ""} text-[color:var(--panel-text)]`}>
                              {res?.ner || t("Оршин суугч")}
                              {res?.toot && (
                                <span className="ml-1.5 text-xs font-normal text-[color:var(--muted-text)]">
                                  {res.toot} {t("тоот")}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-[11px] tabular-nums text-[color:var(--muted-text)]">
                              {formatListTime(item.updatedAt || item.createdAt)}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[13px] text-[color:var(--panel-text)]">
                            {item.title}
                          </div>
                          {item.message && (
                            <div className="mt-0.5 line-clamp-1 text-xs text-[color:var(--muted-text)]">
                              {item.message}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${typePill(item.turul)}`}>
                              {turulToLabel(item.turul)}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${status.pill}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                            {isNew && (
                              <span className="ml-auto h-2 w-2 rounded-full bg-theme" aria-label={t("Шинэ")} />
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Detail */}
        <div
          className={`min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--surface-bg)] ${
            showDetail
              ? "fixed inset-0 z-50 flex md:static md:z-auto md:rounded-2xl md:border md:border-[color:var(--ctl-border)] md:shadow-[var(--ctl-shadow)]"
              : "hidden md:flex md:rounded-2xl md:border md:border-[color:var(--ctl-border)] md:shadow-[var(--ctl-shadow)]"
          }`}
        >
          {selectedMedegdel ? (
            <>
              {/* Detail header */}
              <div className="shrink-0 border-b border-[color:var(--ctl-border)] px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDetail(false)}
                      className="-ml-1 flex shrink-0 rounded-[10px] p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] md:hidden"
                      aria-label={t("Буцах")}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                        isGomdol(selectedMedegdel.turul) ? "bg-danger/10 text-danger" : "bg-theme/10 text-brand"
                      }`}
                    >
                      {initialsOf(selectedResident?.ner) || <User className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-medium">
                          {selectedResident?.ner || t("Оршин суугч")}
                        </span>
                        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] ${typePill(selectedMedegdel.turul)}`}>
                          {turulToLabel(selectedMedegdel.turul)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[color:var(--muted-text)]">
                        {selectedResident?.toot && (
                          <span className="inline-flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {selectedResident.toot} {t("тоот")}
                          </span>
                        )}
                        {selectedResident?.utas && (
                          <a
                            href={`tel:${selectedResident.utas}`}
                            className="inline-flex items-center gap-1 hover:text-brand"
                          >
                            <Phone className="h-3 w-3" />
                            {selectedResident.utas}
                          </a>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {moment(selectedMedegdel.createdAt).format("YYYY-MM-DD HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status segmented control */}
                  <div
                    role="radiogroup"
                    aria-label={t("Төлөв")}
                    className="flex w-full shrink-0 items-center gap-0.5 rounded-[10px] border border-[color:var(--ctl-border)] p-0.5 sm:w-auto"
                  >
                    {statusOptions.map((o) => {
                      const active = currentStatusValue === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            if (o.value === (selectedMedegdel.status || "pending")) {
                              setPendingStatusChange(null);
                              setTailbarText("");
                              return;
                            }
                            handleStatusChange(o.value);
                          }}
                          className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-xs transition-colors cursor-pointer sm:flex-none ${
                            active
                              ? `${o.active} font-medium`
                              : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
                          }`}
                        >
                          {o.icon}
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedMedegdel.title && (
                  <div className="mt-2.5 text-[13px] text-[color:var(--panel-text)]">
                    {selectedMedegdel.title}
                  </div>
                )}

                {/* Pending status change: explanation + confirm */}
                <AnimatePresence>
                  {pendingStatusChange?.id === selectedMedegdel._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 rounded-xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-hover)] p-3">
                        <div className="mb-2 flex items-center gap-1.5 text-xs text-[color:var(--muted-text)]">
                          <span>{getStatusInfo(pendingStatusChange.oldStatus).label}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${getStatusInfo(pendingStatusChange.newStatus).pill}`}>
                            {getStatusInfo(pendingStatusChange.newStatus).label}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <label className="filter-field min-w-0 flex-1">
                            <input
                              type="text"
                              value={tailbarText}
                              onChange={(e) => setTailbarText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  confirmStatusChange();
                                }
                              }}
                              placeholder={
                                pendingStatusChange.newStatus === "done"
                                  ? t("Шийдвэрийн тайлбар (хэрэглэгчид илгээгдэнэ)...")
                                  : t("Татгалзсан шалтгаанаа бичнэ үү (хэрэглэгчид илгээгдэнэ)...")
                              }
                              autoFocus
                            />
                          </label>
                          <div className="flex shrink-0 items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPendingStatusChange(null);
                                setTailbarText("");
                              }}
                              className="btn-minimal h-9 !px-3 text-[13px]"
                            >
                              {t("Болих")}
                            </button>
                            <button
                              type="button"
                              onClick={confirmStatusChange}
                              className="inline-flex h-9 items-center rounded-[10px] bg-theme px-4 text-[13px] font-medium !text-white transition hover:opacity-90 cursor-pointer"
                            >
                              {t("Батлах")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Thread */}
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[color:var(--surface-hover)]/40 px-4 py-4">
                {threadLoading && displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-[color:var(--muted-text)]">
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                    <span className="text-xs">{t("Уншиж байна...")}</span>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[color:var(--muted-text)]">
                    <MessageSquare className="h-7 w-7 opacity-40" />
                    <span className="text-xs">{t("Харилцаа байхгүй")}</span>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-2.5">
                    {displayMessages.map((msg, idx) => {
                      const turul = (msg.turul || "").toLowerCase();
                      const isAdminReply =
                        turul === "khariu" ||
                        turul === "hariu" ||
                        turul === "хариу";
                      const isUser = isAdminReply;
                      const prev = idx > 0 ? displayMessages[idx - 1] : null;
                      const showDay =
                        !prev || !moment(prev.createdAt).isSame(moment(msg.createdAt), "day");

                      return (
                        <React.Fragment key={msg._id || `msg-${idx}`}>
                          {showDay && (
                            <div className="my-1 flex justify-center">
                              <span className="rounded-full bg-[color:var(--surface-bg)] px-2.5 py-0.5 text-[11px] text-[color:var(--muted-text)] shadow-[var(--ctl-shadow)]">
                                {formatDayLabel(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] sm:max-w-[70%] ${
                                isUser
                                  ? "rounded-br-md bg-theme text-white"
                                  : "rounded-bl-md border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)]"
                              }`}
                            >
                              <div
                                className={`mb-0.5 text-[11px] ${
                                  isUser ? "text-white/75" : "text-brand"
                                }`}
                              >
                                {isUser
                                  ? t("Админ")
                                  : msg.orshinSuugchId && residentsMap[msg.orshinSuugchId]
                                  ? residentsMap[msg.orshinSuugchId].ner
                                  : t("Оршин суугч")}
                              </div>

                              {msg.zurag &&
                                (() => {
                                  const paths = String(msg.zurag)
                                    .split(",")
                                    .map((p) => normalizeMedegdelAssetPath(p.trim()))
                                    .filter(Boolean);
                                  const base = getApiUrl().replace(/\/$/, "");
                                  return paths.length ? (
                                    <div className="my-1.5 flex flex-wrap gap-1.5">
                                      {paths.map((path, i) => {
                                        const url = `${base}/medegdel/${path}`;
                                        return (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => setImagePreviewUrl(url)}
                                            className="block max-w-[160px] cursor-zoom-in overflow-hidden rounded-xl transition-opacity hover:opacity-90"
                                          >
                                            <img
                                              src={url}
                                              alt=""
                                              className="h-auto max-h-40 w-full object-cover"
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : null;
                                })()}

                              {msg.duu &&
                                (() => {
                                  const path = normalizeMedegdelAssetPath(msg.duu);
                                  const audioUrl = path
                                    ? `${getApiUrl().replace(/\/$/, "")}/medegdel/${path}`
                                    : "";
                                  return audioUrl ? (
                                    <div className="my-1.5">
                                      <audio controls src={audioUrl} className="h-8 max-w-full" />
                                    </div>
                                  ) : null;
                                })()}

                              {msg.message ? (
                                <p className="whitespace-pre-wrap break-words leading-relaxed">
                                  {msg.message}
                                </p>
                              ) : null}

                              <div
                                className={`mt-1 flex items-center justify-end gap-1 text-[11px] tabular-nums ${
                                  isUser ? "text-white/75" : "text-[color:var(--muted-text)]"
                                }`}
                              >
                                <span>{moment(msg.createdAt).format("HH:mm")}</span>
                                {isUser && msg.kharsanEsekh && (
                                  <CheckCheck className="h-3 w-3" aria-hidden />
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {/* Legacy admin tailbar (if present and not already in displayMessages) */}
                    {selectedMedegdel.tailbar &&
                      !displayMessages.some((m) => m.message === selectedMedegdel.tailbar) && (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-theme px-3.5 py-2.5 text-[13px] text-white sm:max-w-[70%]">
                            <div className="mb-0.5 text-[11px] text-white/75">
                              {t("Хариу тайлбар (Админ)")}
                            </div>
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {selectedMedegdel.tailbar}
                            </p>
                            {selectedMedegdel.repliedAt && (
                              <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-white/75">
                                <CheckCircle className="h-3 w-3" />
                                <span>{moment(selectedMedegdel.repliedAt).format("YYYY-MM-DD HH:mm")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer (sticky bottom) */}
              <div className="shrink-0 border-t border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <input
                  ref={replyImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setReplyImage(f);
                    e.target.value = "";
                  }}
                />

                {(replyImage || replyVoiceBlob || recording) && (
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {replyImage && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-theme/10 py-1 pl-2.5 pr-1 text-xs text-brand">
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span className="max-w-[160px] truncate">{replyImage.name}</span>
                        <button
                          type="button"
                          onClick={() => setReplyImage(null)}
                          className="rounded-full p-0.5 hover:bg-theme/15 cursor-pointer"
                          aria-label={t("Хасах")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {replyVoiceBlob && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-theme/10 py-1 pl-2.5 pr-1 text-xs text-brand">
                        <Mic className="h-3.5 w-3.5" />
                        <span>{t("Дуу")}</span>
                        <button
                          type="button"
                          onClick={() => setReplyVoiceBlob(null)}
                          className="rounded-full p-0.5 hover:bg-theme/15 cursor-pointer"
                          aria-label={t("Хасах")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {recording && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-xs text-danger">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" />
                        {t("Бичиж байна...")}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => replyImageInputRef.current?.click()}
                    disabled={replySending}
                    className={iconBtn}
                    title={t("Зураг хавсаргах")}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>

                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={replySending}
                      className={iconBtn}
                      title={t("Дуу бичих")}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-danger/40 bg-danger/10 text-danger cursor-pointer"
                      title={t("Зогсоох")}
                    >
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <div className="flex min-h-9 flex-1 items-center rounded-[10px] border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-3 shadow-[var(--ctl-shadow)] transition focus-within:border-theme focus-within:shadow-[var(--ctl-focus-ring)]">
                    <textarea
                      rows={1}
                      value={replyInput}
                      onChange={(e) => {
                        setReplyInput(e.target.value);
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendAdminReply();
                        }
                      }}
                      placeholder={t("Хариу бичих...")}
                      className="block max-h-[120px] w-full resize-none bg-transparent py-2 text-[13px] leading-5 text-[color:var(--panel-text)] outline-none placeholder:text-[color:var(--muted-text)]"
                      disabled={replySending}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={sendAdminReply}
                    disabled={
                      replySending ||
                      (!replyInput.trim() && !replyImage && !replyVoiceBlob)
                    }
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-theme !text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer sm:w-auto sm:gap-1.5 sm:px-4 sm:text-[13px] sm:font-medium"
                    title={t("Илгээх")}
                  >
                    {replySending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{t("Илгээх")}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-[color:var(--muted-text)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--surface-hover)]">
                <MessageSquare className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-[13px]">{t("Дэлгэрэнгүй харах мэдээллийг сонгоно уу")}</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {imagePreviewUrl && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={() => setImagePreviewUrl(null)}
      >
        <div
          className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imagePreviewUrl}
            alt="Зураг"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setImagePreviewUrl(null)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            aria-label="Хаах"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
