"use client";

import React, { useState } from "react";
import { Button, DatePicker, notification } from "antd";
import { SolutionOutlined } from "@ant-design/icons";
import moment from "moment";

function AppTokhirgoo({ baiguullaga }: { baiguullaga?: any }) {
  const [isLocked, setIsLocked] = useState(
    !!baiguullaga?.tokhirgoo?.khereglegchEkhlekhOgnoo
  );
  const [startDate, setStartDate] = useState<any>(
    baiguullaga?.tokhirgoo?.khereglegchEkhlekhOgnoo
      ? moment(baiguullaga.tokhirgoo.khereglegchEkhlekhOgnoo)
      : null
  );

  const saveConfig = () => {
    notification.success({ message: "Амжилттай хадгалагдлаа" });
    setIsLocked(true);
  };

  return (
    <div className="col-span-12 lg:col-span-6 xxl:col-span-4">
      <div className="bg-transparent dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
        <div className="flex items-center border-b border-amber-200 dark:border-amber-700 px-5 py-3">
          <h2 className=" text-lg font-semibold dark:text-slate-200">
            Аппликейшин тохиргоо
          </h2>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center">
            <div className="border-l-2 border-green-500 pl-4">
              <div className="font-medium">Ашиглаж эхлэх огноо</div>
            </div>
            <div className="ml-auto w-1/2 !bg-transparent">
              <DatePicker
                disabled={isLocked}
                style={{ width: "100%" }}
                value={startDate}
                onChange={setStartDate}
                prefix={<SolutionOutlined />}
              />
            </div>
          </div>

          {isLocked && (
            <div className="border-t border-amber-200 dark:border-amber-700 pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Хэрвээ энэхүү тохиргоог өөрчлөхийг хүсвэл манай байгууллагад
                хандана уу
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-amber-200 dark:border-amber-700 px-5 py-3">
          <Button type="primary" disabled={isLocked} onClick={saveConfig}>
            Хадгалах
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AppTokhirgoo;
