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
  Download,
  BookOpen,
} from "lucide-react";

export default function TuslamjTokhirgoo() {
  return (
    <div className="min-h-screen ">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3">
          
          <h1 className="text-4xl font-bold text-slate-800">Гарын авлага</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Системийг ашиглах заавар, сургалтын материал болон түгээмэл
            асуултуудын хариулт
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid gap-6 sm:grid-cols-2 mt-12">
          <a
            href="/manuals/suh-manual.pdf"
            target="_blank"
            className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-10 h-10" />
                <Download className="w-5 h-5 opacity-70 group-hover:opacity-100 transition" />
              </div>
              <h3 className="text-xl font-semibold mb-2">PDF гарын авлага</h3>
              <p className="text-blue-100 text-sm">
                Бүрэн гарын авлагыг PDF форматаар татаж авах
              </p>
            </div>
          </a>

          <a
            href="/manuals/suh-manual.pptx"
            target="_blank"
            className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-8 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <FileSpreadsheet className="w-10 h-10" />
                <Download className="w-5 h-5 opacity-70 group-hover:opacity-100 transition" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                PowerPoint танилцуулга
              </h3>
              <p className="text-green-100 text-sm">
                Танилцуулгын материалыг PPT форматаар татаж авах
              </p>
            </div>
          </a>
        </div>

        {/* Video Training Section */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mt-12">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Сургалтын бичлэгүүд
              </h2>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-4">
              {[
                {
                  title: "Нэвтрэх болон тохиргоо",
                  link: "https://youtube.com/watch?v=xxxxx",
                  duration: "5:30",
                  description: "Системд анх удаа нэвтрэх болон үндсэн тохиргоо",
                },
                {
                  title: "Оршин суугч нэмэх",
                  link: "https://youtube.com/watch?v=yyyyy",
                  duration: "8:15",
                  description: "Шинэ оршин суугч бүртгэх дэлгэрэнгүй заавар",
                },
                {
                  title: "Тайлан харах",
                  link: "https://youtube.com/watch?v=zzzzz",
                  duration: "6:45",
                  description: "Тайлан үүсгэх болон харах арга",
                },
              ].map((video, i) => (
                <a
                  key={i}
                  href={video.link}
                  target="_blank"
                  className="group flex items-center gap-4 p-5 border-2 border-slate-100 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-slate-800 font-semibold group-hover:text-blue-600 transition">
                        {video.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                        {video.duration}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {video.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Түгээмэл асуулт (FAQ)
              </h2>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-3">
              {[
                {
                  q: "Системд хэрхэн нэвтрэх вэ?",
                  a: "Бүртгэгдсэн хэрэглэгч нэр болон нууц үгээ ашиглан нэвтэрнэ.",
                },
                {
                  q: "Нууц үгээ мартсан бол?",
                  a: "Нууц үг сэргээх цэсээр шинэ нууц үг авах боломжтой.",
                },
                {
                  q: "Сургалтын бичлэгүүд хаана хадгалагдах вэ?",
                  a: "YouTube-н unlisted линкээр байршуулсан бичлэгүүдийг эндээс үзэх боломжтой.",
                },
              ].map((item, i) => (
                <details
                  key={i}
                  className="group border-2 border-slate-100 rounded-xl overflow-hidden hover:border-indigo-300 transition-all duration-300"
                >
                  <summary className="flex items-center gap-3 cursor-pointer font-semibold text-slate-800 p-5 bg-slate-50 hover:bg-indigo-50 transition-colors list-none">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="flex-1">{item.q}</span>
                    <svg
                      className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="p-5 bg-white border-t border-slate-100">
                    <p className="text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Footer Help Text */}
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">
            Нэмэлт тусламж хэрэгтэй бол манай дэмжлэгийн багтай холбогдоно уу
          </p>
        </div>
      </div>
    </div>
  );
}
