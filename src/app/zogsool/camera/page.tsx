"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import {
  Search,
  Calendar,
  DollarSign,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  X,
  Wifi,
  WifiOff,
  Bell,
  Clock,
  Copy,
  Settings,
  Share2,
  ExternalLink,
  Info,
  MoreHorizontal,
  ChevronDown,
  Plus
} from "lucide-react";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import moment from "moment";
import useSWR from "swr";
import axios from "axios";
import uilchilgee, { socket as getSocket, aldaaBarigch } from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import R2WPlayerComponent from "@/components/R2WPlayerComponent";
import { type Uilchluulegch } from "@/lib/useParkingSocket";
import PaymentModal from "./PaymentModal";
import VehicleRegistrationModal from "./VehicleRegistrationModal";
import { toast } from "react-hot-toast";


const RealTimeDuration = ({ orsonTsag, garsanTsag }: { orsonTsag?: string; garsanTsag?: string }) => {

  const [now, setNow] = useState(moment());

  useEffect(() => {
    if (!garsanTsag) {
      const interval = setInterval(() => {
        setNow(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [garsanTsag]);

  if (!orsonTsag) return <span>00 : 00 : 00</span>;

  const start = moment(orsonTsag);
  const end = garsanTsag ? moment(garsanTsag) : now;
  const diff = moment.duration(end.diff(start));

  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  return (
    <span className="font-mono">
      {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} : {String(seconds).padStart(2, "0")}
    </span>
  );
};

const RealTimeClock = () => {
  const [time, setTime] = useState(moment());
  useEffect(() => {
    const interval = setInterval(() => setTime(moment()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-right hidden md:block">
      <p className="text-sm font-black text-slate-800 dark:text-gray-200">{time.format("YYYY-MM-DD")}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{time.format("HH:mm:ss")}</p>
    </div>
  );
};


export default function Camera() {
  const { token, ajiltan, baiguullaga, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Uilchluulegch | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<Record<string, Uilchluulegch>>({});
  const [activeEntryIP, setActiveEntryIP] = useState<string>("");
  const [activeExitIP, setActiveExitIP] = useState<string>("");
  const [confirmExitId, setConfirmExitId] = useState<string | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const pageSize = 20;


  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const today = useMemo(() => new Date(), []);
  const defaultEnd = useMemo(() => toISODate(today), [today]);
  const defaultStart = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return toISODate(d);
  }, [today]);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([defaultStart, defaultEnd]);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const end = (dateRange?.[1] as string) || defaultEnd;
    const start = (dateRange?.[0] as string) || defaultStart;
    return { start, end };
  }, [dateRange, defaultEnd, defaultStart]);

  const shouldFetch = !!token && !!ajiltan?.baiguullagiinId;



  // Fetch parking configuration to get camera IPs
  const { data: parkingConfigData } = useSWR(
    shouldFetch
      ? ["/parking", token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 100,
        },
      });
      return resp.data;
    },
    { 
      revalidateOnFocus: false, 
      revalidateIfStale: false, 
      revalidateOnReconnect: false 
    },
  );

  // Extract cameras from parking configuration
  const cameras = useMemo(() => {
    const parkingList = Array.isArray(parkingConfigData?.jagsaalt)
      ? parkingConfigData.jagsaalt
      : Array.isArray(parkingConfigData)
        ? parkingConfigData
        : [];

    const allCameras: Array<{
      cameraIP: string;
      cameraPort: number; // RTSP port
      httpPort?: number; // HTTP port for fallback
      cameraType: "entry" | "exit";
      cameraName?: string;
      gateName?: string;
      cameraUsername?: string;
      cameraPassword?: string;
      root?: string; // Stream path (ROOT from tokhirgoo)
      tokhirgoo?: {
        USER?: string;
        PASSWD?: string;
        ROOT?: string;
        PORT?: string;
        dotorKamerEsekh?: boolean;
      };
    }> = [];

    parkingList.forEach((parking: any) => {
      if (Array.isArray(parking?.khaalga)) {
        parking.khaalga.forEach((gate: any) => {
          if (Array.isArray(gate?.camera)) {
            gate.camera.forEach((cam: any) => {
              if (cam?.cameraIP) {
                // For RTSP, use tokhirgoo.PORT if available, otherwise default to 554 (RTSP standard port)
                // For HTTP fallback, use cameraPort or 80
                const rtspPort = cam.tokhirgoo?.PORT
                  ? Number(cam.tokhirgoo.PORT)
                  : 554; // RTSP default port
                const httpPort = cam.cameraPort || 80;

                // Extract username and password from tokhirgoo object
                const username =
                  cam.tokhirgoo?.USER || cam.cameraUsername || "";
                const password =
                  cam.tokhirgoo?.PASSWD || cam.cameraPassword || "";

                allCameras.push({
                  cameraIP: cam.cameraIP,
                  cameraPort: rtspPort, // Use RTSP port for streaming
                  httpPort: httpPort, // Keep HTTP port for fallback
                  cameraType:
                    cam.cameraType ||
                    (gate.turul === "Орох" ? "entry" : "exit"),
                  cameraName: cam.cameraName || cam.cameraIP,
                  gateName: gate.ner,
                  cameraUsername: username,
                  cameraPassword: password,
                  tokhirgoo: cam.tokhirgoo,
                  root: cam.tokhirgoo?.ROOT || "stream", // Use ROOT from tokhirgoo, default to "stream"
                });
              }
            });
          }
        });
      }
    });

    return allCameras;
  }, [parkingConfigData]);

  const socketRef = useRef<any>(null);

  // Stabilize cameras reference to prevent socket effector from re-running unnecessarily
  const camerasHash = useMemo(() => JSON.stringify(cameras), [cameras]);

  const entryCameras = useMemo(
    () => cameras.filter((cam) => cam.cameraType === "entry"),
    [camerasHash],
  );
  const exitCameras = useMemo(
    () => cameras.filter((cam) => cam.cameraType === "exit"),
    [camerasHash],
  );

  // Reset live updates when filters or page change
  useEffect(() => {
    setLiveUpdates({});
  }, [page, searchTerm, dateRange, effectiveBarilgiinId]);

  // Sync active camera IPs when cameras load
  useEffect(() => {
    if (entryCameras.length > 0 && !activeEntryIP) {
      setActiveEntryIP(entryCameras[0].cameraIP);
    }
    if (exitCameras.length > 0 && !activeExitIP) {
      setActiveExitIP(exitCameras[0].cameraIP);
    }
  }, [entryCameras, exitCameras]);

  // State for transaction list
  const [listData, setListData] = useState<any>({
    jagsaalt: [],
    niitMur: 0,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Helper to fetch list via REST (as a fallback or for filters)
  const fetchList = async () => {
    if (!rangeStart || !rangeEnd || !token) return;
    try {
      const resp = await uilchilgee(token).get("/zogsoolUilchluulegch", {
        params: {
          baiguullagiinId: ajiltan?.baiguullagiinId,
          khuudasniiDugaar: page,
          khuudasniiKhemjee: pageSize,
          search: searchTerm,
          startDate: rangeStart,
          endDate: rangeEnd,
        },
      });
      setListData(resp.data);
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Initial fetch and fetch on changes
  useEffect(() => {
    fetchList();
  }, [page, searchTerm, rangeStart, rangeEnd, token]);

  // mutation helper
  const mutateTransactions = fetchList;

  function zurchilteiMashinMsgilgeekh(mashiniiDugaar: string) {
    let yavuulakhData = {
      baiguullagiinId: baiguullaga?._id,
      barilgiinId: effectiveBarilgiinId,
      mashiniiDugaar: mashiniiDugaar,
    };
    uilchilgee(token || undefined)
      .post("/zurchilteiMashinMsgilgeekh", yavuulakhData)
      .then((res) => {
        if (res.status === 200) toast.success("Амжилттай илгээгдлээ");
      })
      .catch(aldaaBarigch);
  }

  function khaalgaNeey(ip: string) {
    if (!ip) return;
    // Call local .NET service directly as requested
    axios.get(`http://localhost:5000/api/neeye/${ip}`)
      .then(() => console.log(`Gate opened locally: ${ip}`))
      .catch((err) => {
        console.error("Local gate error, falling back to server:", err);
        if (token) {
          uilchilgee(token)
            .get("/neeye/" + ip)
            .catch(aldaaBarigch);
        }
      });
  }

  async function handleManualExit(transaction: Uilchluulegch, type: 'pay' | 'free') {
    if (type === 'pay') {
      setSelectedTransaction(transaction);
      setConfirmExitId(null);
    } else {
      // SDK Exit Call
      try {
        const payload = {
          mashiniiDugaar: transaction.mashiniiDugaar,
          CAMERA_IP: activeExitIP || (exitCameras[0]?.cameraIP),
          barilgiinId: effectiveBarilgiinId
        };

        const resp = await axios.post("https://amarhome.mn/api/zogsoolSdkService", payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
        if (resp.status === 200 || resp.data === "Amjilttai") {
          toast.success("Гаралтын команд амжилттай");
          setConfirmExitId(null);
          fetchList();
        } else {
          toast.error("Алдаа: " + (resp.data?.message || "Амжилтгүй"));
        }
      } catch (err) {
        console.error("SDK Error:", err);
        toast.error("Команд илгээхэд алдаа гарлаа");
      }
    }
  }

  // QPay listener (zogsool.md lines 916-953)
  useEffect(() => {
    if (!baiguullaga?._id || !cameras.length) return;
    if (!socketRef.current) {
      socketRef.current = getSocket();
    }

    const s = socketRef.current;
    const cleanup: (() => void)[] = [];

    exitCameras.forEach((cam) => {
      const eventName = `qpayMobileSdk${baiguullaga?._id}${cam.cameraIP}`;
      const handleGarahTulsun = (data: any) => {
        if (!data || !data?.mashiniiDugaar || !data?.baiguullagiinId || data?.baiguullagiinId !== baiguullaga?._id)
          return;
        khaalgaNeey(data.cameraIP);
      };
      s.on(eventName, handleGarahTulsun);
      cleanup.push(() => s.off(eventName, handleGarahTulsun));
    });

    return () => cleanup.forEach((fn) => fn());
  }, [baiguullaga?._id, exitCameras]);

  // Main socket logic (zogsool.md lines 973-1107)
  useEffect(() => {
    if (!baiguullaga?._id || !cameras.length) return;
    if (!socketRef.current) {
      socketRef.current = getSocket();
    }

    const s = socketRef.current;
    const cleanup: (() => void)[] = [];

    s.on("connect", () => {
      setIsConnected(true);
    });
    s.on("disconnect", () => setIsConnected(false));
    setIsConnected(s.connected);

    const handleGeneralUpdate = (data: any) => {
      if (data?._id && data?.baiguullagiinId === baiguullaga?._id) {
        setLiveUpdates((prev) => ({ ...prev, [data._id]: data }));
      }
    };

    s.on(`zogsool${baiguullaga._id}`, handleGeneralUpdate);
    cleanup.push(() => s.off(`zogsool${baiguullaga._id}`, handleGeneralUpdate));

    const handleOroh = (data: any) => {
      if (!data || !data?.mashiniiDugaar || !data?.baiguullagiinId || data?.baiguullagiinId !== baiguullaga?._id)
        return;

      if (!data?.oruulakhguiEsekh) {
        khaalgaNeey(data.cameraIP);
      }

      // Create synthetic update to avoid REST fetch and update "Идэвхтэй" list
      // Use plate as ID to ensure we only have one entry for this car in liveUpdates
      const plate = data.mashiniiDugaar;
      setLiveUpdates((prev) => ({
        ...prev,
        [plate]: {
          _id: plate, // Use plate as stable ID for synthetic entry
          mashiniiDugaar: plate,
          baiguullagiinId: data.baiguullagiinId,
          createdAt: new Date().toISOString(),
          tuukh: [
            {
              tsagiinTuukh: [{ orsonTsag: new Date().toISOString() }],
              orsonKhaalga: data.cameraIP,
              tuluv: 0,
            },
          ],
        },
      }));

      const dugaar = data.mashiniiDugaar?.replace("???", "");
      // Removed: uilchilgee(token || undefined).get(url).catch(() => {});
      // Removed: zurchilteiMashinMsgilgeekh(dugaar);
    };

    const handleGarah = (u: any) => {
      if (!u || !u?.mashiniiDugaar || !u?.baiguullagiinId || u?.baiguullagiinId !== baiguullaga?._id)
        return;

      let dugaar = u.mashiniiDugaar?.replace("???", "");
      const garsanKhaalga = u?.tuukh?.[0]?.garsanKhaalga;
      let niit = u?.niitDun || 0;
      if (u?.tuukh?.[0]?.tulbur?.length > 0) {
        niit = u.niitDun - u.tuukh.reduce((s: number, t: any) => 
          s + (t?.tulbur?.reduce((a: number, b: any) => a + (b?.dun || 0), 0) || 0), 0);
      }
      if (niit < 0) niit = 0;

      let url = `/sambar/${garsanKhaalga}/${dugaar}/${niit}`;
      if (baiguullaga?._id === "65cf2f027fbc788f85e50b90" || baiguullaga?._id === "6549bbe0d437e6d25d557341") {
        const start = moment(u?.createdAt).format("YYYY-MM-DD HH:mm:ss");
        const end = moment().format("YYYY-MM-DD HH:mm:ss");
        url = `/sambarOgnootoi/${garsanKhaalga}/${dugaar}/${niit}/${start}/${end}`;
      }

      if (u?.turul === "Үнэгүй" || niit === 0) {
        if (u?.tuukh?.[0]?.garsanKhaalga) {
          khaalgaNeey(u.tuukh[0].garsanKhaalga);
        }
      }
      // Removed: uilchilgee(token || undefined).get(url).catch(() => {});
      if (u?._id) handleGeneralUpdate(u);
    };

    const handleGarahTulsun = (data: any) => {
      if (!data || !data?.mashiniiDugaar || !data?.baiguullagiinId || data?.baiguullagiinId !== baiguullaga?._id)
        return;
      if (data?._id) handleGeneralUpdate(data);
      let dugaar = data?.mashiniiDugaar?.replace("???", "");
      if (!!dugaar) {
        uilchilgee(token || undefined).get(`/sambar/${data?.cameraIP}/${dugaar}/${moment().format("HH:mm:ss")}`).catch(() => {});
      }
      khaalgaNeey(data.cameraIP);
    };

    entryCameras.forEach((cam) => {
      const eventName = `zogsoolOroh${baiguullaga._id}${cam.cameraIP}`;
      s.on(eventName, handleOroh);
      cleanup.push(() => s.off(eventName, handleOroh));
    });

    exitCameras.forEach((cam) => {
      const e1 = `zogsoolGarah${baiguullaga._id}${cam.cameraIP}`;
      const e2 = `zogsoolGarahTulsun${baiguullaga._id}${cam.cameraIP}`;

      s.on(e1, handleGarah);
      s.on(e2, handleGarahTulsun);

      cleanup.push(() => {
        s.off(e1, handleGarah);
        s.off(e2, handleGarahTulsun);
      });
    });

    return () => cleanup.forEach((fn) => fn());
  }, [baiguullaga?._id, camerasHash, token]);

  const isSocketConnected = isConnected;



  const transactions: Uilchluulegch[] = useMemo(() => {
    const data = listData;
    let list: Uilchluulegch[] = [];

    if (Array.isArray(data?.jagsaalt)) list = data.jagsaalt;
    else if (Array.isArray(data?.list)) list = data.list;
    else if (Array.isArray(data?.data)) list = data.data;
    else if (Array.isArray(data)) list = data;

    const plateMap = new Map<string, Uilchluulegch>();

    list.forEach(item => {
      if (item.mashiniiDugaar) plateMap.set(item.mashiniiDugaar, item);
    });

    Object.values(liveUpdates).forEach((update: any) => {
      if (update.mashiniiDugaar) plateMap.set(update.mashiniiDugaar, update);
    });

    let merged = Array.from(plateMap.values());

    merged.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    if (page === 1) {
      return merged.slice(0, pageSize);
    }

    return merged;
  }, [listData, liveUpdates, page]);

  const stats = useMemo(() => {
    const total = transactions.reduce((sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0), 0);
    const paid = transactions
      .filter(
        (t) => t.tuukh?.[0]?.tuluv !== 0 && t.tuukh?.[0]?.tuluv !== undefined,
      )
      .reduce((sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0), 0);
    const unpaid = transactions
      .filter((t) => t.tuukh?.[0]?.tuluv === 0)
      .reduce((sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0), 0);
    const count = transactions.length;
    const paidCount = transactions.filter(
      (t) => t.tuukh?.[0]?.tuluv !== 0 && t.tuukh?.[0]?.tuluv !== undefined,
    ).length;

    return { total, paid, unpaid, count, paidCount };
  }, [transactions]);

  const totalPages = Math.ceil(
    (listData?.niitMur ||
      transactions.length) / pageSize,
  );

  function formatCurrency(n: number) {
    return `${formatNumber(n)} ₮`;
  }

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${text.toUpperCase()} дугаарыг хууллаа`);
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[color:var(--surface-bg)]">
      <div className="min-h-full p-4 lg:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-1.5 h-6 bg-theme rounded-full"></div>
                 <h1 className="text-2xl font-black text-[color:var(--panel-text)] tracking-tighter uppercase">Хяналтын самбар</h1>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-bold text-[color:var(--muted-text)] uppercase tracking-widest opacity-60">КАМЕР БОЛОН ГҮЙЛГЭЭНИЙ ХЯНАЛТ</p>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter ${isSocketConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  {isSocketConnected ? 'Socket Connected' : 'Socket Offline'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <RealTimeClock />
            </div>
          </div>
        </div>


        {/* Camera Streaming Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Entry Camera Stream */}
          <div className="relative group/camera overflow-hidden rounded-3xl bg-black shadow-2xl transition-all duration-500">
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
               <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Орох Камер</span>
               </div>
            </div>
            
            <div className="aspect-video relative">
              {entryCameras.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 border border-white/5">
                  <VideoOff className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Тохиргоогүй байна</p>
                </div>
              ) : (
                <div className="h-full">
                  {/* Camera Selection Dropdown */}
                  {entryCameras.length > 1 && (
                    <div className="absolute top-4 right-4 z-[50]">
                      <div className="relative group/dropdown">
                        <select
                          value={activeEntryIP}
                          onChange={(e) => setActiveEntryIP(e.target.value)}
                          className="appearance-none bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2 pr-10 text-[10px] font-black text-white uppercase tracking-widest cursor-pointer hover:bg-black/80 transition-all outline-none"
                        >
                          {entryCameras.map((cam) => (
                            <option key={cam.cameraIP} value={cam.cameraIP} className="bg-zinc-900 text-white">
                              {cam.cameraIP}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none group-hover/dropdown:text-white transition-colors" />
                      </div>
                    </div>
                  )}

                  {entryCameras.filter(c => c.cameraIP === activeEntryIP || (!activeEntryIP && entryCameras[0]?.cameraIP === c.cameraIP)).map((camera, i) => (
                    <div key={`entry-${camera.cameraIP}-${i}`} className="h-full relative overflow-hidden group/cam">
                       <CameraStream
                          ip={camera.cameraIP}
                          port={camera.cameraPort}
                          name={camera.cameraName || camera.cameraIP}
                          username={camera.cameraUsername}
                          password={camera.cameraPassword}
                          root={camera.root || "stream"}
                          gateName={camera.gateName}
                          cameraType="entry"
                          onOpenGate={khaalgaNeey}
                        />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exit Camera Stream */}
          <div className="relative group/camera overflow-hidden rounded-3xl bg-black shadow-2xl transition-all duration-500">
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
               <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Гарах Камер</span>
               </div>
            </div>
            
            <div className="aspect-video relative">
              {exitCameras.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 border border-white/5">
                  <VideoOff className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Тохиргоогүй байна</p>
                </div>
              ) : (
                <div className="h-full">
                  {/* Camera Selection Dropdown */}
                  {exitCameras.length > 1 && (
                    <div className="absolute top-4 right-4 z-[50]">
                      <div className="relative group/dropdown">
                        <select
                          value={activeExitIP}
                          onChange={(e) => setActiveExitIP(e.target.value)}
                          className="appearance-none bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2 pr-10 text-[10px] font-black text-white uppercase tracking-widest cursor-pointer hover:bg-black/80 transition-all outline-none"
                        >
                          {exitCameras.map((cam) => (
                            <option key={cam.cameraIP} value={cam.cameraIP} className="bg-zinc-900 text-white">
                              {cam.cameraIP}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none group-hover/dropdown:text-white transition-colors" />
                      </div>
                    </div>
                  )}

                  {exitCameras.filter(c => c.cameraIP === activeExitIP || (!activeExitIP && exitCameras[0]?.cameraIP === c.cameraIP)).map((camera, i) => (
                    <div key={`exit-${camera.cameraIP}-${i}`} className="h-full relative overflow-hidden group/cam">
                       <CameraStream
                          ip={camera.cameraIP}
                          port={camera.cameraPort}
                          name={camera.cameraName || camera.cameraIP}
                          username={camera.cameraUsername}
                          password={camera.cameraPassword}
                          root={camera.root || "stream"}
                          gateName={camera.gateName}
                          cameraType="exit"
                          onOpenGate={khaalgaNeey}
                        />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-slate-900 text-white shadow-lg">
                  <Calendar className="w-4 h-4" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none">Гүйлгээний түүх</h3>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter opacity-70">СҮҮЛД БҮРТГЭГДСЭН ГҮЙЛГЭЭНИЙ ЖАГСААЛТ</p>
               </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRegModalOpen(true)}
                className="flex items-center gap-2 px-6 h-10 rounded-xl bg-[#4285F4] border border-[#4285F4] text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Машин бүртгэх</span>
              </button>

              <div className="min-w-[240px]">
                <DatePickerInput
                  type="range"
                  value={dateRange}
                  onChange={(v: any) => {
                    setDateRange(v);
                    setPage(1);
                  }}
                  valueFormat="YYYY-MM-DD"
                  classNames={{ input: "rounded-xl border-[color:var(--surface-border)] bg-white shadow-sm h-10 font-bold" }}
                  clearable
                />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--surface-border)] bg-white/40 backdrop-blur-md shadow-xl dark:bg-black/20">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-[11px] border-collapse bg-white">
                <thead>
                   <tr className="bg-gray-50/80 border-b border-gray-100">
                      {["№", "Дугаар", "Орсон", "Гарсан", "Хугацаа/мин", "Төрөл", "Хөнгөлөлт", "Дүн", "Төлбөр", "И-Баримт", "Төлөв", "Шалтгаан", ""].map((col, i) => (
                        <th key={col} className={`py-3 px-3 font-bold text-gray-500 uppercase tracking-tighter text-[10px] ${i === 0 ? 'text-center w-12' : 'text-left'}`}>
                          {col}
                        </th>
                      ))}
                      <th className="w-24"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                           <Calendar className="w-12 h-12 mb-2" />
                           <p className="text-xs font-black uppercase tracking-widest">Мэдээлэл олдсонгүй</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction, idx) => {
                      const mur = transaction.tuukh?.[0];
                      const tsag = mur?.tsagiinTuukh?.[0];
                      const orsonTsag = tsag?.orsonTsag;
                      const garsanTsag = tsag?.garsanTsag;
                      
                      const tuluv = mur?.tuluv;
                      const niitDun = transaction.niitDun || 0;
                      const isCurrentlyIn = !mur?.garsanKhaalga;
                      
                      // Action logic: only show exit controls if they are inside and not marked as fully 'Paid' (tuluv 1) already, 
                      // though usually status 1 means they can leave. If status is 0, they definitely need action.
                      const showActionBtn = isCurrentlyIn && (tuluv === 0 || tuluv === 2);

                      return (
                        <tr
                          key={transaction._id || idx}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="py-2.5 px-3 text-center text-gray-400">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700">{transaction.mashiniiDugaar || "-"}</span>
                                <Copy 
                                  className="w-3 h-3 text-slate-300 cursor-pointer hover:text-blue-500 transition-colors" 
                                  onClick={() => copyToClipboard(transaction.mashiniiDugaar)}
                                />
                             </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-gray-600">
                             {orsonTsag ? moment(orsonTsag).format("MM-DD HH:mm:ss") : "-"}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-gray-600">
                             {garsanTsag ? moment(garsanTsag).format("MM-DD HH:mm:ss") : "-"}
                          </td>
                          <td className="py-2.5 px-3">
                             <div className={`px-2 py-1 rounded-md font-bold text-center w-24 ${isCurrentlyIn ? "bg-[#D9E9FF] text-[#2D5BFF]" : "bg-gray-100 text-gray-500"}`}>
                                <RealTimeDuration orsonTsag={orsonTsag} garsanTsag={garsanTsag} />
                             </div>

                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                             {transaction.tuukh?.[0]?.turul || "Үйлчлүүлэгч"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                             {transaction.tuukh?.[0]?.khungulult || ""}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gray-700">
                             {transaction.niitDun || 0}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                             {transaction.tuukh?.[0]?.tulsunDun || ""}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                             {transaction.tuukh?.[0]?.ebarimtId || 0}
                          </td>
                           <td className="py-2.5 px-3">
                              {showActionBtn ? (
                                confirmExitId === transaction._id ? (
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => handleManualExit(transaction, 'pay')}
                                      className="bg-emerald-500 text-white px-2 py-1 rounded-md font-bold text-[8px] uppercase tracking-tighter hover:bg-emerald-600 transition-colors"
                                    >
                                      Төлөх
                                    </button>
                                    <button 
                                      onClick={() => handleManualExit(transaction, 'free')}
                                      className="bg-amber-500 text-white px-2 py-1 rounded-md font-bold text-[8px] uppercase tracking-tighter hover:bg-amber-600 transition-colors"
                                    >
                                      Үнэгүй
                                    </button>
                                    <button 
                                      onClick={() => setConfirmExitId(null)}
                                      className="bg-gray-400 text-white px-2 py-1 rounded-md font-bold text-[8px] uppercase tracking-tighter hover:bg-gray-500 transition-colors"
                                    >
                                      Болих
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      if (niitDun > 0) {
                                        setConfirmExitId(transaction._id);
                                      } else {
                                        handleManualExit(transaction, 'free');
                                      }
                                    }}
                                    className="bg-[#4285F4] text-white px-2.5 py-1 rounded-md font-bold text-[9px] uppercase tracking-tighter active:scale-95 transition-transform"
                                  >
                                    Идэвхтэй
                                  </button>
                                )
                              ) : (
                                <div className="flex items-center gap-1.5">
                                   <span className={`w-1.5 h-1.5 rounded-full ${
                                     tuluv === 1 ? 'bg-emerald-500' : 
                                     tuluv === 2 ? 'bg-indigo-500' : 
                                     tuluv === -1 ? 'bg-rose-500' : 
                                     (!isCurrentlyIn && niitDun === 0) ? 'bg-emerald-500' : 'bg-gray-400'
                                   }`}></span>
                                   <span className={`text-[9px] font-bold uppercase ${
                                     tuluv === 1 ? 'text-emerald-600' : 
                                     tuluv === 2 ? 'text-indigo-600' : 
                                     tuluv === -1 ? 'text-rose-600' : 
                                     (!isCurrentlyIn && niitDun === 0) ? 'text-emerald-600' : 'text-gray-500'
                                   }`}>
                                      {tuluv === 1 ? "Төлсөн" : 
                                       tuluv === 2 ? "Урьдчилсан" : 
                                       tuluv === -1 ? "Зөрчилтэй" : 
                                       (!isCurrentlyIn && niitDun === 0) ? "Үнэгүй" :
                                       (niitDun > 0 ? "Төлөөгүй" : "Идэвхтэй")}
                                   </span>
                                </div>
                              )}
                           </td>
                          <td className="py-2.5 px-3 text-gray-400 italic truncate max-w-[100px]">
                             {transaction.zurchil || ""}
                          </td>
                          <td className="py-2.5 px-3">
                             <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1.5 rounded border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                   <Info className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div className="p-1.5 rounded border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                   <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div className="p-1.5 rounded border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                   <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                             </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-gray-50/50 border-t border-gray-100 font-bold text-[10px]">
                   <tr>
                      <td colSpan={6} className="py-3 px-3 text-right text-gray-400 uppercase">Нийт дүн</td>
                      <td className="py-3 px-3"></td>
                      <td className="py-3 px-3 text-gray-700">0</td>
                      <td className="py-3 px-3 text-gray-700">0</td>
                      <td className="py-3 px-3 text-gray-700">0</td>
                      <td colSpan={3}></td>
                   </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--surface-hover)] transition text-sm"
            >
              Өмнөх
            </button>
            <span className="px-4 py-2 text-sm text-[color:var(--panel-text)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--surface-hover)] transition text-sm"
            >
              Дараах
            </button>
          </div>
        )}

        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4">
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Нийт орлого
                </p>
                <p className="text-lg  text-[color:var(--panel-text)]">
                  {formatCurrency(stats.total)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Төлсөн
                </p>
                <p className="text-lg  text-green-600">
                  {formatCurrency(stats.paid)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Төлөөгүй
                </p>
                <p className="text-lg  text-red-600">
                  {formatCurrency(stats.unpaid)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Нийт тоо
                </p>
                <p className="text-lg  text-[color:var(--panel-text)]">
                  {stats.count}
                </p>
                <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                  Төлсөн: {stats.paidCount}
                </p>
              </div>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div> */}
        
        {selectedTransaction && (
          <PaymentModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            onConfirm={async (amount, method) => {
              try {
                const zogsooliinId = selectedTransaction.tuukh?.[0]?.zogsooliinId || selectedTransaction.barilgiinId || effectiveBarilgiinId;
                
                const payload = {
                  id: selectedTransaction._id,
                  tulbur: [
                    {
                      ognoo: new Date().toISOString(),
                      baiguullagiinId: ajiltan?.baiguullagiinId,
                      barilgiinId: effectiveBarilgiinId,
                      burtgesenAjiltaniiId: ajiltan?._id,
                      burtgesenAjiltaniiNer: ajiltan?.ner,
                      dun: amount,
                      turul: method,
                      zogsooliinId: zogsooliinId,
                    }
                  ]
                };

                const resp = await uilchilgee(token || "").post("/zogsooliinTulburTulye", payload);
                
                if (resp.status === 200 || resp.data === "Amjilttai") {
                  toast.success("Төлбөр амжилттай бүртгэгдлээ");
                  setSelectedTransaction(null);
                  // Refresh the list to show updated status
                  fetchList();
                } else {
                  toast.error("Алдаа гарлаа: " + (resp.data?.message || "Үл мэдэгдэх алдаа"));
                }
              } catch (err) {
                console.error("Payment registration error:", err);
                toast.error("Төлбөр бүртгэхэд алдаа гарлаа");
              }
            }}
          />
        )}
        {isRegModalOpen && (
          <VehicleRegistrationModal
            onClose={() => setIsRegModalOpen(false)}
            token={token || ""}
            barilgiinId={effectiveBarilgiinId}
            entryCameras={entryCameras}
            selectedCameraIP={activeEntryIP}
            onSuccess={() => fetchList()}
          />
        )}
      </div>
    </div>

  );
}

// Camera Stream Component using R2WPlayer
const CameraStream = React.memo(({
  ip,
  port,
  name,
  username,
  password,
  root = "stream",
  gateName,
  cameraType,
  onOpenGate,
}: {
  ip: string;
  port: number;
  name: string;
  username?: string;
  password?: string;
  root?: string; // Stream path (ROOT from tokhirgoo, e.g., "live", "stream")
  gateName?: string;
  cameraType?: "entry" | "exit";
  onOpenGate?: (ip: string) => void;
}) => {
  const [error, setError] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamContainerRef = useRef<HTMLDivElement>(null);

  const handleError = useCallback((err: any) => {
    console.error("R2WPlayer error:", err);
    setError(true);
  }, []);

  const handleConnectionStateChange = useCallback((state: string) => {
    setConnectionState(state);
    if (state === "failed" || state === "disconnected") {
      setError(true);
    } else if (state === "connected") {
      setError(false);
    }
  }, []);

  const toggleFullscreen = () => {
    if (!streamContainerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (streamContainerRef.current.requestFullscreen) {
        streamContainerRef.current.requestFullscreen();
      } else if ((streamContainerRef.current as any).webkitRequestFullscreen) {
        (streamContainerRef.current as any).webkitRequestFullscreen();
      } else if ((streamContainerRef.current as any).msRequestFullscreen) {
        (streamContainerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes and keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'F' to toggle fullscreen (when not in input/textarea)
      if (e.key === "f" || e.key === "F") {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      // Press 'Escape' to exit fullscreen
      if (e.key === "Escape") {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement
        );
        if (isCurrentlyFullscreen) {
          toggleFullscreen();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative p-6 rounded-3xl bg-gray-900/80 backdrop-blur-sm border border-red-500/30">
            <VideoOff className="w-16 h-16 mb-4 mx-auto opacity-75 animate-pulse" />
            <p className="text-base font-semibold mb-2 text-center">
              Камер холбогдохгүй байна
            </p>
            <p className="text-xs opacity-60 text-center mb-3 font-mono">
              {ip}:{port}
            </p>
            {connectionState && (
              <div className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-xs opacity-80 text-center">
                  Төлөв: {connectionState}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={streamContainerRef}
      className="absolute inset-0 w-full h-full group/stream"
      style={
        isFullscreen
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              backgroundColor: "#000",
            }
          : {}
      }
    >
      <R2WPlayerComponent
        Camer={ip}
        PORT={port}
        USER={username}
        PASSWD={password}
        ROOT={root}
        serverPath="/api/camera/stream"
        onError={handleError}
        onConnectionStateChange={handleConnectionStateChange}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* Manual Gate Control Button - Modernized */}
      <div className="absolute bottom-6 left-6 z-40 transition-all duration-300 group-hover/stream:translate-y-0 translate-y-2 group-hover/stream:opacity-100 opacity-0 sm:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenGate?.(ip);
          }}
          className={`
            relative flex items-center gap-3 px-8 py-3 rounded-full 
            font-black text-[11px] uppercase tracking-[0.2em]
            transition-all duration-300 active:scale-90
            backdrop-blur-xl border-2
            shadow-[0_8px_32px_rgba(0,0,0,0.3)]
            ${cameraType === 'entry' 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-400' 
              : 'bg-rose-500/20 border-rose-500/40 text-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-400'
            }
          `}
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${cameraType === 'entry' ? 'bg-emerald-400' : 'bg-rose-400'} group-hover:bg-white`}></div>
          <span>Нээх</span>
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>


      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-all duration-200 ${
          isFullscreen
            ? "opacity-100"
            : "opacity-0 group-hover/stream:opacity-100"
        } focus:opacity-100`}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={
          isFullscreen ? "Бүтэн дэлгэцнээс гарах (ESC)" : "Бүтэн дэлгэц (F)"
        }
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>

      {/* Camera Info Overlay */}
      {!isFullscreen && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium opacity-0 group-hover/stream:opacity-100 transition-opacity duration-200">
          {gateName && <span className="hidden sm:inline">{gateName} - </span>}
          <span className="font-mono">
            {ip}:{port}
          </span>
        </div>
      )}

      {/* Fullscreen overlay info */}
      {isFullscreen && (
        <div className="absolute top-3 left-3 z-30 px-3 py-2 rounded-lg bg-black/70 text-white">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${cameraType === "entry" ? "bg-green-500" : "bg-red-500"} animate-pulse`}
            ></div>
            <div>
              <p className="font-semibold text-xs">{gateName || name}</p>
              <p className="text-xs opacity-75 font-mono">
                {ip}:{port}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Display connection state for debugging */}
      {process.env.NODE_ENV === "development" && connectionState && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1.5 text-center z-10">
          {connectionState}
        </div>
      )}
    </div>
  );
});
