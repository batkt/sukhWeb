"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  Plus,
  User,
  Home,
  Phone,
  IdCard,
  Briefcase,
  Mail,
  Lock,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import { Modal, Form, Input, Button } from "antd";

interface Ajiltan {
  id: number;
  davkhar: string;
  toot: string;
  gd: string;
  name: string;
  register: string;
  utas: string;
  email: string;
  tuluv: string;
  tuukh: string;
  mashinDugaar: string;
  albanTushaal?: string;
  ajildOrsonOgnoo?: string;
}

interface FormData {
  ovog: string;
  ner: string;
  register: string;
  khayag: string;
  utas: string;
  ajildOrsonOgnoo: string;
  albanTushaal: string;
  nevtrekhNer: string;
  nuutsUg: string;
  davkhar: string;
  toot: string;
  gd: string;
  email: string;
  mashinDugaar: string;
}

export default function Burtgel() {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ajiltanList");
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<FormData>({
    ovog: "",
    ner: "",
    register: "",
    khayag: "",
    utas: "",
    ajildOrsonOgnoo: "",
    albanTushaal: "",
    nevtrekhNer: "",
    nuutsUg: "",
    davkhar: "",
    toot: "",
    gd: "",
    email: "",
    mashinDugaar: "",
  });

  const [ajiltanRecords] = useState<Ajiltan[]>([
    {
      id: 1,
      davkhar: "5",
      toot: "101",
      gd: "ГД-01",
      name: "b a",
      register: "AB1234",
      utas: "99001122",
      email: "bat@dd.com",
      tuluv: "Идэвхтэй",
      tuukh: "Шинэ бүртгэл",
      mashinDugaar: "7878ЙЙБ",
      albanTushaal: "Харуул",
      ajildOrsonOgnoo: "2024-01-15",
    },
    {
      id: 2,
      davkhar: "6",
      toot: "201",
      gd: "ГД-02",
      name: "buynaa adiya",
      register: "CD5678",
      utas: "99112233",
      email: "buynaa@aaa.com",
      tuluv: "Идэвхгүй",
      tuukh: "Өмнөх гэрээ дууссан",
      mashinDugaar: "7845УУБ",
      albanTushaal: "Цэвэрлэгч",
      ajildOrsonOgnoo: "2023-06-10",
    },
  ]);

  const [suugchRecords] = useState<Ajiltan[]>([
    {
      id: 1,
      davkhar: "5",
      toot: "101",
      gd: "ГД-01",
      name: "aaa ddd",
      register: "УА12345678",
      utas: "88009988",
      email: "dq@mail.mn",
      tuluv: "Идэвхтэй",
      tuukh: "2020-оноос",
      mashinDugaar: "7777ААА",
    },
    {
      id: 2,
      davkhar: "3",
      toot: "302",
      gd: "ГД-03",
      name: "haalgaa haa",
      register: "УБ98765432",
      utas: "99887766",
      email: "haalgaahaa@gmail.com",
      tuluv: "Идэвхтэй",
      tuukh: "2021-оноос",
      mashinDugaar: "5555БББ",
    },
  ]);

  const activeRecords =
    activeTab === "ajiltanList" ? ajiltanRecords : suugchRecords;
  const activeCount = activeRecords.filter(
    (r) => r.tuluv === "Идэвхтэй"
  ).length;
  const inactiveCount = activeRecords.filter(
    (r) => r.tuluv === "Идэвхгүй"
  ).length;
  const showSummaryCard = activeRecords.length > 5 && !isExpanded;

  const filteredRecords = activeRecords.filter((record) =>
    Object.values(record).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Амжилттай хадгалагдлаа!");
  };

  const tabs = [
    { label: "Ажилтны жагсаалт", icon: FileText, tab: "ajiltanList" },
    { label: "Оршин суугчдын жагсаалт", icon: Users, tab: "suugchList" },
    { label: "Ажилтан нэмэх", icon: Plus, tab: "ajiltanNemekh" },
    { label: "Оршин суугч нэмэх", icon: Plus, tab: "suugchNemekh" },
  ];

  return (
    <div className="min-h-screen">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Бүртгэлийн систем
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Гэрээг удирдах, шинэ гэрээ байгуулах болон загварууд
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(({ label, icon: Icon, tab }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-bar text-white shadow-lg"
                  : "bg-transparent text-gray-700 hover:bg-gray-100 shadow"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {(activeTab === "ajiltanList" || activeTab === "suugchList") && (
          <>
            {showSummaryCard ? (
              <div
                onClick={() => setIsExpanded(true)}
                className="bg-gradient-to-br from-[#f5dcc8] to-[#c7bfee] text-white p-8 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm">
                      <Users className="w-12 h-12" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-bold mb-2">
                        {activeRecords.length}{" "}
                        {activeTab === "ajiltanList"
                          ? "Ажилтан"
                          : "Оршин суугч"}
                      </h2>
                      <p className="text-xl opacity-90">
                        Идэвхтэй: {activeCount} | Идэвхгүй: {inactiveCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">
                      Дэлгэрэнгүй харах
                    </span>
                    <ChevronDown className="w-7 h-7" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-transparent rounded-xl shadow-md p-6 mb-6">
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Хайх..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-white  rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-white rounded-lg hover:bg-gray-50">
                      <Filter className="w-5 h-5" />
                      Шүүлтүүр
                    </button>
                    {activeRecords.length > 5 && (
                      <button
                        onClick={() => setIsExpanded(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <ChevronUp className="w-5 h-5" />
                        Хураангуй
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto bg-trasparent rounded-xl ">
                  <table className="w-full border-collapse ">
                    <thead className="bg-transparent border-b border-white border-whitesticky top-0 z-10">
                      <tr>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          #
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Нэр
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Регистр
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Тоот
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Холбоо барих
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Төлөв
                        </th>
                        <th className="p-4 text-right text-sm font-semibold text-gray-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((person: any, index: number) => (
                        <tr
                          key={person.id}
                          className="border-b transition-shadow hover:shadow-md"
                        >
                          <td className="p-4 text-gray-600 font-medium">
                            {index + 1}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#f5dcc8] to-[#c7bfee] rounded-full flex items-center justify-center text-white font-bold">
                                {person.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {person.name}
                                </div>
                                {activeTab === "ajiltanList" &&
                                  person.albanTushaal && (
                                    <div className="text-sm text-gray-500">
                                      {person.albanTushaal}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-900">
                            {person.register}
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {person.davkhar} давхар / {person.toot}
                              </div>
                              <div className="text-gray-500">{person.gd}</div>
                              {person.mashinDugaar && (
                                <div className="text-gray-500 mt-1">
                                  {person.mashinDugaar}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="text-gray-900 mb-1">
                                {person.utas}
                              </div>
                              <div className="text-gray-600">
                                {person.email}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                person.tuluv === "Идэвхтэй"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {person.tuluv}
                            </span>
                            {person.tuukh && (
                              <div className="text-xs text-gray-500 mt-1">
                                {person.tuukh}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setSelectedRecord(person);
                                  setViewOpen(true);
                                }}
                                className="p-2 rounded-lg hover:bg-green-100 text-green-600 transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                         
                              <button
                                onClick={() => {
                                  setSelectedRecord(person);
                                  setEditOpen(true);
                                }}
                                className="p-2 rounded-lg hover:bg-yellow-100 text-yellow-600 transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => {
                                  setSelectedRecord(person);
                                  setDeleteOpen(true);
                                }}
                                className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Modal
                    title="Дэлгэрэнгүй"
                    open={viewOpen}
                    onCancel={() => setViewOpen(false)}
                    footer={null}
                  >
                    {selectedRecord && (
                      <div className="space-y-2">
                        <p>
                          <b>Нэр:</b> {selectedRecord.name}
                        </p>
                        <p>
                          <b>Регистр:</b> {selectedRecord.register}
                        </p>
                        <p>
                          <b>Тоот:</b> {selectedRecord.davkhar} давхар /{" "}
                          {selectedRecord.toot}
                        </p>
                        <p>
                          <b>Утас:</b> {selectedRecord.utas}
                        </p>
                        <p>
                          <b>Email:</b> {selectedRecord.email}
                        </p>
                        <p>
                          <b>Төлөв:</b> {selectedRecord.tuluv}
                        </p>
                      </div>
                    )}
                  </Modal>
                  <Modal
                    title="Мэдээлэл засах"
                    open={editOpen}
                    onCancel={() => setEditOpen(false)}
                    footer={null}
                  >
                    {selectedRecord && (
                      <Form layout="vertical">
                        <Form.Item label="Нэр">
                          <Input defaultValue={selectedRecord.name} />
                        </Form.Item>
                        <Form.Item label="Регистр">
                          <Input defaultValue={selectedRecord.register} />
                        </Form.Item>
                        <Form.Item label="Утас">
                          <Input defaultValue={selectedRecord.utas} />
                        </Form.Item>
                        <Button type="primary">Хадгалах</Button>
                      </Form>
                    )}
                  </Modal>
                  <Modal
                    title="Устгах уу?"
                    open={deleteOpen}
                    onCancel={() => setDeleteOpen(false)}
                    onOk={() => {
                      console.log("Deleted:", selectedRecord?.id);
                      setDeleteOpen(false);
                    }}
                    okText="Тийм"
                    cancelText="Үгүй"
                  >
                    <p>
                      Та <b>{selectedRecord?.name}</b> -ийн мэдээллийг устгахдаа
                      итгэлтэй байна уу?
                    </p>
                  </Modal>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "ajiltanNemekh" && (
          <div className="bg-transparent rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Шинэ ажилтан нэмэх
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Овог <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ovog"
                      required
                      placeholder="Овог"
                      value={formData.ovog}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Нэр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ner"
                      required
                      placeholder="Нэр"
                      value={formData.ner}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Регистр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="register"
                      placeholder="РД дугаар"
                      required
                      value={formData.register}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Утас <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="utas"
                      required
                      placeholder="Утас"
                      value={formData.utas}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    И-мэйл <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="И-мэйл"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Албан тушаал <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="albanTushaal"
                      required
                      placeholder="Албан тушаал"
                      value={formData.albanTushaal}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ажилд орсон огноо <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="ajildOrsonOgnoo"
                    required
                    value={formData.ajildOrsonOgnoo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Хаяг <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="khayag"
                      required
                      placeholder="Хаяг"
                      value={formData.khayag}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Нэвтрэх мэдээлэл
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Нэвтрэх нэр <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="nevtrekhNer"
                        required
                        placeholder="Нэвтрэх нэр"
                        value={formData.nevtrekhNer}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Нууц үг <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="nuutsUg"
                        required
                        placeholder="Нууц үг"
                        value={formData.nuutsUg}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-bar text-white font-semibold rounded-lg hover:bg-bar/60 transition shadow-md"
                >
                  Хадгалах
                </button>
                <button
                  type="button"
                  className="px-8 py-3 bg-transparent text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Цуцлах
                </button>
              </div>
            </form>
          </div>
        )}
        {activeTab === "suugchNemekh" && (
          <div className="bg-transparent rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Оршин суугч нэмэх
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Овог <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ovog"
                      required
                      placeholder="Овог"
                      value={formData.ovog}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Нэр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ner"
                      required
                      placeholder="Нэр"
                      value={formData.ner}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Регистр <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="register"
                      required
                      placeholder="РД дугаар"
                      value={formData.register}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Утас <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="utas"
                      required
                      placeholder="Утас"
                      value={formData.utas}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    И-мэйл <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="И-Мэйл"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Хаяг <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="khayag"
                      required
                      placeholder="Хаяг"
                      value={formData.khayag}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Нэвтрэх мэдээлэл
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Нэвтрэх нэр <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="nevtrekhNer"
                        required
                        value={formData.nevtrekhNer}
                        placeholder="Нэвтрэх нэр"
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Нууц үг <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="nuutsUg"
                        required
                        placeholder="Нууц үг"
                        value={formData.nuutsUg}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-bar text-white font-semibold rounded-lg hover:bg-bar/70 transition-color shadow-md"
                >
                  Хадгалах
                </button>
                <button
                  type="button"
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Цуцлах
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
