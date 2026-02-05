"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import GolContent from "../../../../../components/golContent";
import { Shield, Building2, Settings, ArrowLeft, Save } from "lucide-react";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { Check } from "lucide-react";
import { useGereeContext } from "@/app/geree/GereeContext";
import updateMethod from "../../../../../tools/function/updateMethod";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";

export default function EmployeeSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { ajiltan, baiguullaga, token } = useAuth();
  const employeeId = params.id as string;
  const { data } = useGereeContext();

  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedSettings, setSelectedSettings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Settings permissions (previously in Тохиргоо section)
  const SETTINGS_PERMISSIONS = [
    { id: "tokhirgoo.barilga", label: "Барилгийн тохиргоо" },
    { id: "tokhirgoo.ashiglaltiinZardal", label: "Ашиглалтын зардал" },
    { id: "tokhirgoo.baaz", label: "Бааз" },
    { id: "tokhirgoo.dans", label: "Данс" },
    { id: "tokhirgoo.ebarimt", label: "Э-баримт" },
    { id: "tokhirgoo.email", label: "И-мэйл" },
    { id: "tokhirgoo.medegdel", label: "Мэдэгдэл" },
    { id: "tokhirgoo.nemelt", label: "Нэмэлт" },
    { id: "tokhirgoo.tuslamj", label: "Тусламж" },
    { id: "tokhirgoo.utas", label: "Утас" },
    { id: "tokhirgoo.zogsool", label: "Зогсоол" },
    { id: "tokhirgoo.zogsoolBurtgekh", label: "Зогсоол бүртгэх" },
    { id: "tokhirgoo.app", label: "Апп" },
    { id: "tokhirgoo.nevtreltiinTuukh", label: "Нэвтрэлтийн түүх" },
    { id: "tokhirgoo.zassanTuukh", label: "Зассан түүх" },
    { id: "tokhirgoo.ustsanTuukh", label: "Устсан түүх" },
  ];

  // Check if user is admin
  useEffect(() => {
    if (ajiltan && ajiltan.erkh !== "Admin" && ajiltan.erkh !== "admin") {
      router.push("/geree");
    }
  }, [ajiltan, router]);

  // Find employee from context
  const employee = useMemo(() => {
    return data.employeesList?.find((emp: any) => emp._id === employeeId);
  }, [data.employeesList, employeeId]);

  // Get buildings list from baiguullaga (useAuth)
  const buildings = useMemo(() => {
    const list = baiguullaga?.barilguud;
    if (list && Array.isArray(list) && list.length > 0) return list;
    return [];
  }, [baiguullaga]);

  // Initialize permissions when employee is loaded
  useEffect(() => {
    if (employee) {
      // Map permissions
      const mappedPerms = (employee.tsonkhniiErkhuud || []).map((p: string) =>
        p.startsWith("/") ? p.substring(1).replace(/\//g, ".") : p
      );
      
      // Separate settings permissions from window permissions
      const settingsPerms = mappedPerms.filter((p: string) => p.startsWith("tokhirgoo."));
      const windowPerms = mappedPerms.filter((p: string) => !p.startsWith("tokhirgoo."));
      
      setSelectedPermissions(windowPerms);
      setSelectedSettings(settingsPerms);
      setSelectedBuildings(employee.barilguud || []);
    }
  }, [employee]);

  const toggleBuilding = (buildingId: string) => {
    setSelectedBuildings((prev) =>
      prev.includes(buildingId)
        ? prev.filter((id) => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const selectAllBuildings = () => {
    setSelectedBuildings(buildings.map((b: any) => b._id));
  };

  const deselectAllBuildings = () => {
    setSelectedBuildings([]);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleSetting = (settingId: string) => {
    setSelectedSettings((prev) =>
      prev.includes(settingId)
        ? prev.filter((id) => id !== settingId)
        : [...prev, settingId]
    );
  };

  const handleSave = async () => {
    if (!employee || !token) return;
    
    try {
      setSaving(true);
      
      // Combine all permissions
      const allPermissions = [...selectedPermissions, ...selectedSettings];
      const payloadPermissions = allPermissions.map((id) => "/" + id.replace(/\./g, "/"));

      // Backend expects barilguud (not barilganuud)
      await updateMethod("ajiltan", token, {
        _id: employee._id,
        tsonkhniiErkhuud: payloadPermissions,
        barilguud: selectedBuildings,
      });

      openSuccessOverlay("Ажилтны тохиргоо амжилттай хадгалагдлаа");
      router.push("/geree/ajiltan");
    } catch (error) {
      console.error("Error saving:", error);
      openErrorOverlay(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (data.isValidatingAjiltan) {
    return (
      <GolContent>
        <div className="flex items-center justify-center h-96">
          <div className="text-theme">Уншиж байна...</div>
        </div>
      </GolContent>
    );
  }

  if (!employee) {
    return (
      <GolContent>
        <div className="flex items-center justify-center h-96">
          <div className="text-theme">Ажилтан олдсонгүй</div>
        </div>
      </GolContent>
    );
  }

  return (
    <GolContent>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/geree/ajiltan")}
              className="p-2 hover:bg-[color:var(--surface-hover)] rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-theme" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-theme">Ажилтны тохиргоо</h1>
              <p className="text-sm text-subtle">
                {employee.ner || employee.nevtrekhNer} - {employee.albanTushaal}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-minimal flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4 lg:h-[calc(100vh-200px)] lg:min-h-[400px]">
          {/* Section 1: Building Assignment */}
          <div className="neu-panel rounded-2xl p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-theme">
                  Барилга
                  <span className="ml-2 text-sm font-normal text-subtle">
                    ({selectedBuildings.length})
                  </span>
                </h2>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={selectAllBuildings}
                  className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  Бүгд
                </button>
                <button
                  onClick={deselectAllBuildings}
                  className="px-2 py-1 text-xs font-medium text-subtle hover:bg-[color:var(--hover-bg)] rounded transition-colors"
                >
                  Цэвэрлэх
                </button>
              </div>
            </div>
            <div className="space-y-2 flex-1 min-h-0 max-h-[260px] lg:max-h-none overflow-y-auto custom-scrollbar">
              {buildings.length === 0 ? (
                <div className="text-center py-8 text-subtle text-sm">
                  Барилга олдсонгүй
                </div>
              ) : (
                buildings.map((building: any) => {
                  const isSelected = selectedBuildings.includes(building._id);
                  return (
                    <div
                      key={building._id}
                      onClick={() => toggleBuilding(building._id)}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-[color:var(--surface-hover)] border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-[color:var(--surface-border)]"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-theme">{building.ner}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: Window Permissions (Modules) */}
          <div className="neu-panel rounded-2xl p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-theme">
                  Модулиуд
                  <span className="ml-2 text-sm font-normal text-subtle">
                    ({selectedPermissions.length})
                  </span>
                </h2>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const allIds: string[] = [];
                    ALL_PERMISSIONS.forEach(p => {
                      allIds.push(p.id);
                      if (p.children) {
                        p.children.forEach(c => allIds.push(c.id));
                      }
                    });
                    setSelectedPermissions(allIds);
                  }}
                  className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                >
                  Бүгд
                </button>
                <button
                  onClick={() => setSelectedPermissions([])}
                  className="px-2 py-1 text-xs font-medium text-subtle hover:bg-[color:var(--hover-bg)] rounded transition-colors"
                >
                  Цэвэрлэх
                </button>
              </div>
            </div>
            <div className="space-y-2 flex-1 min-h-0 max-h-[280px] lg:max-h-none overflow-y-auto custom-scrollbar">
              {ALL_PERMISSIONS.map((perm) => {
                const isSelected = selectedPermissions.includes(perm.id);
                const hasChildren = perm.children && perm.children.length > 0;

                return (
                  <div key={perm.id} className="space-y-1">
                    <div
                      onClick={() => togglePermission(perm.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "hover:bg-[color:var(--surface-hover)] border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-green-500 border-green-500"
                            : "border-[color:var(--surface-border)]"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-theme">{perm.label}</span>
                    </div>

                    {/* Child permissions */}
                    {hasChildren && (
                      <div className="pl-8 space-y-1">
                        {perm.children!.map((child) => {
                          const isChildSelected = selectedPermissions.includes(child.id);
                          return (
                            <div
                              key={child.id}
                              onClick={() => togglePermission(child.id)}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                isChildSelected
                                  ? "bg-green-50 dark:bg-green-900/20"
                                  : "hover:bg-[color:var(--surface-hover)]"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                  isChildSelected
                                    ? "bg-green-500 border-green-500"
                                    : "border-[color:var(--surface-border)]"
                                }`}
                              >
                                {isChildSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className="text-xs font-medium text-theme">{child.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Settings Permissions */}
          <div className="neu-panel rounded-2xl p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-theme">
                  Тохиргооны эрх
                  <span className="ml-2 text-sm font-normal text-subtle">
                    ({selectedSettings.length})
                  </span>
                </h2>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedSettings(SETTINGS_PERMISSIONS.map(s => s.id))}
                  className="px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                >
                  Бүгд
                </button>
                <button
                  onClick={() => setSelectedSettings([])}
                  className="px-2 py-1 text-xs font-medium text-subtle hover:bg-[color:var(--hover-bg)] rounded transition-colors"
                >
                  Цэвэрлэх
                </button>
              </div>
            </div>
            <div className="space-y-2 flex-1 min-h-0 max-h-[280px] lg:max-h-none overflow-y-auto custom-scrollbar">
              {SETTINGS_PERMISSIONS.map((setting) => {
                const isSelected = selectedSettings.includes(setting.id);
                return (
                  <div
                    key={setting.id}
                    onClick={() => toggleSetting(setting.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                        : "hover:bg-[color:var(--surface-hover)] border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-purple-500 border-purple-500"
                          : "border-[color:var(--surface-border)]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-theme">{setting.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </GolContent>
  );
}
