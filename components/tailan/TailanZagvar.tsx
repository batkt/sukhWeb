import React, { useImperativeHandle, forwardRef } from "react";
import { Form, Input, notification } from "antd";
import updateMethod from "../../tools/function/updateMethod";
import createMethod from "../../tools/function/createMethod";
import { t } from "i18next";

interface TailanZagvarProps {
  data?: { _id?: string; [key: string]: any };
  destroy: () => void;
  baiguullagiinId: string | number;
  barilgiinId: string | number;
  token: string;
  refresh: () => void;
  setTable: (data: any) => void;
  setSelectValue: (value: any) => void;
}

export interface TailanZagvarRef {
  khadgalya: () => void;
  khaaya: () => void;
}

const TailanZagvar = (
  {
    data,
    destroy,
    baiguullagiinId,
    barilgiinId,
    token,
    refresh,
    setTable,
    setSelectValue,
  }: TailanZagvarProps,
  ref: React.Ref<TailanZagvarRef>
) => {
  const [form] = Form.useForm();

  useImperativeHandle(
    ref,
    () => ({
      khadgalya() {
        const ugugdul = form.getFieldsValue();
        const method = data?._id ? updateMethod : createMethod;
        ugugdul["barilgiinId"] = barilgiinId;
        ugugdul["baiguullagiinId"] = baiguullagiinId;

        method("tailangiinZagvar", token, { ...data, ...ugugdul }).then(
          ({ data }) => {
            if (data === "Amjilttai") {
              notification.success({
                description: t("Амжилттай хадгаллаа"),
                message: "Мэдэгдэл",
              });
              refresh();
              setTable({});
              setSelectValue(null);
              destroy();
            }
          }
        );
      },
      khaaya() {
        destroy();
      },
    }),
    [
      form,
      data,
      barilgiinId,
      baiguullagiinId,
      token,
      refresh,
      setTable,
      setSelectValue,
      destroy,
    ]
  );

  return (
    <Form
      form={form}
      initialValues={data}
      labelCol={{ span: 10 }}
      wrapperCol={{ span: 14 }}
    >
      <Form.Item label="Нэр" name="ner">
        <Input autoComplete="off" />
      </Form.Item>
    </Form>
  );
};

export default forwardRef<TailanZagvarRef, TailanZagvarProps>(TailanZagvar);
