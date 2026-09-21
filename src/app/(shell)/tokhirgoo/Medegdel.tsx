"use client";

import React, { useState, useRef } from "react";
import { Input, Popconfirm, Tooltip, notification, Modal } from "antd";
import Button from "@/components/ui/Button";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import UtasBurtgel, { UtasBurtgelRef } from "./UtasBurtgel";

const FloatingInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: any) => void;
}) => (
  <div className="relative w-full my-3">
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder=" "
      className="peer w-full rounded-xl border border-white bg-transparent px-4 pt-5 pb-2 text-theme focus:border-theme focus:ring-1 focus:ring-theme focus:outline-none transition"
    />
    <label className="absolute left-4 top-2 text-[color:var(--muted-text)] text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-[color:var(--muted-text)] peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-[color:var(--panel-text)] peer-focus:text-sm">
      {label}
    </label>
  </div>
);

interface Tokhirgoo {
  msgIlgeekhDugaar: string;
  msgIlgeekhKey: string;
  msgAvakhDugaar: string[];
  msgAvakhTurul: string;
}

interface Baiguullaga {
  tokhirgoo?: Tokhirgoo;
}

interface DugaarTileProps {
  baiguullaga: Baiguullaga;
}

const DugaarTile: React.FC<DugaarTileProps> = ({ baiguullaga }) => {
  const data = baiguullaga.tokhirgoo?.msgAvakhDugaar || [];

  const ustgaya = (mur: string) => {
    const ustgasanData = data.filter((utga) => utga !== mur);
    const medegdelTokhirgoo = {
      msgAvakhTurul: baiguullaga.tokhirgoo?.msgAvakhTurul || "",
      msgAvakhDugaar: ustgasanData,
    };

    notification.success({ message: "Амжилттай устгалаа (mock)" });
  };

  if (data.length === 0) {
    return (
      <div className="p-5 text-center text-[color:var(--muted-text)]">
        Бүртгэлтэй дугаар байхгүй байна
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((mur, index) => (
        <div
          key={index}
          className="p-4 hover:bg-[color:var(--surface-hover)] rounded-xl transition flex items-center justify-between border border-warning/30"
        >
          <div className=" text-[color:var(--panel-text)]">{mur}</div>
          <Popconfirm
            title="Утас устгах уу?"
            okText="Тийм"
            cancelText="Үгүй"
            onConfirm={() => ustgaya(mur)}
          >
            <Tooltip title="Устгах">
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-danger text-white hover:bg-danger transition">
                <DeleteOutlined />
              </div>
            </Tooltip>
          </Popconfirm>
        </div>
      ))}
    </div>
  );
};

interface MedegdelProps {
  baiguullaga?: Baiguullaga;
  baiguullagaMutate?: () => void;
  setSongogdsonTsonkhniiIndex?: React.Dispatch<React.SetStateAction<number>>;
}

const Medegdel: React.FC<MedegdelProps> = ({
  baiguullaga,
  baiguullagaMutate,
  setSongogdsonTsonkhniiIndex,
}) => {
  const ref = useRef<UtasBurtgelRef>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [medegdelTokhirgoo, setMedegdelTokhirgoo] = useState<Tokhirgoo>({
    msgIlgeekhDugaar: baiguullaga?.tokhirgoo?.msgIlgeekhDugaar || "",
    msgIlgeekhKey: baiguullaga?.tokhirgoo?.msgIlgeekhKey || "",
    msgAvakhDugaar: baiguullaga?.tokhirgoo?.msgAvakhDugaar || [],
    msgAvakhTurul: baiguullaga?.tokhirgoo?.msgAvakhTurul || "",
  });

  const khungulultiinTokhirgooKhadgalya = () => {
    notification.success({ message: "Амжилттай засагдлаа (mock)" });
  };

  const utasBurtgey = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);
  const handleModalOk = () => ref.current?.khadgalya?.();
  const handleModalCancel = () => ref.current?.khaaya?.();

  if (!baiguullaga) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-transparent rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-warning/30">
          <h2 className="text-lg  text-[color:var(--panel-text)]">СМС тохиргоо</h2>
        </div>
        <div className="p-6 space-y-4">
          <FloatingInput
            label="СМС илгээх түлхүүр"
            value={medegdelTokhirgoo.msgIlgeekhKey}
            onChange={({ target }) =>
              setMedegdelTokhirgoo((prev) => ({
                ...prev,
                msgIlgeekhKey: target.value,
              }))
            }
          />
          <FloatingInput
            label="СМС илгээх дугаар"
            value={medegdelTokhirgoo.msgIlgeekhDugaar}
            onChange={({ target }) =>
              setMedegdelTokhirgoo((prev) => ({
                ...prev,
                msgIlgeekhDugaar: target.value,
              }))
            }
          />
          <div className="flex justify-end">
            <Button
              type="primary"
              onClick={khungulultiinTokhirgooKhadgalya}
              className="rounded-xl"
            >
              Хадгалах
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-transparent rounded-2xl shadow-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-warning/30">
          <h2 className="text-lg  text-[color:var(--panel-text)]">
            Мэдэгдэл илгээх дугаар
          </h2>
          <div
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-theme text-white hover:bg-theme transition"
            onClick={utasBurtgey}
          >
            <PlusOutlined />
          </div>
        </div>
        <div className="p-4">
          <DugaarTile baiguullaga={baiguullaga} />
        </div>
      </div>

      <Modal
        title="Утас бүртгэх"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Хадгалах"
        cancelText="Хаах"
        width={600}
        rootClassName="modal-themed"
      >
        <UtasBurtgel
          ref={ref}
          destroy={handleModalClose}
          baiguullaga={baiguullaga}
          baiguullagaMutate={baiguullagaMutate}
        />
      </Modal>
    </div>
  );
};

export default Medegdel;
