"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Popconfirm,
  Popover,
  Select,
  Table,
  Tabs,
  Switch,
} from "antd";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { MonthPickerInput } from "@/components/ui/MonthPickerInput";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import formatNumber from "../../../../tools/function/formatNumber";

interface GereeData {
  _id: string;
  ner: string;
  gereeniiDugaar: string;
  talbainDugaar: string;
  davkhar: string;
  talbainKhemjee: number;
  talbainKhemjeeMetrKube?: number;
  sariinTurees: number;
  zardluud?: Array<{
    _id: string;
    ner: string;
    turul: string;
    tariff: number;
    dun: number;
  }>;
}

interface KhungulultData {
  _id: string;
  createdAt: string;
  khungulukhKhuvi: number;
  khamaataiGereenuud: Array<{
    gereeniiDugaar: string;
    ner: string;
  }>;
  ognoonuud: string[];
  khungulultKhonog?: number;
  khungulukhTurul: string;
  tulukhDun: number;
  khungulultiinDun: number;
  khungulsunDun: number;
  turul: string;
  shaltgaan: string;
  guilgeeKhiisenAjiltniiNer: string;
}

const TulburTootsoo: React.FC = () => {
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<[Date | null, Date | null]>([
    new Date(),
    new Date(),
  ]);
  const formRef = useRef<any>(null);
  const [songogdsonGereenuud, setSongogdsonGereenuud] = useState<GereeData[]>(
    []
  );
  const [ognoonuud, setOgnoonuud] = useState<[Date | null, Date | null] | null>(
    null
  );
  const [khonogTootsokhEsekh, setKhonogTootsokhEsekh] =
    useState<boolean>(false);
  const [turul, setTurul] = useState<string>("turees");
  const [songogdsonNuur, setSongogdsonNuur] = useState<string>("1");
  const [form] = Form.useForm();

  const [tootsoolol, setTootsoolol] = useState({
    niitTalbai: 0,
    niitSariinTurees: 0,
    khunglugdsunDun: 0,
    niitTulukhDun: 0,
    khungulukhKhuvi: 0,
  });
  const [selectedRowKeys, setRowKeys] = useState<React.Key[]>([]);
  const [khungulukh, setKhungulukh] = useState<string>("khuvi");

  const { Option } = Select;

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // Mock data for demonstration
  const gereeniiMedeelel = {
    jagsaalt: [] as GereeData[],
  };

  const khungulultTuukh = {
    jagsaalt: [] as KhungulultData[],
    khuudasniiDugaar: 1,
    niitMur: 0,
  };

  const zardal = {
    jagsaalt: [] as Array<{
      _id: string;
      ner: string;
      turul: string;
      tariff: number;
      dun: number;
    }>,
  };

  const baiguullaga = {
    tokhirgoo: {
      khonogKhungulultOruulakhEsekh: false,
      deedKhungulultiinKhuvi: 100,
    },
    barilguud: [
      {
        _id: "1",
        davkharuud: [{ davkhar: "1" }, { davkhar: "2" }],
      },
    ],
  };
  const LocalStyles = () => (
    <style jsx global>{`
      /* Scope all overrides so they don't affect other pages */
      .no-theme-scope {
        /* Force light/neutral tokens within this scope */
        --panel-text: #0f172a;
        --btn-text: #0f172a;
        --btn-bg: #ffffff;
        --btn-bg-hover: #f8fafc;
        --btn-bg-active: #f1f5f9;
        --btn-border: rgba(15, 23, 42, 0.12);
        --surface-bg: #ffffff;
        --surface-border: rgba(15, 23, 42, 0.12);
        --glass-tint: #ffffff;
        --glass-tint-2: #ffffff;
        --glass-border: rgba(15, 23, 42, 0.12);
        color: #0f172a !important;
        background: #ffffff !important;
      }
      .no-theme-scope *,
      .no-theme-scope
        :where(th, td, p, span, div, button, input, select, label) {
        color: #0f172a !important;
      }
      /* Table readability on white */
      .no-theme-scope .table-ui thead {
        background: #ffffff !important;
      }
      .no-theme-scope .table-ui th,
      .no-theme-scope .table-ui td {
        color: #0f172a !important;
        border-bottom-color: #e5e7eb !important; /* gray-200 */
      }
      .no-theme-scope .table-ui tbody tr:hover {
        background: #f8fafc !important;
      }
      /* Inputs: neutral borders */
      .no-theme-scope input,
      .no-theme-scope select,
      .no-theme-scope textarea {
        background: #ffffff !important;
        color: #0f172a !important;
        border-color: #e5e7eb !important;
      }
      /* Buttons: minimal/neu visible on white */
      .no-theme-scope .btn-minimal,
      .no-theme-scope .btn-minimal-ghost,
      .no-theme-scope .btn-neu {
        background: #ffffff !important;
        color: #0f172a !important;
        border-color: #e5e7eb !important;
        box-shadow: none !important;
      }
      .no-theme-scope .btn-minimal:hover,
      .no-theme-scope .btn-minimal-ghost:hover,
      .no-theme-scope .btn-neu:hover {
        background: #f8fafc !important;
      }
    `}</style>
  );
  function handleChange(value: string[]) {
    // Handle floor selection
  }

  function nukhtulSongokh(value: string) {
    if (value === "Бүгд") {
      form.setFieldValue("davkhar", []);
    } else {
      setRowKeys([]);
      setSongogdsonGereenuud([]);
    }
  }

  function khungulultKhadgalya() {
    // TODO: Hook up real API call; for now, show success overlay
    openSuccessOverlay("Хөнгөлөлт амжилттай хадгалагдлаа");
  }

  const gereeniiColumn: TableColumnsType<GereeData> = useMemo(() => {
    let column: TableColumnsType<GereeData> = [
      {
        title: "Түрээслэгч",
        dataIndex: "ner",
        className: "text-center",
        align: "center",
        width: "5rem",
        sorter: (a, b) => (a.ner || "").localeCompare(b.ner || ""),
      },
      {
        title: "Гэрээ",
        dataIndex: "gereeniiDugaar",
        className: "text-center",
        align: "center",
        width: "7rem",
        sorter: (a, b) =>
          (a.gereeniiDugaar || "").localeCompare(b.gereeniiDugaar || ""),
      },
      {
        title: "Талбай",
        dataIndex: "talbainDugaar",
        className: "text-center",
        align: "center",
        width: "7rem",
        sorter: (a, b) =>
          (a.talbainDugaar || "").localeCompare(b.talbainDugaar || ""),
      },
      {
        title: "Давхар",
        dataIndex: "davkhar",
        align: "center",
        width: "5rem",
        className: "text-center",
        sorter: (a, b) => Number(a.davkhar || 0) - Number(b.davkhar || 0),
      },
      {
        title: "Талбай /м2/",
        dataIndex: "talbainKhemjee",
        align: "center",
        width: "7rem",
        className: "text-center",
        render: (talbainKhemjee: number) => {
          return `${talbainKhemjee} м2`;
        },
        sorter: (a, b) =>
          Number(a.talbainKhemjee || 0) - Number(b.talbainKhemjee || 0),
      },
      {
        title: "Төлбөр",
        dataIndex: "sariinTurees",
        className: "text-center",
        width: "7rem",
        align: "center",
        render: (sariinTurees: number) => {
          return formatNumber(sariinTurees || 0);
        },
        sorter: (a, b) =>
          Number(a.sariinTurees || 0) - Number(b.sariinTurees || 0),
      },
    ];

    return column;
  }, [form.getFieldValue("zardliinId"), zardal?.jagsaalt]);

  function ustgaya(mur: KhungulultData) {}

  function tseverlekh() {
    formRef.current.resetFields();
    setRowKeys([]);
  }

  const columns: TableColumnsType<KhungulultData> = useMemo(() => {
    return [
      {
        title: "Огноо",
        dataIndex: "createdAt",
        ellipsis: true,
        align: "center",
        width: "8rem",
        render: (data: string) => {
          return dayjs(data).format("YYYY-MM-DD hh:mm:ss");
        },
      },
      {
        title: "Хөнгөлөлт %",
        dataIndex: "khungulukhKhuvi",
        ellipsis: true,
        width: "7rem",
        align: "center",
      },
      {
        title: "Гэрээнүүд",
        dataIndex: "khamaataiGereenuud",
        ellipsis: true,
        width: "6rem",
        align: "center",
        render: (data: any[]) => {
          return (
            <Popover
              content={
                <div>
                  {data?.map((mur, index) => {
                    return (
                      <div key={index}>
                        {mur?.gereeniiDugaar}
                        {index < data?.length - 1 && ","}
                      </div>
                    );
                  })}
                </div>
              }
            >
              {data?.length === 1 &&
                data?.map((mur) => {
                  return mur?.gereeniiDugaar;
                })}
              {data?.length > 1 && <EyeOutlined />}
            </Popover>
          );
        },
      },
      {
        title: "Түрээслэгчид",
        dataIndex: "khamaataiGereenuud",
        ellipsis: true,
        width: "7rem",
        align: "center",
        render: (data: any[]) => {
          return (
            <Popover
              content={
                <div>
                  {data?.map((mur, index) => {
                    return (
                      <div key={index}>
                        {mur?.ner}
                        {index < data?.length - 1 && ","}
                      </div>
                    );
                  })}
                </div>
              }
            >
              {data?.length === 1 &&
                data?.map((mur) => {
                  return mur?.ner;
                })}
              {data?.length > 1 && <EyeOutlined />}
            </Popover>
          );
        },
      },
      {
        title: "Эхлэх хугацаа",
        width: "7rem",
        dataIndex: "ognoonuud",
        ellipsis: true,
        align: "center",
        render: (data: string[]) => {
          return dayjs(data && data[0]).format("YYYY-MM-DD");
        },
      },
      {
        title: "Дуусах хугацаа",
        width: "7rem",
        dataIndex: "ognoonuud",
        ellipsis: true,
        align: "center",
        render: (data: string[]) => {
          return dayjs(data && data[data?.length - 1]).format("YYYY-MM-DD");
        },
      },
      {
        title: "Хоног",
        width: "4rem",
        dataIndex: "khungulultKhonog",
        ellipsis: true,
        align: "center",
        render: (data: number) => {
          return data;
        },
      },
      {
        title: "Төрөл",
        dataIndex: "khungulukhTurul",
        ellipsis: true,
        width: "5rem",
        align: "center",
        render: (data: string) => {
          switch (data) {
            case "turees":
              return (
                <div className="flex items-center justify-center rounded-2xl bg-green-400 px-2 py-1 dark:bg-green-700 dark:text-slate-200">
                  Түрээс
                </div>
              );
            case "zardal":
              return (
                <div className="flex items-center justify-center rounded-2xl bg-yellow-400 px-2 py-1 dark:bg-yellow-700 dark:text-slate-200">
                  Зардал
                </div>
              );
            default:
              return data;
          }
        },
      },
      {
        title: "Төлөх дүн",
        width: "7rem",
        dataIndex: "tulukhDun",
        align: "right",
        render: (data: number) => {
          return formatNumber(data || 0) + " ₮";
        },
      },
      {
        title: "Хөнгөлөх дүн",
        width: "7rem",
        dataIndex: "khungulultiinDun",
        align: "right",
        render: (data: number) => {
          return formatNumber(data || 0) + " ₮";
        },
      },
      {
        title: "Төлсөн дүн",
        width: "7rem",
        dataIndex: "khungulsunDun",
        align: "right",
        render: (data: number) => {
          return formatNumber(data || 0) + " ₮";
        },
      },
      {
        title: "Төрөл",
        width: "5rem",
        dataIndex: "turul",
        ellipsis: true,
        align: "center",
      },
      {
        title: "Шалтгаан",
        width: "20rem",
        dataIndex: "shaltgaan",
        ellipsis: true,
        align: "center",
      },
      {
        title: "Ажилтан",
        width: "6rem",
        dataIndex: "guilgeeKhiisenAjiltniiNer",
        align: "center",
      },
      {
        title: <SettingOutlined />,
        width: "40px",
        align: "center",
        render(data: KhungulultData) {
          return (
            <Popconfirm
              title="Хөнгөлөлт устгах уу?"
              okText="Тийм"
              cancelText="Үгүй"
              onConfirm={() => ustgaya(data)}
            >
              <Button
                danger
                size="small"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                shape="circle"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          );
        },
      },
    ];
  }, []);

  const focuser = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Handle focus logic
      }
    },
    []
  );

  function onSelectChange(
    selectedRowKeys: React.Key[],
    selectedRows: GereeData[]
  ) {
    setRowKeys(selectedRowKeys);
    setSongogdsonGereenuud(selectedRows);
  }

  function khungulukhDunTootsoolyo() {
    let dun = form?.getFieldValue("khungulukhKhuvi");

    // Calculate based on selected contracts
    const niitSariinTurees = songogdsonGereenuud.reduce(
      (sum, item) => sum + (item.sariinTurees || 0),
      0
    );

    let khunglugdsunDun = 0;
    if (khungulukh === "khuvi") {
      khunglugdsunDun = (niitSariinTurees * (dun || 0)) / 100;
    } else {
      khunglugdsunDun = dun || 0;
    }

    const niitTulukhDun = niitSariinTurees - khunglugdsunDun;

    setTootsoolol({
      niitTalbai: songogdsonGereenuud.length,
      niitSariinTurees,
      khunglugdsunDun,
      niitTulukhDun,
      khungulukhKhuvi: khungulukh === "khuvi" ? dun || 0 : 0,
    });
  }

  return (
    <div className="h-screen overflow-hidden no-theme-scope -mt-3">
      <LocalStyles />
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl  mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        Хөнгөлөлт
      </motion.h1>
      <div className="col-span-12">
        <Tabs size="large" onChange={(v) => setSongogdsonNuur(v)}>
          <Tabs.TabPane tab="Хөнгөлөлт оруулах" key="1">
            <div className="grid w-full grid-cols-12 gap-6">
              <div className="col-span-12 rounded-2xl p-5 bg-white border border-gray-200 md:col-span-8 xl:col-span-3 text-theme h-[560px] custom-scrollbar">
                <Form
                  onFinish={khungulultKhadgalya}
                  form={form}
                  autoComplete="off"
                  ref={formRef}
                  name="control-ref"
                  initialValues={{ remember: true }}
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 30 }}
                  layout="horizontal"
                >
                  <Form.Item
                    name="khungulukhTurul"
                    label={<span className="text-theme">Төрөл</span>}
                    labelAlign="left"
                  >
                    <Select
                      popupClassName="tusgaiZagvar"
                      className="ml-1 mr-3 flex-1 text-theme"
                      defaultValue="turees"
                      onChange={(e) => {
                        setTurul(e);
                        setRowKeys([]);
                        setTootsoolol({
                          niitTalbai: 0,
                          niitSariinTurees: 0,
                          khunglugdsunDun: 0,
                          niitTulukhDun: 0,
                          khungulukhKhuvi: 0,
                        });
                      }}
                    >
                      <Select.Option value="turees">Түрээс</Select.Option>
                      <Select.Option value="zardal">Зардал</Select.Option>
                    </Select>
                  </Form.Item>

                  {baiguullaga?.tokhirgoo?.khonogKhungulultOruulakhEsekh && (
                    <Form.Item
                      name="khonogTootsokhEsekh"
                      label="Хоногийн хөнгөлөлт эсэх"
                      labelAlign="left"
                    >
                      <Switch
                        checked={khonogTootsokhEsekh}
                        onChange={(v) => {
                          form.setFieldValue("khungulultKhuvi", 0);
                          form.setFieldValue("khungulultKhonog", 0);
                          setKhonogTootsokhEsekh(v);
                          khungulukhDunTootsoolyo();
                        }}
                      />
                    </Form.Item>
                  )}

                  {khonogTootsokhEsekh ? (
                    <Form.Item
                      labelAlign="left"
                      name="ognoonuud"
                      label="Хөнгөлөх өдөр"
                      rules={[
                        {
                          required: true,
                          message: "Хөнгөлөх өдөр бүртгэнэ үү!",
                        },
                      ]}
                    >
                      <DatePickerInput
                        type="range"
                        className="w-full sm:w-auto !bg-transparent rounded-xl hover:shadow-md transition-all duration-300 z-9999"
                        value={ekhlekhOgnoo}
                        onChange={(v) => {
                          const dates = (v || [null, null]) as [
                            Date | null,
                            Date | null
                          ];
                          setEkhlekhOgnoo(dates);
                          if (dates[0] && dates[1]) {
                            setOgnoonuud([dates[0], dates[1]]);
                            form.setFieldValue(
                              "khungulultKhonog",
                              dayjs(dates[1]).diff(dayjs(dates[0]), "d") + 1
                            );
                            khungulukhDunTootsoolyo();
                          }
                        }}
                        locale="mn"
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      labelAlign="left"
                      name="ognoonuud"
                      label={<span className="text-theme">Хөнгөлөх сар</span>}
                      rules={[
                        {
                          required: true,
                          message: "Хөнгөлөх сар бүртгэнэ үү!",
                        },
                      ]}
                    >
                      <MonthPickerInput
                        type="range"
                        style={{ width: "100%" }}
                        className="text-theme"
                        placeholder={"Сар"}
                        onChange={(v) => {
                          const dates = (v || [null, null]) as [
                            Date | null,
                            Date | null
                          ];
                          setOgnoonuud(dates);
                        }}
                        locale="mn"
                      />
                    </Form.Item>
                  )}

                  {khonogTootsokhEsekh && (
                    <>
                      <Form.Item
                        label="Хөнгөлөх хоног"
                        name="khungulultKhonog"
                        labelAlign="left"
                      >
                        <Input
                          type="number"
                          placeholder="Хөнгөлөх хоног"
                          onChange={khungulukhDunTootsoolyo}
                        />
                      </Form.Item>
                      <Form.Item
                        label="Хөнгөлөх хувь"
                        name="khungulultKhuvi"
                        labelAlign="left"
                      >
                        <Input
                          min={0}
                          type="number"
                          placeholder="Хөнгөлөх хувь"
                          onChange={khungulukhDunTootsoolyo}
                        />
                      </Form.Item>
                    </>
                  )}

                  <Form.Item
                    name="turul"
                    label={<span className="text-theme">Нөхцөл</span>}
                    labelAlign="left"
                  >
                    <Select
                      popupClassName="tusgaiZagvar"
                      className="text-theme"
                      placeholder="Нөхцөл"
                      onChange={nukhtulSongokh}
                    >
                      <Option value="Давхраар">Давхраар</Option>
                      <Option value="Бүгд">Бүгд</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="davkhar"
                    label={<span className="text-theme">Давхар</span>}
                    labelAlign="left"
                  >
                    <Select
                      popupClassName="tusgaiZagvar"
                      className="text-theme"
                      mode="multiple"
                      placeholder="Давхар"
                      onChange={handleChange}
                      disabled={form?.getFieldValue("turul") === "Бүгд"}
                    >
                      {baiguullaga?.barilguud?.[0]?.davkharuud.map((a) => (
                        <Select.Option key={a.davkhar} value={a.davkhar}>
                          {a.davkhar}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {!khonogTootsokhEsekh && (
                    <>
                      <Form.Item
                        label={
                          <span className="text-theme">Хөнгөлөх төрөл</span>
                        }
                        labelAlign="left"
                      >
                        <Select
                          popupClassName="tusgaiZagvar"
                          placeholder="Хөнгөлөх төрөл"
                          className="w-32 text-theme"
                          value={khungulukh}
                          onChange={(v) => {
                            setKhungulukh(v);
                            form.setFieldsValue({ khungulukhKhuvi: null });
                            if (v === "khuvi") {
                              setTootsoolol((prev) => ({
                                ...prev,
                                khungulukhKhuvi: 0,
                              }));
                            }
                          }}
                        >
                          <Select.Option key="khuvi">Хувь</Select.Option>
                          <Select.Option key="mungunDun">
                            Мөнгөн дүн
                          </Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={
                          <span className="text-theme">
                            {khungulukh === "khuvi"
                              ? "Хөнгөлөх хувь"
                              : "Хөнгөлөх дүн"}
                          </span>
                        }
                        name="khungulukhKhuvi"
                        labelAlign="left"
                      >
                        <Input
                          className="text-theme"
                          onKeyDown={focuser}
                          type="number"
                          placeholder={
                            khungulukh === "khuvi"
                              ? "Хөнгөлөх хувь"
                              : "Хөнгөлөх дүн"
                          }
                          onChange={khungulukhDunTootsoolyo}
                        />
                      </Form.Item>
                    </>
                  )}

                  <Form.Item
                    label={<span className="text-theme">Шалтгаан</span>}
                    name="shaltgaan"
                    labelAlign="left"
                  >
                    <Input.TextArea
                      className="text-theme"
                      onKeyDown={focuser}
                      placeholder="Шалтгаан"
                    />
                  </Form.Item>

                  <div className="flex-column mt-12 grid text-theme dark:text-slate-50">
                    <div className="flex justify-between">
                      Нийт талбайн тоо :<a>{tootsoolol.niitTalbai}</a>
                    </div>
                    <div className="flex justify-between">
                      {turul === "turees"
                        ? "Нийт түрээсийн орлого"
                        : "Нийт зардлын дүн"}{" "}
                      :<a>{formatNumber(tootsoolol.niitSariinTurees || 0)}</a>
                    </div>
                    <div className="flex justify-between">
                      Нийт хөнгөлөгдсөн дүн :
                      <a className="text-red-400">
                        {formatNumber(tootsoolol.khunglugdsunDun || 0)}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      Нийт төлөх дүн :
                      <a className="text-green-500">
                        {formatNumber(tootsoolol.niitTulukhDun || 0)}
                      </a>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-row justify-between">
                    <Form.Item>
                      <Button
                        htmlType="button"
                        onClick={tseverlekh}
                        className="border-red-400 dark:border-red-400 dark:bg-gray-900"
                      >
                        <span className="text-red-400 dark:text-red-400">
                          Цэвэрлэх
                        </span>
                      </Button>
                    </Form.Item>
                    <Form.Item>
                      <Button
                        id="khungulultKhadgalya"
                        onClick={() => form.submit()}
                        type="primary"
                      >
                        <span className="text-white">Хадгалах</span>
                      </Button>
                    </Form.Item>
                  </div>
                </Form>
              </div>

              <div className="col-span-12 md:col-span-8 xl:col-span-9">
                <div className="table-surface overflow-hidden rounded-2xl mt-0 w-full">
                  <div className="rounded-3xl p-6 mb-4 neu-table allow-overflow">
                    <div className="max-h-[280px] overflow-y-auto custom-scrollbar w-full">
                      <table className="table-ui text-sm min-w-full">
                        <thead>
                          <tr className="text-theme">
                            <th className="p-3 text-xs  text-center">
                              #
                            </th>
                            {gereeniiColumn.map((col) => (
                              <th
                                key={col.title as string}
                                className="p-3 text-xs  text-center"
                              >
                                {typeof col.title === "function"
                                  ? col.title({})
                                  : col.title}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {gereeniiMedeelel.jagsaalt.map((row, index) => (
                            <tr
                              key={row._id}
                              className={`transition-colors border-b last:border-b-0 ${
                                selectedRowKeys.includes(row._id)
                                  ? "bg-white/20"
                                  : ""
                              }`}
                              onClick={() => {
                                const selected = [...selectedRowKeys];
                                const idx = selected.indexOf(row._id);
                                if (idx > -1) selected.splice(idx, 1);
                                else selected.push(row._id);
                                setRowKeys(selected);
                                setSongogdsonGereenuud(
                                  selected.map(
                                    (key) =>
                                      gereeniiMedeelel.jagsaalt.find(
                                        (r) => r._id === key
                                      )!
                                  )
                                );
                              }}
                            >
                              <td className="p-3 text-center">{index + 1}</td>
                              <td className="p-3 text-center">{row.ner}</td>
                              <td className="p-3 text-center">
                                {row.gereeniiDugaar}
                              </td>
                              <td className="p-3 text-center">
                                {row.talbainDugaar}
                              </td>
                              <td className="p-3 text-center">{row.davkhar}</td>
                              <td className="p-3 text-center">
                                {row.talbainKhemjee} м2
                              </td>
                              <td className="p-3 text-center">
                                {formatNumber(row.sariinTurees || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Хөнгөлөлт түүх" key="2">
            <div className="grid w-full grid-cols-12 gap-6">
              <div className="box col-span-12 p-5 md:col-span-8 xl:col-span-12">
                <div className="mt-5 flex w-full flex-row justify-between">
                  <DatePickerInput
                    type="range"
                    style={{ marginBottom: "20px" }}
                    value={ekhlekhOgnoo}
                    className="text-theme"
                    onChange={(dates) => {
                      setEkhlekhOgnoo(
                        (dates || [null, null]) as [Date | null, Date | null]
                      );
                    }}
                    locale="mn"
                  />
                </div>

                <div className="col-span-12 md:col-span-8 xl:col-span-9">
                  <div className="table-surface overflow-hidden rounded-2xl mt-0 w-full">
                    <div className="rounded-3xl p-6 mb-4 neu-table allow-overflow">
                      <div className="max-h-[280px] overflow-y-auto custom-scrollbar w-full">
                        <table className="table-ui text-sm min-w-full">
                          <thead>
                            <tr className="text-theme">
                              <th className="p-3 text-xs  text-center">
                                #
                              </th>
                              {gereeniiColumn.map((col) => (
                                <th
                                  key={col.title as string}
                                  className="p-3 text-xs  text-center"
                                >
                                  {typeof col.title === "function"
                                    ? col.title({})
                                    : col.title}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {gereeniiMedeelel.jagsaalt.map((row, index) => (
                              <tr
                                key={row._id}
                                className={`transition-colors border-b last:border-b-0 ${
                                  selectedRowKeys.includes(row._id)
                                    ? "bg-white/20"
                                    : ""
                                }`}
                                onClick={() => {
                                  const selected = [...selectedRowKeys];
                                  const idx = selected.indexOf(row._id);
                                  if (idx > -1) selected.splice(idx, 1);
                                  else selected.push(row._id);
                                  setRowKeys(selected);
                                  setSongogdsonGereenuud(
                                    selected.map(
                                      (key) =>
                                        gereeniiMedeelel.jagsaalt.find(
                                          (r) => r._id === key
                                        )!
                                    )
                                  );
                                }}
                              >
                                <td className="p-3 text-center">{index + 1}</td>
                                <td className="p-3 text-center">{row.ner}</td>
                                <td className="p-3 text-center">
                                  {row.gereeniiDugaar}
                                </td>
                                <td className="p-3 text-center">
                                  {row.talbainDugaar}
                                </td>
                                <td className="p-3 text-center">
                                  {row.davkhar}
                                </td>
                                <td className="p-3 text-center">
                                  {row.talbainKhemjee} м2
                                </td>
                                <td className="p-3 text-center">
                                  {formatNumber(row.sariinTurees || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default TulburTootsoo;
