"use client";

import React, { useState } from "react";
import { notification } from "antd";
import Button from "@/components/ui/Button";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { SolutionOutlined } from "@ant-design/icons";
import moment from "moment";

function AppTokhirgoo({ baiguullaga }: { baiguullaga?: any }) {
  const [isLocked, setIsLocked] = useState(
    !!baiguullaga?.tokhirgoo?.khereglegchEkhlekhOgnoo
  );
  const [startDate, setStartDate] = useState<Date | null>(
    baiguullaga?.tokhirgoo?.khereglegchEkhlekhOgnoo
      ? moment(baiguullaga.tokhirgoo.khereglegchEkhlekhOgnoo).toDate()
      : null
  );

  const saveConfig = () => {
    notification.success({ message: "Амжилттай хадгалагдлаа" });
    setIsLocked(true);
  };

  return (
    <div className="col-span-12 lg:col-span-6 xxl:col-span-4">
      <div className="bg-transparent rounded-2xl shadow overflow-hidden">
        <div className="flex items-center border-b border-warning/30 px-5 py-3">
          <h2 className=" text-lg">
            Аппликейшин тохиргоо
          </h2>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center">
            <div className="border-l-2 border-theme pl-4">
              <div className="">Ашиглаж эхлэх огноо</div>
            </div>
            <div className="ml-auto w-1/2 !bg-transparent">
              <StandardDatePicker
                disabled={isLocked}
                style={{ width: "100%" }}
                value={startDate ?? undefined}
                onChange={(v) => setStartDate((v as Date | null) ?? null)}
              />
            </div>
          </div>

          {isLocked && (
            <div className="border-t border-warning/30 pt-2">
              <p className="text-xs text-[color:var(--muted-text)]">
                Хэрвээ энэхүү тохиргоог өөрчлөхийг хүсвэл манай байгууллагад
                хандана уу
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-warning/30 px-5 py-3">
          <Button variant="primary" disabled={isLocked} onClick={saveConfig}>
            Хадгалах
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AppTokhirgoo;
