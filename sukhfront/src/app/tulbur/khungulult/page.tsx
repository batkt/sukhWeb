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
  DatePicker,
  Form,
  Input,
  Popconfirm,
  Popover,
  Select,
  Table,
  Tabs,
  Switch,
} from "antd";
import type { TableColumnsType } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

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
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<[Dayjs, Dayjs]>([
    dayjs(),
    dayjs(),
  ]);
  const formRef = useRef<any>();
  const [songogdsonGereenuud, setSongogdsonGereenuud] = useState<GereeData[]>(
    []
  );
  const [ognoonuud, setOgnoonuud] = useState<[Dayjs, Dayjs] | null>(null);
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

  function khungulultKhadgalya() {}

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
          return sariinTurees?.toLocaleString() || 0;
        },
        sorter: (a, b) =>
          Number(a.sariinTurees || 0) - Number(b.sariinTurees || 0),
      },
    ];

    return column;
  }, [form.getFieldValue("zardliinId"), zardal?.jagsaalt]);

  function ustgaya(mur: KhungulultData) {
    // Delete discount
    console.log("Deleting discount...", mur);
  }

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
                <div className="flex items-center justify-center rounded-lg bg-green-400 px-2 py-1 dark:bg-green-700 dark:text-gray-200">
                  Түрээс
                </div>
              );
            case "zardal":
              return (
                <div className="flex items-center justify-center rounded-lg bg-yellow-400 px-2 py-1 dark:bg-yellow-700 dark:text-gray-200">
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
          return data?.toLocaleString() + "₮";
        },
      },
      {
        title: "Хөнгөлөх дүн",
        width: "7rem",
        dataIndex: "khungulultiinDun",
        align: "right",
        render: (data: number) => {
          return data?.toLocaleString() + "₮";
        },
      },
      {
        title: "Төлсөн дүн",
        width: "7rem",
        dataIndex: "khungulsunDun",
        align: "right",
        render: (data: number) => {
          return data?.toLocaleString() + "₮";
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
        width: "13rem",
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
    <div className="h-screen">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm"
      >
        Хөнгөлөлт
      </motion.h1>
      <div className="col-span-12">
        <Tabs size="large" onChange={(v) => setSongogdsonNuur(v)}>
          <Tabs.TabPane tab="Хөнгөлөлт оруулах" key="1">
            <div className="grid w-full grid-cols-12 gap-6">
              <div className="col-span-12 rounded-md p-5 dark:bg-gray-900 md:col-span-8 xl:col-span-3">
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
                    label="Төрөл"
                    labelAlign="left"
                  >
                    <Select
                      className="ml-1 mr-3 flex-1"
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
                      <DatePicker.RangePicker
                        style={{ width: "100%" }}
                        placeholder={["Эхлэх өдөр", "Дуусах өдөр"]}
                        onChange={(v) => {
                          if (v && v[0] && v[1]) {
                            setOgnoonuud([v[0], v[1]]);
                            form.setFieldValue(
                              "khungulultKhonog",
                              v[1].diff(v[0], "d") + 1
                            );
                            khungulukhDunTootsoolyo();
                          }
                        }}
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      labelAlign="left"
                      name="ognoonuud"
                      label="Хөнгөлөх сар"
                      rules={[
                        {
                          required: true,
                          message: "Хөнгөлөх сар бүртгэнэ үү!",
                        },
                      ]}
                    >
                      <DatePicker.RangePicker
                        allowClear={false}
                        style={{ width: "100%" }}
                        picker="month"
                        placeholder={["Эхлэх сар", "Дуусах сар"]}
                        onChange={(v) => {
                          if (v && v[0] && v[1]) {
                            setOgnoonuud([v[0], v[1]]);
                          }
                        }}
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

                  <Form.Item name="turul" label="Нөхцөл" labelAlign="left">
                    <Select placeholder="Нөхцөл" onChange={nukhtulSongokh}>
                      <Option value="Давхраар">Давхраар</Option>
                      <Option value="Бүгд">Бүгд</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="davkhar" label="Давхар" labelAlign="left">
                    <Select
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
                      <Form.Item label="Хөнгөлөх төрөл" labelAlign="left">
                        <Select
                          placeholder="Хөнгөлөх төрөл"
                          className="w-32"
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
                          khungulukh === "khuvi"
                            ? "Хөнгөлөх хувь"
                            : "Хөнгөлөх дүн"
                        }
                        name="khungulukhKhuvi"
                        labelAlign="left"
                      >
                        <Input
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
                    label="Шалтгаан"
                    name="shaltgaan"
                    labelAlign="left"
                  >
                    <Input.TextArea
                      onKeyDown={focuser}
                      placeholder="Шалтгаан"
                    />
                  </Form.Item>

                  <div className="flex-column mt-12 grid text-base dark:text-gray-50">
                    <div className="flex justify-between">
                      Нийт талбайн тоо :<a>{tootsoolol.niitTalbai}</a>
                    </div>
                    <div className="flex justify-between">
                      {turul === "turees"
                        ? "Нийт түрээсийн орлого"
                        : "Нийт зардлын дүн"}{" "}
                      :<a>{tootsoolol.niitSariinTurees?.toLocaleString()}</a>
                    </div>
                    <div className="flex justify-between">
                      Нийт хөнгөлөгдсөн дүн :
                      <a className="text-red-400">
                        {tootsoolol.khunglugdsunDun?.toLocaleString()}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      Нийт төлөх дүн :
                      <a className="text-green-500">
                        {tootsoolol.niitTulukhDun?.toLocaleString()}
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

              <div className="col-span-12 md:col-span-8 xl:col-span-9 rounded-2xl bg-transparent dark:bg-gray-800/30 backdrop-blur-md p-6 overflow-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-800 dark:text-gray-100">
                    <thead className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                      <tr>
                        <th className="border-b border-white/40 p-3 text-center">
                          #
                        </th>
                        {gereeniiColumn.map((col) => (
                          <th
                            key={col.title as string}
                            className="border-b border-white/40 p-3 text-center"
                          >
                            {typeof col.title === "function"
                              ? col.title({})
                              : col.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                      {gereeniiMedeelel.jagsaalt.map((row, index) => (
                        <tr
                          key={row._id}
                          className={`hover:bg-white/20 transition-colors ${
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
                            {row.sariinTurees?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Хөнгөлөлт түүх" key="2">
            <div className="grid w-full grid-cols-12 gap-6">
              <div className="box col-span-12 p-5 md:col-span-8 xl:col-span-12">
                <div className="mt-5 flex w-full flex-row justify-between">
                  <DatePicker.RangePicker
                    style={{ marginBottom: "20px" }}
                    size="middle"
                    value={ekhlekhOgnoo}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setEkhlekhOgnoo([dates[0], dates[1]]);
                      }
                    }}
                  />
                </div>

                <div className="col-span-12 md:col-span-8 xl:col-span-9 rounded-2xl bg-transparent dark:bg-gray-800/30 backdrop-blur-md p-6 overflow-auto">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-800 dark:text-gray-100">
                      <thead className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                        <tr>
                          <th className="border-b border-white/40 p-3 text-center">
                            #
                          </th>
                          {gereeniiColumn.map((col) => (
                            <th
                              key={col.title as string}
                              className="border-b border-white/40 p-3 text-center"
                            >
                              {typeof col.title === "function"
                                ? col.title({})
                                : col.title}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/20">
                        {gereeniiMedeelel.jagsaalt.map((row, index) => (
                          <tr
                            key={row._id}
                            className={`hover:bg-white/20 transition-colors ${
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
                              {row.sariinTurees?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
