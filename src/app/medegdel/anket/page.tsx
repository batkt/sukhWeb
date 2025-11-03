"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Button,
  Form,
  FormInstance,
  Input,
  message,
  Popconfirm,
  Radio,
  Select,
} from "antd";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import {
  CloseCircleOutlined,
  DeleteOutlined,
  DoubleRightOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import Aos from "aos";
import _ from "lodash";

const staticAnketData = [
  {
    _id: "1",
    ner: "Ажилчдын сэтгэл санааны судалгаа",
    asuultuud: [
      {
        asuult: "Таны ажлын байр таалагдаж байна уу?",
        turul: "songokh",
        khariultuud: ["Тийм", "Үгүй", "Хэсэгчлэн"],
      },
      {
        asuult: "Таны цалин хангалттай гэж бодож байна уу?",
        turul: "songokh",
        khariultuud: ["Тийм", "Үгүй", "Хэсэгчлэн"],
      },
      {
        asuult: "Таны санал бодол:",
        turul: "boglokh",
        khariultuud: [],
      },
    ],
    barilgiinId: "test-barilgiin-id",
    baiguullagiinId: "test-baiguullagiin-id",
  },
  {
    _id: "2",
    ner: "Үйлчлүүлэгчдийн сэтгэл ханамж",
    asuultuud: [
      {
        asuult: "Манай үйлчилгээ танд таалагдаж байна уу?",
        turul: "songokh",
        khariultuud: ["Маш сайн", "Сайн", "Дундаж", "Муу"],
      },
      {
        asuult: "Нэмэлт санал бодол:",
        turul: "boglokh",
        khariultuud: [],
      },
    ],
    barilgiinId: "test-barilgiin-id",
    baiguullagiinId: "test-baiguullagiin-id",
  },
];

const staticKhariultData = [
  {
    _id: "k1",
    asuultiinId: "1",
    asuultiinNer: "Ажилчдын сэтгэл санааны судалгаа",
    khariultuud: [
      { khariult: "Тийм" },
      { khariult: "Үгүй" },
      { khariult: "Хэсэгчлэн" },
    ],
    ognoo: dayjs().subtract(2, "days").format("YYYY-MM-DD HH:mm:ss"),
  },
  {
    _id: "k2",
    asuultiinId: "1",
    asuultiinNer: "Ажилчдын сэтгэл санааны судалгаа",
    khariultuud: [
      { khariult: "Тийм" },
      { khariult: "Үгүй" },
      { khariult: "Хэсэгчлэн" },
    ],
    ognoo: dayjs().subtract(1, "day").format("YYYY-MM-DD HH:mm:ss"),
  },
];

type AsuultOruulakhProps = {
  name: number;
  fieldKey: number;
  restField: Record<string, unknown>;
  fields: unknown[];
  remove: (name: number) => void;
};

function AsuultOruulakh({
  name,
  fieldKey,
  restField,
  fields,
  remove,
}: AsuultOruulakhProps) {
  const { t } = useTranslation();
  const [hide, setHide] = React.useState(true);
  return (
    <Form.Item
      className="block rounded-2xl border px-2 py-4 shadow-lg"
      key={fieldKey}
    >
      <div className="relative space-y-3">
        <Form.Item
          name={[name, "asuult"]}
          fieldKey={[fieldKey, "asuult"]}
          {...restField}
          rules={[
            {
              required: true,
              message: t("Асуулт оруулна уу!"),
            },
          ]}
        >
          <Input
            placeholder={t("Асуулт", { count: name + 1 })}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          name={[name, "turul"]}
          fieldKey={[fieldKey, "turul"]}
          {...restField}
        >
          <Select
            popupClassName="tusgaiZagvar"
            placeholder={t("Хариултын төрөл")}
            defaultValue={"boglokh"}
            options={[
              { label: t("Бөглөх"), value: "boglokh" },
              { label: t("Сонгох"), value: "songokh" },
            ]}
            onChange={(e) => (e === "songokh" ? setHide(false) : setHide(true))}
          />
        </Form.Item>
        {fields.length > 0 ? (
          <div className="absolute -right-3 -top-11 rounded-full bg-white dark:bg-gray-900 lg:-right-5 lg:-top-10">
            <CloseCircleOutlined
              className="dynamic-delete-button text-2xl text-slate-900 text-opacity-60 transition-colors hover:text-red-400 dark:text-white dark:text-opacity-50"
              onClick={() => {
                remove(name);
              }}
            />
          </div>
        ) : null}
      </div>
      {hide === false && (
        <div className="mt-5">
          <Form.List name={[name, "khariultuud"]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, key) => (
                  <Form.Item
                    key={key}
                    name={field.name}
                    fieldId={field.key}
                    {...(field as any).restField}
                    rules={[
                      { required: true, message: t("Хариулт оруулна уу!") },
                    ]}
                  >
                    <div className="relative pr-8">
                      <Input
                        placeholder={`Хариулт ${String.fromCharCode(
                          "A".charCodeAt(0) + field.name
                        )}`}
                        style={{ width: "100%" }}
                      />
                      <MinusCircleOutlined
                        className="dynamic-delete-button absolute right-2 top-0 text-xl text-slate-900 text-opacity-50 dark:text-white dark:text-opacity-50"
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  </Form.Item>
                ))}
                <Button
                  className="dark:bg-gray-800 dark:text-white"
                  style={{ width: "100%" }}
                  type={"default"}
                  onClick={() => add()}
                  icon={<PlusOutlined className="text-xs" />}
                >
                  {t("Хариулт оруулах")}
                </Button>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </div>
      )}
    </Form.Item>
  );
}

