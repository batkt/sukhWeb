import shalgaltKhiikh from "services/shalgaltKhiikh";
import Admin from "components/Admin";
import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "services/auth";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Popover,
  Space,
  Table,
  Radio,
  Modal,
  TreeSelect,
  Form,
  message,
  Tooltip,
  Drawer,
  Select,
  notification,
  InputNumber,
} from "antd";
import { toast } from "sonner";
import {
  StarOutlined,
  CameraOutlined,
  WalletOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  DownOutlined,
  CloseOutlined,
  FilterOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  CopyOutlined,
  ArrowRightOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import CardList from "components/cardList";
import BaganiinSongolt from "components/table/BaganiinSongolt";
import UilchluulegchTile from "components/pageComponents/zogsool/UilchluulegchTile";
import moment from "moment";
import formatNumber from "tools/function/formatNumber";
import { useRef, useEffect } from "react";
import useOrder from "tools/function/useOrder";
import Aos from "aos";
import { useTranslation } from "react-i18next";
import useUilchluulegch, {
  useUilchluulegchZogsoolToo,
} from "hooks/useUilchluulegch";
import useJagsaalt from "../../../hooks/useJagsaalt";
import { modal } from "../../../components/ant/Modal";
import _ from "lodash";
import updateMethod from "../../../tools/function/crud/updateMethod";
import { tulburBodoy } from "../../../tools/function/tulburBodyo";
import useDansKhuulga from "../../../hooks/khuulga/useDansKhuulga";

import { zogsoolUilchilgee, aldaaBarigch, socket } from "services/uilchilgee";
import uilchilgee from "services/uilchilgee";
import { t } from "i18next";
import { Excel } from "antd-table-saveas-excel";
import { useKeyboardTovchlol } from "hooks/useKeyboardTovchlol";
import Stream1, { SocketStream, Stream2 } from "./stream";
import StackStream from "./stackStream";
import TulburiinDelgerenguiTailan from "components/pageComponents/zogsool/TulburiinDelgerenguiTailan";
import AjiltniiDelgerenguiTailan from "components/pageComponents/zogsool/AjiltniiDelgerenguiTailan";
import ZogsoolCameraTable from "components/pageComponents/zogsool/ZogsoolCameraTable";
import R2WPlayerComponent from "components/streamPlayer";
import StackIkhNaydStream from "./StackIkhNaydStream";
import ShineTulbur from "components/pageComponents/tulbur/ShineTulbur";
import KhungulukhTsonkh from "components/pageComponents/zogsool/KhungulukhTsonkh";
import { CiDiscount1 } from "react-icons/ci";

export function TsagToololt({ ekhlekhTsag }) {
  const [timeUp, setTimeUp] = useState("Тооцоолж байна");

  const tsagTootsoolur = () => {
    var zoruu = moment.duration(moment(new Date()).diff(ekhlekhTsag));
    var tsag = Math.floor(zoruu.asHours());
    var minut = Math.floor(zoruu.minutes());
    var second = Math.floor(zoruu.seconds());
    return (
      <div>
        {tsag < 10 && "0"}
        {tsag > 0 ? tsag : "0"} : {minut < 10 && "0"}
        {minut > 0 ? minut : "0"} : {second < 10 && "0"}
        {second > 0 ? second : "0"}
      </div>
    );
  };

  useEffect(() => {
    setTimeout(() => {
      setTimeUp(tsagTootsoolur());
    }, 1000);
  }, [ekhlekhTsag, timeUp]);
  return <div>{timeUp}</div>;
}

const usguud = [
  "А",
  "Б",
  "В",
  "Г",
  "Д",
  "Е",
  "Ё",
  "Ж",
  "З",
  "И",
  "Й",
  "К",
  "Л",
  "М",
  "Н",
  "О",
  "Ө",
  "П",
  "Р",
  "С",
  "Т",
  "У",
  "Ү",
  "Ф",
  "Х",
  "Ц",
  "Ч",
  "Ш",
  "Щ",
  "Ъ",
  "Ь",
  "Ы",
  "Э",
  "Ю",
  "Я",
];

function generateChild(mur, turul) {
  if (mur?.length > 0) {
    let res = [];
    for (let i = 0; i < mur.length; i++) {
      const a = mur[i];
      if (!!a?.turul) if (a.turul !== turul) continue;
      res.push({
        value: !!a?.ner ? a.ner : a?.cameraIP,
        title: !!a?.ner ? (
          a.ner + (a?.turul ? " / " + a?.turul : "")
        ) : (
          <b
            key={a?.cameraIP}
            className="w-full text-green-400 hover:text-green-800"
          >
            {t("Камер")}-{a?.cameraIP}
          </b>
        ),
        children: generateChild(!!a?.khaalga ? a.khaalga : a?.camera, turul),
        disabled: false,
        disableCheckbox: true,
        selectable: !a?.ner,
        checkable: !a?.ner,
      });
    }
    return res;
  }
  return [];
}

function tulburKhurvuulekh(v) {
  var utga = undefined;
  switch (v) {
    case "belen":
      utga = "Бэлэн";
      break;
    case "zeel":
      utga = "Зээл";
      break;
    case "khariltsakh":
      utga = "Дансаар";
      break;
    case "khaan":
      utga = "Хаан";
      break;
    case "khas":
      utga = "Хас";
      break;
    case "tur":
      utga = "Төр";
      break;
    case "golomt":
      utga = "Голомт";
      break;
    case "tdb":
      utga = "ХХБ";
      break;
    case "kapitron":
      utga = "Капитрон";
      break;
    case "toki":
      utga = "Токи";
      break;
    case "kiosk":
      utga = "Киоск";
      break;
    case "khungulult":
      utga = "Хөнгөлөлт";
      break;
    case "bankQR":
      utga = "Банк QR";
      break;
    case "tseneglelt":
      utga = "Хэтэвч";
      break;
    case "qpay":
      utga = "QPay";
      break;
    case "DotorQR":
      utga = "Дотор QR";
      break;

    case "GadaaQR":
      utga = "Гадаа QR";
      break;
    case "PosBelen":
      utga = "Пос Бэлэн";
      break;
    case "PosKart":
      utga = "Пос Карт";
      break;
    case "PosKhariltsakh":
      utga = "Пос Данс";
      break;
    default:
      if (v && typeof v === "string" && v.toLowerCase().startsWith("ugaalga")) {
        if (v.includes("24")) {
          utga = "Угаалга/ 24 цаг";
        } else {
          utga = "Угаалга/ 1 цаг";
        }
      } else {
        utga = v;
      }
      break;
  }
  return utga;
}

/**
 * Эхний байдлаар зөвхөн 1 зогсоол дээр төлбөр тооцхоор шийдлээ
 * дотороо зогсоолтой тохиолдолд өөрчилнө
 * */

function camera({ token }) {
  const { t, i18n } = useTranslation();
  const { baiguullaga, ajiltan, barilgiinId, isOfflineMode, isOnline } =
    useAuth();

  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const currentOnline =
      typeof navigator !== "undefined" ? navigator.onLine : true;
    if (currentOnline !== browserOnline) {
      setBrowserOnline(currentOnline);
    }

    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isActuallyOffline = isOfflineMode || !isOnline || !browserOnline;

  const [syncStatus, setSyncStatus] = useState("idle"); // idle, syncing, success, error
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [pendingCarsUpdateTrigger, setPendingCarsUpdateTrigger] = useState(0);
  const [wasOffline, setWasOffline] = useState(
    isOfflineMode || !isOnline || !browserOnline
  );
  const [localOfflineData, setLocalOfflineData] = useState([]); // Data from local .NET service
  const [ognoo, setOgnoo] = useState([
    moment().startOf("day"),
    moment().endOf("day"),
  ]);
  const [turul, setTurul] = useState(undefined);
  // const [songosonMashin, setSongosonMashin] = useState(undefined);
  const tulburRef = React.useRef(null);
  const mashiniiDugaarRef = React.useRef(null);
  const tailanRef = React.useRef(null);
  const ajiltniiTailanRef = React.useRef(null);
  const khungulultRef = React.useRef(null);
  // const { order, onChangeTable } = useOrder({"tuukh.0.tsagiinTuukh.0.garsanTsag":-1});
  const { order, onChangeTable, setOrder } = useOrder({
    "tuukh.0.tsagiinTuukh.0.garsanTsag": -1,
  });
  const [modalOpen, setModalOpen] = useState({
    bool: false,
    item: null,
    type: "",
  });
  const [value, setValue] = useState(null);
  const [ajiltniiNers, setAjiltniiNers] = useState([]);
  const [camerVal, setCamerVal] = useState([null, null]);
  const [cameraData, setCameraData] = useState([null, null]);
  const [cameraKharakh, setCamerKharakh] = useState(false);
  const [guilgeeKharakh, setGuilgeeKharakh] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [khelber, setKhelber] = useState("");

  const [dun, setDun] = useState("");
  const [tuluvFilter, setTuluvFilter] = useState("");
  const [khaikh, setKhaikh] = useState("");
  // const [refresh, setRefresh] = useState(true);
  const [modalNeelttei, setModalNeelttei] = useState(false);
  const [guilgeeDrawerOpen, setGuilgeeDrawerOpen] = useState(false);
  const [shineBagana, setShineBagana] = useState([]);
  const [form] = Form.useForm();
  const songogdsonCameraIP = Form.useWatch("CAMERA_IP", form);
  const orohCameraSongogdson =
    !!camerVal[0] && songogdsonCameraIP === camerVal[0];
  const garahCameraSongogdson =
    !!camerVal[1] && songogdsonCameraIP === camerVal[1];
  const searchUtga = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    setShineBagana([]);
  }, [i18n.language]);

  const [isHovered, setIsHovered] = useState(false);
  const [isHovered2, setIsHovered2] = useState(false);

  const que = useMemo(() => {
    return {
      baiguullagiinId: baiguullaga?._id,
      barilgiinId: barilgiinId,
      "khaalga.ajiltnuud.id": ajiltan?._id,
    };
  }, [baiguullaga?._id, ajiltan, barilgiinId]);

  const { jagsaalt, mutate: toololtMutate } = useJagsaalt(
    "/zogsoolJagsaalt",
    que
  );

  const streamQuery = useMemo(() => {
    return {
      baiguullagiinId: baiguullaga?._id,
      barilgiinId: barilgiinId,
    };
  }, [baiguullaga?._id, barilgiinId]);

  const { jagsaalt: parkingJagsaalt, mutate: parkingMutate } = useJagsaalt(
    "/parking",
    streamQuery
  );

  const zurchilteiMashinMsgilgeekh = (mashiniiDugaar) => {
    let yavuulakhData = {
      baiguullagiinId: baiguullaga?._id,
      barilgiinId: barilgiinId,
      mashiniiDugaar: mashiniiDugaar,
    };
    uilchilgee(token)
      .post("/zurchilteiMashinMsgilgeekh", yavuulakhData)
      .then((res) => {
        if (res.status === 200)
          notification.success({ message: t("Амжилттай илгээгдлээ") });
      })
      .catch(aldaaBarigch);
  };

  const songogdzonZogsoolOrokh = useMemo(() => {
    var zogsool = {};
    if (parkingJagsaalt && camerVal[0]) {
      parkingJagsaalt?.forEach((item) => {
        item?.khaalga?.forEach((khaalgaItem) => {
          khaalgaItem?.camera?.forEach((cameraItem) => {
            if (cameraItem?.cameraIP === camerVal[0]) {
              zogsool = item;
            }
          });
        });
      });
    }
    return zogsool;
  }, [parkingJagsaalt, camerVal]);

  const songogdzonZogsool = useMemo(() => {
    var zogsool = {};
    if (parkingJagsaalt && camerVal[1]) {
      parkingJagsaalt?.forEach((item) => {
        item?.khaalga?.forEach((khaalgaItem) => {
          khaalgaItem?.camera?.forEach((cameraItem) => {
            if (cameraItem?.cameraIP === camerVal[1]) {
              zogsool = item;
            }
          });
        });
      });
    }
    return zogsool;
  }, [parkingJagsaalt, camerVal]);

  const uneguiKhugatsaaMin = useMemo(() => {
    const raw = songogdzonZogsool?.mashinGargakhKhugatsaa;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 30;
  }, [songogdzonZogsool?.mashinGargakhKhugatsaa]);

  const tuukhiinKhugatsaaMin = useCallback((tuukh) => {
    if (!tuukh) return null;
    const niitKhugatsaa = tuukh?.niitKhugatsaa;
    if (Number.isFinite(Number(niitKhugatsaa)) && Number(niitKhugatsaa) >= 0) {
      return Number(niitKhugatsaa);
    }
    const orsonTsag = tuukh?.tsagiinTuukh?.[0]?.orsonTsag;
    const garsanTsag = tuukh?.tsagiinTuukh?.[0]?.garsanTsag || new Date();
    if (!orsonTsag) return null;
    return moment(garsanTsag).diff(moment(orsonTsag), "minutes");
  }, []);

  const isInUneguiKhugatsaa = useCallback(
    (tuukh) => {
      const minutes = tuukhiinKhugatsaaMin(tuukh);
      return (
        Number.isFinite(Number(minutes)) &&
        Number(minutes) <= uneguiKhugatsaaMin
      );
    },
    [tuukhiinKhugatsaaMin, uneguiKhugatsaaMin]
  );

  const calculateParkingFee = useCallback(
    async (tuukh) => {
      try {
        if (!tuukh || !songogdzonZogsool?.tulburuud) {
          return 0;
        }

        const orsonTsag = tuukh?.tsagiinTuukh?.[0]?.orsonTsag;
        const garsanTsag = tuukh?.tsagiinTuukh?.[0]?.garsanTsag || new Date();

        if (!orsonTsag) return 0;

        const fee = await tulburBodoy(
          songogdzonZogsool.tulburuud,
          moment(garsanTsag),
          moment(orsonTsag),
          songogdzonZogsool.undsenUne || 0,
          songogdzonZogsool.undsenMin || 0,
          0, // dotorZogsoolMinut
          0 // zuruuMinut
        );

        return fee || 0;
      } catch (error) {
        console.error("Error calculating parking fee:", error);
        return 0;
      }
    },
    [songogdzonZogsool]
  );

  const [isPaying, setIsPaying] = React.useState(false);

  const query = useMemo(() => {
    let result = {};
    const hasSearch =
      !!khaikh &&
      !khaikh.includes("\\") &&
      !khaikh.includes("[") &&
      !khaikh.includes("]");

    if (!!camerVal[1]) {
      result = {
        $or: [
          {
            "tuukh.0.garsanKhaalga": camerVal[1],
            "tuukh.tsagiinTuukh.garsanTsag": {
              $gte: moment(ognoo[0]).format("YYYY-MM-DD 00:00:00"),
              $lte: moment(ognoo[1]).format("YYYY-MM-DD 23:59:59"),
            },
          },
          {
            "tuukh.0.garsanKhaalga": { $exists: false },
            createdAt: {
              $gte: moment(ognoo[0]).format("YYYY-MM-DD 00:00:00"),
              $lte: moment(ognoo[1]).format("YYYY-MM-DD 23:59:59"),
            },
          },
        ],
      };
    } else {
      result = {
        $or: [
          {
            "tuukh.tsagiinTuukh.garsanTsag": {
              $gte: moment(ognoo[0]).format("YYYY-MM-DD 00:00:00"),
              $lte: moment(ognoo[1]).format("YYYY-MM-DD 23:59:59"),
            },
          },
          {
            createdAt: {
              $gte: moment(ognoo[0]).format("YYYY-MM-DD 00:00:00"),
              $lte: moment(ognoo[1]).format("YYYY-MM-DD 23:59:59"),
            },
          },
        ],
      };

      if (
        tuluvFilter !== "" &&
        tuluvFilter !== null &&
        tuluvFilter !== undefined
      ) {
        switch (tuluvFilter) {
          case "active":
            baseQuery["tuukh.0.tuluv"] = 0;
            baseQuery["tuukh.0.garsanKhaalga"] = { $exists: false };
            baseQuery["tuukh.0.uneguiGarsan"] = { $exists: false };
            baseQuery["tuukh.0.tsagiinTuukh.0.garsanTsag"] = { $exists: false };
            baseQuery["tuukh.0.tsagiinTuukh.0.orsonTsag"] = {
              $gt: new Date(Date.now() - shalgakhTsag * 60 * 60 * 1000),
            };
            break;
          case "tulsun":
            baseQuery["tuukh.0.tuluv"] = 1;
            break;
          case "tulugdsun":
            baseQuery["tuukh.0.tuluv"] = 1;
            break;

          case "unegui":
            baseQuery["niitDun"] = { $eq: 0 };
            break;

          case "tulburtei":
            baseQuery["tuukh.0.tuluv"] = -4;
            baseQuery["tuukh.0.uneguiGarsan"] = { $exists: false };
            baseQuery["niitDun"] = { $gt: 0 };
            baseQuery["tuukh"] = { $elemMatch: { tulbur: { $eq: [] } } };
            break;
        }
      }
    }
    if (hasSearch) {
      result = {
        $and: [
          result,
          {
            $or: [{ mashiniiDugaar: { $regex: khaikh, $options: "i" } }],
          },
        ],
      };
    }

    // Apply payment type filter (Fixed syntax error)
    if (!!khelber) {
      if (khelber === "tuluugui") {
        result["tuukh.tulbur.0"] = { $exists: false };
      } else {
        result["tuukh.tulbur.turul"] =
          !!khelber && khelber === "card"
            ? { $in: ["khaan", "tdb", "khas", "golomt", "kapitron", "tur"] }
            : khelber;
      }
    }

    if (!!dun) {
      result["tuukh.tulukhDun"] =
        !!dun && dun === "dunBodson"
          ? { $gt: 0 }
          : { $in: [0, null, undefined] };
    }

    return result;
  }, [ognoo, khelber, dun, camerVal, khaikh, tuluvFilter]);

  useEffect(() => {
    Aos.init({ once: true });
  });
  useEffect(() => {
    var data = localStorage.getItem("CamerVal");
    data = JSON.parse(data);
    if (Array.isArray(data) && data.length === 2) {
      setCamerVal(data);
    }
    // Load pending updates
    if (typeof window !== "undefined") {
      const stored = JSON.parse(
        localStorage.getItem("cameraPendingUpdates") || "[]"
      );
      setPendingUpdates(stored);
    }
  }, []);

  // Fetch offline data from local .NET service
  const fetchLocalOfflineData = React.useCallback(async () => {
    if (!isActuallyOffline) return; // Only fetch when offline

    try {
      // Try to connect to local .NET service (adjust port as needed)
      const response = await fetch("http://localhost:5000/api/offline-plates", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000, // 5 second timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Found ${result.count} plates from local .NET service`);
        console.log("Last updated:", result.lastUpdated);

        const transformedData = result.data
          .map((plate, index) => {
            try {
              // Helper function to extract string value from array or string
              const extractValue = (value) => {
                if (Array.isArray(value)) {
                  return value.length > 0 ? String(value[0]) : "";
                }
                return value ? String(value) : "";
              };

              // Clean null characters and whitespace
              const cleanString = (str) => {
                return str.replace(/\u0000/g, "").trim();
              };

              // Handle both old and new property names from .NET service
              const mashiniiDugaar = cleanString(
                extractValue(plate.mashiniiDugaar)
              );
              const cameraIP = cleanString(
                extractValue(plate.camerA_IP || plate.CAMERA_IP)
              );
              const burtgelOgnoo = cleanString(
                extractValue(plate.burtgelOgnoo)
              );
              const color = cleanString(
                extractValue(plate.color || plate.Color)
              );

              // Skip empty records
              if (!mashiniiDugaar || !cameraIP || !burtgelOgnoo) {
                console.log("Skipping empty plate record:", plate);
                return null;
              }

              return {
                _id: `local-net-${Date.now()}-${index}`,
                mashiniiDugaar: mashiniiDugaar.toUpperCase(),
                turul: "Үйлчлүүлэгч",
                createdAt: burtgelOgnoo,
                localSource: true,
                netServiceData: true,
                cameraIP: cameraIP,
                color: color,
                originalData: plate,
                tuukh: [
                  {
                    tuluv: 0,
                    tulukhDun: 0,
                    tulbur: [],
                    orsonKhaalga: cameraIP,
                    tsagiinTuukh: [
                      {
                        orsonTsag: new Date(burtgelOgnoo),
                      },
                    ],
                  },
                ],
                mashin: {
                  temdeglel: `Камер: ${cameraIP}, Өнгө: ${color || "N/A"}`,
                },
                baiguullagiinId: baiguullaga?._id,
                barilgiinId: barilgiinId,
              };
            } catch (error) {
              console.error("Error transforming plate data:", error, plate);
              return null;
            }
          })
          .filter(Boolean); // Remove null entries

        setLocalOfflineData(transformedData);
        return transformedData;
      }
    } catch (error) {
      console.log("Local .NET service not available:", error.message);
      setLocalOfflineData([]);
    }

    return [];
  }, [isActuallyOffline, baiguullaga?._id, barilgiinId]);

  const syncPendingUpdates = React.useCallback(async () => {
    if (typeof window === "undefined") return;

    const storedUpdates = JSON.parse(
      localStorage.getItem("cameraPendingUpdates") || "[]"
    );
    const storedCars = JSON.parse(
      localStorage.getItem("cameraPendingCars") || "[]"
    );

    if (storedUpdates.length === 0 && storedCars.length === 0) return;

    setSyncStatus("syncing");
    const successful = [];
    const failed = [];
    const successfulCars = [];
    const failedCars = [];

    for (const update of storedUpdates) {
      try {
        if (update.type === "updateUilchluulegch") {
          const response = await updateMethod(
            "uilchluulegch",
            token,
            update.body
          );
          if (response?.data === "Amjilttai") {
            successful.push(update.id);
          } else {
            failed.push(update);
          }
        } else if (update.type === "zogsooliinTulburTulye") {
          const response = await uilchilgee(token).post(
            "/zogsooliinTulburTulye",
            {
              tulbur: update.tulbur,
              id: update.id,
            }
          );
          if (response?.data === "Amjilttai") {
            successful.push(update.pendingId);
          } else {
            failed.push(update);
          }
        }
      } catch (error) {
        failed.push(update);
      }
    }

    for (const car of storedCars) {
      try {
        if (car.type === "addCar" || car.type === "addCarFromEntry") {
          const endpoint =
            car.type === "addCarFromEntry"
              ? "/zogsoolOrlogoGaraas"
              : "/zogsoolSdkService";
          const response = await uilchilgee(token).post(endpoint, car.data);
          if (response?.status === 200 && !response?.data?.aldaa) {
            successfulCars.push(car.id);
          } else {
            failedCars.push(car);
          }
        } else if (car.type === "removeCar") {
          const response = await uilchilgee(token).post(
            "/zogsoolSdkService",
            car.data
          );
          if (response?.status === 200 && !response?.data?.aldaa) {
            successfulCars.push(car.id);
          } else {
            failedCars.push(car);
          }
        }
      } catch (error) {
        failedCars.push(car);
      }
    }

    const remainingUpdates = storedUpdates.filter(
      (update) =>
        !successful.includes(update.id) &&
        !successful.includes(update.pendingId)
    );
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "cameraPendingUpdates",
        JSON.stringify(remainingUpdates)
      );
    }
    setPendingUpdates(remainingUpdates);

    const remainingCars = storedCars.filter(
      (car) => !successfulCars.includes(car.id)
    );
    if (typeof window !== "undefined") {
      localStorage.setItem("cameraPendingCars", JSON.stringify(remainingCars));

      setPendingCarsUpdateTrigger((prev) => prev + 1);
    }

    const totalSuccessful = successful.length + successfulCars.length;
    const totalFailed = failed.length + failedCars.length;
    const totalAttempted = totalSuccessful + totalFailed;

    if (totalSuccessful > 0) {
      setSyncStatus("success");
      toast.success(
        t(`Амжилттай нэгтгэл хийгдлээ (${totalSuccessful} өгөгдөл)`)
      );
      onRefresh && onRefresh();
      setTimeout(() => setSyncStatus("idle"), 3000);
    }

    // if (totalFailed > 0 && totalAttempted > 0) {
    //   if (totalSuccessful === 0) {
    //     setSyncStatus("error");
    //     toast.error(t("Нэгтгэл хийхэд алдаа гарлаа"));
    //     setTimeout(() => setSyncStatus("idle"), 3000);
    //   } else {
    //     toast.warning(t(`${totalFailed} өгөгдөл нэгтгэл хийгдсэнгүй`));
    //   }
    // }
  }, [token, t]);

  useEffect(() => {
    if (!isOfflineMode && isOnline && typeof window !== "undefined") {
      const storedUpdates = JSON.parse(
        localStorage.getItem("cameraPendingUpdates") || "[]"
      );
      const storedCars = JSON.parse(
        localStorage.getItem("cameraPendingCars") || "[]"
      );
      if (storedUpdates.length > 0 || storedCars.length > 0) {
        syncPendingUpdates();
      }
    }
  }, [isOfflineMode, isOnline, syncPendingUpdates]);

  useEffect(() => {
    const a1 = generateChild(jagsaalt, "Орох");
    const a2 = generateChild(jagsaalt, "Гарах");
    setCameraData([a1, a2]);
  }, [jagsaalt]);

  const ekhniiCameraOlokh = (treeData) => {
    if (!treeData || !Array.isArray(treeData)) return null;
    for (const item of treeData) {
      if (item.selectable && item.value) {
        return item.value;
      }
      if (item.children) {
        const childValue = ekhniiCameraOlokh(item.children);
        if (childValue) return childValue;
      }
    }
    return null;
  };

  useEffect(() => {
    const treeHasValue = (treeData, value) => {
      if (!value || !treeData || !Array.isArray(treeData)) return false;
      for (const item of treeData) {
        if (item?.value === value) return true;
        if (item?.children && treeHasValue(item.children, value)) return true;
      }
      return false;
    };

    if (!Array.isArray(cameraData?.[0]) || !Array.isArray(cameraData?.[1]))
      return;

    if (cameraData[0].length > 0) {
      const isValidIn = treeHasValue(cameraData[0], camerVal[0]);
      if (!camerVal[0] || !isValidIn) {
        const firstIn = ekhniiCameraOlokh(cameraData[0]);
        if (firstIn && firstIn !== camerVal[0]) {
          cameraChange(firstIn, 1);
        }
      }
    }

    if (cameraData[1].length > 0) {
      const isValidOut = treeHasValue(cameraData[1], camerVal[1]);
      if (!camerVal[1] || !isValidOut) {
        const firstOut = ekhniiCameraOlokh(cameraData[1]);
        if (firstOut && firstOut !== camerVal[1]) {
          cameraChange(firstOut, 2);
        }
      }
    }
  }, [cameraData?.[0], cameraData?.[1], camerVal?.[0], camerVal?.[1]]);

  const {
    uilchluulegchGaralt,
    setUilchluulegchKhuudaslalt,
    uilchluulegchMutate,
    isValidating,
    updateOfflineItem,
    removeOfflineItem,
  } = useUilchluulegch(token, baiguullaga?._id, query, order, undefined, 100);
  useEffect(() => {
    if (
      !baiguullaga?._id ||
      !parkingJagsaalt ||
      !songogdzonZogsool?.gadaaStickerAshiglakhEsekh
    )
      return;
    if (!socketRef.current) {
      socketRef.current = socket();
    }

    const s = socketRef.current;
    const cleanup = [];
    const getCams = (type) =>
      parkingJagsaalt?.flatMap((item) =>
        item?.khaalga
          ?.filter((k) => k.turul === type)
          ?.flatMap((k) => k.camera?.map((c) => c.cameraIP) || [])
      ) || [];
    const garahCams = getCams("Гарах");
    const handleGarahTulsun = (data) => {
      if (
        !data ||
        !data?.mashiniiDugaar ||
        !data?.baiguullagiinId ||
        data?.baiguullagiinId !== baiguullaga?._id
      )
        return;
      khaalgaNeey(data.cameraIP);
      onRefresh();
    };
    garahCams.forEach((camIP) => {
      const e2 = `qpayMobileSdk${baiguullaga?._id}${camIP}`;
      s.on(e2, handleGarahTulsun);
      cleanup.push(() => s.off(e2, handleGarahTulsun));
    });
    return () => cleanup.forEach((fn) => fn());
  }, [baiguullaga, songogdzonZogsool, parkingJagsaalt]);

  useEffect(() => {
    if (
      !modalOpen?.bool &&
      modalOpen?.type === "unegui" &&
      value === "F7 Үнэгүй"
    )
      khadgalakh();
  }, [modalOpen, value]);

  useEffect(() => {
    if (tuluvFilter) {
      setUilchluulegchKhuudaslalt((prev) => ({
        ...prev,
        khuudasniiDugaar: 1,
      }));
    }
  }, [tuluvFilter]);

  useEffect(() => {
    if (!baiguullaga?._id || !parkingJagsaalt) return;
    if (!socketRef.current) {
      socketRef.current = socket();
    }

    const s = socketRef.current;
    const cleanup = [];
    const getCams = (type) =>
      parkingJagsaalt?.flatMap((item) =>
        item?.khaalga
          ?.filter((k) => k.turul === type)
          ?.flatMap((k) => k.camera?.map((c) => c.cameraIP) || [])
      ) || [];

    const orohCams = getCams("Орох");
    const garahCams = getCams("Гарах");

    const handleOroh = (data) => {
      if (
        !data ||
        !data?.mashiniiDugaar ||
        !data?.baiguullagiinId ||
        data?.baiguullagiinId !== baiguullaga?._id
      )
        return;

      if (!data?.oruulakhguiEsekh) {
        khaalgaNeey(data.cameraIP);
        onRefresh();
      }

      const dugaar = data.mashiniiDugaar?.replace("???", "");
      if (!!dugaar) {
        const url = `/sambar/${data.cameraIP}/${dugaar}/${moment().format(
          "HH:mm:ss"
        )}`;

        zogsoolUilchilgee()
          .get(url)
          .catch(() => {});
      }
      if (baiguullaga?.tokhirgoo?.zurchulMsgeerSanuulakh)
        zurchilteiMashinMsgilgeekh(dugaar);
    };
    const handleGarah = (u) => {
      if (
        !u ||
        !u?.mashiniiDugaar ||
        !u?.baiguullagiinId ||
        u?.baiguullagiinId !== baiguullaga?._id
      )
        return;

      let dugaar = u.mashiniiDugaar?.replace("???", "");
      const garsanKhaalga = u?.tuukh?.[0]?.garsanKhaalga;
      let niit = u?.niitDun;
      if (u?.tuukh?.[0]?.tulbur?.length > 0) {
        niit =
          u.niitDun -
          u.tuukh.reduce(
            (s, t) => s + t?.tulbur?.reduce((a, b) => a + (b?.dun || 0), 0),
            0
          );
      }
      if (niit < 0) niit = 0;

      let url = `/sambar/${garsanKhaalga}/${dugaar}/${niit}`;
      if (
        baiguullaga?._id === "65cf2f027fbc788f85e50b90" ||
        baiguullaga?._id === "6549bbe0d437e6d25d557341"
      ) {
        const start = moment(u?.createdAt).format("YYYY-MM-DD HH:mm:ss");
        const end = moment().format("YYYY-MM-DD HH:mm:ss");

        url = `/sambarOgnootoi/${garsanKhaalga}/${dugaar}/${niit}/${start}/${end}`;
      }
      if (u?.turul === "Үнэгүй" || niit === 0) {
        if (u?.tuukh?.[0]?.garsanKhaalga) {
          toololtMutate();
          zogsoolTusBuriinTooMutate();

          if (songogdzonZogsool?.garakhKhaalgaGarTokhirgoo !== true) {
            khaalgaNeey(u.tuukh[0].garsanKhaalga);
          }
        }
      }
      if (!!dugaar) {
        zogsoolUilchilgee()
          .get(url)
          .catch(() => {});
      }
      onRefresh();
    };
    const handleGarahTulsun = (data) => {
      if (
        !data ||
        !data?.mashiniiDugaar ||
        !data?.baiguullagiinId ||
        data?.baiguullagiinId !== baiguullaga?._id
      )
        return;
      let dugaar = data?.mashiniiDugaar?.replace("???", "");
      if (!!dugaar) {
        zogsoolUilchilgee()
          .get(
            `/sambar/${data?.cameraIP}/${dugaar}/${moment().format("HH:mm:ss")}`
          )
          .catch(() => {});
      }

      khaalgaNeey(data.cameraIP);
      onRefresh();
    };
    orohCams.forEach((camIP) => {
      const eventName = `zogsoolOroh${baiguullaga._id}${camIP}`;
      s.on(eventName, handleOroh);
      cleanup.push(() => s.off(eventName, handleOroh));
    });
    garahCams.forEach((camIP) => {
      const e1 = `zogsoolGarah${baiguullaga._id}${camIP}`;
      const e2 = `zogsoolGarahTulsun${baiguullaga._id}${camIP}`;

      s.on(e1, handleGarah);
      s.on(e2, handleGarahTulsun);

      cleanup.push(() => s.off(e1, handleGarah));
      cleanup.push(() => s.off(e2, handleGarahTulsun));
    });
    return () => cleanup.forEach((fn) => fn());
  }, [
    baiguullaga,
    parkingJagsaalt,
    songogdzonZogsool?.garakhKhaalgaGarTokhirgoo,
  ]);

  useEffect(() => {
    if (isActuallyOffline) {
      if (!wasOffline) {
        setWasOffline(true);
      }
    } else if (wasOffline) {
      setWasOffline(false);

      setTimeout(() => {
        uilchluulegchMutate();
        toololtMutate();
        parkingMutate();

        setPendingCarsUpdateTrigger((prev) => prev + 1);
      }, 2000);
    }
  }, [
    isActuallyOffline,
    wasOffline,
    uilchluulegchMutate,
    toololtMutate,
    parkingMutate,
  ]);

  useEffect(() => {
    if (syncStatus === "success" && !isActuallyOffline) {
      console.log("Sync completed successfully, doing final refresh...");
      setTimeout(() => {
        uilchluulegchMutate();
        setPendingCarsUpdateTrigger((prev) => prev + 1);
      }, 500);
    }
  }, [syncStatus, isActuallyOffline, uilchluulegchMutate]);

  // Poll local .NET service for offline data when offline
  useEffect(() => {
    if (!isActuallyOffline) {
      setLocalOfflineData([]); // Clear when online
      return;
    }

    // Initial fetch
    fetchLocalOfflineData();

    // Set up polling interval (every 30 seconds to match .NET service)
    const pollInterval = setInterval(() => {
      fetchLocalOfflineData();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isActuallyOffline, fetchLocalOfflineData]);

  const tooQuery = useMemo(() => {
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();
    return {
      "tuukh.tsagiinTuukh.garsanTsag": { $exists: false },
      "tuukh.tuluv": { $ne: -2 },
      createdAt: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    };
  }, [uilchluulegchGaralt]);

  const f5Darsan = useCallback(() => {
    const data = uilchluulegchGaralt?.jagsaalt?.[0];
    const mur = data?.tuukh?.[0];
    if (!data) {
      return notification.error({
        message: "Мэдээлэл алга",
        duration: 1,
      });
    }
    if (mur?.tuluv === 0 && (!!mur?.tulukhDun || data?.niitDun)) {
      if (modalNeelttei === false) {
        setModalNeelttei(true);
        return tulburTulyu(mur, data?._id, data?.mashiniiDugaar, data?.niitDun);
      }
    } else
      return notification.warning({
        message: "Төлбөр бодогдох боломжгүй",
        duration: 1,
      });
  }, [uilchluulegchGaralt, modalNeelttei]);

  useKeyboardTovchlol("F4", f5Darsan);
  useKeyboardTovchlol("F1", f3Darsan);
  useKeyboardTovchlol("F2", f4Darsan);
  useKeyboardTovchlol("F8", f8Darsan);
  useKeyboardTovchlol("F7", f7Darsan);
  useKeyboardTovchlol("+", nemekhDarsan);
  useKeyboardTovchlol("-", khasakhDarsan);

  const populateRegistrationDateTime = () => {
    const now = moment();
    form.setFieldsValue({
      burtgelOgnoo: now,
      burtgelTsag: now.format("HH:mm"),
    });
  };

  function f3Darsan() {
    khaalgaNeey(camerVal[0]);
    document.getElementById("neekhKhaalgaID").focus();
  }

  function f4Darsan() {
    khaalgaNeey(camerVal[1]);
    document.getElementById("khaakhkhaalgaID").focus();
  }

  function nemekhDarsan() {
    setModalOpen({
      bool: true,
      item: null,
      type: "dugaarBurtgekh",
    });
    !!camerVal[0] && form.setFieldValue("CAMERA_IP", camerVal[0]);
    populateRegistrationDateTime();
    setTimeout(() => {
      mashiniiDugaarRef.current.focus();
    }, 200);
  }
  function f8Darsan() {
    setModalOpen({
      bool: true,
      item: null,
      type: "orlogo",
    });
    setTimeout(() => {
      mashiniiDugaarRef.current.focus();
    }, 200);
  }

  function f7Darsan() {
    const data = uilchluulegchGaralt?.jagsaalt?.[0];
    const mur = data?.tuukh?.[0];

    if (!data) {
      return notification.error({
        message: "Мэдээлэл алга",
        duration: 1,
      });
    }

    if (mur?.tuluv !== 0 || (!mur?.tulukhDun && !data?.niitDun)) {
      return notification.warning({
        message: "Үнэгүй горимд тохирох дүн алга",
        duration: 1,
      });
    }

    setModalOpen({
      bool: true,
      item: data,
      type: "unegui",
    });
  }

  function khasakhDarsan() {
    setModalOpen({
      bool: true,
      item: null,
      type: "dugaarBurtgekh",
    });
    !!camerVal[1] && form.setFieldValue("CAMERA_IP", camerVal[1]);
    populateRegistrationDateTime();
    setTimeout(() => {
      mashiniiDugaarRef.current.focus();
    }, 200);
  }

  const tooQue = useMemo(() => {
    return {
      ekhlekhOgnoo: moment().startOf("day").format("YYYY-MM-DD 00:00:00"),
      duusakhOgnoo: moment().endOf("day").format("YYYY-MM-DD 23:59:59"),
      "tuukh.tsagiinTuukh.garsanTsag": { $exists: false },
      "tuukh.tuluv": { $ne: -2 },
    };
  }, [uilchluulegchGaralt]);

  const { zogsoolTusBuriinToo, zogsoolTusBuriinTooMutate } =
    useUilchluulegchZogsoolToo(token, tooQue);
  const dugaar = !!songogdzonZogsool?.zogsooliinDans
    ? songogdzonZogsool?.zogsooliinDans
    : "";
  const dasniiMedeelel = {
    baiguullagiinId: baiguullaga?._id,
    dugaar,
    bank: dugaar[0] == 4 ? "tdb" : dugaar[0] == 5 ? "khaan" : "golomt",
  };
  const {
    dansniiKhuulgaGaralt,
    dansniiKhuulgaMutate,
    isValidating: dansKhuleelt,
  } = useDansKhuulga(
    token,
    baiguullaga?._id,
    dasniiMedeelel,
    [
      moment().subtract(30, "days").format("YYYY-MM-DD 00:00:00"),
      moment().format("YYYY-MM-DD 23:59:59"),
    ],
    { createdAt: -1 }
  );

  function onRefresh() {
    setModalNeelttei(false);
    uilchluulegchMutate();
    toololtMutate();
    zogsoolTusBuriinTooMutate();
  }
  const minToHour = (m) => {
    let res;
    if (m < 60) res = m + " мин";
    else {
      const h = Math.floor(m / 60);
      const min = m % 60;
      res = h + " цаг " + (min && min + " мин");
    }
    return res;
  };
  function tulburTulyu(data, uilchluugchiinId, mashiniiDugaar, niitDun, index) {
    modal({
      title: false,
      style: { top: 25 },
      maskClosable: false,
      content: (
        <ShineTulbur
          suuliikhEsekh={index === 0}
          niitDun={niitDun}
          camerVal={camerVal[1]}
          ref={tulburRef}
          data={_.cloneDeep(data)}
          eBarimtAshiglakhEsekh={
            baiguullaga?.barilguud?.find((e) => e._id === barilgiinId)
              ?.tokhirgoo?.eBarimtAshiglakhEsekh
          }
          eBarimtAutomataarShivikh={
            baiguullaga?.tokhirgoo?.eBarimtAutomataarShivikh
          }
          token={token}
          baiguullaga={baiguullaga}
          barilgiinId={barilgiinId}
          ajiltan={ajiltan}
          uilchluugchiinId={uilchluugchiinId}
          onRefresh={onRefresh}
          modalNeelttei={modalNeelttei}
          setModalNeelttei={setModalNeelttei}
          songogdsonZogsool={songogdzonZogsool}
          mashiniiDugaar={mashiniiDugaar}
          updateOfflineItem={updateOfflineItem}
          isActuallyOffline={isActuallyOffline}
        />
      ),
      footer: false,
      className: "!w-fit",
    });
  }
  useEffect(() => {
    var ajiltnuud = [];
    uilchluulegchGaralt?.jagsaalt?.forEach((element) => {
      element.tuukh[0]?.burtgesenAjiltaniiId &&
        !ajiltnuud.find(
          (a) =>
            a.burtgesenAjiltaniiId === element.tuukh[0]?.burtgesenAjiltaniiId
        ) &&
        ajiltnuud.push(element.tuukh[0]?.burtgesenAjiltaniiId);
    });
    ajiltnuud.length > 0 &&
      uilchilgee(token)
        .get("/ajiltan", {
          params: { query: { _id: ajiltnuud.map((a) => a) } },
        })
        .then(({ data }) => {
          if (!!data && data?.jagsaalt?.length > 0) {
            setAjiltniiNers(
              data?.jagsaalt?.map((a) => {
                return { ner: a?.ner, id: a?._id };
              })
            );
          }
        });
  }, [uilchluulegchGaralt?.jagsaalt]);
  const baganaColumns = useMemo(
    () => [
      {
        title: t("Тайлбар"),
        align: "center",
        width: "12rem",
        dataIndex: ["mashin", "temdeglel"],
        render: (_value, record) => (
          <Tooltip title={record?.mashin?.temdeglel}>
            <div className="w-full cursor-help truncate break-words text-left">
              {record?.mashin?.temdeglel}
            </div>
          </Tooltip>
        ),
      },
    ],
    [t]
  );
  const columns = useMemo(() => {
    const col = [
      {
        title: "№",
        align: "center",
        dataIndex: "dugaar",
        width: "2rem",
        render: (text, record, index) =>
          (uilchluulegchGaralt?.khuudasniiDugaar || 0) *
            (uilchluulegchGaralt?.khuudasniiKhemjee || 0) -
          (uilchluulegchGaralt?.khuudasniiKhemjee || 0) +
          index +
          1,
      },
      {
        title: t("Дугаар1"),
        align: "center",
        width: "10rem",
        dataIndex: "mashiniiDugaar",
        showSorterTooltip: false,
        sorter: () => 0,
        render: (a) => (
          <div
            onClick={() => {
              navigator.clipboard.writeText(String(a).toUpperCase());
              toast.success(`${String(a).toUpperCase()} дугаарыг хууллаа`);
            }}
            className="flex cursor-copy items-center justify-center gap-3"
          >
            {String(a).toUpperCase()}
            <CopyOutlined className="text-lg text-gray-300" />
          </div>
        ),
      },
    ];
    if (baiguullaga?._id === "63c0f31efe522048bf02086d") {
      col.push({
        title: "Зогсоол",
        align: "center",
        width: "5rem",
        render: (data) => {
          var zogsojBuiTuluv = "Гадна";
          if (data?.tuukh?.length > 1) {
            if (!!data.tuukh?.[1].tsagiinTuukh?.[0]?.garsanTsag) {
              zogsojBuiTuluv = "Дотор";
            } else {
              zogsojBuiTuluv = "Гадна";
            }
          }
          return (
            <div
              className={`flex w-full items-center justify-center rounded-lg px-2 py-1 font-[500] text-gray-600 dark:text-gray-200 ${
                zogsojBuiTuluv === "Дотор" ? "bg-blue-300" : "bg-green-300"
              } `}
            >
              {zogsojBuiTuluv}
            </div>
          );
        },
      });
    }
    return [
      ...col,
      {
        title: t("Орсон"),
        align: "center",
        width: "10rem",
        dataIndex: "tuukh.tsagiinTuukh.orsonTsag",
        showSorterTooltip: false,
        sorter: () => 0,
        render(v, p) {
          const d = p.tuukh[0]?.tsagiinTuukh[0]?.orsonTsag;
          return d && moment(d).format("MM-DD HH:mm:ss");
        },
      },
      {
        title: t("Гарсан"),
        align: "center",
        width: "10rem",
        dataIndex: "tuukh.tsagiinTuukh.garsanTsag",
        showSorterTooltip: false,
        sorter: () => 0,
        render(v, p) {
          const d = p.tuukh[0]?.tsagiinTuukh[0]?.garsanTsag;
          return d && moment(d).format("MM-DD HH:mm:ss");
        },
      },
      {
        title: (
          <Popover
            placement="bottom"
            content={
              <div className="space-y-2">
                <div
                  onClick={() =>
                    setOrder({
                      "tuukh.0.niitKhugatsaa": -1,
                    })
                  }
                  className={`relative flex ${
                    JSON.stringify(order) ==
                      JSON.stringify({ "tuukh.0.niitKhugatsaa": -1 }) &&
                    "bg-green-500 text-white"
                  } cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Удаан зогссон эхэнд")}
                </div>
                <div
                  onClick={() => {
                    setOrder({
                      "tuukh.tsagiinTuukh.garsanTsag": 1,
                      niitDun: 1,
                      "tuukh.tuluv": 1,
                      "tuukh.tsagiinTuukh.orsonTsag": -1,
                      zurchil: 1,
                    });
                  }}
                  className={`relative ${
                    JSON.stringify(order) ==
                      JSON.stringify({
                        "tuukh.tsagiinTuukh.garsanTsag": 1,
                        niitDun: 1,
                        "tuukh.tuluv": 1,
                        "tuukh.tsagiinTuukh.orsonTsag": -1,
                        zurchil: 1,
                      }) && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Сүүлд орсон эхэнд")}
                </div>
                <div
                  onClick={() =>
                    setOrder({
                      "tuukh.0.tsagiinTuukh.0.garsanTsag": -1,
                    })
                  }
                  className={`relative ${
                    JSON.stringify(order) ==
                      JSON.stringify({
                        "tuukh.0.tsagiinTuukh.0.garsanTsag": -1,
                      }) && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Сүүлд гарсан эхэнд")}
                </div>
              </div>
            }
          >
            <div
              className={`flex cursor-pointer items-center justify-center gap-3`}
            >
              <FilterOutlined className="text-lg text-green-600" />
              {t("Хугацаа/мин")}
            </div>
          </Popover>
        ),
        align: "center",
        width: "10rem",
        dataIndex: "tuukh.0.niitKhugatsaa",
        render(v, parents) {
          const d2 = tsagTootsoolur(
            parents?.tuukh[0]?.tsagiinTuukh[0]?.orsonTsag
          );
          if (parents?.zurchil === "Гарсан цаг тодорхойгүй!") {
            return (
              <div className="rounded bg-red-200 px-3 py-1 text-slate-700">
                -- : -- : --
              </div>
            );
          } else
            return !!parents?.tuukh[0]?.tsagiinTuukh[0]?.garsanTsag ? (
              <div
                className={`rounded px-3 py-1 text-slate-700 ${
                  !!parents.zurchil &&
                  parents.zurchil !== "" &&
                  parents?.tuukh[0]?.tuluv === -2
                    ? "bg-red-200"
                    : "bg-green-200"
                }`}
              >
                {minToHour(parents?.niitKhugatsaa || 0)}
              </div>
            ) : (
              <div className="rounded bg-blue-200 px-3 py-1 text-slate-700">
                {/* {d2.hours.length < 2 ? "0" + d2.hours : d2.hours} :{" "}
                {d2.minutes.length < 2 ? "0" + d2.minutes : d2.minutes} */}
                <TsagToololt
                  ekhlekhTsag={parents?.tuukh[0]?.tsagiinTuukh[0]?.orsonTsag}
                />
              </div>
            );
        },
      },
      {
        title: (
          <Popover
            placement="bottom"
            content={
              <div className="space-y-2">
                <div
                  onClick={() => setTurul(undefined)}
                  className={`relative ${
                    turul === undefined && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Бүгд")}
                </div>

                <div
                  onClick={() => setTurul("Төлбөртэй")}
                  className={`relative ${
                    turul === "Төлбөртэй" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Төлбөртэй")}
                </div>
                {/* <div
                  onClick={() => setTurul("Идэвхтэй")}
                  className={`relative ${
                    turul === "Идэвхтэй" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Идэвхтэй")}
                </div> */}
              </div>
            }
          >
            <div
              className={`flex cursor-pointer items-center justify-center gap-3`}
            >
              <FilterOutlined className="text-lg text-green-600" />
              {t("Төрөл")}
            </div>
          </Popover>
        ),
        align: "center",
        width: "10rem",
        dataIndex: "turul",
        showSorterTooltip: false,
        sorter: () => 0,
        render: (a, b) => {
          var ekhlekhOgnoo = moment(b?.mashin?.ekhlekhOgnoo).diff(
            new Date(),
            "d"
          );
          var duusakhOgnoo = moment(b?.mashin?.duusakhOgnoo).diff(
            new Date(),
            "d"
          );

          // If turul is "Үнэгүй", always show "Үнэгүй"
          if (a === "Үнэгүй") {
            return "Үнэгүй";
          }

          // Use mashin.turul if it exists - this should always be used when available
          const mashinTurul = b?.mashin?.turul;
          if (mashinTurul) {
            return mashinTurul;
          }

          // Also check top-level turul if it's a valid type
          const topLevelTurul = b?.turul;
          if (topLevelTurul && topLevelTurul !== "Үнэгүй") {
            return topLevelTurul;
          }

          const mur = b.tuukh?.[0];
          // Check if has payment records
          const hasPayment = mur?.tulbur?.length > 0;

          let dunTuluv = false;
          b?.tuukh?.forEach((murItem) => {
            if (murItem.tulukhDun > 0) dunTuluv = true;
          });
          // Идэвхтэй = has calculated amount but no payment records yet
          const isActive =
            (mur?.tuluv === 0 || b?.zurchil === "Гарсан цаг тодорхойгүй!") &&
            dunTuluv &&
            b.turul !== "Үнэгүй" &&
            !hasPayment;

          return !!a ? (
            a === "Гэрээт" ? (
              <Tooltip
                title={`${moment(b.mashin.ekhlekhOgnoo).format(
                  "YYYY-MM-DD"
                )}-/аас⁴/ ${moment(b.mashin.duusakhOgnoo).format(
                  "YYYY-MM-DD"
                )} хүртэл гэрээ байгуулсан ба гэрээ ${
                  duusakhOgnoo < 0
                    ? "дууссан"
                    : ekhlekhOgnoo > 0
                    ? "эхлээгүй"
                    : "идэвхтэй"
                } байна.`}
              >
                <div className="flex items-center justify-center">
                  <div
                    className={`flex cursor-help rounded-md border-white px-3 ${
                      a === "Гэрээт" && duusakhOgnoo < 0
                        ? " border bg-red-400 font-medium text-white"
                        : ekhlekhOgnoo > 0
                        ? " border bg-blue-400 font-medium text-white"
                        : ""
                    }`}
                  >
                    {a}
                  </div>
                </div>
              </Tooltip>
            ) : hasPayment ? (
              "төлбөр[F4]"
            ) : isActive ? (
              "Идэвхтэй"
            ) : (
              a
            )
          ) : (
            "Үйлчлүүлэгч"
          );
        },
      },
      {
        title: t("Хөнгөлөлт"),
        align: "center",
        width: "10rem",
        dataIndex: "mashin",
        showSorterTooltip: false,
        render: (a, record) => {
          if (a?.khungulultTurul === "togtmolTsag") {
            return (
              <div className="flex items-center justify-center">
                {a && (
                  <div
                    className={`flex w-[8rem] items-center justify-center rounded-lg px-2 py-1 font-[600] text-white ${
                      a?.uldegdelKhungulukhKhugatsaa > 0
                        ? "bg-green-400 dark:bg-green-700"
                        : "bg-yellow-400 dark:bg-yellow-700"
                    }`}
                  >
                    {a?.uldegdelKhungulukhKhugatsaa}
                    {"/"}
                    {a?.khungulukhKhugatsaa}
                    {t("мин")}
                  </div>
                )}
              </div>
            );
          }

          if (a?.khungulultTurul === "khuviKhungulult") {
            return (
              <div className="flex items-center justify-center">
                {a?.khungulultTurul && (
                  <div className="flex w-[8rem] items-center justify-center rounded-lg bg-blue-400 px-2 py-1 font-[600] text-white dark:bg-blue-700">
                    {a?.khungulult}
                    {"%"}
                  </div>
                )}
              </div>
            );
          }

          if (record?.turul === "Зочин") {
            return (
              <div className="flex items-center justify-center">
                <div className="flex w-[8rem] items-center justify-center rounded-lg bg-green-400 px-2 py-1 font-[600] text-white dark:bg-green-700">
                  {record?.urisanMashin?.tusBurAshiglasanUneguiMinut || 0}
                  {t("мин")}
                </div>
              </div>
            );
          }

          if (a?.khungulultTurul === "khuviKhungulult") {
            return (
              <div className="flex items-center justify-center">
                {a?.khungulultTurul && (
                  <div className="flex w-[8rem] items-center justify-center rounded-lg bg-blue-400 px-2 py-1 font-[600] text-white dark:bg-blue-700">
                    {a?.khungulult}
                    {"%"}
                  </div>
                )}
              </div>
            );
          }
          if (a?.gereetTulburBodokhEsekh && !a.tulburBodokhTsagEkhlekhNeg) {
            return (
              <Tooltip
                title={`${a?.tulburBodokhTsagEkhlekh}-аас ${a?.tulburBodokhTsagDuusakh} хүртэл төлбөр бодогдоно.`}
              >
                <div className="flex cursor-help items-center justify-center">
                  {a?.tulburBodokhTsagEkhlekh} - {a?.tulburBodokhTsagDuusakh}
                </div>
              </Tooltip>
            );
          }
          if (a?.gereetTulburBodokhEsekh && !!a.tulburBodokhTsagEkhlekhNeg) {
            return (
              <Tooltip
                title={`${a?.tulburBodokhTsagEkhlekh}-аас ${a?.tulburBodokhTsagDuusakh}, ${a?.tulburBodokhTsagEkhlekhNeg}-аас ${a?.tulburBodokhTsagDuusakhNeg} хүртэл төлбөр бодогдоно.`}
              >
                <div className="flex cursor-help items-center justify-center">
                  {a?.tulburBodokhTsagEkhlekh} - {a?.tulburBodokhTsagDuusakh},{" "}
                  {a?.tulburBodokhTsagEkhlekhNeg} -{" "}
                  {a?.tulburBodokhTsagDuusakhNeg}
                </div>
              </Tooltip>
            );
          }
        },
      },
      {
        title: (
          <Popover
            placement="bottom"
            content={
              <div className="space-y-2">
                <div
                  onClick={() => setDun("")}
                  className={`relative ${
                    dun === "" && "bg-green-500 text-white"
                  } flex cursor-pointer justify-center rounded-md border px-5 py-[2px] font-medium  hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Бүгд1")}
                </div>
                <div
                  onClick={() => setDun("dunBodson")}
                  className={`relative ${
                    dun === "dunBodson" && "bg-green-500 text-white"
                  } flex cursor-pointer justify-center rounded-md border px-5 py-[2px] font-medium  hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Дүн бодсон")}
                </div>
                <div
                  onClick={() => setDun("dunBodoogui")}
                  className={`relative ${
                    dun === "dunBodoogui" && "bg-green-500 text-white"
                  } flex cursor-pointer justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Дүн бодоогүй")}
                </div>
              </div>
            }
          >
            <div
              className={`flex cursor-pointer  items-center justify-center gap-3 `}
            >
              <FilterOutlined className="text-lg text-green-600" />
              {t("Дүн")}
            </div>
          </Popover>
        ),
        align: "right",
        width: "10rem",
        dataIndex: "tuukh.tulukhDun",
        render(v, p) {
          return p && formatNumber(p.niitDun || p.tuukh[0]?.tulukhDun || 0, 0);
        },
        summary: true,
      },
      {
        title: (
          <Popover
            placement="bottom"
            content={
              <div className="space-y-2">
                <div
                  onClick={() => setKhelber("")}
                  className={`relative ${
                    khelber === "" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Бүгд")}
                </div>
                <div
                  onClick={() => setKhelber("belen")}
                  className={`relative ${
                    khelber === "belen" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Бэлэн")}
                </div>
                <div
                  onClick={() => setKhelber("card")}
                  className={`relative ${
                    khelber === "card" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Карт")}
                </div>
                <div
                  onClick={() => setKhelber("khariltsakh")}
                  className={`relative ${
                    khelber === "khariltsakh" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white `}
                >
                  {t("Дансаар")}
                </div>
                <div
                  onClick={() => setKhelber("tuluugui")}
                  className={`relative ${
                    khelber === "tuluugui" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white `}
                >
                  {t("Төлөөгүй")}
                </div>
                <div
                  onClick={() => setKhelber("toki")}
                  className={`relative ${
                    khelber === "toki" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white `}
                >
                  {t("Токи")}
                </div>
                <div
                  onClick={() => setKhelber("khungulult")}
                  className={`relative ${
                    khelber === "khungulult" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white `}
                >
                  {t("Хөнгөлөлт")}
                </div>
                <div
                  onClick={() => setKhelber("qpay")}
                  className={`relative ${
                    khelber === "qpay" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white `}
                >
                  {t("qpay")}
                </div>
              </div>
            }
          >
            <div
              className={`flex cursor-pointer items-center justify-center gap-3`}
            >
              <FilterOutlined className="text-lg text-green-600" />
              {t("Төлбөр")}
            </div>
          </Popover>
        ),
        align: "center",
        dataIndex: "tuukh",
        width: "15rem",
        showSorterTooltip: false,
        render: (v) => {
          let r = null;
          if (v[0]?.tulbur?.length > 1) {
            r = (
              <div className="flex justify-center">
                <Popover
                  content={() =>
                    v[0]?.tulbur.map((mur) => (
                      <div className="dark:text-gray-200">
                        {t(tulburKhurvuulekh(mur.turul))}:{" "}
                        {formatNumber(mur.dun, 0)}
                      </div>
                    ))
                  }
                  placement="bottom"
                  trigger="click"
                >
                  <Button
                    icon={<ShareAltOutlined style={{ fontSize: "16px" }} />}
                  ></Button>
                </Popover>
              </div>
            );
          } else r = tulburKhurvuulekh(v[0]?.tulbur?.[0]?.turul);
          return (
            r && (
              <div>
                {v[0]?.tulbur?.length > 1 ? r : t(r)}{" "}
                {v[0]?.tulbur?.length === 1 &&
                  `: ${formatNumber(v[0]?.tulbur[0]?.dun, 0)}`}
              </div>
            )
          );
        },
      },
      {
        title: t("И-Баримт"),
        align: "center",
        width: "9rem",
        dataIndex: "ebarimtAvsanDun",
        showSorterTooltip: false,
        sorter: () => 0,
        render: (v) => {
          return <div className="w-full text-right">{formatNumber(v, 0)}</div>;
        },
      },
      {
        title: (
          <Popover
            placement="top"
            content={
              <div className="space-y-2">
                <div
                  onClick={() => {
                    setTuluvFilter("");
                  }}
                  className={`relative ${
                    tuluvFilter === "" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Бүгд")}
                </div>

                {/* <div
                  onClick={() => {
                    setTuluvFilter("idevekhitei");
                  }}
                  className={`relative ${
                    tuluvFilter === "idevekhitei" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Төлбөртэй")}
                </div> */}
                <div
                  onClick={() => {
                    setTuluvFilter("active");
                  }}
                  className={`relative ${
                    tuluvFilter === "active" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Идэвхтэй")}
                </div>
                <div
                  onClick={() => {
                    setTuluvFilter("tulugdsun");
                  }}
                  className={`relative ${
                    tuluvFilter === "tulugdsun" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Төлөгдсөн")}
                </div>
                {/* <div
                  onClick={() => setTuluvFilter("tulburtei")}
                  className={`relative ${
                    tuluvFilter === "tulburtei" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Төлбөртэй")}
                </div> */}
                <div
                  onClick={() => {
                    setTuluvFilter("unegui");
                  }}
                  className={`relative ${
                    tuluvFilter === "unegui" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Үнэгүй")}
                </div>
                {/* <div
                  onClick={() => {
                    setTuluvFilter("zurchiltei");
                  }}
                  className={`relative ${
                    tuluvFilter === "zurchiltei" && "bg-green-500 text-white"
                  } flex cursor-pointer items-center justify-center rounded-md border px-5 py-[2px] font-medium hover:bg-green-600 hover:bg-opacity-20 dark:text-white`}
                >
                  {t("Зөрчилтэй")}
                </div> */}
              </div>
            }
          >
            <div
              className={`flex cursor-pointer items-center justify-center gap-3`}
            >
              <FilterOutlined className="text-lg text-green-600" />
              {t("Төлөв")}
            </div>
          </Popover>
        ),
        align: "center",
        width: "10rem",
        dataIndex: "tuukh.tuluv",
        render(v, parent, index) {
          let dunTuluv = false;
          parent?.tuukh?.map((mur) => {
            if (mur.tulukhDun > 0) dunTuluv = true;
          });
          const mur = parent.tuukh[0];

          let currentStatus = "";
          const isActive =
            mur?.tuluv === 0 &&
            !mur?.tsagiinTuukh?.[0]?.garsanTsag &&
            !mur?.garsanKhaalga;
          if (parent.turul === "Үнэгүй") {
            currentStatus = "unegui";
          } else if (isActive) {
            currentStatus = "active";
          } else if (
            (mur?.tuluv === 0 ||
              parent?.zurchil === "Гарсан цаг тодорхойгүй!") &&
            dunTuluv
          ) {
            currentStatus = "idevekhitei";
          } else if (mur?.tuluv === 1 || mur?.tuluv === 2) {
            currentStatus = "tulugdsun";
          } else if (
            !!parent.zurchil &&
            parent.zurchil !== "" &&
            mur?.tuluv === -2
          ) {
            currentStatus = "zurchiltei";
          } else if (mur?.tuluv === -1) {
            currentStatus = "unegui";
          }

          if (parent.turul === "Үнэгүй") {
            return (
              <div className="mx-auto flex w-max cursor-pointer items-center justify-center space-x-2 rounded bg-gray-500 px-3 text-white">
                <div className="flex items-center justify-center">
                  {t("Үнэгүй")}
                </div>
              </div>
            );
          } else
            return (mur?.tuluv === 0 ||
              parent?.zurchil === "Гарсан цаг тодорхойгүй!") &&
              dunTuluv ? (
              <Popover
                placement="bottom"
                trigger="hover"
                content={() => (
                  <div className="flex w-36 flex-col space-y-2">
                    <a
                      className="ant-dropdown-link flex w-full items-center justify-between rounded-lg p-2 hover:bg-green-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        if (isPaying) return;
                        if (!parent?.niitDun || parent.niitDun <= 0) {
                          notification.warn({
                            message: t("Дүн бодогдоогүй байна."),
                          });
                          return;
                        }

                        setIsPaying(true);

                        tulburTulyu(
                          mur,
                          parent._id,
                          parent?.mashiniiDugaar,
                          parent?.niitDun,
                          index
                        );

                        setTimeout(() => {
                          setIsPaying(false);
                        }, 2000);
                      }}
                    >
                      <WalletOutlined style={{ fontSize: "18px" }} />
                      <label>{t("Төлөх [F4]")}</label>
                    </a>

                    <a
                      className="ant-dropdown-link flex w-full items-center justify-between rounded-lg p-2 hover:bg-green-100 dark:hover:bg-gray-700"
                      onClick={() =>
                        setModalOpen({
                          bool: true,
                          item: parent,
                          type: "unegui",
                        })
                      }
                    >
                      <StarOutlined style={{ fontSize: "18px" }} />
                      <label>{t("Үнэгүй [F7]")}</label>
                    </a>
                  </div>
                )}
              >
                <Button
                  type="tertiary"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#FF8505",
                  }}
                  size="small"
                >
                  <div className="flex items-center justify-center space-x-2 text-white">
                    <div className="flex items-center justify-center">
                      <DollarCircleOutlined />
                    </div>
                    <div className="flex items-center justify-center">
                      {t("Төлбөр")} {index === 0 ? t("F4") : ""}
                    </div>
                  </div>
                </Button>
              </Popover>
            ) : mur?.tuluv === 0 && !mur?.tsagiinTuukh[0]?.garsanTsag ? (
              <Popover
                trigger="click"
                content={
                  <div className="flex flex-col items-center justify-center gap-2">
                    {(ajiltan?.tokhirgoo?.zogsooliinKhungulultEsekh === true ||
                      ajiltan?.erkh === "Admin") && (
                      <div
                        onClick={() => khungulyu(parent, parent?._id)}
                        className="flex w-28 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-1 hover:border-2 dark:bg-gray-600 dark:text-gray-200"
                      >
                        <div className="flex items-center justify-center">
                          <CiDiscount1 />
                        </div>
                        <div className="flex items-center justify-center">
                          Хөнгөлөх
                        </div>
                      </div>
                    )}
                    <div
                      onClick={() => {
                        dugaarGaraasBurtgekh(parent);
                      }}
                      className="flex w-28 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-1 hover:border-2 dark:bg-gray-600 dark:text-gray-200"
                    >
                      <div className="flex items-center justify-center">
                        <ArrowRightOutlined />
                      </div>
                      <div className="flex items-center justify-center">
                        Гаргах
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="mx-auto flex w-max cursor-pointer items-center justify-center space-x-2 rounded bg-blue-500 px-3 text-white">
                  <div className="flex items-center justify-center">
                    {t("Идэвхтэй")}
                  </div>
                </div>
              </Popover>
            ) : mur?.tuluv === 1 ? (
              mur?.ebarimtAvsanEsekh === false ? (
                <div
                  onClick={() =>
                    tulburTulyu(
                      mur,
                      parent?._id,
                      parent?.mashiniiDugaar,
                      parent?.niitDun
                    )
                  }
                  className="mx-auto flex w-max items-center justify-center space-x-2 rounded bg-blue-500 px-3 text-white"
                >
                  <div className="flex items-center justify-center">
                    {t("И-Баримт")}
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex w-max items-center justify-center space-x-2 rounded bg-lime-500 px-3 text-white">
                  <div className="flex items-center justify-center">
                    {t("Төлөгдсөн")}
                  </div>
                </div>
              )
            ) : !!parent.zurchil &&
              parent.zurchil !== "" &&
              mur?.tuluv === -2 ? (
              <div className="mx-auto flex w-max cursor-pointer items-center justify-center space-x-2 rounded bg-red-500 px-3 text-white">
                <div className="flex items-center justify-center">
                  {t("Зөрчилтэй")}
                </div>
              </div>
            ) : mur?.tuluv === 2 ? (
              <div className="mx-auto flex w-max items-center justify-center space-x-2 rounded bg-lime-500 px-3 text-white">
                <div className="flex items-center justify-center">
                  {t("Төлөгдсөн")}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-max cursor-pointer items-center justify-center space-x-2 rounded bg-gray-500 px-3 text-white">
                <div className="flex items-center justify-center">
                  {t("Үнэгүй")}
                </div>
              </div>
            );
        },
      },
      {
        title: t("Шалтгаан"),
        align: "center",
        dataIndex: "tuukh",
        width: "10rem",
        showSorterTooltip: false,
        render: (v, parent) => {
          if (parent.turul === "Үнэгүй" || parent.turul === "Дотоод") {
            return (
              <Tooltip placement="top" title={parent?.mashin?.temdeglel}>
                <div className="max-w-[8rem] cursor-help truncate break-words">
                  {parent?.mashin?.temdeglel}
                </div>
              </Tooltip>
            );
          } else if (parent.turul === "Гэрээт") {
            return (
              <div className="max-w-[8rem] cursor-help truncate break-words">
                {!!parent?.zurchil
                  ? parent?.zurchil
                  : parent?.mashin?.temdeglel}
              </div>
            );
          } else
            return (
              v && (
                <Tooltip
                  placement="top"
                  title={
                    v[0]?.tuluv === -1 ? v[0]?.uneguiGarsan : t(parent.zurchil)
                  }
                >
                  <div className="max-w-[8rem] cursor-help truncate break-words">
                    {v[0]?.tuluv === -1
                      ? v[0]?.uneguiGarsan
                      : !!parent.zurchil
                      ? t(parent.zurchil)
                      : ""}
                  </div>
                </Tooltip>
              )
            );
        },
      },
      ...shineBagana,

      {
        title: () => <SettingOutlined />,
        width: "2rem",
        align: "center",
        render: (data) => {
          return data.tuukh[0]?.tulbur?.length === 0 &&
            data.tuukh[0]?.tulukhDun !== 0 &&
            data?.zurchil !== "Гарсан цаг тодорхойгүй!" ? (
            <div className="flex flex-row">
              <a
                className="ant-dropdown-link flex w-full items-center justify-center rounded-lg p-2 hover:bg-green-100 dark:hover:bg-gray-700"
                onClick={() =>
                  setModalOpen({
                    bool: true,
                    item: data,
                    type: "zurchil",
                  })
                }
              >
                <ExclamationCircleOutlined
                  style={{ fontSize: "18px", marginRight: "3px" }}
                />
              </a>
            </div>
          ) : null;
        },
      },
      {
        title: () => <VideoCameraAddOutlined />,
        width: "2rem",
        align: "center",
        render: (data) => {
          return (
            <div className="flex justify-center">
              <Popover
                content={() =>
                  data?.tuukh?.map((mur) => (
                    <div className="dark:text-gray-200">{mur.orsonKhaalga}</div>
                  ))
                }
                placement="bottom"
                trigger="click"
              >
                <Button
                  icon={<ShareAltOutlined style={{ fontSize: "16px" }} />}
                ></Button>
              </Popover>
            </div>
          );
        },
      },
      {
        title: () => <VideoCameraOutlined />,
        width: "2rem",
        align: "center",
        render: (data) => {
          return (
            <div className="flex justify-center">
              <Popover
                content={() =>
                  data?.tuukh?.map((mur) => (
                    <div className="dark:text-gray-200">
                      {mur.garsanKhaalga}
                    </div>
                  ))
                }
                placement="bottom"
                trigger="click"
              >
                <Button
                  icon={<ShareAltOutlined style={{ fontSize: "16px" }} />}
                ></Button>
              </Popover>
            </div>
          );
        },
      },
    ];
  }, [
    turul,
    i18n.language,
    ajiltan,
    baiguullaga,
    barilgiinId,
    order,
    khelber,
    dun,
    shineBagana,
    uilchluulegchGaralt,
    tuluvFilter,
  ]);

  const baganuud = [
    {
      title: "№",
      width: "2.5rem",
      align: "center",
      dataIndex: "description",
      render: (v, index, key) => key + 1,
    },
    {
      title: t("Огноо"),
      width: "6rem",
      align: "center",
      dataIndex: "createdAt",
      render: (data) => {
        return moment(data).format("MM/DD HH:mm");
      },
    },
    {
      title: t("Утга"),
      width: "10rem",
      align: "center",
      dataIndex: "description",
      render: (_v, e) => {
        return (
          <Tooltip
            placement="top"
            title={
              e?.description
                ? e?.description
                : e?.TxAddInf
                ? e?.TxAddInf
                : e?.tranDesc
            }
            mouseLeaveDelay={0}
            mouseEnterDelay={1}
          >
            <div className="truncate text-left">
              {e?.description
                ? e?.description
                : e?.TxAddInf
                ? e?.TxAddInf
                : e?.tranDesc}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t("Дүн"),
      width: "4rem",
      dataIndex: "amount",
      align: "center",
      render(_v, e) {
        return (
          (e?.amount || e?.Amt || e?.tranAmount) && (
            <div className="text-right">
              {formatNumber(
                e?.amount ? e?.amount : e?.Amt ? e?.Amt : e?.tranAmount,
                0
              )}{" "}
              ₮
            </div>
          )
        );
      },
    },
  ];
  const onChange = (e) => {
    setValue(e.target.value);
  };
  const cameraChange = (e, type) => {
    if (type === 1) {
      setCamerVal([e, camerVal[1]]);
      localStorage.setItem("CamerVal", JSON.stringify([e, camerVal[1]]));
    } else {
      setCamerVal([camerVal[0], e]);
      localStorage.setItem("CamerVal", JSON.stringify([camerVal[0], e]));
    }
  };

  const khadgalakh = () => {
    const getOgnoo = async () => {
      if (isActuallyOffline) {
        return new Date().toISOString();
      }
      try {
        const response = await uilchilgee(token).get("ognooAvya");
        return response?.data || new Date().toISOString();
      } catch (e) {
        return new Date().toISOString();
      }
    };

    getOgnoo()
      .then((data) => {
        if (!!data) {
          let body = modalOpen.item;
          if (!!body && body.tuukh?.length > 0) {
            body.tuukh[0].burtgesenAjiltaniiId = ajiltan?._id;
            body.tuukh[0].burtgesenAjiltaniiNer = ajiltan?.ner;
          }
          if (modalOpen.type === "zurchil") {
            if (!value || value === "" || value === undefined) {
              toastwarn("Зөрчлийн шалтгаан оруулна уу!");
              return;
            }
            body.zurchil = value;
            body.tuukh[0].tuluv = -2;
            if (!!camerVal[1] && value === "Зугтаасан") {
              body.tuukh[0].garsanKhaalga = camerVal[1];
              body.tuukh[0].tsagiinTuukh[0].garsanTsag = data;
              body.tuukh[0].niitKhugatsaa = moment(data).diff(
                body.tuukh[0].tsagiinTuukh[0].orsonTsag,
                "minutes"
              );
            }
          } else if (
            modalOpen.type === "dugaarBurtgekh" ||
            modalOpen.type === "orlogo"
          ) {
            form.submit();
          } else {
            if (value) {
              body.tuukh[0].uneguiGarsan = value;
              body.tuukh[0].tuluv = -1;
            } else if (songogdzonZogsool?.zurchilZaavalBurtgekhEsekh) {
              return notification.warn({
                message: "Шалтгаан оруулна уу",
                duration: 2,
              });
            }
          }
          if (modalOpen.type !== "dugaarBurtgekh") {
            // Check if offline
            if (isOfflineMode || !isOnline) {
              // Store pending update
              const pendingUpdate = {
                type: "updateUilchluulegch",
                body: body,
                timestamp: new Date().toISOString(),
                id: Date.now(),
              };
              if (typeof window !== "undefined") {
                const stored = JSON.parse(
                  localStorage.getItem("cameraPendingUpdates") || "[]"
                );
                stored.push(pendingUpdate);
                localStorage.setItem(
                  "cameraPendingUpdates",
                  JSON.stringify(stored)
                );
                setPendingUpdates(stored);
              }

              if (body?._id && updateOfflineItem) {
                updateOfflineItem(body._id, (item) => ({
                  ...item,
                  ...body,
                  tuukh: body.tuukh || item.tuukh,
                }));
              }

              toast.success(
                t(
                  "Интернетгүй үед хадгаллаа. Сүлжээнд холбогдох үед нэгтгэл хийгдэнэ."
                )
              );
              setModalOpen({ bool: false, item: null, type: "" });
              setValue(null);
              return;
            }

            updateMethod("uilchluulegch", token, body)
              .then(({ data }) => {
                if (data === "Amjilttai") {
                  toast.success(t("Амжилттай хадгаллаа"));
                  if (
                    value !== "Маргалдсан" &&
                    value !== "Журам зөрчсөн" &&
                    value !== "Зугтаасан"
                  ) {
                    khaalgaNeey(body?.tuukh?.[0]?.garsanKhaalga);
                  }
                  if (searchUtga.current?.value) {
                    searchUtga.current.value = "";
                    setUilchluulegchKhuudaslalt((e) => ({
                      ...e,
                      khuudasniiDugaar: 1,
                      search: "",
                    }));
                    setKhaikh("");
                  }
                  onRefresh();
                }
              })
              .catch((error) => {
                // If network error, store as pending
                if (!navigator.onLine) {
                  const pendingUpdate = {
                    type: "updateUilchluulegch",
                    body: body,
                    timestamp: new Date().toISOString(),
                    id: Date.now(),
                  };
                  if (typeof window !== "undefined") {
                    const stored = JSON.parse(
                      localStorage.getItem("cameraPendingUpdates") || "[]"
                    );
                    stored.push(pendingUpdate);
                    localStorage.setItem(
                      "cameraPendingUpdates",
                      JSON.stringify(stored)
                    );
                    setPendingUpdates(stored);
                  }
                  toast.warning(
                    t(
                      "Сүлжээний алдаа. Хадгалсан өгөгдөл сүлжээнд холбогдох үед нэгтгэл хийгдэнэ."
                    )
                  );
                }
              });
            setModalOpen({ bool: false, item: null, type: "" });
            setValue(null);
          }
        } else toastwarn("Уучлаарай дахин оролдоно уу");
      })
      .catch((error) => {
        if (!navigator.onLine || isOfflineMode) {
          toast.warning(t("Оффлайн горимд байна. Огноо авах боломжгүй."));
        }
      });
  };

  function tulburiinDelgerengui() {
    const footer = [
      <div className="flex w-full items-center justify-between">
        <Button type="primary" onClick={() => tailanRef.current.khaaya()}>
          {t("Хаах")}
        </Button>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={() => tailanRef.current.khadgalya()}
        >
          {t("Хэвлэх")}
        </Button>
      </div>,
    ];
    modal({
      title: t("Орлого тайлан"),
      icon: <FileExcelOutlined />,
      content: (
        <TulburiinDelgerenguiTailan
          ref={tailanRef}
          defualtOgnoo={ognoo}
          ajiltan={ajiltan}
          garsanKhaalga={camerVal[1]}
          token={token}
          baiguullagiinId={baiguullaga?._id}
          barilgiinId={barilgiinId}
          cameraData={cameraData}
        />
      ),
      footer,
    });
  }

  function ajiltniiDelgerengui() {
    modal({
      title: (
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">{t("Өдрийн хаалт")}</div>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors duration-200 hover:bg-red-600"
            onClick={() => ajiltniiTailanRef.current.khaaya()}
            title="Хаах"
          >
            <CloseOutlined className="text-xs" />
          </button>
        </div>
      ),
      content: (
        <AjiltniiDelgerenguiTailan
          ref={ajiltniiTailanRef}
          ajiltan={ajiltan}
          token={token}
          baiguullagiinId={baiguullaga?._id}
          barilgiinId={barilgiinId}
          songogdsonCamera={camerVal[1]}
          zogsooliinId={songogdzonZogsool?._id}
          cameraData={cameraData}
        />
      ),
      footer: null,
    });
  }

  const exlCol = () => {
    const aa = columns;
    aa.splice(columns.length - 2, 2, {
      title: t("Төлөв"),
      sorter: () => 0,
      dataIndex: "tuukh",
      render(v) {
        return v[0]?.tuluv === 0 ? (
          <div>{t("Төлөөгүй")}</div>
        ) : v[0]?.tuluv < 0 ? (
          <div>{t("Үнэгүй")}</div>
        ) : v[0]?.ebarimtAvsanEsekh ? (
          <div>{t("Төлөгдсөн")}</div>
        ) : (
          <div>{t("И-Баримт")}</div>
        );
      },
    });
    return aa;
  };
  const khaalgaNeey = (ip) => {
    const filterData = zogsoolTusBuriinToo?.filter(
      (mur) => mur?._id?.zogsool === songogdzonZogsoolOrokh?._id
    );
    var sulToo =
      (songogdzonZogsoolOrokh?.too || 0) -
      (filterData?.length > 0 ? filterData[0].too : 0);
    if (
      ip === camerVal[0] &&
      songogdzonZogsoolOrokh?.zogsoolTooKhyazgaarlakhEsekh &&
      (sulToo === 0 || sulToo <= -1)
    ) {
      toastwarn("Зогсоол дүүрсэн байна");
      return;
    } else {
      // if (baiguullaga?._id === "66c2c871597ea1390c3fd830") {
      //   let data =
      //     '<?xml version="1.0" encoding="UTF-8"?><BarrierGate><ctrlMode>open</ctrlMode></BarrierGate>';
      //   let config = {
      //     method: "put",
      //     maxBodyLength: Infinity,
      //     url: "http://" + ip + "/ISAPI/Parking/channels/1/barrierGate",
      //     auth: {
      //       username: "admin",
      //       password: "Asdf1199",
      //     },
      //     headers: {
      //       Accept: "*/*",
      //       Connection: "keep-alive",
      //       "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      //       "Access-Control-Allow-Origin": "*",
      //     },
      //     data: data,
      //   };
      //   axios
      //     .request(config)
      //     .then((response) => {
      //     })
      //     .catch((error) => {
      //     });
      // } else
      zogsoolUilchilgee()
        .get("/neeye/" + ip + "")
        .then(function (response) {})
        .catch(function (error) {});
    }
  };

  const keyPadHandler = (v) => {
    const val = form.getFieldValue("mashiniiDugaar");
    if (!val || val.length < 7)
      form.setFieldValue("mashiniiDugaar", val ? val + v : v);
  };

  const dugaarBurtgekh = () => {
    const body = { ...form.getFieldsValue() };
    const ognoo = body?.burtgelOgnoo;
    const tsag = body?.burtgelTsag;
    const songogdsonCamera = body?.CAMERA_IP;

    const garakhCamera = songogdsonCamera === camerVal[1];

    if (ognoo?.clone && !garakhCamera) {
      const datetime = ognoo.clone();
      const tsagMoment =
        moment.isMoment(tsag) && tsag?.isValid()
          ? tsag
          : typeof tsag === "string" && tsag
          ? moment(tsag, "HH:mm")
          : null;
      if (tsagMoment?.isValid()) {
        datetime.set({
          hour: tsagMoment.hour(),
          minute: tsagMoment.minute(),
          second: tsagMoment.second(),
        });
      }
      body.burtgelOgnoo = datetime.format("YYYY-MM-DD HH:mm:ss");
    } else {
      delete body.burtgelOgnoo;
    }
    delete body.burtgelTsag;
    if (!!barilgiinId) body["barilgiinId"] = barilgiinId;

    Object.keys(body).forEach((key) => {
      if (body[key] === undefined || body[key] === null) {
        delete body[key];
      }
    });

    // Check if offline
    if (isOfflineMode || !isOnline) {
      // Store as pending car
      const pendingCar = {
        type: "addCar",
        data: {
          ...body,
          baiguullagiinId: baiguullaga?._id,
          barilgiinId: barilgiinId,
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        id: Date.now(),
      };
      if (typeof window !== "undefined") {
        const stored = JSON.parse(
          localStorage.getItem("cameraPendingCars") || "[]"
        );
        stored.push(pendingCar);
        localStorage.setItem("cameraPendingCars", JSON.stringify(stored));
        // Trigger UI update
        setPendingCarsUpdateTrigger((prev) => prev + 1);
      }

      notification.success({ message: t("Амжилттай бүртгэгдлээ (Оффлайн)") });
      setModalOpen({ bool: false, item: null, type: "" });
      form.resetFields();
      return;
    }

    uilchilgee(token)
      .post("/zogsoolSdkService", body)
      .then((res) => {
        if (res.status === 200) {
          if (!!res?.data?.aldaa) {
            notification.warn({ message: res.data.aldaa });
            setModalOpen({ bool: false, item: null, type: "" });
            form.resetFields();
          } else {
            notification.success({ message: t("Амжилттай бүртгэгдлээ") });

            setModalOpen({ bool: false, item: null, type: "" });
            form.resetFields();

            if (searchUtga.current?.value) {
              searchUtga.current.value = "";
              setUilchluulegchKhuudaslalt((e) => ({
                ...e,
                khuudasniiDugaar: 1,
                search: "",
              }));
              setKhaikh("");
            }

            if (baiguullaga?.tokhirgoo?.zurchulMsgeerSanuulakh) {
              zurchilteiMashinMsgilgeekh(body?.mashiniiDugaar);
            }

            if (!garakhCamera && !searchUtga.current?.value) {
              const pageSize = uilchluulegchGaralt?.khuudasniiKhemjee || 10;
              const total = uilchluulegchGaralt?.niitMur || 0;
              const targetPage = Math.max(1, Math.ceil((total + 1) / pageSize));
              setUilchluulegchKhuudaslalt((e) => ({
                ...e,
                khuudasniiDugaar: targetPage,
              }));
            }

            onRefresh();

            if (garakhCamera) {
              const mashiniiDugaar = body.mashiniiDugaar?.toUpperCase();
              const apiAvsanMashin = res.data?._id;

              setTimeout(() => {
                const fetchAndOpenModal = () => {
                  if (apiAvsanMashin) {
                    uilchilgee(token)
                      .get("/zogsoolUilchluulegch", {
                        params: {
                          query: { _id: apiAvsanMashin },
                        },
                      })
                      .then(({ data: freshData }) => {
                        const fresh = freshData?.jagsaalt?.[0];
                        if (fresh?.tuukh?.[0] && fresh?._id) {
                          // Don't open payment modal if it's still within free-time window
                          if (isInUneguiKhugatsaa(fresh.tuukh[0])) {
                            return;
                          }
                          const haruulakhDun =
                            fresh.niitDun ?? fresh.tuukh?.[0]?.tulukhDun ?? 0;

                          tulburTulyu(
                            fresh.tuukh[0],
                            fresh._id,
                            fresh.mashiniiDugaar,
                            haruulakhDun,
                            0
                          );
                        } else {
                          notification.warn({
                            message: t("Машины мэдээлэл дутуу байна"),
                          });
                        }
                      })
                      .catch((err) => {
                        notification.error({
                          message: t("Төлбөрийн цонх нээхэд алдаа гарлаа"),
                        });
                      });
                  } else {
                    uilchilgee(token)
                      .get("/zogsoolUilchluulegch", {
                        params: {
                          query: {
                            mashiniiDugaar: mashiniiDugaar,
                            "tuukh.garsanKhaalga": songogdsonCamera,
                          },
                          order: { createdAt: -1 },
                          khuudasniiKhemjee: 1,
                        },
                      })
                      .then(({ data: searchData }) => {
                        const found = searchData?.jagsaalt?.[0];
                        if (found?.tuukh?.[0] && found?._id) {
                          // Don't open payment modal if it's still within free-time window
                          if (isInUneguiKhugatsaa(found.tuukh[0])) {
                            return;
                          }
                          const haruulakhDun =
                            found.niitDun ?? found.tuukh?.[0]?.tulukhDun ?? 0;

                          tulburTulyu(
                            found.tuukh[0],
                            found._id,
                            found.mashiniiDugaar,
                            haruulakhDun,
                            0
                          );
                        } else {
                          notification.warn({
                            message: t("Машины мэдээлэл олдсонгүй"),
                          });
                        }
                      })
                      .catch((err) => {
                        notification.error({
                          message: t("Машин хайхад алдаа гарлаа"),
                        });
                      });
                  }
                };

                fetchAndOpenModal();
              }, 1500);
            }
          }
        }
      })
      .catch(aldaaBarigch);
  };

  const dugaarGaraasBurtgekh = (data) => {
    if (data) {
      if (!camerVal[1]) {
        return notification.warn({
          message: "Гарах камер сонгоно уу.",
          duration: 2,
        });
      }
      if (!data.mashiniiDugaar) {
        return notification.warn({
          message: "Машины дугаар оруулна уу.",
          duration: 2,
        });
      }

      const yavuulakhData = {
        mashiniiDugaar: data.mashiniiDugaar,
        CAMERA_IP: camerVal[1],
      };
      if (barilgiinId) {
        yavuulakhData.barilgiinId = barilgiinId;
      }
      // Check if offline
      if (isOfflineMode || !isOnline) {
        const checkPaymentRequired = async () => {
          try {
            const tuukh = data.tuukh?.[0];
            if (tuukh) {
 
              const mashin = data.mashin;
              if (
                mashin?.khungulultTurul === "togtmolTsag" &&
                mashin?.uldegdelKhungulukhKhugatsaa > 0
              ) {
                const remainingDiscountTime = mashin.uldegdelKhungulukhKhugatsaa;
                const parkingTime = data.niitKhugatsaa || 0;
                
                
                if (remainingDiscountTime >= parkingTime) {
                  proceedWithOfflineExit();
                  return;
                }
              }

              const fee = await calculateParkingFee(tuukh);

              if (fee > 0) {
                const haruulakhDun = fee;

                tulburTulyu(
                  tuukh,
                  data._id,
                  data.mashiniiDugaar,
                  haruulakhDun,
                  0
                );
                return;
              }
            }

            proceedWithOfflineExit();
          } catch (error) {
            console.error("Error calculating parking fee:", error);

            proceedWithOfflineExit();
          }
        };

        const proceedWithOfflineExit = () => {
          const pendingCar = {
            type: "removeCar",
            data: {
              ...yavuulakhData,
              originalData: data,
              baiguullagiinId: baiguullaga?._id,
            },
            timestamp: new Date().toISOString(),
            id: Date.now(),
          };

          if (typeof window !== "undefined") {
            const stored = JSON.parse(
              localStorage.getItem("cameraPendingCars") || "[]"
            );
            stored.push(pendingCar);
            localStorage.setItem("cameraPendingCars", JSON.stringify(stored));

            // Handle offline-added cars differently
            if (data._id && data._id.startsWith("pending_")) {
              // This is an offline-added car, update it in localStorage
              const updatedStored = stored.map((item) => {
                if (item.id && data._id === `pending_${item.id}`) {
                  return {
                    ...item,
                    data: {
                      ...item.data,
                      exitTimestamp: new Date().toISOString(),
                      exitCamera: camerVal[1],
                      tuluv: -1, // Mark as exited
                    },
                  };
                }
                return item;
              });
              localStorage.setItem(
                "cameraPendingCars",
                JSON.stringify(updatedStored)
              );
            }

            // Trigger UI update
            setPendingCarsUpdateTrigger((prev) => prev + 1);
          }

          // Update online data if available
          if (
            data?._id &&
            updateOfflineItem &&
            !data._id.startsWith("pending_")
          ) {
            updateOfflineItem(data._id, (item) => ({
              ...item,
              tuukh: item.tuukh?.map((t, idx) =>
                idx === 0
                  ? {
                      ...t,
                      tuluv: -1,
                      tsagiinTuukh: t.tsagiinTuukh?.map((ts, i) =>
                        i === 0
                          ? { ...ts, garsanTsag: new Date().toISOString() }
                          : ts
                      ),
                      garsanKhaalga: camerVal[1],
                    }
                  : t
              ),
            }));
          }

          notification.success({
            message: t("Амжилттай бүртгэгдлээ (Оффлайн)"),
          });
          setModalNeelttei(false);
        };

        checkPaymentRequired();
        return;
      }

      uilchilgee(token)
        .post("/zogsoolSdkService", yavuulakhData)
        .then((res) => {
          if (res.status === 200) {
            if (!res?.data?.aldaa) {
              notification.success({ message: t("Амжилттай бүртгэгдлээ") });
              const mashinData = res?.data;

              if (
                mashinData?.tuukh?.[0] &&
                mashinData?._id &&
                mashinData?.mashiniiDugaar
              ) {
                const tuukh = mashinData.tuukh[0];
                const niitKhugatsaa = tuukh?.niitKhugatsaa;
                const orsonTsag = tuukh?.tsagiinTuukh?.[0]?.orsonTsag;
                const garsanTsag =
                  tuukh?.tsagiinTuukh?.[0]?.garsanTsag || new Date();
                const computedMin =
                  Number.isFinite(Number(niitKhugatsaa)) &&
                  Number(niitKhugatsaa) >= 0
                    ? Number(niitKhugatsaa)
                    : orsonTsag
                    ? moment(garsanTsag).diff(moment(orsonTsag), "minutes")
                    : null;

              
                const mashin = data.mashin;
                let isInFreePeriod = false;
                
                if (
                  mashin?.khungulultTurul === "togtmolTsag" &&
                  mashin?.uldegdelKhungulukhKhugatsaa > 0
                ) {
                  const remainingDiscountTime = mashin.uldegdelKhungulukhKhugatsaa;
                  const parkingTime = data.niitKhugatsaa || computedMin || 0;
                  isInFreePeriod = remainingDiscountTime >= parkingTime;
                } else {
                  isInFreePeriod =
                    Number.isFinite(Number(computedMin)) &&
                    Number(computedMin) <= uneguiKhugatsaaMin;
                }

                if (!isInFreePeriod) {
                  uilchilgee(token)
                    .get("/zogsoolUilchluulegch", {
                      params: { query: { _id: mashinData._id } },
                    })
                    .then(({ data: freshData }) => {
                      const fresh = freshData?.jagsaalt?.[0];
                      if (fresh?.tuukh?.[0] && fresh?._id) {
                        const haruulakhDun =
                          fresh.niitDun ?? fresh.tuukh?.[0]?.tulukhDun ?? 0;
                        if (haruulakhDun > 0) {
                          tulburTulyu(
                            fresh.tuukh[0],
                            fresh._id,
                            fresh.mashiniiDugaar,
                            haruulakhDun,
                            0
                          );
                        }
                      } else {
                        const haruulakhDun = mashinData?.niitDun ?? tuukh?.tulukhDun ?? 0;
                        if (haruulakhDun > 0) {
                          tulburTulyu(
                            tuukh,
                            mashinData._id,
                            mashinData.mashiniiDugaar,
                            haruulakhDun,
                            0
                          );
                        }
                      }
                    })
                    .catch(() => {
                      const haruulakhDun = mashinData?.niitDun ?? tuukh?.tulukhDun ?? 0;
                      if (haruulakhDun > 0) {
                        tulburTulyu(
                          tuukh,
                          mashinData._id,
                          mashinData.mashiniiDugaar,
                          haruulakhDun,
                          0
                        );
                      }
                    });
                }
              } else if (data?.tuukh?.[0]) {
                const tuukh = data.tuukh[0];
                const niitKhugatsaa = tuukh?.niitKhugatsaa;
                const orsonTsag = tuukh?.tsagiinTuukh?.[0]?.orsonTsag;
                const garsanTsag =
                  tuukh?.tsagiinTuukh?.[0]?.garsanTsag || new Date();
                const computedMin =
                  Number.isFinite(Number(niitKhugatsaa)) &&
                  Number(niitKhugatsaa) >= 0
                    ? Number(niitKhugatsaa)
                    : orsonTsag
                    ? moment(garsanTsag).diff(moment(orsonTsag), "minutes")
                    : null;

             
                const mashin = data.mashin;
                let isInFreePeriod = false;
                
                if (
                  mashin?.khungulultTurul === "togtmolTsag" &&
                  mashin?.uldegdelKhungulukhKhugatsaa > 0
                ) {
                  const remainingDiscountTime = mashin.uldegdelKhungulukhKhugatsaa;
                  const parkingTime = data.niitKhugatsaa || computedMin || 0;
                  isInFreePeriod = remainingDiscountTime >= parkingTime;
                } else {
                  isInFreePeriod =
                    Number.isFinite(Number(computedMin)) &&
                    Number(computedMin) <= uneguiKhugatsaaMin;
                }

                if (!isInFreePeriod) {
                  uilchilgee(token)
                    .get("/zogsoolUilchluulegch", {
                      params: {
                        query: {
                          mashiniiDugaar: data.mashiniiDugaar,
                          "tuukh.0.garsanKhaalga": camerVal[1],
                        },
                        order: { createdAt: -1 },
                        khuudasniiKhemjee: 1,
                      },
                    })
                    .then(({ data: searchData }) => {
                      const found = searchData?.jagsaalt?.[0];
                      if (found?.tuukh?.[0] && found?._id) {
                        const haruulakhDun =
                          found.niitDun ?? found.tuukh?.[0]?.tulukhDun ?? 0;
                        if (haruulakhDun > 0) {
                          tulburTulyu(
                            found.tuukh[0],
                            found._id,
                            found.mashiniiDugaar,
                            haruulakhDun,
                            0
                          );
                        }
                      } else {
                        const haruulakhDun = data?.niitDun ?? tuukh?.tulukhDun ?? 0;
                        if (haruulakhDun > 0) {
                          tulburTulyu(
                            tuukh,
                            data._id,
                            data.mashiniiDugaar,
                            haruulakhDun,
                            0
                          );
                        }
                      }
                    })
                    .catch(() => {
                      const haruulakhDun = data?.niitDun ?? tuukh?.tulukhDun ?? 0;
                      if (haruulakhDun > 0) {
                        tulburTulyu(
                          tuukh,
                          data._id,
                          data.mashiniiDugaar,
                          haruulakhDun,
                          0
                        );
                      }
                    });
                }
              }
            }
            onRefresh();
          }
        });
    }
  };

  const khungulyu = (data, uilchluulegchiinId) => {
    const footer = [
      <div className="flex w-full items-center justify-between">
        <Button type="primary" onClick={() => khungulultRef?.current.khaaya()}>
          {t("Хаах")}
        </Button>
        <Button
          icon={<CiDiscount1 />}
          onClick={() => khungulultRef?.current.khadgalya()}
        >
          {t("Хөнгөлөх")}
        </Button>
      </div>,
    ];
    modal({
      title: t("Хөнгөлөх"),
      icon: <FileExcelOutlined />,
      content: (
        <KhungulukhTsonkh
          ref={khungulultRef}
          token={token}
          uilchluulegchiinId={uilchluulegchiinId}
          data={data}
          songogdsonZogsool={songogdzonZogsool}
          mutate={uilchluulegchMutate}
          ajiltan={ajiltan}
          baiguullaga={baiguullaga}
          barilgiinId={barilgiinId}
        />
      ),
      footer,
    });
  };

  const tsagTootsoolur = (v) => {
    const odooginTsag =
      Number(moment(new Date()).format("HH")) * 60 * 60 +
      Number(moment(new Date()).format("mm")) * 60 +
      Number(moment(new Date()).format("ss"));
    const ekhlesenTsag =
      Number(moment(v).format("HH")) * 60 * 60 +
      Number(moment(v).format("mm")) * 60 +
      Number(moment(v).format("ss"));
    const difference = odooginTsag - ekhlesenTsag;
    const tsag = Math.floor(difference / 60 / 60);
    const minut = Math.floor((difference - tsag * 60 * 60) / 60);
    // const second = Math.floor(difference - tsag * 60 * 60 - minut * 60);
    return {
      hours: tsag.toString(),
      minutes: minut.toString(),
    };
  };
  const orlogoGaraasOruulya = () => {
    const body = form.getFieldsValue();
    let yavuulakhData = {};
    yavuulakhData.mashiniiDugaar = body.mashiniiDugaar;
    yavuulakhData.tulukhDun = body.tulukhDun;
    yavuulakhData.barilgiinId = barilgiinId;
    yavuulakhData.orsonCamera = camerVal[0];
    yavuulakhData.garsanCamera = camerVal[1];

    // Check if offline
    if (isOfflineMode || !isOnline) {
      // Store as pending car
      const pendingCar = {
        type: "addCarFromEntry",
        data: {
          ...yavuulakhData,
          baiguullagiinId: baiguullaga?._id,
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        id: Date.now(),
      };
      if (typeof window !== "undefined") {
        const stored = JSON.parse(
          localStorage.getItem("cameraPendingCars") || "[]"
        );
        stored.push(pendingCar);
        localStorage.setItem("cameraPendingCars", JSON.stringify(stored));
        // Trigger UI update
        setPendingCarsUpdateTrigger((prev) => prev + 1);
      }

      notification.success({ message: t("Амжилттай бүртгэгдлээ (Оффлайн)") });
      setModalOpen({ bool: false, item: null, type: "" });
      form.resetFields();
      onRefresh();
      return;
    }

    uilchilgee(token)
      .post("/zogsoolOrlogoGaraas", yavuulakhData)
      .then((res) => {
        if (res.status === 200) {
          notification.success({ message: t("Амжилттай бүртгэгдлээ") });

          setModalOpen({ bool: false, item: null, type: "" });
          form.resetFields();
          onRefresh();

          if (res?.data?.tuukh?.[0] && res?.data?._id) {
            tulburTulyu(
              res.data.tuukh[0],
              res.data._id,
              res.data.mashiniiDugaar,
              res.data?.niitDun ??
                res.data?.tuukh?.[0]?.tulukhDun ??
                res.data?.tulukhDun ??
                0,
              0
            );
          }
        }
      })
      .catch((error) => {
        // If network error, store as pending
        if (!navigator.onLine || isOfflineMode) {
          const pendingCar = {
            type: "addCarFromEntry",
            data: {
              ...yavuulakhData,
              baiguullagiinId: baiguullaga?._id,
              createdAt: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
            id: Date.now(),
          };
          if (typeof window !== "undefined") {
            const stored = JSON.parse(
              localStorage.getItem("cameraPendingCars") || "[]"
            );
            stored.push(pendingCar);
            localStorage.setItem("cameraPendingCars", JSON.stringify(stored));
            // Trigger UI update
            setPendingCarsUpdateTrigger((prev) => prev + 1);
          }
          notification.warning(
            t(
              "Сүлжээний алдаа. Хадгалсан өгөгдөл сүлжээнд холбогдох үед нэгтгэл хийгдэнэ."
            )
          );
          onRefresh();
        } else {
          aldaaBarigch(error);
        }
      });
  };

  const modalKhaakh = () => {
    form.resetFields();
    setValue();
    setModalOpen({ bool: false, item: null, type: "" });
  };

  function guilgeeDrawerOngoilgokh() {
    setGuilgeeDrawerOpen(true);
  }
  function guilgeeDrawerKhaakh() {
    setGuilgeeDrawerOpen(false);
  }

  function khailtDoubleClick() {
    navigator.clipboard.readText().then((v) => {
      if (!!v) {
        searchUtga.current.value = v;
        setUilchluulegchKhuudaslalt((a) => ({
          ...a,
          search: v,
          khuudasniiDugaar: 1,
        }));
      }
    });
  }
  // Merge pending cars with actual data for offline support
  const mergedJagsaalt = useMemo(() => {
    const actual = uilchluulegchGaralt?.jagsaalt || [];
    const pendingCars =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("cameraPendingCars") || "[]")
        : [];

    // Filter out pending cars that are already synced (exist in actual data) or duplicates
    const unsyncedPending = pendingCars.filter((pending, index, arr) => {
      if (pending.type === "addCar" || pending.type === "addCarFromEntry") {
        const mashinDugaar =
          pending.data.mashiniiDugaar?.toUpperCase() ||
          pending.data.mashiniiDugaar;

        // Check if this car already exists in actual data
        const existsInActual = actual.some(
          (item) => item.mashiniiDugaar?.toUpperCase() === mashinDugaar
        );

        // Check for duplicates in pending array (keep only the first occurrence)
        const isDuplicate =
          arr.findIndex((p) => {
            if (p.type === "addCar" || p.type === "addCarFromEntry") {
              const otherDugaar =
                p.data.mashiniiDugaar?.toUpperCase() || p.data.mashiniiDugaar;
              return otherDugaar === mashinDugaar;
            }
            return false;
          }) !== index;

        return !existsInActual && !isDuplicate;
      }
      return false; // Remove operations don't need to be shown
    });

    // Add pending cars to the list with proper structure
    const pendingToAdd = unsyncedPending
      .filter((p) => p.type === "addCar" || p.type === "addCarFromEntry")
      .map((p) => {
        const carData = p.data;
        // Ensure mashiniiDugaar is uppercase to match actual data format
        const mashiniiDugaar =
          carData.mashiniiDugaar?.toUpperCase() || carData.mashiniiDugaar;

        // Check if this car has been exited offline
        const isExited = carData.exitTimestamp || carData.tuluv === -1;

        return {
          _id: `pending_${p.id}`, // Temporary ID
          mashiniiDugaar: mashiniiDugaar,
          baiguullagiinId: carData.baiguullagiinId || baiguullaga?._id,
          barilgiinId: carData.barilgiinId || barilgiinId,
          turul: carData.turul || "Үйлчлүүлэгч", // Changed from "Үнэгүй" to "Үйлчлүүлэгч"
          isPending: true,
          createdAt: carData.createdAt || p.timestamp,
          niitDun: carData.tulukhDun || 0,
          tuukh: carData.tuukh || [
            {
              tuluv: isExited ? -1 : 0, // Update status based on exit
              tulukhDun: carData.tulukhDun || 0, // Set to 0 for active status (no amount calculated yet)
              tulbur: [], // Ensure no payment records for active status
              garsanKhaalga: carData.exitCamera || null, // Add exit camera if available
              tsagiinTuukh: [
                {
                  orsonTsag: new Date(carData.createdAt || p.timestamp),
                  garsanTsag: carData.exitTimestamp
                    ? new Date(carData.exitTimestamp)
                    : null,
                },
              ],
            },
          ],
          mashin: carData.mashin || {},
        };
      });

    const merged = [...actual, ...pendingToAdd, ...localOfflineData];
    return merged;
  }, [
    uilchluulegchGaralt?.jagsaalt,
    baiguullaga?._id,
    barilgiinId,
    pendingCarsUpdateTrigger,
    localOfflineData, // Add dependency for local .NET service data
  ]);

  const filteredJagsaalt = useMemo(() => {
    if (!mergedJagsaalt || mergedJagsaalt.length === 0) return [];

    let filtered = mergedJagsaalt;

    if (turul) {
      if (turul === "Төлбөртэй") {
        filtered = filtered.filter((parent) => {
          const mur = parent.tuukh?.[0];
          return mur?.tulbur?.length > 0;
        });
      } else if (turul === "Идэвхтэй") {
        filtered = filtered.filter((parent) => {
          let dunTuluv = false;
          parent?.tuukh?.forEach((mur) => {
            if (mur.tulukhDun > 0) dunTuluv = true;
          });
          const mur = parent.tuukh?.[0];

          const hasPayment = mur?.tulbur?.length > 0;

          return (
            parent.turul !== "Үнэгүй" &&
            mur?.tuluv !== -1 &&
            (mur?.tuluv === 0 ||
              parent?.zurchil === "Гарсан цаг тодорхойгүй!") &&
            dunTuluv &&
            !hasPayment &&
            mur?.tuluv !== 1 &&
            mur?.tuluv !== 2
          );
        });
      }
    }

    if (!tuluvFilter) return filtered;

    return filtered.filter((parent) => {
      let dunTuluv = false;
      parent?.tuukh?.forEach((mur) => {
        if (mur.tulukhDun > 0) dunTuluv = true;
      });
      const mur = parent.tuukh[0];

      let currentStatus = "";

      const hasPayment = mur?.tulbur?.length > 0;

      const niitKhugatsaa = mur?.niitKhugatsaa;
      const hasExitTime = !!mur?.tsagiinTuukh?.[0]?.garsanTsag;
      const isInFreePeriod =
        hasExitTime &&
        Number.isFinite(Number(niitKhugatsaa)) &&
        Number(niitKhugatsaa) <= uneguiKhugatsaaMin;
      const isActive = mur?.tuluv === 0 && !hasExitTime && !mur?.garsanKhaalga;

      if (isActive) {
        currentStatus = "active";
      } else if (mur?.tuluv === 1 || mur?.tuluv === 2) {
        currentStatus = "tulugdsun";
      } else if (hasPayment) {
        currentStatus = "tulburtei";
      } else if (
        parent.turul === "Үнэгүй" ||
        mur?.tuluv === -1 ||
        isInFreePeriod
      ) {
        currentStatus = "unegui";
      } else if (
        !!parent.zurchil &&
        parent.zurchil !== "" &&
        mur?.tuluv === -2
      ) {
        currentStatus = "zurchiltei";
      } else if (
        (mur?.tuluv === 0 || parent?.zurchil === "Гарсан цаг тодорхойгүй!") &&
        dunTuluv
      ) {
        currentStatus = "idevekhitei";
      } else if (mur?.tuluv === 0 && !dunTuluv) {
        currentStatus = "unegui";
      }

      return currentStatus === tuluvFilter;
    });
  }, [mergedJagsaalt, tuluvFilter, turul]);

  const filteredData = useMemo(() => {
    const hasClientFilter = !!turul || !!tuluvFilter;
    // Always use merged data to include pending cars
    const baseData = {
      ...uilchluulegchGaralt,
      jagsaalt: hasClientFilter ? filteredJagsaalt : mergedJagsaalt,
      niitMur: hasClientFilter
        ? uilchluulegchGaralt?.niitMur ?? filteredJagsaalt.length
        : uilchluulegchGaralt?.niitMur ?? mergedJagsaalt.length,
    };
    if (!hasClientFilter) return baseData;
    return baseData;
  }, [
    uilchluulegchGaralt,
    filteredJagsaalt,
    mergedJagsaalt,
    turul,
    tuluvFilter,
  ]);

  const tableSummary = useMemo(() => {
    if (!tuluvFilter && uilchluulegchGaralt?.niitDun !== undefined) {
      return {
        totalDun: uilchluulegchGaralt.niitDun || 0,
        totalEbarimt: uilchluulegchGaralt.niitEbarimt || 0,

        totalTulbur: 0,
      };
    }

    const nemekhData = tuluvFilter
      ? uilchluulegchGaralt?.jagsaalt?.filter((parent) => {
          let dunTuluv = false;
          parent?.tuukh?.forEach((mur) => {
            if (mur.tulukhDun > 0) dunTuluv = true;
          });
          const mur = parent.tuukh[0];

          let currentStatus = "";

          const hasPayment = mur?.tulbur?.length > 0;
          const hasExitTime = !!mur?.tsagiinTuukh?.[0]?.garsanTsag;
          const isActive =
            mur?.tuluv === 0 && !hasExitTime && !mur?.garsanKhaalga;

          if (parent.turul === "Үнэгүй" || mur?.tuluv === -1) {
            currentStatus = "unegui";
          } else if (isActive) {
            currentStatus = "active";
          } else if (
            (mur?.tuluv === 0 ||
              parent?.zurchil === "Гарсан цаг тодорхойгүй!") &&
            dunTuluv
          ) {
            currentStatus = "idevekhitei";
          } else if (mur?.tuluv === 1 || mur?.tuluv === 2) {
            currentStatus = "tulugdsun";
          } else if (hasPayment) {
            currentStatus = "tulburtei";
          } else if (
            !!parent.zurchil &&
            parent.zurchil !== "" &&
            mur?.tuluv === -2
          ) {
            currentStatus = "zurchiltei";
          } else if (mur?.tuluv === 0 && !dunTuluv) {
            currentStatus = "unegui";
          }

          return currentStatus === tuluvFilter;
        })
      : uilchluulegchGaralt?.jagsaalt;

    if (!nemekhData || nemekhData.length === 0) return null;

    let totalDun = 0;
    let totalEbarimt = 0;
    let totalTulbur = 0;

    nemekhData.forEach((record) => {
      const mur = record.tuukh[0];

      totalDun += record.niitDun || mur?.tulukhDun || 0;

      if (mur?.tuluv === 1 || mur?.tuluv === 2) {
        if (mur.tulbur?.length > 0) {
          totalTulbur += mur.tulbur.reduce((sum, t) => sum + (t.dun || 0), 0);
        }
      }

      totalEbarimt += record.ebarimtAvsanDun || 0;
    });

    return { totalDun, totalEbarimt, totalTulbur };
  }, [uilchluulegchGaralt, tuluvFilter]);

  const excel = new Excel();
  return (
    <Admin
      title="Камер - Касс"
      tsonkhniiId={"64474e3e28c37d7cdda15d01"}
      khuudasniiNer="Camera"
      dedKhuudas={true}
      fixedZagvarNeegdsenEsekh={guilgeeKharakh}
      setTurulZagvar={setGuilgeeKharakh}
      searchUtga={searchUtga}
      suggestionData={uilchluulegchGaralt?.jagsaalt}
      className="relative p-2 pb-24 sm:p-4"
      onSearch={(search) => {
        setUilchluulegchKhuudaslalt((a) => ({
          ...a,
          search,
          khuudasniiDugaar: 1,
        }));
        setKhaikh(search);
      }}
      khailtDoubleClick={khailtDoubleClick}
    >
      {jagsaalt?.length > 0 ||
      filteredData?.jagsaalt?.length > 0 ||
      isActuallyOffline ? (
        <div className="col-span-12">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="fixed left-6 top-24 z-[10000] hidden h-[400px] md:block">
              <Tooltip title="Хуулга шалгах">
                <div
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-r-full border-y border-r bg-yellow-500 text-xl"
                  onClick={guilgeeDrawerOngoilgokh}
                >
                  <DollarCircleOutlined />
                </div>
              </Tooltip>

              <Drawer
                title={t("Сүүлийн гүйлгээ")}
                placement="left"
                size="large"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onClose={guilgeeDrawerKhaakh}
                open={guilgeeDrawerOpen}
                getContainer={false}
                bodyStyle={{ paddingTop: 0, paddingBottom: 0 }}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="absolute right-4 top-3">
                    <Button
                      className={`${
                        guilgeeKharakh === false ? "mr-0" : "mr-8"
                      }`}
                      type="tertiary"
                      onClick={(e) => {
                        e.stopPropagation();
                        dansniiKhuulgaMutate();
                      }}
                    >
                      Шалгах
                    </Button>
                  </div>
                  <Table
                    pagination={false}
                    tableLayout="fixed"
                    className="mt-3"
                    scroll={{ y: "calc(100vh / 4.5)" }}
                    size="small"
                    loading={false}
                    dataSource={dansniiKhuulgaGaralt?.jagsaalt}
                    columns={baganuud}
                  />
                </div>
              </Drawer>
            </div>
            <div
              onClick={() => {
                setCamerKharakh(false);
              }}
              className={`w-full ${
                cameraKharakh === 1 &&
                "fixed right-0 top-0 z-10 flex h-screen w-screen items-center justify-center rounded-md bg-black bg-opacity-80 p-2 md:py-[10%]"
              }`}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setCamerKharakh(1);
                }}
                className={`w-full rounded-md bg-[url('/notPlay.png')] bg-[length:100%_100%] bg-center bg-no-repeat ${
                  cameraKharakh === 1
                    ? "sm:h-[80vh] sm:w-[80%]"
                    : "sm:h-[450px]"
                }`}
              >
                {baiguullaga?._id === "6115f350b35689cdbf1b9da3" &&
                (camerVal[0] === "192.168.1.128" ||
                  camerVal[0] === "192.168.1.232") ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"admin123"}
                    Camer={camerVal[0]}
                    PORT={554}
                  />
                ) : baiguullaga?._id === "6115f350b35689cdbf1b9da3" ? (
                  <R2WPlayerComponent
                    // USER={"admin"}
                    // ROOT={"stream"}
                    // PASSWD={"123456"}
                    // Camer={camerVal[0]}
                    // PORT={554}
                    USER={parkingJagsaalt?.[0]?.tokhirgoo?.USER}
                    ROOT={parkingJagsaalt?.[0]?.tokhirgoo?.ROOT}
                    PASSWD={parkingJagsaalt?.[0]?.tokhirgoo?.PASSWD}
                    Camer={camerVal[0]}
                    PORT={parkingJagsaalt?.[0]?.tokhirgoo?.PORT}
                  />
                ) : baiguullaga?._id === "66b330a4621d4f5d11f09c8e" &&
                  camerVal[0] === "192.168.1.91" ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"admin123"}
                    Camer={camerVal[0]}
                    PORT={554}
                  />
                ) : baiguullaga?._id === "669e28beb13f35e669e773a6" ? (
                  camerVal[0] === "192.168.0.109" ? (
                    <R2WPlayerComponent
                      USER={"admin"}
                      ROOT={"live"}
                      PASSWD={"Admin123"}
                      Camer={camerVal[0]}
                      PORT={554}
                    />
                  ) : (
                    <R2WPlayerComponent
                      USER={parkingJagsaalt?.[0]?.tokhirgoo?.USER}
                      ROOT={parkingJagsaalt?.[0]?.tokhirgoo?.ROOT}
                      PASSWD={parkingJagsaalt?.[0]?.tokhirgoo?.PASSWD}
                      Camer={camerVal[0]}
                      PORT={parkingJagsaalt?.[0]?.tokhirgoo?.PORT}
                    />
                  )
                ) : baiguullaga?._id === "671f0d5d53b82cbedf0f81a3" &&
                  barilgiinId === "671f0d5d53b82cbedf0f81a4" ? (
                  camerVal[0] === "192.168.1.155" ||
                  camerVal[0] === "192.168.1.156" ||
                  camerVal[0] === "192.168.1.157" ||
                  camerVal[0] === "192.168.1.158" ||
                  camerVal[0] === "192.168.1.159" ||
                  camerVal[0] === "192.168.1.160" ||
                  camerVal[0] === "192.168.1.206" ||
                  camerVal[0] === "192.168.1.108" ? (
                    <R2WPlayerComponent
                      USER={"admin"}
                      ROOT={"live"}
                      PASSWD={
                        camerVal[0] === "192.168.1.206" ||
                        camerVal[0] === "192.168.1.108"
                          ? "Admin123@"
                          : "admin123"
                      }
                      Camer={camerVal[0]}
                      PORT={554}
                    />
                  ) : (
                    <R2WPlayerComponent
                      USER={parkingJagsaalt?.[0]?.tokhirgoo?.USER}
                      ROOT={parkingJagsaalt?.[0]?.tokhirgoo?.ROOT}
                      PASSWD={parkingJagsaalt?.[0]?.tokhirgoo?.PASSWD}
                      Camer={camerVal[0]}
                      PORT={parkingJagsaalt?.[0]?.tokhirgoo?.PORT}
                    />
                  )
                ) : baiguullaga?._id === "6646fab6ae3f7ecc2ea5ecd9" &&
                  barilgiinId === "6646fab6ae3f7ecc2ea5ecda" &&
                  camerVal[0] === "192.168.1.242" ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"Admin123"}
                    Camer={camerVal[0]}
                    PORT={554}
                  />
                ) : // tedy voucher hkvision
                baiguullaga?._id === "66c2c871597ea1390c3fd830" &&
                  barilgiinId === "68514b121af1430455676c6d" &&
                  camerVal[0] === "192.168.1.83" ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"Tsegts157"}
                    Camer={camerVal[0]}
                    PORT={554}
                  />
                ) : parkingJagsaalt?.[0]?.tokhirgoo ? (
                  parkingJagsaalt?.[0]?.tokhirgoo?.socketEsekh === true ? (
                    <SocketStream
                      ip={camerVal[0]}
                      CHANNEL={parkingJagsaalt?.[0]?.tokhirgoo?.CHANNEL}
                      PORT={parkingJagsaalt?.[0]?.tokhirgoo?.PORT}
                      TOKEN={parkingJagsaalt?.[0]?.tokhirgoo?.TOKEN}
                    />
                  ) : parkingJagsaalt?.[0]?.tokhirgoo?.socketEsekh === false ? (
                    <R2WPlayerComponent
                      USER={parkingJagsaalt?.[0]?.tokhirgoo?.USER}
                      ROOT={parkingJagsaalt?.[0]?.tokhirgoo?.ROOT}
                      PASSWD={parkingJagsaalt?.[0]?.tokhirgoo?.PASSWD}
                      Camer={camerVal[0]}
                      PORT={parkingJagsaalt?.[0]?.tokhirgoo?.PORT}
                    />
                  ) : (
                    ""
                  )
                ) : (
                  ""
                )}
              </div>
              {cameraKharakh === 1 && (
                <div className="absolute right-5 top-5 text-3xl text-white">
                  <CloseOutlined
                    onClick={(e) => {
                      e.stopPropagation();
                      setCamerKharakh(false);
                    }}
                  />
                </div>
              )}
              <div
                className={`mt-3 flex flex-col justify-between gap-3 sm:flex-row ${
                  cameraKharakh === 1 && "absolute bottom-5 w-40"
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative inline-block">
                    <Button
                      onClick={(e) => {
                        khaalgaNeey(camerVal[0]);
                      }}
                      className="w-full sm:w-auto"
                      type="primary"
                      id="neekhKhaalgaID"
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                    >
                      {t("Нээх")} [ {t("Орох")} F1 ]
                    </Button>

                    <div
                      className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-zinc-700 px-3 py-2 text-sm text-white shadow-md transition-opacity duration-200 ease-in-out ${
                        isHovered ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      Орох хаалт нээх
                      <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-zinc-700"></div>
                    </div>
                  </div>
                </div>
                <TreeSelect
                  placement={cameraKharakh === 1 ? "topRight" : "bottomLeft"}
                  showSearch
                  style={{
                    backgroundColor: "#10B981",
                    borderColor: "#10B981",
                  }}
                  value={camerVal[0]}
                  dropdownStyle={{
                    maxHeight: 600,
                    minWidth: 280,
                    overflow: "auto",
                  }}
                  className="sm:w-50 w-full md:w-auto"
                  placeholder={t("Камер сонгох")}
                  allowClear
                  treeDefaultExpandAll
                  onChange={(e) => cameraChange(e, 1)}
                  treeData={cameraData[0]}
                />
              </div>
            </div>
            <div
              onClick={() => {
                setCamerKharakh(false);
              }}
              className={`w-full ${
                cameraKharakh === 2 &&
                "fixed right-0 top-0 z-10 flex h-screen w-screen items-center justify-center rounded-md bg-black bg-opacity-80 p-2"
              }`}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setCamerKharakh(2);
                }}
                className={`w-full rounded-md bg-[url('/notPlay.png')] bg-[length:100%_100%] bg-center bg-no-repeat ${
                  cameraKharakh === 2
                    ? "sm:h-[80vh] sm:w-[80%]"
                    : "sm:h-[450px]"
                }`}
              >
                {/*baiguullagiin id ni FoodCity.iin id */}
                {baiguullaga?._id === "63c0f31efe522048bf02086d" ? (
                  camerVal[1] === "192.168.2.236" ? (
                    <R2WPlayerComponent
                      USER={"admin"}
                      ROOT={"live"}
                      PASSWD={"food2345"}
                      Camer={camerVal[1]}
                      PORT={554}
                    />
                  ) : (
                    <R2WPlayerComponent
                      Camer={camerVal[1]}
                      PASSWD={parkingJagsaalt?.[0]?.tokhirgoo?.PASSWD}
                      PORT={parkingJagsaalt?.[0]?.tokhirgoo?.PORT}
                      ROOT={parkingJagsaalt?.[0]?.tokhirgoo?.ROOT}
                      USER={parkingJagsaalt?.[0]?.tokhirgoo?.USER}
                    />
                  )
                ) : baiguullaga?._id === "6115f350b35689cdbf1b9da3" &&
                  (camerVal[1] === "192.168.1.229" ||
                    camerVal[1] === "192.168.1.231") ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"admin123"}
                    Camer={camerVal[1]}
                    PORT={554}
                  />
                ) : baiguullaga?._id === "662ee74ba29549374bc40245" &&
                  camerVal[1] === "172.16.19.115" ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"admin123"}
                    Camer={camerVal[1]}
                    PORT={554}
                  />
                ) : baiguullaga?._id === "6115f350b35689cdbf1b9da3" ? (
                  <R2WPlayerComponent
                    // USER={"admin"}
                    // PASSWD={"123456"}
                    // ROOT={"stream"}
                    // Camer={camerVal[1]}
                    // PORT={554}
                    Camer={camerVal[1]}
                    PASSWD={parkingJagsaalt?.[0]?.tokhirgoo?.PASSWD}
                    PORT={parkingJagsaalt?.[0]?.tokhirgoo?.PORT}
                    ROOT={parkingJagsaalt?.[0]?.tokhirgoo?.ROOT}
                    USER={parkingJagsaalt?.[0]?.tokhirgoo?.USER}
                  />
                ) : baiguullaga?._id === "6698c657c26994f4e0f8de62" &&
                  barilgiinId === "67285bb9e212a8d0cb42495f" &&
                  camerVal[1] === "192.168.8.108" ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"Admin123"}
                    Camer={camerVal[1]}
                    PORT={554}
                  />
                ) : baiguullaga?._id === "669e28beb13f35e669e773a6" &&
                  camerVal[1] === "192.168.0.110" ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"Admin123"}
                    Camer={camerVal[1]}
                    PORT={554}
                  />
                ) : baiguullaga?._id === "66d90703344b0b96a65ef1a4" &&
                  camerVal[1] === "192.168.4.108" ? (
                  <R2WPlayerComponent
                    USER={"admin"}
                    ROOT={"live"}
                    PASSWD={"Admin123"}
                    Camer={camerVal[1]}
                    PORT={554}
                  />
                ) : parkingJagsaalt?.[0]?.tokhirgoo ? (
                  parkingJagsaalt?.[0]?.tokhirgoo?.socketEsekh === true ? (
                    <SocketStream
                      ip={camerVal[1]}
                      CHANNEL={parkingJagsaalt?.[0]?.tokhirgoo?.CHANNEL}
                      PORT={parkingJagsaalt?.[0]?.tokhirgoo?.STREAMPORT}
                      TOKEN={parkingJagsaalt?.[0]?.tokhirgoo?.TOKEN}
                    />
                  ) : parkingJagsaalt?.[0]?.tokhirgoo?.socketEsekh === false ? (
                    <R2WPlayerComponent
                      Camer={camerVal[1]}
                      PASSWD={parkingJagsaalt?.[0]?.tokhirgoo?.PASSWD}
                      PORT={parkingJagsaalt?.[0]?.tokhirgoo?.PORT}
                      ROOT={parkingJagsaalt?.[0]?.tokhirgoo?.ROOT}
                      USER={parkingJagsaalt?.[0]?.tokhirgoo?.USER}
                    />
                  ) : (
                    ""
                  )
                ) : (
                  ""
                )}
              </div>
              {cameraKharakh === 2 && (
                <div className="absolute right-5 top-5 text-3xl text-white">
                  <CloseOutlined
                    onClick={(e) => {
                      e.stopPropagation();
                      setCamerKharakh(false);
                    }}
                  />
                </div>
              )}
              <div
                className={`mt-3 flex flex-col justify-between gap-3 sm:flex-row ${
                  cameraKharakh === 2 && "absolute bottom-5 w-40"
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative inline-block">
                    <Button
                      onClick={(e) => {
                        khaalgaNeey(camerVal[1]);
                      }}
                      id="khaakhkhaalgaID"
                      className="w-full sm:w-auto"
                      type="primary"
                      onMouseEnter={() => setIsHovered2(true)}
                      onMouseLeave={() => setIsHovered2(false)}
                    >
                      {t("Нээх")} [ {t("Гарах1")} F2 ]
                    </Button>

                    <div
                      className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-zinc-700 px-3 py-2 text-sm text-white shadow-md transition-opacity duration-200 ease-in-out ${
                        isHovered2 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      Гарах хаалт нээх
                      <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-zinc-700"></div>
                    </div>
                  </div>
                </div>
                <TreeSelect
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  placement={cameraKharakh === 2 ? "topRight" : "bottomRight"}
                  showSearch
                  style={{
                    backgroundColor: "#10B981",
                    borderColor: "#10B981",
                  }}
                  value={camerVal[1]}
                  dropdownStyle={{
                    maxHeight: 600,
                    minWidth: 280,
                    overflow: "auto",
                  }}
                  placeholder={t("Камер сонгох")}
                  allowClear
                  treeDefaultExpandAll
                  onChange={(e) => cameraChange(e, 2)}
                  treeData={cameraData[1]}
                />
              </div>
            </div>
          </div>
          <div className="col-span-12 mt-1 pt-1 dark:bg-gray-800">
            <div className="mb-5 xl:hidden">
              <Button
                onClick={() => khaalgaNeey(camerVal[0])}
                className="relative w-full sm:w-auto"
                type="primary"
                id="neekhKhaalgaID"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {t("Орох хаалт нээх")} [ F1 ]
              </Button>
            </div>
            <div className="flex flex-col gap-1 lg:flex-row">
              <div
                data-aos="fade-right"
                data-aos-duration="1000"
                className="flex w-full flex-col lg:flex-row"
                data-aos-delay="100"
              >
                <DatePicker.RangePicker
                  allowClear={false}
                  className="w-full md:w-auto"
                  size="middle"
                  value={ognoo}
                  onChange={setOgnoo}
                />
              </div>
              <div
                className="mb-5 flex w-full flex-col justify-between gap-2 sm:justify-end md:mb-0 md:ml-auto lg:w-auto lg:flex-row lg:gap-0"
                data-aos="fade-left"
                data-aos-duration="1000"
                data-aos-delay="300"
              >
                <BaganiinSongolt
                  columns={baganaColumns}
                  shineBagana={shineBagana}
                  setShineBagana={setShineBagana}
                  ButtonStyle="mr-3 w-full lg:w-auto text-ellipsis"
                />
                <Button
                  onClick={() => ajiltniiDelgerengui()}
                  className="mr-3  w-full text-ellipsis"
                  icon={<PrinterOutlined />}
                  type="primary"
                >
                  {t("Өдрийн хаалт")}
                </Button>
                {(ajiltan?.tokhirgoo?.zogsoolNegtgelDunKharakhEsekh === true ||
                  ajiltan?.erkh === "Admin") && (
                  <Button
                    onClick={() => tulburiinDelgerengui()}
                    className="mr-3 !w-full text-ellipsis"
                    icon={<PrinterOutlined />}
                    type="primary"
                  >
                    {t("Орлого тайлан")}
                  </Button>
                )}

                <div className="flex w-full items-center justify-center">
                  <div className="relative inline-block">
                    <Button
                      className="group relative mr-3 w-auto text-ellipsis"
                      onClick={() => {
                        setModalOpen({
                          bool: true,
                          item: null,
                          type: "orlogo",
                        });
                      }}
                      type="primary"
                    >
                      {t("Орлого")} [ F8 ]
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-zinc-700 px-3 py-2 text-sm text-white opacity-0 shadow-md transition-opacity duration-200 ease-in-out group-hover:opacity-100">
                        Орсон цаг тодорхойгүй машинд гараас төлбөр оруулж
                        бүртгэх
                        <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-zinc-700"></div>
                      </div>
                    </Button>
                  </div>
                  <div className="relative inline-block">
                    <Button
                      className="group mr-3 w-auto text-ellipsis"
                      onClick={() => {
                        setModalOpen({
                          bool: true,
                          item: null,
                          type: "dugaarBurtgekh",
                        });
                        populateRegistrationDateTime();
                        setTimeout(() => {
                          mashiniiDugaarRef.current.focus();
                        }, 200);
                      }}
                      type="primary"
                    >
                      {t("Машин")} [ + ]
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-zinc-700 px-3 py-2 text-sm text-white opacity-0 shadow-md transition-opacity duration-200 ease-in-out group-hover:opacity-100">
                        Гараас машин шивж бүртгэх
                        <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-zinc-700"></div>
                      </div>
                    </Button>
                  </div>

                  <Popover
                    content={() => (
                      <div className="flex flex-col text-ellipsis">
                        <a
                          className="flex cursor-pointer items-center space-x-2 rounded-lg p-1 hover:bg-green-100 dark:text-white dark:hover:bg-gray-700 "
                          onClick={() => {
                            uilchilgee(token)
                              .get("zogsoolUilchluulegch", {
                                params: {
                                  order: order,
                                  query: query,
                                  khuudasniiKhemjee:
                                    uilchluulegchGaralt?.niitMur,
                                },
                              })
                              .then(({ data }) => {
                                excel
                                  .addSheet("Камер")
                                  .addColumns([
                                    {
                                      title: "№",
                                      align: "center",
                                      dataIndex: "dugaar",
                                      width: "2rem",
                                      __style__: { h: "center" },
                                      render: (text, record, index) =>
                                        (data?.khuudasniiDugaar || 0) *
                                          (data?.khuudasniiKhemjee || 0) -
                                        (data?.khuudasniiKhemjee || 0) +
                                        index +
                                        1,
                                    },
                                    {
                                      title: t("Дугаар1"),
                                      dataIndex: "mashiniiDugaar",
                                      __style__: { h: "center" },
                                      render(v) {
                                        return String(v).toUpperCase();
                                      },
                                    },
                                    {
                                      title: t("Орсон"),
                                      dataIndex: "tuukh.tsagiinTuukh.orsonTsag",
                                      __style__: { h: "center" },
                                      render(v, p) {
                                        const d =
                                          p.tuukh[0]?.tsagiinTuukh[0]
                                            ?.orsonTsag;
                                        return (
                                          d && moment(d).format("MM-DD HH:mm")
                                        );
                                      },
                                    },
                                    {
                                      title: t("Гарсан"),
                                      __style__: { h: "center" },
                                      dataIndex:
                                        "tuukh.tsagiinTuukh.garsanTsag",
                                      render(v, p) {
                                        const d =
                                          p.tuukh[0]?.tsagiinTuukh[0]
                                            ?.garsanTsag;
                                        return (
                                          d && moment(d).format("MM-DD HH:mm")
                                        );
                                      },
                                    },
                                    {
                                      title: t("Хугацаа/мин"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "center" },
                                      render(v) {
                                        const d1 = moment(
                                          v?.[0]?.tsagiinTuukh[0]?.orsonTsag
                                        );
                                        const d2 = moment(
                                          v?.[0]?.tsagiinTuukh[0]?.garsanTsag
                                        );
                                        const diff = d2.diff(d1, "minutes");
                                        return diff && diff;
                                      },
                                    },
                                    {
                                      title: t("Төрөл"),
                                      __style__: { h: "center" },
                                      dataIndex: "turul",
                                      render: (v) => (!!v ? v : "Үйлчлүүлэгч"),
                                    },
                                    {
                                      title: t("Дүн"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          v?.[0]?.tulukhDun ||
                                          v?.[1]?.tulukhDun ||
                                          0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Бэлэн"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) => e.turul === "belen"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Зээл"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) => e.turul === "zeel"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Дансаар"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) =>
                                                    e.turul === "khariltsakh"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Карт"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) =>
                                                    e.turul === "khaan" ||
                                                    e.turul === "tdb" ||
                                                    e.turul === "khas" ||
                                                    e.turul === "golomt" ||
                                                    e.turul === "kapitron" ||
                                                    e.turul === "tur"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Токи"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) => e.turul === "toki"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Киоск"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) => e.turul === "kiosk"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Хөнгөлөлт"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) =>
                                                    e.turul === "khungulult"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("qpay"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) => e.turul === "qpay"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("QPAY Урьдчилсан"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) =>
                                                    e.turul ===
                                                    "qpayUridchilsan"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Пос бэлэн"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) => e.turul === "PosBelen"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Пос карт"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) => e.turul === "PosCard"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: t("Пос дансаар"),
                                      dataIndex: "tuukh",
                                      __style__: { h: "right" },
                                      __numFmt__: "#,##0.00",
                                      __cellType__: "TypeNumeric",
                                      render(v, p, i) {
                                        return (
                                          (v[0]?.tulbur?.length > 0
                                            ? v[0]?.tulbur
                                                ?.filter(
                                                  (e) =>
                                                    e.turul === "PosKhariltsakh"
                                                )
                                                .reduce(
                                                  (a, b) =>
                                                    a + Number(b.dun || 0),
                                                  0
                                                )
                                            : 0) || 0
                                        );
                                      },
                                    },
                                    {
                                      title: "Төлөв",
                                      dataIndex: "tuukh",
                                      __style__: { h: "center" },
                                      render: (v) => {
                                        return v[0]?.tuluv === 1
                                          ? "Төлсөн"
                                          : v[0]?.tuluv === 0
                                          ? "Төлөөгүй"
                                          : v[0]?.tuluv === -2
                                          ? "Зөрчилтэй"
                                          : "";
                                      },
                                    },
                                    {
                                      title: t("Шалтгаан"),
                                      dataIndex: "tuukh",
                                      render: (v, parent) => {
                                        if (parent.turul === "Үнэгүй") {
                                          return t(parent?.mashin?.temdeglel);
                                        } else
                                          return v?.[0]?.tuluv === -1
                                            ? v?.[0]?.uneguiGarsan
                                            : !!v?.[0]?.tsagiinTuukh[0]
                                                ?.garsanTsag &&
                                              Number.isFinite(
                                                Number(v?.[0]?.niitKhugatsaa)
                                              ) &&
                                              Number(v?.[0]?.niitKhugatsaa) <=
                                                uneguiKhugatsaaMin
                                            ? minToHour(uneguiKhugatsaaMin)
                                            : t(parent.zurchil);
                                      },
                                    },
                                    {
                                      title: t("Бүртгэсэн"),
                                      dataIndex: "tuukh",
                                      render: (v) => {
                                        return (
                                          v &&
                                          (String(
                                            v[0]?.burtgesenAjiltaniiNer
                                          ).replace(/\D/g, "").length > 9
                                            ? ajiltniiNers.find(
                                                (a) =>
                                                  a.id ===
                                                  v[0]?.burtgesenAjiltaniiId
                                              )?.ner
                                            : v[0]?.burtgesenAjiltaniiNer)
                                        );
                                      },
                                    },
                                    {
                                      title: t("Орсон хаалга"),
                                      dataIndex: "tuukh",
                                      render: (v) => {
                                        var khaalguud = "";
                                        v?.map((a) => {
                                          khaalguud =
                                            khaalguud +
                                            (khaalguud ? ", " : "") +
                                            a.orsonKhaalga;
                                        });
                                        return khaalguud;
                                      },
                                    },
                                    {
                                      title: t("Гарсан хаалга"),
                                      dataIndex: "tuukh",
                                      render: (v) => {
                                        var khaalguud = "";
                                        v?.map((a) => {
                                          khaalguud =
                                            khaalguud +
                                            (khaalguud ? ", " : "") +
                                            (a.garsanKhaalga || "");
                                        });
                                        return khaalguud;
                                      },
                                    },
                                  ])
                                  .addDataSource(data?.jagsaalt)
                                  .saveAs("Camera.xlsx");
                              });
                          }}
                        >
                          <DownloadOutlined style={{ fontSize: "18px" }} />
                          <label>{t("Татах")}</label>
                        </a>
                      </div>
                    )}
                    style={{ padding: 0 }}
                    placement="bottom"
                    trigger="click"
                  >
                    {/* <Button
                      type="primary"
                      className="mr-3 w-auto text-ellipsis"
                      icon={<FileExcelOutlined />}
                    >
                      <span>Excel</span>
                      <DownOutlined width={5} />
                    </Button> */}
                  </Popover>
                  <Button
                    className="w-full text-ellipsis"
                    icon={<CameraOutlined />}
                    onClick={() => setDrawerOpen(true)}
                    type="primary"
                  >
                    {t("Камер")}
                  </Button>
                  {/* Offline/Sync Status Indicator */}
                  {isActuallyOffline ? (
                    <div>
                      <div className="flex flex-col text-xs">
                        {pendingUpdates.length > 0 && (
                          <span>
                            {/* {pendingUpdates.length} {t("хүлээгдэж буй")} */}
                          </span>
                        )}
                        {localOfflineData.length > 0 && (
                          <span>
                            {localOfflineData.length} .NET {t("сервисээс")}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : syncStatus === "syncing" ? (
                    <div>
                      {/* <LoadingOutlined spin />
                      <span className="text-sm font-medium">
                        {t("Нэгтгэл хийж байна...")}
                      </span> */}
                    </div>
                  ) : syncStatus === "success" ? (
                    <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-1.5 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircleOutlined />
                      <span className="text-sm font-medium">
                        {t("Нэгтгэл амжилттай")}
                      </span>
                    </div>
                  ) : null}
                </div>
                <Drawer
                  width={"100vw"}
                  title={t("Камер")}
                  placement="right"
                  onClose={() => setDrawerOpen(false)}
                  visible={drawerOpen}
                >
                  {drawerOpen && (
                    <Card className="col-span-12 row-span-full lg:col-span-4 lg:col-start-9">
                      <div className="w-max">
                        {/*baiguullagiin id ni FoodCity.iin id */}
                        {baiguullaga?._id === "63c0f31efe522048bf02086d" ? (
                          <StackStream tuluv={drawerOpen} />
                        ) : baiguullaga?._id === "6115f350b35689cdbf1b9da3" ? (
                          <StackIkhNaydStream
                            barilgiinId={barilgiinId}
                            token={token}
                          />
                        ) : (
                          ""
                        )}
                      </div>
                    </Card>
                  )}
                </Drawer>
              </div>
            </div>

            <div>
              <ZogsoolCameraTable
                isValidating={false}
                uilchluulegchGaralt={filteredData}
                columns={columns}
                onChangeTable={onChangeTable}
                setUilchluulegchKhuudaslalt={setUilchluulegchKhuudaslalt}
                summary={() => {
                  if (!tableSummary) return null;

                  const dunIndex = 7;
                  const tulburIndex = 8;
                  const ebarimtIndex = 9;

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell
                          index={0}
                          colSpan={dunIndex}
                          align="right"
                        >
                          Нийт дүн:
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={dunIndex} align="right">
                          <strong>
                            {formatNumber(tableSummary?.totalDun || 0, 0)}
                          </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={tulburIndex} align="right">
                          <strong>
                            {formatNumber(tableSummary?.totalTulbur || 0, 0)}
                          </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={ebarimtIndex} align="right">
                          <strong>
                            {formatNumber(tableSummary?.totalEbarimt || 0, 0)}
                          </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell
                          index={ebarimtIndex + 1}
                          colSpan={6}
                        ></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </div>
          </div>
          <Modal
            title={
              modalOpen.type !== "zurchil"
                ? modalOpen.type !== "dugaarBurtgekh"
                  ? modalOpen.type !== "orlogo"
                    ? t("Үнэгүй үйлчлүүлэгчийн төрөл сонгох")
                    : t("Орлого")
                  : t("Машин бүртгэх")
                : t("Зөрчил оруулах")
            }
            open={modalOpen.bool}
            onCancel={() => modalKhaakh()}
            width={564}
            footer={[
              <Button type="primary" key="back" onClick={() => modalKhaakh()}>
                {t("Хаах")}
              </Button>,
              <Button type="primary" onClick={khadgalakh}>
                {t("Хадгалах")}
              </Button>,
            ]}
          >
            <Space direction="vertical" className="w-full">
              {modalOpen.type !== "dugaarBurtgekh" &&
              modalOpen.type !== "orlogo" ? (
                <>
                  <Radio.Group onChange={onChange} value={value}>
                    {modalOpen.type !== "zurchil" ? (
                      <Space align="start">
                        <Space.Compact direction="vertical">
                          <Radio value="Цагдаа">{t("Цагдаа")}</Radio>
                          <Radio value="Гал">{t("Гал")}</Radio>
                          <Radio value="Эмнэлэг">{t("Эмнэлэг")}</Radio>
                          <Radio value="Онцгой">{t("Онцгой")}</Radio>
                          <Radio value="Борлуулалтын машин">
                            {t("Борлуулалтын машин")}
                          </Radio>
                          <Radio value="Хөгжлийн бэрхшээлтэй">
                            {t("Хөгжлийн бэрхшээлтэй")}
                          </Radio>
                          <Radio value="Хогны машин">{t("Хогны машин")}</Radio>
                          <Radio value="Шуудан">Шуудан</Radio>
                          <Radio value="Дэлгүүрийн үйлчлүүлэгч">
                            {t("Дэлгүүрийн үйлчлүүлэгч")}
                          </Radio>
                          {baiguullaga?._id === "63c0f31efe522048bf02086d" && (
                            <>
                              <Radio value="Түрээслэгч">
                                {t("Түрээслэгч")}
                              </Radio>
                              <Radio value="Барилга">{t("Барилга")}</Radio>
                            </>
                          )}
                        </Space.Compact>
                        <Space.Compact direction="vertical">
                          <Radio value="Бүртгэл хийгдээгүй айл">
                            Бүртгэл хийгдээгүй айл
                          </Radio>
                          <Radio value="Бүртгэл хийгдээгүй үйлчилгээ эрхлэгч">
                            Бүртгэл хийгдээгүй үйлчилгээ эрхлэгч
                          </Radio>
                          <Radio value="Хүргэлтийн машин">
                            Хүргэлтийн машин
                          </Radio>
                          <Radio value="Компанийн ажилчдын машин">
                            Компанийн ажилчдын машин
                          </Radio>
                          <Radio value="Такси">Такси</Radio>
                          <Radio value="Бүртгэл хийгдэх тоот">
                            Бүртгэл хийгдэх тоот
                          </Radio>
                          <Radio value="Тусгай зочид">Тусгай зочид</Radio>
                          <Radio value="Банк хамгаалалт">Банк хамгаалалт</Radio>
                          <Radio value="Цэцэрлэг">Цэцэрлэг</Radio>
                          <Radio value="Авто угаалга">Авто угаалга</Radio>
                          <Radio value="Агуулах">Агуулах</Radio>
                        </Space.Compact>
                      </Space>
                    ) : (
                      <Space direction="vertical">
                        <Radio value="Маргалдсан">{t("Маргалдсан")}</Radio>
                        <Radio value="Журам зөрчсөн">
                          {t("Журам зөрчсөн")}
                        </Radio>
                        <Radio value="Зугтаасан">{t("Зугтаасан")}</Radio>
                      </Space>
                    )}
                  </Radio.Group>
                  <div className="flex w-full items-center">
                    <label>{t("Бусад")}</label>
                    <Input
                      value={value}
                      onChange={onChange}
                      className="ml-[10px] w-full"
                    />
                  </div>
                </>
              ) : modalOpen.type === "orlogo" ? (
                <Form
                  form={form}
                  className="flex w-full gap-4"
                  onFinish={orlogoGaraasOruulya}
                >
                  <Form.Item
                    label={t("Дугаар1")}
                    name="mashiniiDugaar"
                    className="w-1/2"
                    normalize={(input) => {
                      const too = input.replace(/[^0-9]/g, "").slice(0, 4);
                      const useg = Array.from(input)
                        .filter((a) => /[А-Яа-яөӨүҮ]/.test(a))
                        .slice(0, 3)
                        .join("");
                      return `${too}${useg}`.toUpperCase();
                    }}
                    rules={[
                      {
                        required: true,
                        message: t("Машины дугаар бүртгэнэ үү!"),
                      },
                      {
                        required:
                          form.getFieldValue("mashiniiDugaar")?.length > 0 &&
                          true,
                        min: 6,
                        max: 7,
                        pattern: new RegExp(
                          "[0-9]{4}[А-Я|а-я|ө|Ө|ү|Ү]{3}|[0-9]{4}[А-Я|а-я|ө|Ө|ү|Ү]{2}"
                        ),
                        message: t(
                          "Машины дугаар 4 тоо 2 эсвэл 3 үсэг байх ёстой"
                        ),
                      },
                    ]}
                  >
                    <Input
                      onDoubleClick={() =>
                        navigator.clipboard
                          .readText()
                          .then(
                            (v) =>
                              !!v && form.setFieldValue("mashiniiDugaar", v)
                          )
                      }
                      maxLength={7}
                      ref={mashiniiDugaarRef}
                      placeholder="1234УБА"
                      className="ml-[10px]"
                    />
                  </Form.Item>
                  <Form.Item
                    name="tulukhDun"
                    label={t("Дүн")}
                    className="w-1/2"
                    rules={[
                      {
                        required: true,
                        message: t("Үнийн дүн оруулна уу."),
                      },
                    ]}
                  >
                    <InputNumber
                      className="w-fit"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      placeholder={t("Төлөх дүн...")}
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      min={0}
                      step={500}
                    />
                  </Form.Item>
                  <a
                    onClick={() => form.resetFields()}
                    className="ml-2 flex h-8 items-center rounded border border-red-400 px-2 hover:bg-red-200 dark:text-white"
                  >
                    {t("Цэвэрлэх")}
                  </a>
                </Form>
              ) : (
                <>
                  <Form
                    form={form}
                    className="flex w-full flex-col gap-4"
                    onFinish={dugaarBurtgekh}
                  >
                    <div className="flex w-full gap-2">
                      <Form.Item
                        label={t("Дугаар1")}
                        name="mashiniiDugaar"
                        className="w-[180px] flex-shrink-0"
                        normalize={(input) => {
                          const too = input.replace(/[^0-9]/g, "").slice(0, 4);
                          const useg = Array.from(input)
                            .filter((a) => /[А-Яа-яөӨүҮ]/.test(a))
                            .slice(0, 3)
                            .join("");
                          return `${too}${useg}`.toUpperCase();
                        }}
                        rules={[
                          {
                            required: true,
                            message: t("Машины дугаар бүртгэнэ үү!"),
                          },
                          {
                            required:
                              form.getFieldValue("mashiniiDugaar")?.length >
                                0 &&
                              !garahCameraSongogdson &&
                              true,
                            min: 6,
                            max: 7,
                            pattern: new RegExp(
                              "[0-9]{4}[А-Я|а-я|ө|Ө|ү|Ү]{3}|[0-9]{4}[А-Я|а-я|ө|Ө|ү|Ү]{2}"
                            ),
                            message: t(
                              "Машины дугаар 4 тоо 2 эсвэл 3 үсэг байх ёстой"
                            ),
                          },
                        ]}
                      >
                        <Input
                          onDoubleClick={() =>
                            navigator.clipboard
                              .readText()
                              .then(
                                (v) =>
                                  !!v && form.setFieldValue("mashiniiDugaar", v)
                              )
                          }
                          maxLength={7}
                          ref={mashiniiDugaarRef}
                          placeholder="1234УБА"
                        />
                      </Form.Item>
                      <Form.Item
                        name="CAMERA_IP"
                        className="flex-1"
                        rules={[
                          {
                            required: true,
                            message: t("Камер сонгоно уу."),
                          },
                        ]}
                      >
                        <Select className="" placeholder={`${t("Камер")} IP`}>
                          {camerVal[0] && (
                            <Select.Option key={camerVal[0]}>
                              Орох
                            </Select.Option>
                          )}
                          {camerVal[1] && (
                            <Select.Option key={camerVal[1]}>
                              Гарах
                            </Select.Option>
                          )}
                        </Select>
                      </Form.Item>
                      <a
                        onClick={() => form.resetFields()}
                        className="flex h-8 items-center rounded border border-red-400 px-2 hover:bg-red-200 dark:text-white"
                      >
                        {t("Цэвэрлэх")}
                      </a>
                    </div>
                    {orohCameraSongogdson && (
                      <div className="flex w-full flex-col gap-3 md:flex-row">
                        <Form.Item
                          label={t("Огноо")}
                          name="burtgelOgnoo"
                          className="w-full md:w-1/2"
                        >
                          <DatePicker
                            className="w-full"
                            format="YYYY-MM-DD"
                            placeholder={t("Огноо сонгоно уу")}
                          />
                        </Form.Item>
                        <Form.Item
                          label={t("Цаг")}
                          name="burtgelTsag"
                          className="w-full md:w-1/2"
                        >
                          <Input type="time" step={300} className="w-full" />
                        </Form.Item>
                      </div>
                    )}
                    <div className="flex flex-wrap">
                      <div className="flex w-full flex-wrap">
                        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                          (n) => (
                            <a
                              key={n}
                              onClick={() => keyPadHandler(n)}
                              className="m-1 rounded border px-3 py-2 hover:bg-green-200 dark:text-white"
                            >
                              {n}
                            </a>
                          )
                        )}
                      </div>
                      {usguud.map((useg) => (
                        <a
                          key={useg}
                          onClick={() => keyPadHandler(useg)}
                          className="m-1 rounded border px-3 py-2 hover:bg-green-200 dark:text-white"
                        >
                          {useg}
                        </a>
                      ))}
                    </div>
                  </Form>
                </>
              )}
            </Space>
          </Modal>
          <div style={{ position: "absolute", bottom: 25 }}>
            <ZogsooliinToo
              zogsoolTusBuriinToo={zogsoolTusBuriinToo}
              jagsaalt={jagsaalt}
            />
          </div>
        </div>
      ) : (
        <div className="col-span-12 flex justify-center">
          {"Сүлжээний доголдол, сервертэй холбогдоход ачаалал үүссэн байна."}
          {/* {t("зогсоолын эрх байхгүй байна.", {
            ajiltniiNer: ajiltan?.ner,
          })} */}
        </div>
      )}
    </Admin>
  );
}

const ZogsooliinToo = ({ zogsoolTusBuriinToo, jagsaalt }) => {
  // const [too, setToo] = useState([]);
  const too = [];
  for (let i = 0; jagsaalt.length > i; i++) {
    const zog = jagsaalt[i];
    for (let k = 0; zogsoolTusBuriinToo?.length > k; k++) {
      const to = zogsoolTusBuriinToo[k];
      if (zog._id === to._id.zogsool) {
        too.push({ ner: zog.ner, idevkhtei: to.too, sul: zog.too - to.too });
        // setToo([...too, {ner: zog.ner, idevkhtei: to.too, sul: (zog.too-to.too)}])
      }
      continue;
    }
  }
  return (
    too.length > 0 &&
    too.map((mur) => (
      <div className="ml-10 flex">
        <text
          style={{
            width: 120,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          className="font-bold text-blue-600"
        >
          {mur.ner}
        </text>
        <div style={{ width: 100 }} className="flex text-blue-600">
          {"Идэвхтэй"}: {mur.idevkhtei}
        </div>
        <div className="ml-10 flex text-yellow-600">Сул зогсоол: {mur.sul}</div>
      </div>
    ))
  );
};

export const getServerSideProps = shalgaltKhiikh;

export default camera;

