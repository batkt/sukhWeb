import { toast as sonnerToast } from "sonner";

/**
 * Алдааны мэдэгдлийг «Анхааруулга» болгоно (улаан «Алдаа гарлаа» биш —
 * улбар шар, ⚠). Ихэнх нь хэрэглэгчийн үйлдлээс (шалтгаан бичээгүй, талбар
 * дутуу г.м.) үүсдэг тул айлгах өнгөгүй харуулна.
 */
export const ANHAARUULGA_GARCHIG = "Анхааруулга";

/** «Алдаа гарлаа: X» → «X». Зөвхөн «Алдаа гарлаа» бол хэвээр. */
export function aldaaniiUgKhasakh(msg: string): string {
  const tseverlesen = String(msg ?? "")
    // Зөвхөн бүтэн үг («Алдаагүй» г.м.-д хүрэхгүй)
    .replace(/^\s*(алдаа гарлаа|алдаа)(?=[\s:!.\-–—]|$)\s*[:!.\-–—]?\s*/i, "")
    .trim();
  return tseverlesen || String(msg ?? "");
}

let sonnerZassan = false;

/**
 * sonner-ийн `toast.error`-ийг бүх газар `toast.warning` болгоно: гарчиг
 * «Анхааруулга», бичвэр нь тайлбар. Апп эхлэхэд нэг удаа дуудна.
 */
export function sonnerAldaagAnhaaruulgaBolgokh() {
  if (sonnerZassan) return;
  sonnerZassan = true;
  const warning = sonnerToast.warning;
  (sonnerToast as any).error = (message: any, data?: any) => {
    if (typeof message !== "string") return warning(message, data);
    const bichvver = aldaaniiUgKhasakh(message);
    // Тайлбар аль хэдийн байвал бичвэрийг гарчиг болгоно
    if (data?.description) return warning(bichvver, data);
    return warning(ANHAARUULGA_GARCHIG, { ...(data || {}), description: bichvver });
  };
}
