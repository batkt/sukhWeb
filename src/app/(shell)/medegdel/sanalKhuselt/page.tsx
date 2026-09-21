"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { notification, Select } from "antd";
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
          color: "text-warning",
          bg: "bg-warning/10",
          border: "border-warning/30",
          icon: <Clock className="w-4 h-4" />,
        };
      case "done":
        return {
          label: t("Шийдэгдсэн"),
          color: "text-theme dark:text-theme",
          bg: "bg-theme/10 dark:bg-theme/30",
          border: "border-theme/30 dark:border-theme",
          icon: <CheckCircle className="w-4 h-4" />,
        };
      case "rejected":
        return {
          label: t("Татгалзсан"),
          color: "text-danger",
          bg: "bg-danger/10",
          border: "border-danger/30",
          icon: <XCircle className="w-4 h-4" />,
        };
      default:
        return {
          label: t("Тодорхойгүй"),
          color: "text-[color:var(--muted-text)]",
          bg: "bg-[color:var(--surface-hover)]",
          border: "border-[color:var(--surface-border)]",
          icon: <AlertCircle className="w-4 h-4" />,
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
  const dashboardCounts = {
    all: rootList.length,
    shiidegdsen: rootList.filter((i) => (i.status || "pending") === "done")
      .length,
    gomdol: rootList.filter((i) => isGomdol(i.turul)).length,
    sanal: rootList.filter((i) => isSanal(i.turul)).length,
  };
  const dashboardActive = {
    all: filterType === "all" && filterStatus === "all",
    shiidegdsen: filterStatus === "done" && filterType === "all",
    gomdol: filterType === "gomdol" && filterStatus === "all",
    sanal: filterType === "sanal" && filterStatus === "all",
  };
  const setDashboardFilter = (
    key: "all" | "shiidegdsen" | "gomdol" | "sanal",
  ) => {
    if (key === "all") {
      setFilterType("all");
      setFilterStatus("all");
      return;
    }
    if (key === "shiidegdsen") {
      setFilterStatus("done");
      setFilterType("all");
      return;
    }
    if (key === "gomdol") {
      setFilterType("gomdol");
      setFilterStatus("all");
      return;
    }
    if (key === "sanal") {
      setFilterType("sanal");
      setFilterStatus("all");
      return;
    }
  };

  const filteredList = medegdelList.filter((item) => {
    // Don't show user_reply as separate list rows (they appear in thread view)
    const type = item.turul?.toLowerCase() || "";
    if (type === "user_reply") return false;

    const matchesSearch = item.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

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

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <>
    <div className="h-[calc(100vh-64px)] p-3 sm:p-4 md:p-5 flex flex-col gap-3 overflow-hidden relative">
      <div className="flex-1 flex gap-3.5 min-h-0 relative">
        {/* Left Panel: List */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`w-full md:w-[360px] lg:w-[400px] flex-col gap-3 shrink-0 ${showDetail ? "hidden md:flex" : "flex"}`}
        >
          {/* Dashboard: counts, click to filter list */}
          <div id="feedback-stats" className="grid grid-cols-4 gap-1.5 shrink-0">
            <button
              id="feedback-filter-all"
              type="button"
              onClick={() => setDashboardFilter("all")}
              className={`rounded-xl border p-2 text-center transition-all cursor-pointer ${dashboardActive.all
                ? "border-theme bg-theme/10 text-theme dark:text-theme"
                : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--surface-hover)] text-theme"
                }`}
            >
              <div className="text-base font-normal">{dashboardCounts.all}</div>
              <div className="text-[10px] opacity-80">{t("Бүгд")}</div>
            </button>
            <button
              id="feedback-filter-done"
              type="button"
              onClick={() => setDashboardFilter("shiidegdsen")}
              className={`rounded-xl border p-2 text-center transition-all cursor-pointer ${dashboardActive.shiidegdsen
                ? "border-theme bg-theme/10 text-theme dark:text-theme"
                : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--surface-hover)] text-theme"
                }`}
            >
              <div className="text-base font-normal">{dashboardCounts.shiidegdsen}</div>
              <div className="text-[10px] opacity-80">{t("Шийдэгдсэн")}</div>
            </button>
            <button
              id="feedback-filter-gomdol"
              type="button"
              onClick={() => setDashboardFilter("gomdol")}
              className={`rounded-xl border p-2 text-center transition-all cursor-pointer ${dashboardActive.gomdol
                ? "border-danger bg-danger/10 text-danger"
                : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--surface-hover)] text-theme"
                }`}
            >
              <div className="text-base font-normal">{dashboardCounts.gomdol}</div>
              <div className="text-[10px] opacity-80">{t("Гомдол")}</div>
            </button>
            <button
              id="feedback-filter-sanal"
              type="button"
              onClick={() => setDashboardFilter("sanal")}
              className={`rounded-xl border p-2 text-center transition-all cursor-pointer ${dashboardActive.sanal
                ? "border-theme bg-theme/10 text-theme dark:text-theme"
                : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--surface-hover)] text-theme"
                }`}
            >
              <div className="text-base font-normal">{dashboardCounts.sanal}</div>
              <div className="text-[10px] opacity-80">{t("Санал")}</div>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-2">
            <div id="feedback-search" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[color:var(--muted-text)]" />
              <input
                type="text"
                placeholder={t("Хайх...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 h-9 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] text-xs focus:outline-none focus:ring-1 focus:ring-theme transition-all"
              />
            </div>
            <div id="feedback-filters" className="grid grid-cols-2 gap-2">
              <Select
                id="feedback-filter-type-select"
                value={filterType}
                onChange={setFilterType}
                className="w-full"
                size="middle"
                classNames={{
                  popup: {
                    root: "rounded-xl border border-[color:var(--surface-border)] shadow-xl",
                  },
                }}
                options={[
                  { value: "all", label: t("Бүгд") },
                  { value: "sanal", label: t("Санал") },
                  { value: "gomdol", label: t("Гомдол") },
                ]}
              />
              <Select
                id="feedback-filter-status-select"
                value={filterStatus}
                onChange={setFilterStatus}
                className="w-full"
                size="middle"
                classNames={{
                  popup: {
                    root: "rounded-xl border border-[color:var(--surface-border)] shadow-xl",
                  },
                }}
                options={[
                  { value: "all", label: t("Бүх төлөв") },
                  { value: "pending", label: t("Хүлээгдэж байна") },
                  { value: "done", label: t("Шийдэгдсэн") },
                  { value: "rejected", label: t("Татгалзсан") },
                ]}
              />
            </div>
          </div>

          <div
            id="sanal-list"
            className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3"
          >
            {loading ? (
              <div className="py-10 text-center text-theme text-sm">
                {t("Уншиж байна...")}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-3 opacity-60">
                <div className="w-12 h-12 rounded-full bg-[color:var(--surface-hover)] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-theme" />
                </div>
                <div className="text-theme text-sm">
                  {t("Илэрц олдсонгүй")}
                </div>
              </div>
            ) : (
              filteredList.map((item) => {
                const status = getStatusInfo(item.status);
                const isSelected = selectedMedegdel?._id === item._id;

                return (
                  <motion.div
                    key={item._id}
                    layoutId={item._id}
                    onClick={() => {
                      setSelectedMedegdel(item);
                      setShowDetail(true);
                    }}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${isSelected
                      ? "bg-theme/20 dark:bg-theme/20 border-theme/30 dark:border-theme shadow-sm"
                      : "bg-[color:var(--surface-bg)] border-[color:var(--surface-border)] hover:border-theme/50 hover:bg-[color:var(--surface-hover)]"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-2xl text-[10px]  tracking-wide border ${(item.turul?.toLowerCase() || "").includes(
                            "sanal",
                          ) || (item.turul ?? "").includes("санал")
                            ? "bg-theme/15 text-theme dark:text-theme border-theme/50"
                            : "bg-danger/15 text-danger border-danger/50"
                            }`}
                        >
                          {turulToLabel(item.turul)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-2xl text-[10px]  tracking-wide border ${status.bg} ${status.color} ${status.border} bg-opacity-50`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-theme ">
                        {moment(item.createdAt).fromNow()}
                      </span>
                    </div>
                    <h3
                      className={`text-sm  mb-1 line-clamp-1 ${isSelected ? "text-theme dark:text-theme" : "text-theme"}`}
                    >
                      {item.title}
                    </h3>
                    {item.orshinSuugchId &&
                      residentsMap[item.orshinSuugchId] && (
                        <div className="mb-2 p-2 rounded-xl bg-theme/60 dark:bg-theme/10 border border-theme/60 dark:border-theme/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <User className="w-3 h-3 text-theme shrink-0" />
                            <span className="text-[10px] text-theme dark:text-theme shrink-0">Нэр:</span>
                            <span className="text-[11px] font-semibold text-theme dark:text-theme truncate">
                              {residentsMap[item.orshinSuugchId].ner}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {residentsMap[item.orshinSuugchId].toot && (
                              <div className="flex items-center gap-1">
                                <Home className="w-3 h-3 text-theme shrink-0" />
                                <span className="text-[10px] text-theme dark:text-theme shrink-0">Тоот:</span>
                                <span className="text-[10px] text-theme dark:text-theme">
                                  {residentsMap[item.orshinSuugchId].toot}
                                </span>
                              </div>
                            )}
                            {residentsMap[item.orshinSuugchId].utas && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-theme shrink-0" />
                                <span className="text-[10px] text-theme dark:text-theme shrink-0">Утас:</span>
                                <span className="text-[10px] text-theme dark:text-theme">
                                  {residentsMap[item.orshinSuugchId].utas}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    <p className="text-xs text-theme line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {isSelected && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-theme" />
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Right Panel: Detail */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`flex-1 bg-transparent border-[color:var(--surface-border)] border rounded-3xl shadow-sm overflow-hidden flex flex-col ${showDetail ? "fixed inset-0 z-50 m-0 rounded-none md:static md:z-auto md:m-0 md:rounded-3xl" : "hidden md:flex"}`}
        >
          {selectedMedegdel ? (
            <>
              {/* Detail Header - Sleek, Compact & High-Density */}
              <div className="px-4 py-2.5 sm:py-3 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Mobile back button + Avatar + Resident Info + Subject */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Mobile Back Button */}
                    <button
                      type="button"
                      onClick={() => setShowDetail(false)}
                      className="flex md:hidden p-1.5 -ml-1 rounded-xl hover:bg-[color:var(--surface-hover)] text-theme shrink-0"
                      aria-label="Буцах"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Avatar Circle */}
                    <div className="w-9 h-9 rounded-xl bg-theme/10 text-theme dark:text-theme flex items-center justify-center shrink-0 border border-theme/20">
                      <User className="w-4 h-4" />
                    </div>

                    {/* Resident Info & Topic Title */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium text-[color:var(--panel-text)] truncate">
                          {selectedMedegdel.orshinSuugchId &&
                          residentsMap[selectedMedegdel.orshinSuugchId]?.ner
                            ? residentsMap[selectedMedegdel.orshinSuugchId].ner
                            : "Оршин суугч"}
                        </span>
                        {selectedMedegdel.orshinSuugchId &&
                          residentsMap[selectedMedegdel.orshinSuugchId]?.toot && (
                            <span className="px-1.5 py-0.2 rounded-md bg-theme/10 dark:bg-theme/20 text-theme dark:text-theme text-[10px] font-normal shrink-0 border border-theme/60 dark:border-theme/40">
                              {residentsMap[selectedMedegdel.orshinSuugchId].toot} тоот
                            </span>
                          )}
                        {selectedMedegdel.orshinSuugchId &&
                          residentsMap[selectedMedegdel.orshinSuugchId]?.utas && (
                            <a
                              href={`tel:${residentsMap[selectedMedegdel.orshinSuugchId].utas}`}
                              className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[color:var(--muted-text)] hover:text-theme transition-colors"
                            >
                              <Phone className="w-3 h-3 text-[color:var(--muted-text)]" />
                              <span>{residentsMap[selectedMedegdel.orshinSuugchId].utas}</span>
                            </a>
                          )}
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-normal border shrink-0 ${
                            isSanal(selectedMedegdel.turul)
                              ? "bg-theme/10 text-theme dark:text-theme border-theme/40"
                              : "bg-danger/10 text-danger border-danger/40"
                          }`}
                        >
                          {turulToLabel(selectedMedegdel.turul)}
                        </span>
                      </div>

                      {/* Request title & timestamp */}
                      <div className="flex items-center gap-2 text-xs text-[color:var(--muted-text)] mt-0.5">
                        <span
                          className="truncate max-w-[220px] sm:max-w-[420px] font-normal text-[color:var(--muted-text)]"
                          title={selectedMedegdel.title}
                        >
                          {selectedMedegdel.title}
                        </span>
                        <span className="text-[10px] text-[color:var(--muted-text)] shrink-0">
                          • {moment(selectedMedegdel.createdAt).format("YYYY-MM-DD HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Dropdown */}
                  <div className="shrink-0 flex items-center gap-2">
                    <Select
                      value={
                        pendingStatusChange?.id === selectedMedegdel._id
                          ? pendingStatusChange.newStatus
                          : selectedMedegdel.status || "pending"
                      }
                      onChange={handleStatusChange}
                      className="w-[135px] sm:w-[155px]"
                      size="middle"
                      options={[
                        {
                          value: "pending",
                          label: (
                            <span className="flex items-center gap-1.5 text-xs text-warning font-normal">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{t("Хүлээгдэж байна")}</span>
                            </span>
                          ),
                        },
                        {
                          value: "done",
                          label: (
                            <span className="flex items-center gap-1.5 text-xs text-theme dark:text-theme font-normal">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{t("Шийдэгдсэн")}</span>
                            </span>
                          ),
                        },
                        {
                          value: "rejected",
                          label: (
                            <span className="flex items-center gap-1.5 text-xs text-danger font-normal">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t("Татгалзсан")}</span>
                            </span>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* Inline banner for Pending Status Change Decision Explanation */}
                <AnimatePresence>
                  {pendingStatusChange?.id === selectedMedegdel._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-2 border-t border-[color:var(--surface-border)]"
                    >
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[color:var(--surface-hover)] p-2.5 rounded-xl border border-[color:var(--surface-border)]">
                        <input
                          type="text"
                          value={tailbarText}
                          onChange={(e) => setTailbarText(e.target.value)}
                          placeholder={
                            pendingStatusChange.newStatus === "done"
                              ? t("Шийдвэрийн тайлбар (хэрэглэгчид илгээгдэнэ)...")
                              : t("Татгалзсан шалтгаанаа бичнэ үү (хэрэглэгчид илгээгдэнэ)...")
                          }
                          className="flex-1 h-8 px-3 rounded-lg bg-white border border-[color:var(--surface-border)] text-xs text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-1 focus:ring-theme"
                        />
                        <div className="flex items-center gap-1.5 shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={confirmStatusChange}
                            className="h-8 px-3 bg-theme hover:bg-theme text-white text-xs rounded-lg transition-colors font-normal shadow-xs cursor-pointer"
                          >
                            {t("Батлах")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingStatusChange(null);
                              setTailbarText("");
                            }}
                            className="h-8 px-3 bg-[color:var(--panel)] hover:bg-[color:var(--panel)] text-[color:var(--panel-text)] text-xs rounded-lg transition-colors font-normal cursor-pointer"
                          >
                            {t("Хаах")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Messages Body - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 custom-scrollbar bg-[color:var(--surface-bg)]">
                {threadLoading && displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-[color:var(--muted-text)]">
                    <Loader2 className="w-6 h-6 animate-spin text-theme" />
                    <span className="text-xs">{t("Уншиж байна...")}</span>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-[color:var(--muted-text)] gap-2">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    <span className="text-xs">{t("Харилцаа байхгүй")}</span>
                  </div>
                ) : (
                  <>
                    {displayMessages.map((msg, idx) => {
                      const turul = (msg.turul || "").toLowerCase();
                      const isAdminReply =
                        turul === "khariu" ||
                        turul === "hariu" ||
                        turul === "хариу";
                      const isUser = isAdminReply;

                      return (
                        <div
                          key={msg._id || `msg-${idx}`}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                              isUser
                                ? "bg-theme text-white rounded-br-xs"
                                : "bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] text-[color:var(--panel-text)] rounded-bl-xs"
                            }`}
                          >
                            {/* Sender label */}
                            <div
                              className={`flex items-center gap-1.5 mb-1 ${
                                isUser ? "justify-end text-theme" : "justify-start text-theme dark:text-theme"
                              }`}
                            >
                              <span className="text-[10px] font-normal uppercase tracking-wider">
                                {isUser
                                  ? "Админ"
                                  : msg.orshinSuugchId && residentsMap[msg.orshinSuugchId]
                                  ? residentsMap[msg.orshinSuugchId].ner
                                  : "Оршин суугч"}
                              </span>
                            </div>

                            {/* Attached Images */}
                            {msg.zurag &&
                              (() => {
                                const paths = String(msg.zurag)
                                  .split(",")
                                  .map((p) => normalizeMedegdelAssetPath(p.trim()))
                                  .filter(Boolean);
                                const base = getApiUrl().replace(/\/$/, "");
                                return paths.length ? (
                                  <div className="flex flex-wrap gap-1.5 my-1.5">
                                    {paths.map((path, i) => {
                                      const url = `${base}/medegdel/${path}`;
                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => setImagePreviewUrl(url)}
                                          className="block rounded-xl overflow-hidden max-w-[140px] cursor-zoom-in hover:opacity-90 transition-opacity border border-white/20"
                                        >
                                          <img
                                            src={url}
                                            alt=""
                                            className="w-full h-auto object-cover max-h-36"
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : null;
                              })()}

                            {/* Attached Voice Note */}
                            {msg.duu &&
                              (() => {
                                const path = normalizeMedegdelAssetPath(msg.duu);
                                const audioUrl = path
                                  ? `${getApiUrl().replace(/\/$/, "")}/medegdel/${path}`
                                  : "";
                                return audioUrl ? (
                                  <div className="my-1.5">
                                    <audio controls src={audioUrl} className="max-w-full h-8" />
                                  </div>
                                ) : null;
                              })()}

                            {/* Text Message */}
                            {msg.message ? (
                              <p className="whitespace-pre-wrap leading-relaxed text-xs">
                                {msg.message}
                              </p>
                            ) : null}

                            {/* Timestamp & Read Status */}
                            <div
                              className={`flex items-center gap-1 mt-1 text-[10px] ${
                                isUser ? "justify-end text-theme" : "justify-end text-[color:var(--muted-text)]"
                              }`}
                            >
                              <span>{moment(msg.createdAt).format("HH:mm")}</span>
                              {isUser && msg.kharsanEsekh && (
                                <CheckCheck className="w-3 h-3 text-theme" aria-hidden />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Legacy Admin Tailbar (if present and not already in displayMessages) */}
                    {selectedMedegdel.tailbar &&
                      !displayMessages.some((m) => m.message === selectedMedegdel.tailbar) && (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] sm:max-w-[72%] rounded-2xl rounded-br-xs px-3.5 py-2.5 bg-theme text-white shadow-2xs text-xs">
                            <div className="flex items-center justify-between gap-1.5 mb-1 text-theme">
                              <span className="text-[10px] font-normal uppercase tracking-wider">
                                Хариу тайлбар (Админ)
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed text-xs">
                              {selectedMedegdel.tailbar}
                            </p>
                            {selectedMedegdel.repliedAt && (
                              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-theme">
                                <CheckCircle className="w-3 h-3" />
                                <span>{moment(selectedMedegdel.repliedAt).format("YYYY-MM-DD HH:mm")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar - DOCKED STICKY AT BOTTOM */}
              <div className="shrink-0 p-2.5 sm:p-3 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
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

                {/* Previews for attached image or voice note */}
                {(replyImage || replyVoiceBlob) && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {replyImage && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-theme/10 dark:bg-theme/30 border border-theme/30 dark:border-theme px-2.5 py-1 text-xs text-theme dark:text-theme">
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[140px]">{replyImage.name}</span>
                        <button
                          type="button"
                          onClick={() => setReplyImage(null)}
                          className="text-danger hover:text-danger ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {replyVoiceBlob && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-theme/10 dark:bg-theme/30 border border-theme/30 dark:border-theme px-2.5 py-1 text-xs text-theme dark:text-theme">
                        <Mic className="w-3.5 h-3.5" />
                        <span>{t("Дуу")}</span>
                        <button
                          type="button"
                          onClick={() => setReplyVoiceBlob(null)}
                          className="text-danger hover:text-danger ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {/* Input Controls Row */}
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => replyImageInputRef.current?.click()}
                    disabled={replySending}
                    className="h-9 w-9 rounded-xl border border-[color:var(--surface-border)] flex items-center justify-center text-[color:var(--muted-text)] hover:text-theme hover:bg-[color:var(--surface-hover)] disabled:opacity-50 transition cursor-pointer shrink-0"
                    title={t("Зураг хавсаргах")}
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>

                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={replySending}
                      className="h-9 w-9 rounded-xl border border-[color:var(--surface-border)] flex items-center justify-center text-[color:var(--muted-text)] hover:text-theme hover:bg-[color:var(--surface-hover)] disabled:opacity-50 transition cursor-pointer shrink-0"
                      title={t("Дуу бичих")}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="h-9 w-9 rounded-xl border border-danger bg-danger/10 text-danger flex items-center justify-center transition animate-pulse cursor-pointer shrink-0"
                      title={t("Зогсоох")}
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  )}

                    <input
                      type="text"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendAdminReply();
                        }
                      }}
                      placeholder={t("Хариу бичих...")}
                      className="flex-1 h-9 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3 text-xs text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-1 focus:ring-theme transition"
                      disabled={replySending}
                    />

                    <button
                      type="button"
                      onClick={sendAdminReply}
                      disabled={
                        replySending ||
                        (!replyInput.trim() && !replyImage && !replyVoiceBlob)
                      }
                      className="h-9 w-9 rounded-xl bg-theme hover:bg-theme text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer shrink-0 active:scale-95"
                      title={t("Илгээх")}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-theme gap-4">
              <div className="w-20 h-20 bg-[color:var(--surface-hover)] rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 opacity-50" />
              </div>
              <p>{t("Дэлгэрэнгүй харах мэдээллийг сонгоно уу")}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>

    {imagePreviewUrl && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={() => setImagePreviewUrl(null)}
      >
        <div
          className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imagePreviewUrl}
            alt="Зураг"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          />
          <button
            type="button"
            onClick={() => setImagePreviewUrl(null)}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            aria-label="Хаах"
          >
            ✕
          </button>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
