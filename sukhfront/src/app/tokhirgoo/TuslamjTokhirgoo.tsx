"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Info,
  FileText,
  FileSpreadsheet,
  PlayCircle,
  HelpCircle,
} from "lucide-react";

export default function TuslamjTokhirgoo() {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-semibold border-b border-b-gray-300 text-gray-800 pb-6">
          Гарын авлага
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="/manuals/suh-manual.pdf"
          target="_blank"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow"
        >
          <FileText className="w-5 h-5" /> PDF татах
        </a>
        <a
          href="/manuals/suh-manual.pptx"
          target="_blank"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition shadow"
        >
          <FileSpreadsheet className="w-5 h-5" /> PPT татах
        </a>
      </div>

      <section className="bg-transparent p-8 rounded-2xl shadow-md border">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Сургалтын бичлэгүүд
        </h2>
        <div className="space-y-4">
          {[
            {
              title: "Нэвтрэх болон тохиргоо",
              link: "https://youtube.com/watch?v=xxxxx",
            },
            {
              title: "Оршин суугч нэмэх",
              link: "https://youtube.com/watch?v=yyyyy",
            },
            {
              title: "Тайлан харах",
              link: "https://youtube.com/watch?v=zzzzz",
            },
          ].map((video, i) => (
            <a
              key={i}
              href={video.link}
              target="_blank"
              className="flex items-center gap-3 p-4 border rounded-xl hover:bg-gray-50 transition"
            >
              <PlayCircle className="w-6 h-6 text-red-500" />
              <span className="text-gray-700 font-medium">{video.title}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-transparent p-8 rounded-2xl shadow-md border">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Түгээмэл асуулт (FAQ)
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Системд хэрхэн нэвтрэх вэ?",
              a: "Бүртгэгдсэн хэрэглэгч нэр болон нууц үгээ ашиглан нэвтэрнэ.",
            },
            {
              q: "Нууц үгээ мартсан бол?",
              a: "“Нууц үг сэргээх” цэсээр шинэ нууц үг авах боломжтой.",
            },
            {
              q: "Сургалтын бичлэгүүд хаана хадгалагдах вэ?",
              a: "YouTube-н unlisted линкээр байршуулсан бичлэгүүдийг эндээс үзэх боломжтой.",
            },
          ].map((item, i) => (
            <details
              key={i}
              className="group border rounded-xl p-4 hover:shadow transition"
            >
              <summary className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                <HelpCircle className="w-5 h-5 text-gray-500" />
                {item.q}
              </summary>
              <p className="mt-2 text-gray-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
