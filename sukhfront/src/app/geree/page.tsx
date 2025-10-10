"use client";

import { useState } from "react";
import { FileText, Plus, Download, Search, Filter } from "lucide-react";

export default function Geree() {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "templates">(
    "list"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Бүгд");

  const contracts = [
    {
      id: 1,
      name: "aadjaoi",
      type: "Үндсэн гэрээ",
      date: "2025-09-01",
      davkhar: "2",
      toot: "31",
      gereenDugaar: "21009",
      utas: "99115522",
      email: "aaaa@aaaa.com",
      status: "Идэвхтэй",
    },
    {
      id: 2,
      name: "aadjaoi",
      type: "Түр гэрээ",
      date: "2025-09-01",
      davkhar: "2",
      toot: "31",
      gereenDugaar: "21009",
      utas: "99115522",
      email: "aaaa@aaaa.com",
      status: "Идэвхтэй",
    },
  ];

  const filteredContracts = contracts.filter(
    (c) =>
      (filterType === "Бүгд" || c.type === filterType) &&
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [newContract, setNewContract] = useState({
    ner: "",
    gereeTurul: "Үндсэн гэрээ",
    davkhar: "",
    toot: "",
    startDate: "",
    gereeDugaar: "",
    utas: "",
    email: "",
  });

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Гэрээ үүсгэх: " + JSON.stringify(newContract, null, 2));
  };

  const templates = [
    {
      id: 1,
      name: "Үндсэн гэрээний загвар",
      description: "Үндсэн гэрээний загвар файл",
    },
    {
      id: 2,
      name: "Түр гэрээний загвар",
      description: "Түр гэрээний загвар файл",
    },
  ];

  return (
    <div className="min-h-screen ">
      <h1 className="text-3xl font-bold mb-4 text-slate-900">Гэрээ</h1>
      <p className="text-lg text-gray-600 mb-8">
        Гэрээг удирдах, шинэ гэрээ байгуулах болон загварууд
      </p>

      <div className="flex gap-4 mb-8 border-b pt-4 border-white">
        {[
          { label: "Гэрээний жагсаалт", icon: FileText, tab: "list" },
          { label: "Гэрээ байгуулах", icon: Plus, tab: "create" },
          { label: "Гэрээний загвар", icon: Download, tab: "templates" },
        ].map(({ label, icon: Icon, tab }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-4 px-6 font-semibold transition-all ${
              activeTab === tab
                ? "text-slate-900 border-b-2 border-black"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="inline-block w-5 h-5 mr-2" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-transparent rounded-2xl shadow-lg p-8">
        {activeTab === "list" && (
          <div>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-900 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Гэрээ хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-slate-900 border border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-900 w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-8 py-3 border text-slate-900 border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-transparent"
                >
                  <option>Бүгд</option>
                  <option>Үндсэн гэрээ</option>
                  <option>Түр гэрээ</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto ">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Гэрээний нэр
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Төрөл
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Огноо
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Давхар
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Тоот
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Регистр
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Утас
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      И-мэйл
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-white hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-slate-900">
                        {contract.name}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            contract.type === "Үндсэн гэрээ"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {contract.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {contract.date}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {contract.davkhar}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {contract.toot}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {contract.gereenDugaar}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {contract.utas}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {contract.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Шинэ гэрээ байгуулах
            </h2>
            <form onSubmit={handleCreateContract} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Нэр
                  </label>
                  <input
                    type="text"
                    required
                    value={newContract.ner}
                    onChange={(e) =>
                      setNewContract({ ...newContract, ner: e.target.value })
                    }
                    className="w-full px-4 py-3 border text-slate-900 border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Овог нэр оруулах"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Гэрээний төрөл
                  </label>
                  <select
                    required
                    value={newContract.gereeTurul}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        gereeTurul: e.target.value,
                      })
                    }
                    className="w-full text-slate-900 px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option>Үндсэн гэрээ</option>
                    <option>Түр гэрээ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Давхар
                  </label>
                  <input
                    type="text"
                    required
                    value={newContract.davkhar}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        davkhar: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 text-slate-900 border border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Давхар оруулах"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Тоот
                  </label>
                  <input
                    type="text"
                    required
                    value={newContract.toot}
                    onChange={(e) =>
                      setNewContract({ ...newContract, toot: e.target.value })
                    }
                    className="w-full px-4 py-3 text-slate-900 border border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Тоот оруулах"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Эхлэх огноо
                  </label>
                  <input
                    type="date"
                    required
                    value={newContract.startDate}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 text-slate-900 border border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Гэрээний дугаар
                  </label>
                  <input
                    type="number"
                    required
                    value={newContract.gereeDugaar}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        gereeDugaar: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border text-slate-900 border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Гэрээний дугаар оруулах"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    И-мэйл
                  </label>
                  <input
                    type="email"
                    value={newContract.email}
                    onChange={(e) =>
                      setNewContract({ ...newContract, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border text-slate-900 border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="И-мэйл оруулах"
                  />
                </div>

                {newContract.gereeTurul === "Түр гэрээ" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Хугацаа (сар)
                    </label>
                    <input
                      type="number"
                      required
                      value={newContract.utas}
                      onChange={(e) =>
                        setNewContract({ ...newContract, utas: e.target.value })
                      }
                      className="w-full text-slate-900 px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Гэрээний хугацаа"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setNewContract({
                      ner: "",
                      gereeTurul: "Үндсэн гэрээ",
                      davkhar: "",
                      toot: "",
                      startDate: "",
                      gereeDugaar: "",
                      utas: "",
                      email: "",
                    })
                  }
                  className="px-6 py-3 border border-white rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  Цэвэрлэх
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-bar text-white rounded-lg font-semibold hover:bg-bar transition-colors focus:outline-none"
                >
                  Гэрээ үүсгэх
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "templates" && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Гэрээний загварууд
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-white rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <FileText className="w-12 h-12 text-bar mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {template.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  <button className="w-full px-4 py-2 bg-bar text-white rounded-lg font-semibold hover:bg-bar/10 transition-colors flex items-center justify-center gap-2 focus:outline-none">
                    <Download className="w-4 h-4" />
                    Татаж авах
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
