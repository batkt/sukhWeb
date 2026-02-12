"use client";

import React, { useEffect, useState, useRef } from "react";
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
} from "lucide-react";

/** Normalize zurag/duu to API path "baiguullagiinId/filename". Handles full server paths (e.g. /root/sukhBack/public/medegdel/.../file.jpg) and relative paths. */
function normalizeMedegdelAssetPath(p: string | null | undefined): string {
  if (p == null || !p.trim()) return "";
  const s = p.trim().replace(/^\/+/, "").replace(/^public\/medegdel\/?/i, "").replace(/^public\/?/i, "");
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

  const [medegdelList, setMedegdelList] = useState<MedegdelItem[]>([]);
  const [selectedMedegdel, setSelectedMedegdel] = useState<MedegdelItem | null>(
    null
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
  const [threadMessages, setThreadMessages] = useState<MedegdelItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyImage, setReplyImage] = useState<File | null>(null);
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

  useEffect(() => {
    if (ajiltan?.baiguullagiinId && token) {
      fetchMedegdelData(ajiltan.baiguullagiinId);
    }
  }, [ajiltan, token]);

  const fetchThread = async (rootId: string) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      console.warn("[sanalKhuselt] fetchThread skip (missing token/baiguullagiinId) rootId=", rootId);
      return;
    }
    setThreadLoading(true);
    try {
      const params: { baiguullagiinId: string; tukhainBaaziinKholbolt?: string } = { baiguullagiinId: ajiltan.baiguullagiinId };
      if (ajiltan.tukhainBaaziinKholbolt) params.tukhainBaaziinKholbolt = ajiltan.tukhainBaaziinKholbolt;
      const res = await uilchilgee(token).get(`/medegdel/thread/${rootId}`, { params });
      if (res.data?.data && Array.isArray(res.data.data)) {
        setThreadMessages(res.data.data);
        console.log("[sanalKhuselt] fetchThread ok rootId=", rootId, "count=", res.data.data.length);
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
    const rootId = (selectedMedegdel as MedegdelItem).parentId || selectedMedegdel._id;
    fetchThread(rootId);
  }, [selectedMedegdel?._id]);

  useEffect(() => {
    if (preselectedId && medegdelList.length > 0) {
      const found = medegdelList.find((it) => it._id === preselectedId);
      if (found) setSelectedMedegdel(found);
    }
  }, [preselectedId, medegdelList]);

  const markedSeenRootIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const markAsSeen = async (item: MedegdelItem) => {
      if (!item || !token || !ajiltan?.baiguullagiinId) return;
      const rootId = String(item.parentId || item._id);
      if (markedSeenRootIds.current.has(rootId)) return;
      if (item.status !== "pending" || item.kharsanEsekh) return;

      try {
        await uilchilgee(token).patch(`/medegdel/${item._id}/kharsanEsekh`, {}, {
          params: { baiguullagiinId: ajiltan.baiguullagiinId },
        });
        markedSeenRootIds.current.add(rootId);
        // Backend marks root + all replies in thread; update all list rows that belong to this thread
        setMedegdelList((prev) =>
          prev.map((it) => (String(it.parentId || it._id) === rootId ? { ...it, kharsanEsekh: true } : it))
        );
        setSelectedMedegdel((prev) =>
          prev && String((prev as MedegdelItem).parentId || prev._id) === rootId ? { ...prev, kharsanEsekh: true } : prev
        );
        // Update thread messages so "seen" shows without refetch
        setThreadMessages((prev) => prev.map((m) => ({ ...m, kharsanEsekh: true })));
        // Fetch fresh unread count and update cache directly (same params as golContent)
        const countRes = await uilchilgee(token).get("/medegdel/unreadCount", {
          params: { baiguullagiinId: ajiltan.baiguullagiinId, ...(selectedBuildingId ? { barilgiinId: selectedBuildingId } : {}) },
        });
        const unreadKey = ["/medegdel/unreadCount", token, ajiltan.baiguullagiinId, selectedBuildingId];
        mutate(unreadKey, countRes.data, { revalidate: false });
        // Revalidate unread list so dropdown shows updated kharsanEsekh
        mutate(
          (k) => Array.isArray(k) && k[0] === "/medegdel/unreadList",
          undefined,
          { revalidate: true }
        );
      } catch {
        // Ignore - don't block UI
      }
    };

    if (selectedMedegdel) markAsSeen(selectedMedegdel);
  }, [selectedMedegdel?._id, selectedMedegdel, token, ajiltan]);

  const fetchMedegdelData = async (
    baiguullagiinId: string,
    options?: { keepSelection?: boolean }
  ) => {
    console.log("[sanalKhuselt] fetchMedegdelData start baiguullagiinId=", baiguullagiinId);
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
        // Filter for only "sanal" and "gomdol" types (checking both Latin's and Cyrillic)
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
            new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        setMedegdelList(filteredData);
        console.log("[sanalKhuselt] fetchMedegdelData ok count=", filteredData.length);
        const rootIdToKeep = keepSelectionRootIdRef.current;
        if (options?.keepSelection && (rootIdToKeep != null || selectedMedegdelRef.current)) {
          // Prefer explicit root we stored (e.g. when socket fired); else use current selection
          const rootId = rootIdToKeep ?? String(((selectedMedegdelRef.current as MedegdelItem)?.parentId || selectedMedegdelRef.current?._id) ?? "");
          keepSelectionRootIdRef.current = null;
          const fresh = filteredData.find((it: MedegdelItem) => String(it._id) === String(rootId));
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

  // Real-time: new medegdel from app, user reply, or admin reply. Refetch list/thread; toast is shown globally from golContent.
  useEffect(() => {
    if (!socket || !ajiltan?.baiguullagiinId) return;
    const event = "baiguullagiin" + ajiltan.baiguullagiinId;
    const bId = ajiltan.baiguullagiinId;
    console.log("[sanalKhuselt] SUBSCRIBE socket event=", event);
    const handler = (payload: { type?: string; data?: { parentId?: unknown; rootId?: string } }) => {
      console.log("[sanalKhuselt] RECV socket", event, "payload.type=", payload?.type, "payload=", payload);
      // Real-time seen: update list, selection, and thread so "seen" shows without refresh
      if (payload?.type === "medegdelSeen") {
        const rootId = payload?.data?.rootId != null ? String(payload.data.rootId) : null;
        if (rootId) {
          setMedegdelList((prev) =>
            prev.map((it) => (String(it._id) === rootId || String(it.parentId) === rootId ? { ...it, kharsanEsekh: true } : it))
          );
          setSelectedMedegdel((prev) => {
            if (!prev) return prev;
            const prevRootId = String((prev as MedegdelItem).parentId || prev._id);
            return prevRootId === rootId ? { ...prev, kharsanEsekh: true } : prev;
          });
          const sel = selectedMedegdelRef.current;
          const currentRootId = sel ? String((sel as MedegdelItem).parentId || sel._id) : null;
          if (currentRootId === rootId) {
            setThreadMessages((prev) => prev.map((m) => ({ ...m, kharsanEsekh: true })));
          }
          mutate((k: unknown) => Array.isArray(k) && k[0] === "/medegdel/unreadCount", undefined, { revalidate: true });
          mutate((k: unknown) => Array.isArray(k) && k[0] === "/medegdel/unreadList", undefined, { revalidate: true });
        }
      }
      // Toast is shown globally from golContent so it appears on any page; here we only refetch and update list/thread
      if (payload?.type === "medegdelNew") {
        fetchMedegdelData(bId);
        mutate((k) => Array.isArray(k) && k[0] === "/medegdel/unreadCount", undefined, { revalidate: true });
      }
      if (payload?.type === "medegdelUserReply") {
        const replyData = payload?.data as MedegdelItem | undefined;
        const replyParentId = replyData?.parentId != null ? String(replyData.parentId) : null;
        const sel = selectedMedegdelRef.current;
        const currentRootId = sel ? String((sel as MedegdelItem).parentId || sel._id) : null;
        const isForOpenThread = replyParentId !== null && currentRootId !== null && replyParentId === currentRootId;
        if (isForOpenThread && replyData) {
          setThreadMessages((prev) => [...prev, { ...replyData, parentId: replyParentId }]);
        }
        if (currentRootId) keepSelectionRootIdRef.current = currentRootId;
        fetchMedegdelData(bId, { keepSelection: true });
        mutate((k) => Array.isArray(k) && k[0] === "/medegdel/unreadCount", undefined, { revalidate: true });
      }
      if (payload?.type === "medegdelAdminReply") {
        const replyData = payload?.data as MedegdelItem | undefined;
        const replyId = replyData?._id != null ? String(replyData._id) : null;
        if (replyId && replyId === lastSentAdminReplyIdRef.current) {
          lastSentAdminReplyIdRef.current = null;
          const sel = selectedMedegdelRef.current;
          if (sel) keepSelectionRootIdRef.current = String((sel as MedegdelItem).parentId || sel._id);
          fetchMedegdelData(bId, { keepSelection: true });
          return;
        }
        const replyParentId = replyData?.parentId != null ? String(replyData.parentId) : null;
        const sel = selectedMedegdelRef.current;
        const currentRootId = sel ? String((sel as MedegdelItem).parentId || sel._id) : null;
        const isForOpenThread = replyParentId !== null && currentRootId !== null && replyParentId === currentRootId;
        if (isForOpenThread && replyData) {
          setThreadMessages((prev) => {
            if (replyId && prev.some((m) => String(m._id) === replyId)) return prev;
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
            if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg") || "image.jpg", { type: "image/jpeg" }));
            else resolve(file);
          },
          "image/jpeg",
          0.82
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
    const res = await uilchilgee(token ?? undefined).post<{ success: boolean; path: string }>("/medegdel/uploadChatFile", form, {
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
      mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.length) setReplyVoiceBlob(new Blob(chunks, { type: mr.mimeType || "audio/webm" }));
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAdminReply = async () => {
    const rootId = selectedMedegdel ? String((selectedMedegdel as MedegdelItem).parentId || selectedMedegdel._id) : null;
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
    if (typeof window !== "undefined") (window as any).__medegdelSendingReply = true;
    try {
      let zuragPath: string | undefined;
      let voicePath: string | undefined;
      if (replyImage) {
        const toUpload = await compressImageForChat(replyImage);
        zuragPath = await uploadChatFile(toUpload);
        setReplyImage(null);
      }
      if (replyVoiceBlob) {
        const voiceFile = new File([replyVoiceBlob], "voice.webm", { type: replyVoiceBlob.type });
        voicePath = await uploadChatFile(voiceFile);
        setReplyVoiceBlob(null);
      }
      const body: { parentId: string; message: string; baiguullagiinId: string; tukhainBaaziinKholbolt?: string; zurag?: string; voiceUrl?: string } = {
        parentId: rootId,
        message: replyInput.trim() || "",
        baiguullagiinId: ajiltan.baiguullagiinId,
      };
      if (zuragPath) body.zurag = zuragPath;
      if (voicePath) body.voiceUrl = voicePath;
      if (ajiltan.tukhainBaaziinKholbolt) body.tukhainBaaziinKholbolt = ajiltan.tukhainBaaziinKholbolt;
      const res = await uilchilgee(token).post<{ success: boolean; data: MedegdelItem }>("/medegdel/adminReply", body);
      setReplyInput("");
      const newReply = res.data?.data;
      if (newReply) {
        const replyId = newReply._id != null ? String(newReply._id) : null;
        if (replyId) {
          lastSentAdminReplyIdRef.current = replyId;
          // So golContent can skip "new message" toast when this client sent the reply
          if (typeof window !== "undefined") (window as any).__medegdelLastSentReplyId = replyId;
          setTimeout(() => { if (typeof window !== "undefined") (window as any).__medegdelLastSentReplyId = null; }, 5000);
        }
        const item = { ...newReply, parentId: newReply.parentId ? String(newReply.parentId) : rootId };
        setThreadMessages((prev) => {
          if (replyId && prev.some((m) => String(m._id) === replyId)) return prev;
          return [...prev, item];
        });
      }
    } catch (e) {
      console.error("[sanalKhuselt] sendAdminReply error", e);
      notification.error({ message: t("Хариу илгээхэд алдаа гарлаа") });
    } finally {
      if (typeof window !== "undefined") (window as any).__medegdelSendingReply = false;
      setReplySending(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const s = status || "pending";
    switch (s) {
      case "pending":
        return {
          label: t("Хүлээгдэж байна"),
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-100 dark:bg-amber-900/30",
          border: "border-amber-200 dark:border-amber-800",
          icon: <Clock className="w-4 h-4" />,
        };
      case "done":
        return {
          label: t("Шийдэгдсэн"),
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
          border: "border-emerald-200 dark:border-emerald-800",
          icon: <CheckCircle className="w-4 h-4" />,
        };
      case "rejected":
        return {
          label: t("Татгалзсан"),
          color: "text-rose-600 dark:text-rose-400",
          bg: "bg-rose-100 dark:bg-rose-900/30",
          border: "border-rose-200 dark:border-rose-800",
          icon: <XCircle className="w-4 h-4" />,
        };
      default:
        return {
          label: t("Тодорхойгүй"),
          color: "text-slate-600 dark:text-slate-400",
          bg: "bg-slate-100 dark:bg-slate-800",
          border: "border-slate-200 dark:border-slate-700",
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
        (item) => item._id === pendingStatusChange.id
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
        }
      );

      if (response.data.success) {
        setMedegdelList((prev) =>
          prev.map((item) =>
            item._id === pendingStatusChange.id
              ? { ...item, status: pendingStatusChange.newStatus }
              : item
          )
        );
        setSelectedMedegdel((prev) =>
          prev
            ? { ...prev, status: pendingStatusChange.newStatus, tailbar: tailbarText.trim() || prev.tailbar }
            : null
        );
        setMedegdelList((prev) =>
          prev.map((item) =>
            item._id === pendingStatusChange.id
              ? { ...item, tailbar: tailbarText.trim() || item.tailbar }
              : item
          )
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
    if (t === "app" || t === "мессеж" || t === "mail" || t === "мэдэгдэл" || t === "medegdel") return "Мэдэгдэл";
    return turul ?? "";
  };

  const isSanal = (t: string | undefined) => { const x = (t ?? "").toLowerCase().trim(); return x === "sanal" || x === "санал"; };
  const isGomdol = (t: string | undefined) => { const x = (t ?? "").toLowerCase().trim(); return x === "gomdol" || x === "гомдол"; };
  const rootList = medegdelList.filter((item) => (item.turul ?? "").toLowerCase() !== "user_reply");
  const dashboardCounts = {
    all: rootList.length,
    shiidegdsen: rootList.filter((i) => (i.status || "pending") === "done").length,
    gomdol: rootList.filter((i) => isGomdol(i.turul)).length,
    sanal: rootList.filter((i) => isSanal(i.turul)).length,
  };
  const dashboardActive = {
    all: filterType === "all" && filterStatus === "all",
    shiidegdsen: filterStatus === "done" && filterType === "all",
    gomdol: filterType === "gomdol" && filterStatus === "all",
    sanal: filterType === "sanal" && filterStatus === "all",
  };
  const setDashboardFilter = (key: "all" | "shiidegdsen" | "gomdol" | "sanal") => {
    if (key === "all") { setFilterType("all"); setFilterStatus("all"); return; }
    if (key === "shiidegdsen") { setFilterStatus("done"); setFilterType("all"); return; }
    if (key === "gomdol") { setFilterType("gomdol"); setFilterStatus("all"); return; }
    if (key === "sanal") { setFilterType("sanal"); setFilterStatus("all"); return; }
  };

  const filteredList = medegdelList.filter((item) => {
    // Don't show user_reply as separate list rows (they appear in thread view)
    const type = item.turul?.toLowerCase() || "";
    if (type === "user_reply") return false;

    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type Filter
    const matchesType = filterType === "all" 
      ? true 
      : filterType === "sanal" 
        ? type.includes("sanal") || type.includes("санал")
        : type.includes("gomdol") || type.includes("гомдол");

    // Status Filter
    const status = item.status || "pending";
    const matchesStatus = filterStatus === "all" ? true : status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="h-[calc(100vh-64px)] p-4 md:p-6 flex flex-col gap-6 overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between shrink-0 ${showDetail ? 'hidden md:flex' : 'flex'}`}
      >
        <div>
          <h1 className="text-2xl  text-theme">{t("Санал хүсэлт")}</h1>
          <p className="text-theme/60 text-sm mt-1">
            {t("Ирсэн санал, гомдлуудыг шийдвэрлэх")}
          </p>
        </div>
      </motion.div>

      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* Left Panel: List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`w-full md:w-[380px] lg:w-[420px] flex-col gap-4 shrink-0 ${showDetail ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Dashboard: counts, click to filter list */}
          <div className="grid grid-cols-4 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDashboardFilter("all")}
              className={`rounded-2xl border p-3 text-center transition-all ${
                dashboardActive.all
                  ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--surface-hover)] text-theme"
              }`}
            >
              <div className="text-lg font-semibold">{dashboardCounts.all}</div>
              <div className="text-[10px] opacity-80">{t("Бүгд")}</div>
            </button>
            <button
              type="button"
              onClick={() => setDashboardFilter("shiidegdsen")}
              className={`rounded-2xl border p-3 text-center transition-all ${
                dashboardActive.shiidegdsen
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--surface-hover)] text-theme"
              }`}
            >
              <div className="text-lg font-semibold">{dashboardCounts.shiidegdsen}</div>
              <div className="text-[10px] opacity-80">{t("Шийдэгдсэн")}</div>
            </button>
            <button
              type="button"
              onClick={() => setDashboardFilter("gomdol")}
              className={`rounded-2xl border p-3 text-center transition-all ${
                dashboardActive.gomdol
                  ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--surface-hover)] text-theme"
              }`}
            >
              <div className="text-lg font-semibold">{dashboardCounts.gomdol}</div>
              <div className="text-[10px] opacity-80">{t("Гомдол")}</div>
            </button>
            <button
              type="button"
              onClick={() => setDashboardFilter("sanal")}
              className={`rounded-2xl border p-3 text-center transition-all ${
                dashboardActive.sanal
                  ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--surface-hover)] text-theme"
              }`}
            >
              <div className="text-lg font-semibold">{dashboardCounts.sanal}</div>
              <div className="text-[10px] opacity-80">{t("Санал")}</div>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme/50" />
                <input
                type="text"
                placeholder={t("Хайх...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] text-theme placeholder:text-theme/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                 <Select
                    value={filterType}
                    onChange={setFilterType}
                    className="w-full"
                    classNames={{ popup: { root: "rounded-2xl border border-[color:var(--surface-border)] shadow-xl" } }}
                    options={[
                      { value: "all", label: t("Бүгд") },
                      { value: "sanal", label: t("Санал") },                                      
                      { value: "gomdol", label: t("Гомдол") },
                    ]}
                 />
                 <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    className="w-full"
                    classNames={{ popup: { root: "rounded-2xl border border-[color:var(--surface-border)] shadow-xl" } }}
                    options={[
                      { value: "all", label: t("Бүх төлөв") },
                      { value: "pending", label: t("Хүлээгдэж байна") },
                      { value: "done", label: t("Шийдэгдсэн") },
                      { value: "rejected", label: t("Татгалзсан") },
                    ]}
                 />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {loading ? (
              <div className="py-10 text-center text-theme/50 text-sm">
                {t("Уншиж байна...")}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-3 opacity-60">
                <div className="w-12 h-12 rounded-full bg-[color:var(--surface-hover)] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-theme/50" />
                </div>
                <div className="text-theme/70 text-sm">
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
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-200 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                        : "bg-[color:var(--surface-bg)] border-[color:var(--surface-border)] hover:border-blue-300/50 hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-2xl text-[10px] font-medium tracking-wide border ${
                            (item.turul?.toLowerCase() || "").includes("sanal") || (item.turul ?? "").includes("санал")
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/50"
                              : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/50"
                          }`}
                        >
                          {turulToLabel(item.turul)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-2xl text-[10px] font-medium tracking-wide border ${status.bg} ${status.color} ${status.border} bg-opacity-50`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-theme/50 font-medium">
                        {moment(item.createdAt).fromNow()}
                      </span>
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 line-clamp-1 ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-theme"}`}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-theme/60 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    
                    {isSelected && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4 text-blue-500" />
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
          className={`flex-1 bg-transparent border rounded-3xl shadow-sm overflow-hidden flex flex-col ${showDetail ? 'fixed inset-0 z-50 m-0 rounded-none md:static md:z-auto md:m-0 md:rounded-3xl' : 'hidden md:flex'}`}
        >
          {selectedMedegdel ? (
            <>
              {/* Detail Header */}
              <div className="p-4 md:p-6 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] md:bg-theme/5 backdrop-blur-sm flex flex-col gap-4">
                {/* Mobile Back Button */}
                 <div className="flex md:hidden items-center gap-2 mb-1">
                     <button 
                        onClick={() => setShowDetail(false)}
                        className="p-2 -ml-2 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors active:scale-95"
                     >
                        <ArrowLeft className="w-6 h-6 text-theme" />
                     </button>
                     <span className=" text-lg text-theme">{t("Санал хүсэлт")}</span>
                  </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2 md:pt-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2 py-1 rounded-2xl text-[10px] tracking-wider border ${
                          isSanal(selectedMedegdel.turul)
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/50"
                            : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/50"
                        }`}
                      >
                        {turulToLabel(selectedMedegdel.turul)}
                      </span>
                      <span className="text-xs text-theme/50">
                        {moment(selectedMedegdel.createdAt).format("YYYY-MM-DD HH:mm")}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl  text-theme leading-tight">
                      {selectedMedegdel.title}
                    </h2>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 min-w-[200px]">
                    <Select
                      value={
                        pendingStatusChange?.id === selectedMedegdel._id
                          ? pendingStatusChange.newStatus
                          : selectedMedegdel.status || "pending"
                      }
                      onChange={handleStatusChange}
                      className="w-full"
                      classNames={{ popup: { root: "rounded-2xl border border-[color:var(--surface-border)] shadow-xl" } }}
                      size="large"
                      options={[
                        { value: "pending", label: <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500"/> {t("Хүлээгдэж байна")}</span> },
                        { value: "done", label: <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> {t("Шийдэгдсэн")}</span> },
                        { value: "rejected", label: <span className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500"/> {t("Татгалзсан")}</span> },
                      ]}
                    />
                    
                    <AnimatePresence>
                      {pendingStatusChange?.id === selectedMedegdel._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-3 w-full overflow-hidden"
                        >
                          {(pendingStatusChange.newStatus === "done" || pendingStatusChange.newStatus === "rejected") && (
                            <div>
                              <label className="block text-xs font-medium text-theme/70 mb-1.5">
                                {t("Хариу тайлбар")} {pendingStatusChange.newStatus === "rejected" && `(${t("Татгалзсан шалтгаан")})`}
                              </label>
                              <textarea
                                value={tailbarText}
                                onChange={(e) => setTailbarText(e.target.value)}
                                placeholder={pendingStatusChange.newStatus === "done" 
                                  ? t("Шийдвэрийн тайлбар (хэрэглэгчид илгээгдэнэ)") 
                                  : t("Татгалзсан шалтгаанаа бичнэ үү (хэрэглэгчид илгээгдэнэ)")}
                                rows={3}
                                className="w-full px-3 py-2 rounded-2xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] text-theme placeholder:text-theme/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
                              />
                              <p className="text-[10px] text-theme/50 mt-1">
                                {t("Хэрэглэгчийн апп-д шууд мэдэгдэл ирнэ")}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={confirmStatusChange}
                              className="flex-1 py-1.5 px-3 bg-blue-600 !text-white text-xs font-semibold rounded-2xl shadow-sm hover:bg-blue-700 transition-colors"
                            >
                              {t("Батлах")}
                            </button>
                            <button
                              onClick={() => { setPendingStatusChange(null); setTailbarText(""); }}
                              className="flex-1 py-1.5 px-3 bg-gray-200 text-gray-700 text-xs font-semibold rounded-2xl hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200"
                            >
                              {t("Болих")}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[color:var(--surface-bg)]">
               
                

                {/* Reply Section (single admin tailbar when no thread) */}
                {selectedMedegdel.tailbar && threadMessages.length <= 1 && (
                     <div>
                        <h3 className="text-sm  text-blue-600 dark:text-blue-400  tracking-wide mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            {t("Хариу тайлбар")}
                        </h3>
                        <div className="p-6 rounded-2xl bg-blue-200 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-theme leading-relaxed whitespace-pre-wrap relative">
                             {selectedMedegdel.tailbar}
                             {selectedMedegdel.repliedAt && (
                                <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-800/50 text-xs text-theme/50 flex items-center gap-2">
                                     <CheckCircle className="w-3 h-3" />
                                     {t("Хариулсан")}: {moment(selectedMedegdel.repliedAt).format("YYYY-MM-DD HH:mm")}
                                </div>
                             )}
                        </div>
                    </div>
                )}

                {/* Thread / chat history (same as app) */}
                <div>
                  <h3 className="text-sm text-theme/80 tracking-wide mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    
                  </h3>
                  {threadLoading ? (
                    <div className="py-6 text-center text-theme/50 text-sm">{t("Уншиж байна...")}</div>
                  ) : threadMessages.length === 0 ? (
                    <div className="py-4 text-center text-theme/50 text-sm">{t("Харилцаа байхгүй")}</div>
                  ) : (
                    <div className="space-y-3">
                      {threadMessages.map((msg) => {
                        const turul = (msg.turul || "").toLowerCase();
                        const isUser =
                          turul === "user_reply" ||
                          turul === "sanal" ||
                          turul === "санал" ||
                          turul === "gomdol" ||
                          turul === "гомдол";
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                isUser
                                  ? "bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-br-md"
                                  : "bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] rounded-bl-md"
                              }`}
                            >
                              {msg.zurag && (() => {
                                const paths = String(msg.zurag).split(",").map((p) => normalizeMedegdelAssetPath(p.trim())).filter(Boolean);
                                const base = getApiUrl().replace(/\/$/, "");
                                return paths.length ? (
                                  <div className="flex flex-wrap gap-1 my-1">
                                    {paths.map((path, i) => {
                                      const url = `${base}/medegdel/${path}`;
                                      return (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden max-w-[140px]">
                                          <img src={url} alt="" className="w-full h-auto object-cover" />
                                        </a>
                                      );
                                    })}
                                  </div>
                                ) : null;
                              })()}
                              {msg.duu && (() => {
                                const path = normalizeMedegdelAssetPath(msg.duu);
                                const audioUrl = path ? `${getApiUrl().replace(/\/$/, "")}/medegdel/${path}` : "";
                                return audioUrl ? (
                                  <div className="my-1">
                                    <audio controls src={audioUrl} className="max-w-full h-9" />
                                  </div>
                                ) : null;
                              })()}
                              {msg.message ? <p className="text-theme text-sm whitespace-pre-wrap">{msg.message}</p> : null}
                              <p className="text-theme/50 text-xs mt-1">
                                {moment(msg.createdAt).format("YYYY-MM-DD HH:mm")}
                              </p>
                              {msg.kharsanEsekh && msg.updatedAt && (
                                <p className="text-theme/40 text-xs mt-1 flex items-center gap-1 justify-end">
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" aria-hidden />
                                  <span>{moment(msg.updatedAt).format("HH:mm")}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Admin reply bar (like app) – text, image, voice */}
                <div className="mt-4 pt-4 border-t border-[color:var(--surface-border)]">
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
                  {(replyImage || replyVoiceBlob) && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {replyImage && (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-sm">
                          <ImagePlus className="w-4 h-4" />
                          {replyImage.name}
                          <button type="button" onClick={() => setReplyImage(null)} className="text-red-500 hover:underline">×</button>
                        </span>
                      )}
                      {replyVoiceBlob && (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 text-sm">
                          <Mic className="w-4 h-4" />
                          {t("Дуу")}
                          <button type="button" onClick={() => setReplyVoiceBlob(null)} className="text-red-500 hover:underline">×</button>
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => replyImageInputRef.current?.click()}
                      disabled={replySending}
                      className="rounded-2xl border border-[color:var(--surface-border)] p-2.5 text-theme hover:bg-[color:var(--surface-hover)] disabled:opacity-50"
                      aria-label={t("Зураг")}
                    >
                      <ImagePlus className="w-5 h-5" />
                    </button>
                    {!recording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={replySending}
                        className="rounded-2xl border border-[color:var(--surface-border)] p-2.5 text-theme hover:bg-[color:var(--surface-hover)] disabled:opacity-50"
                        aria-label={t("Дуу бичих")}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="rounded-22xl border border-red-300 bg-red-50 dark:bg-red-900/20 p-2.5 text-red-600"
                        aria-label={t("Зогсоох")}
                      >
                        <Square className="w-5 h-5" />
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
                      className="flex-1 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-ground)] px-4 py-3 text-theme placeholder:text-theme/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                      disabled={replySending}
                    />
                    <button
                      type="button"
                      onClick={sendAdminReply}
                      disabled={replySending || (!replyInput.trim() && !replyImage && !replyVoiceBlob)}
                      className="rounded-2xl bg-blue-500 dark:bg-blue-700 text-white p-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      aria-label={t("Илгээх")}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-theme/40 gap-4">
                <div className="w-20 h-20 bg-[color:var(--surface-hover)] rounded-full flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 opacity-50" />
                </div>
                <p>{t("Дэлгэрэнгүй харах мэдээллийг сонгоно уу")}</p>
             </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
