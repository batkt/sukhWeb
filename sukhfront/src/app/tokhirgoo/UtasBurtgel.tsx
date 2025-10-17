"use client";

import React, {
  useEffect,
  useImperativeHandle,
  ForwardRefRenderFunction,
  useState,
} from "react";
import {
  Form,
  InputNumber,
  notification,
  Button,
  Select,
  Space,
  Switch,
  Modal,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export interface UtasBurtgelRef {
  khadgalya: () => void;
  khaaya: () => void;
}

interface UtasBurtgelProps {
  data?: any[];
  destroy: () => void;
  token?: string;
  baiguullaga: {
    tokhirgoo?: {
      msgAvakhTurul: string;
      msgAvakhDugaar?: string[];
      msgAvakhTsag?: string;
    };
  };
  baiguullagaMutate?: () => void;
}

const UtasBurtgel: ForwardRefRenderFunction<
  UtasBurtgelRef,
  UtasBurtgelProps
> = ({ destroy, baiguullaga, baiguullagaMutate }, ref) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [msgAvakhTurul, setMsgAvakhTurul] = useState(
    baiguullaga.tokhirgoo?.msgAvakhTurul || ""
  );

  // Initialize switches
  useEffect(() => {
    const turul = baiguullaga.tokhirgoo?.msgAvakhTurul;
    if (turul) {
      form.setFieldValue("system", turul === "bugd" || turul === "system");
      form.setFieldValue("dans", turul === "bugd" || turul === "dans");
    }
  }, [baiguullaga.tokhirgoo?.msgAvakhTurul, form]);

  // Initialize phone numbers safely
  useEffect(() => {
    const numbers = baiguullaga.tokhirgoo?.msgAvakhDugaar || [];
    if (numbers.length > 0) {
      const initialValues = numbers.map((value) => ({ utas: value }));
      form.setFieldsValue({ utasnuud: initialValues });
    }
  }, [baiguullaga.tokhirgoo?.msgAvakhDugaar, form]);

  const handleSwitchChange = () => {
    const systemChecked = form.getFieldValue("system");
    const dansChecked = form.getFieldValue("dans");
    if (systemChecked && dansChecked) setMsgAvakhTurul("bugd");
    else if (systemChecked) setMsgAvakhTurul("system");
    else if (dansChecked) setMsgAvakhTurul("dans");
    else setMsgAvakhTurul("");
  };

  const onFinish = () => {
    const formValues = form.getFieldsValue();
    const utasnuudArray: string[] =
      formValues.utasnuud?.map((item: { utas: string | number }) =>
        item.utas.toString()
      ) || [];

    const medegdelTokhirgoo = {
      msgAvakhTurul,
      msgAvakhDugaar: utasnuudArray,
      msgAvakhTsag: formValues.msgAvakhTsag,
    };

   
    notification.success({ message: t("Амжилттай хадгаллаа (mock)") });
    baiguullagaMutate?.();
    destroy();
  };

  const garya = () => {
    Modal.confirm({
      content: t("Та хадгалахгүй гарахдаа итгэлтэй байна уу? (mock)"),
      okText: t("Тийм"),
      cancelText: t("Үгүй"),
      onOk: destroy,
    });
  };

  useImperativeHandle(ref, () => ({
    khadgalya: onFinish,
    khaaya: garya,
  }));

  return (
    <Form
      form={form}
      onFinish={onFinish}
      autoComplete="off"
      style={{ width: "100%" }}
    >
      <Form.List name="utasnuud">
        {(fields, { add, remove }) => (
          <div className="flex flex-col gap-2">
            {fields.map(({ key, name, ...restField }) => (
              <Space
                key={key}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
                align="baseline"
              >
                <Form.Item
                  {...restField}
                  name={[name, "utas"]}
                  rules={[
                    {
                      required: true,
                      message: "Утасны дугаар оруулаагүй байна.",
                    },
                  ]}
                  style={{ minWidth: "293px" }}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="Утасны дугаар"
                  />
                </Form.Item>
                <MinusCircleOutlined
                  onClick={() => remove(name)}
                  className="cursor-pointer text-red-600"
                />
              </Space>
            ))}
            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
              {t("Дугаар нэмэх")}
            </Button>
          </div>
        )}
      </Form.List>

      <Form.Item label={t("Хүлээн авах цаг")} name="msgAvakhTsag">
        <Select placeholder="Хүлээн авах цаг">
          {["07:00", "09:30", "20:00", "22:00"].map((time) => (
            <Select.Option key={time}>{time}</Select.Option>
          ))}
        </Select>
      </Form.Item>

      <div className="flex gap-4">
        <Form.Item label={t("Системд бүртгэгдсэн дүн")} name="system">
          <Switch
            checked={msgAvakhTurul === "bugd" || msgAvakhTurul === "system"}
            onChange={handleSwitchChange}
          />
        </Form.Item>
        <Form.Item label={t("Дансанд орсон дүн")} name="dans">
          <Switch
            checked={msgAvakhTurul === "bugd" || msgAvakhTurul === "dans"}
            onChange={handleSwitchChange}
          />
        </Form.Item>
      </div>
    </Form>
  );
};

export default React.forwardRef(UtasBurtgel);
