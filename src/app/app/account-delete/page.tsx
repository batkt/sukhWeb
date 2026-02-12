import React from "react";

export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-center text-2xl  text-gray-900">
          Хэрэглэгчийн бүртгэл устгах заавар
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          Amarhome аппликейшнд бүртгэл үүсгэсэн хэрэглэгчид өөрийн бүртгэлийг
          аппликейшн дотроос бүрэн устгах боломжтой.
        </p>

        <section className="mb-6">
          <h2 className="mb-3 text-base  text-gray-800">
            Бүртгэл устгах алхмууд
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
            <li>Amarhome аппликейшнийг нээнэ</li>
            <li>Хувийн мэдээлэл орно</li>
            <li>"Бүртгэл устгах" товчийг дарна</li>
            <li>Нууц үгээ оруулж баталгаажуулна</li>
          </ol>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base  text-gray-800">
            Устгагдах мэдээлэл
          </h2>
          <p className="text-sm text-gray-700">
            Бүртгэл устгаснаар хэрэглэгчийн бүртгэлийн мэдээлэл болон түүнтэй
            холбогдсон хувийн өгөгдөл бүрмөсөн устгагдана.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Хууль, санхүүгийн шаардлагын дагуу зарим мэдээллийг тодорхой
            хугацаанд хадгалах боломжтой.
          </p>
        </section>

        <section className="border-t pt-4">
          <p className="text-sm text-gray-600">
            Хэрэв та аппликейшнд нэвтрэх боломжгүй бол бидэнтэй дараах хаягаар
            холбогдоно уу:
          </p>
          <p className="mt-1 text-sm  text-gray-800">
            📧 info@zevtabs.mn
          </p>
        </section>
      </div>
    </main>
  );
}
