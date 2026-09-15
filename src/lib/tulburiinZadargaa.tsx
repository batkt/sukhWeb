import React from "react";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Landmark,
  Tag,
  Wallet,
} from "lucide-react";
import {
  TULBURIIN_BULEGIIN_NER,
  TULBURIIN_BULEGIIN_UNGU,
  tulburiinBulegAvya,
  type TulburiinBuleg,
} from "./tulburiinTurul";

const BULEGIIN_DUURS: Record<TulburiinBuleg, React.ReactNode> = {
  belen: <Banknote className="w-4 h-4" />,
  kart: <CreditCard className="w-4 h-4" />,
  dans: <ArrowRight className="w-4 h-4" />,
  qpay: <Landmark className="w-4 h-4" />,
  khungulult: <Tag className="w-4 h-4" />,
  busad: <Wallet className="w-4 h-4" />,
};

export type TulburiinZadargaaMur = {
  key: TulburiinBuleg;
  name: string;
  icon: React.ReactNode;
  color: string;
  /** Тэмдэгтэй: хөнгөлөлт/буцаалт сөрөг гарна. */
  amount: number;
  count: number;
  pct: string;
};

/**
 * "Төлбөрийн хэлбэр" задаргааг тооцно. Жагсаалт ба Камер касс цонх хоёулаа
 * үүнийг дуудна — өмнө нь энэ блок гурван хувилбартай, гурвуулаа өөр өөр
 * шошготой хуулбарлагдсан байсан.
 *
 * Хоёр алдааг зассан:
 *
 * 1) Түүхий `turul`-аар бүлэглэдэг байсан. Backend нь QPay-г `qpay`, `QPay`,
 *    `toki`, `GadaaQR`, `bankQR` ... гэж олон янзаар бичдэг тул нэг QPay
 *    гүйлгээ хэд хэдэн шошгогүй мөр болж задарч, "төлбөрийн дэлгэрэнгүй"
 *    шүүлттэйгээ ч, бодит байдалтай ч таарахгүй байв. Одоо
 *    `tulburiinBulegAvya`-аар нэг жишигт оруулна.
 *
 * 2) `Math.abs(p.dun)` хэрэглэдэг байсан тул ХӨНГӨЛӨЛТ (сөрөг дүн) орлого
 *    мэт нэмэгдэж, хөлийн "Нийт орлого" нь бодит цуглуулсан дүнгээс
 *    хөнгөлөлтийн хэмжээгээр ХОЁР ДАХИН зөрдөг байв. Одоо тэмдэгтэй нийлбэр
 *    авах тул хүснэгтийн "Төлсөн" (Σ tulbur.dun)-тэй яг таарна.
 */
export function tulburiinZadargaaBodyo(jagsaalt: unknown[]): {
  items: TulburiinZadargaaMur[];
  totalAmount: number;
} {
  const buleguud = new Map<TulburiinBuleg, { amount: number; count: number }>();

  (Array.isArray(jagsaalt) ? jagsaalt : []).forEach((mur) => {
    const tulburuud = (mur as { tuukh?: { tulbur?: unknown }[] })?.tuukh?.[0]
      ?.tulbur;
    if (!Array.isArray(tulburuud)) return;
    tulburuud.forEach((tulbur) => {
      const p = tulbur as { turul?: string; dun?: number };
      const buleg = tulburiinBulegAvya(p?.turul);
      const odoo = buleguud.get(buleg) || { amount: 0, count: 0 };
      odoo.amount += Number(p?.dun) || 0;
      odoo.count += 1;
      buleguud.set(buleg, odoo);
    });
  });

  let totalAmount = 0;
  // Хувийг зөвхөн ЭЕРЭГ (бодит орлого) бүлгүүд дээр бодно — эс тэгвээс сөрөг
  // хөнгөлөлт хувь хуваарилалтыг гажуудуулж, 100%-иас хэтэрнэ.
  let eeregNiit = 0;
  buleguud.forEach((v) => {
    totalAmount += v.amount;
    if (v.amount > 0) eeregNiit += v.amount;
  });

  const items = Array.from(buleguud.entries())
    .map(([key, val]) => ({
      key,
      name: TULBURIIN_BULEGIIN_NER[key],
      icon: BULEGIIN_DUURS[key],
      color: TULBURIIN_BULEGIIN_UNGU[key],
      amount: val.amount,
      count: val.count,
      pct:
        eeregNiit > 0 && val.amount > 0
          ? ((val.amount / eeregNiit) * 100).toFixed(2)
          : "0.00",
    }))
    .sort((a, b) => b.amount - a.amount);

  return { items, totalAmount };
}
