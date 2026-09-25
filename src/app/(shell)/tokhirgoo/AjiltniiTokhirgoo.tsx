"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";
import EmployeesSection from "../geree/EmployeesSection";
import EmployeePermissionsModal from "../geree/EmployeePermissionsModal";
import { GereeProvider, useGereeContext } from "../geree/GereeContext";

/**
 * Тохиргоо → Ажилтны тохиргоо.
 *
 * Ажилтны жагсаалтыг харуулж, эрх/барилгын хуваарилалтыг Гэрээ → Ажилтан
 * хэсэгтэй ЯГ ИЖИЛ модалаар тохируулна. Гэрээ хэсгийн жагсаалттай ижил өгөгдөл
 * ашиглах тул `GereeProvider`-оор боож өгөв — /tokhirgoo нь geree layout-ын
 * гадна байрладаг.
 */
function AjiltniiTokhirgooTsonkh() {
  const { state, data } = useGereeContext();
  const [erkhAjiltan, setErkhAjiltan] = useState<any | null>(null);

  return (
    <div className="w-full space-y-4">
      {/* Гарчгийг бүрхүүл зурна — энд зөвхөн яаж ашиглахыг зааварлана */}
      <div className="flex items-start gap-3 rounded-xl bg-theme/5 px-4 py-3 text-[13px] text-[color:var(--panel-text)]">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p>
          Жагсаалтаас ажилтны мөрөн дэх <span className="text-brand">эрхийн товч</span>-ийг дарж
          тухайн ажилтны харах, засах эрх болон хариуцах барилгыг нь сонгоно.
        </p>
      </div>

      <EmployeesSection
        isValidatingAjiltan={data.isValidatingAjiltan}
        currentEmployees={data.currentEmployees}
        filteredEmployees={data.filteredEmployees}
        empPage={state.empPage}
        empPageSize={state.empPageSize}
        empTotalPages={data.empTotalPages}
        setEmpPage={state.setEmpPage}
        setEmpPageSize={state.setEmpPageSize}
        // Энэ таб зөвхөн эрхийн тохиргоонд зориулагдсан тул засах/устгах
        // үйлдлүүдийг Гэрээ → Ажилтан хэсэгт нь үлдээв.
        canEdit={false}
        canDelete={false}
        canManagePermissions={true}
        onEdit={() => {}}
        onDelete={() => {}}
        onManagePermissions={(employee: any) => setErkhAjiltan(employee)}
      />

      <EmployeePermissionsModal
        employee={erkhAjiltan}
        open={!!erkhAjiltan}
        onClose={() => setErkhAjiltan(null)}
        onSaved={() => data.ajiltniiJagsaaltMutate?.()}
      />
    </div>
  );
}

export default function AjiltniiTokhirgoo() {
  return (
    <GereeProvider>
      <AjiltniiTokhirgooTsonkh />
    </GereeProvider>
  );
}