type AnketiinZagvarProps = {
  a: Record<string, unknown>;
  setData: (data: Record<string, unknown>) => void;
  anketUstgay: (data: Record<string, unknown>) => void;
  data: Record<string, unknown> | undefined;
  anketIlgeeye: (data: Record<string, unknown>) => void;
  ognoo: [Date | null, Date | null];
};

function AnketiinZagvar({
  a,
  setData,
  anketUstgay,
  data,
  anketIlgeeye,
  ognoo,
}: AnketiinZagvarProps) {
  const { t } = useTranslation();

  // Filter static data based on date range
  const khariult = useMemo(() => {
    const filtered = staticKhariultData.filter((k) => {
      if (!ognoo[0] || !ognoo[1]) return k.asuultiinId === a._id;
      return (
        k.asuultiinId === a._id &&
        dayjs(k.ognoo).isAfter(dayjs(ognoo[0])) &&
        dayjs(k.ognoo).isBefore(dayjs(ognoo[1]))
      );
    });
    return { jagsaalt: filtered };
  }, [a._id, ognoo]);

  const [kharakh, setKharakh] = useState(false);

  return (
    <div
      className="group"
      onClick={() => {
        setKharakh(!kharakh);
      }}
    >
      <div
        key={a._id as string}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl  bg-secondary bg-opacity-5 p-2 shadow-lg dark:text-slate-200 md:block lg:flex"
      >
        <div>{a.ner as string}</div>
        <div className="flex justify-end gap-2">
          <Button
            className="bg-white text-green-400 hover:text-green-600 dark:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              anketIlgeeye(a);
            }}
            icon={<SendOutlined className="dark:text-green-400" />}
          />
          <Button
            className="bg-white text-blue-400 hover:text-blue-600 dark:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              setData({ ...a, khariultuud: undefined });
            }}
            icon={<EyeOutlined className="dark:text-blue-400" />}
          />
          <Popconfirm
            placement="right"
            title={t("Та анкетын загвар устгах гэж байна!")}
            onConfirm={() => {
              anketUstgay(a);
            }}
            okText={t("Тийм")}
            cancelText={t("Үгүй")}
          >
            <Button
              className="bg-white text-red-400 hover:text-red-600 dark:bg-gray-900"
              onClick={(e) => {
                e.stopPropagation();
              }}
              icon={<DeleteOutlined className="dark:text-red-400" />}
            />
          </Popconfirm>
        </div>
      </div>
      <div className="flex w-full items-center justify-between px-5">
        <div
          className={`flex w-full flex-col items-center justify-end overflow-hidden rounded-b-xl border border-t-0 border-border bg-secondary bg-opacity-5 p-1 shadow-lg transition-all dark:text-slate-900`}
          style={{
            height:
              kharakh === false
                ? "1.5rem"
                : khariult.jagsaalt.length > 0
                ? `${
                    khariult.jagsaalt.length * 4 < 16
                      ? khariult.jagsaalt.length * 4 + 0.5
                      : 16
                  }rem`
                : "3.5rem",
          }}
        >
          {khariult.jagsaalt.length > 0 ? (
            <div
              className={`${
                kharakh === true
                  ? "opacity-200 visible transition-all delay-100"
                  : "invisible opacity-0"
              } h-full w-full space-y-3 overflow-y-auto px-5 py-2`}
            >
              {khariult.jagsaalt.map((b, i) => {
                return (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setData({
                        ...a,
                        khariultuud: b.khariultuud,
                        ner: b.asuultiinNer,
                        _id: b._id,
                      });
                    }}
                    className={`flex w-full cursor-pointer justify-between rounded-2xl border p-2 py-1 ${
                      data?._id === b._id ? "bg-blue-200" : "bg-white"
                    } border-border`}
                    key={i}
                  >
                    <p>{i + 1}.</p>
                    <p>{dayjs(b.ognoo).format("YYYY-MM-DD HH:mm:ss")}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center transition-opacity delay-200 dark:text-[#E5E7EB] ${
                kharakh === true ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              {t("Анкет ирээгүй байна")}
            </div>
          )}
          <div className="relative flex w-full justify-center transition-all group-hover:animate-pulse dark:text-[#E5E7EB]">
            <DoubleRightOutlined
              className="cursor-pointer transition-all"
              style={{ rotate: kharakh === true ? "-90deg" : "90deg" }}
            />
            <div
              className={`absolute -bottom-1 right-2 transition-all ${
                khariult.jagsaalt.length > 0
                  ? "font-medium text-pink-500"
                  : "text-slate-400"
              }`}
            >
              {khariult.jagsaalt.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { t } = useTranslation();
  const [ognoo, setOgnoo] = useState<[Date | null, Date | null]>([
    dayjs(new Date()).subtract(1, "month").toDate(),
    new Date(),
  ]);
  const [data, setData] = useState<Record<string, unknown> | undefined>(
    undefined
  );
  const [asuultData, setAsuultData] = useState(staticAnketData);

  const [form] = Form.useForm();
  const [formPreview] = Form.useForm();
  const formRef = useRef<FormInstance>(null);

  useEffect(() => {
    Aos.init({ once: true });
  });

  function anketBurtgey(v: Record<string, unknown>) {
    // Simulate API call with static data
    const newAnket = {
      _id: Date.now().toString(),
      ...v,
      barilgiinId: "test-barilgiin-id",
      baiguullagiinId: "test-baiguullagiin-id",
    };

    setAsuultData((prev) => [...prev, newAnket as (typeof staticAnketData)[0]]);
    openSuccessOverlay(t("Анкетын загвар амжилттай бүртгэгдлээ"));
    formRef.current?.resetFields();
    setData(undefined);
  }

  function anketUstgay(data: Record<string, unknown>) {
    // Simulate API call
    setAsuultData((prev) => prev.filter((item) => item._id !== data._id));
    openSuccessOverlay(t("Устгагдлаа"));
    setData(undefined);
  }

  function anketIlgeeye() {
    // Simulate modal opening
    message.info(t("Анкет илгээх функц хэрэгжүүлэх шаардлагатай"));
  }

  useEffect(() => {
    const field = form.getFieldInstance?.("ner");
    if (field) {
      field.focus();
    }
  }, [form]);

  const focuser = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      switch (e.currentTarget.id) {
        case "dynamic_form_item_ner":
          document.getElementById("asuultNemekhButton")?.focus();
          break;
        default:
          break;
      }
    }
  }, []);

  useEffect(() => {
    if (!data?.shineAnket) {
      formPreview.resetFields();
    }
    formPreview.setFieldValue("asuultuud", data?.asuultuud);
  }, [data, formPreview]);

  return (
    <div className="min-h-screen dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl font-bold mb-6 text-theme  bg-clip-text text-transparent drop-shadow-sm"
      >
        {"Анкетын асуулга бэлтгэх"}
      </motion.h1>
      <div className="col-span-12 p-3 md:p-5">
        <div className="absolute right-3 top-3 z-50 hidden lg:flex"></div>
        <div className="flex grid-cols-12 flex-col-reverse gap-5 md:grid">
          <div
            className="rounded-2xl relative col-span-12 p-4 bg-transparent/60 dark:bg-gray-800/50 py-5 shadow-md backdrop-blur-sm pt-3 md:col-span-4"
            style={{ height: "calc( 100vh - 8rem)" }}
            data-aos="fade-right"
            data-aos-duration="1000"
            data-aos-delay="300"
          >
            <span className="font-medium dark:text-slate-100">
              {t("Анкетын загварууд")}
            </span>
            <div className="mt-5 w-full px-5">
              <DatePickerInput
                type="range"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="flex w-full rounded-2xl md:w-auto"
                placeholder={"Огноо"}
                value={ognoo}
                onChange={(dates) => {
                  setOgnoo(
                    (dates || [null, null]) as [Date | null, Date | null]
                  );
                }}
                locale="mn"
              />
            </div>
            <div
              className="mt-5 flex flex-col gap-5 overflow-y-auto pb-10"
              style={{ height: "calc( 100vh - 14rem )" }}
            >
              {asuultData?.map((a) => {
                return (
                  <AnketiinZagvar
                    key={a._id}
                    ognoo={ognoo}
                    a={a}
                    anketIlgeeye={anketIlgeeye}
                    setData={setData}
                    data={data}
                    anketUstgay={anketUstgay}
                  />
                );
              })}
            </div>
          </div>

          <div
            className="rounded-2xl relative col-span-12 overflow-auto p-1 pt-3 md:col-span-3 xl:col-span-3 bg-transparent/60 dark:bg-gray-800/50 py-5 shadow-md backdrop-blur-sm"
            style={{ height: "calc( 100vh - 8rem)" }}
            data-aos="fade-left"
            data-aos-duration="1000"
            data-aos-delay="300"
          >
            <span className="font-medium dark:text-slate-100 lg:px-5">
              {t("Анкетын загвар үүсгэх")}
            </span>
            <Form
              ref={formRef}
              form={form}
              className="pl-5 pt-5"
              name="dynamic_form_item"
              autoComplete={"off"}
              onFinish={(v) => {
                anketBurtgey(v);
              }}
              onValuesChange={() => {
                setData({
                  ..._.cloneDeep(form.getFieldsValue()),
                  shineAnket: true,
                });
              }}
            >
              <div>
                <div className="grid-cols-1 gap-3 pr-5 lg:grid">
                  <Form.Item name="_id" hidden></Form.Item>
                  <Form.Item name="barilgiinId" hidden></Form.Item>
                  <Form.Item
                    className="w-full"
                    name="ner"
                    rules={[
                      {
                        required: true,
                        message: t("Нэр оруулна уу!"),
                      },
                    ]}
                  >
                    <Input
                      autoFocus={true}
                      onKeyUp={focuser}
                      placeholder={t("Анкетын нэр")}
                    />
                  </Form.Item>
                </div>
                <Form.List name="asuultuud">
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      <Form.Item className="pb-3 pr-5">
                        <Button
                          type="default"
                          id="asuultNemekhButton"
                          onClick={() => {
                            add();
                            const div =
                              document?.getElementById("form-container");
                            div?.lastElementChild?.scrollIntoView({
                              behavior: "smooth",
                            });
                          }}
                          className="dark:bg-gray-800 dark:text-white"
                          style={{ width: "100%" }}
                          icon={<PlusOutlined className="text-xs" />}
                        >
                          {t("Асуулт нэмэх")}
                        </Button>
                        <Form.ErrorList errors={errors} />
                      </Form.Item>
                      <div
                        className="-my-8 grid w-full grid-cols-1 gap-2 overflow-y-auto py-5 pr-5"
                        style={{ maxHeight: "calc( 100vh - 20rem)" }}
                        id={"form-container"}
                      >
                        {fields.map(({ key, name, fieldKey, ...restField }) => (
                          <AsuultOruulakh
                            key={key}
                            name={name}
                            fieldKey={fieldKey || 0}
                            restField={restField}
                            fields={fields}
                            remove={remove}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </Form.List>
              </div>
              <Form.Item className="flex justify-end pr-5 !mt-2">
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  className="w-full"
                >
                  {t("Хадгалах")}
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div
            className="relative col-span-5 block h-full overflow-y-auto rounded-2xl pt-3 dark:bg-gray-900 shadow-md backdrop-blur-sm"
            style={{ height: "calc( 100vh - 8rem)" }}
          >
            <header className="border-b border-gray-300 pb-5 font-medium dark:text-slate-100 lg:px-5">
              {t("Анкет харах хэсэг")}
            </header>
            <header className="border-b border-gray-300 px-6 py-1 text-xl font-medium uppercase text-slate-400 text-opacity-40 dark:text-white dark:text-opacity-40">
              {(data?.ner as string) || t("Анкетын загварын нэр")}
            </header>
            <Form
              disabled={true}
              form={formPreview}
              name="dynamic_form_nest_item"
              autoComplete={"off"}
              className="block h-5/6 overflow-y-auto pt-5"
              layout="vertical"
            >
              <Form.List name="asuultuud">
                {(fields) => (
                  <>
                    <div className="flex flex-col">
                      {fields.map(({ key, name, ...restField }) => (
                        <div
                          className="px-6 pb-3 dark:text-slate-300"
                          key={key}
                        >
                          <div className="flex gap-1 text-base">
                            <p className="font-medium">{name + 1}.</p>
                            {!!data?.asuultuud &&
                              (data.asuultuud as any)[name]?.asuult}
                          </div>
                          <div className="flex flex-wrap gap-2 py-2 dark:text-slate-200 sm:px-10">
                            <Form.Item
                              {...restField}
                              hidden
                              name={[name, "asuult"]}
                              noStyle
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, "khariult"]}
                              className="w-full"
                            >
                              {!!formPreview.getFieldValue("asuultuud") &&
                              (formPreview.getFieldValue("asuultuud") as any)[
                                name
                              ]?.turul === "songokh" ? (
                                <Radio.Group
                                  defaultValue={
                                    !!data?.khariultuud
                                      ? (data?.khariultuud as any)[name]
                                          ?.khariult
                                      : undefined
                                  }
                                  className="flex flex-col"
                                >
                                  {!!formPreview.getFieldValue("asuultuud") &&
                                    (
                                      formPreview.getFieldValue(
                                        "asuultuud"
                                      ) as any
                                    )[name].khariultuud?.map(
                                      (a: string, i: number) => (
                                        <Radio
                                          key={i}
                                          value={a}
                                          className="dark:text-slate-200"
                                        >
                                          {a}
                                        </Radio>
                                      )
                                    )}
                                </Radio.Group>
                              ) : (
                                <Input
                                  width={"100%"}
                                  placeholder={t("Энд хариултаа бичнэ үү")}
                                  defaultValue={
                                    !!data?.khariultuud
                                      ? (data?.khariultuud as any)[name]
                                          ?.khariult
                                      : undefined
                                  }
                                />
                              )}
                            </Form.Item>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Form.List>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
