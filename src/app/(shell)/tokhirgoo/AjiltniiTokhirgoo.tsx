"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import EmployeesSection from "../geree/EmployeesSection";
import { GereeProvider, useGereeContext } from "../geree/GereeContext";

/**
 * Тохиргоо → Ажилтны тохиргоо.
 *
 * Ажилтны жагсаалтыг харуулж, тухайн ажилтны эрх/барилгын хуваарилалтыг
 * тохируулах хуудас руу шилжүүлнэ. Гэрээ хэсгийн жагсаалттай ижил өгөгдөл
 * ашиглах тул `GereeProvider`-оор боож өгөв — /tokhirgoo нь geree layout-ын
 * гадна байрладаг.
 */
function AjiltniiTokhirgooTsonkh() {
  const router = useRouter();
  const { state, data } = useGereeContext();

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-500" />
        <div>
          <h2 className="text-lg text-theme">Ажилтны тохиргоо</h2>
          <p className="text-xs text-subtle mt-0.5">
            Ажилтан сонгоод эрх болон хариуцах барилгыг нь тохируулна
          </p>
        </div>
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
        onManagePermissions={(employee: any) => {
          // `from` нь тухайн хуудасны "Буцах"/"Хадгалах" дараа энэ таб руугаа
          // эргэж ирэхэд хэрэгтэй
          router.push(`/ajiltan/tokhirgoo/${employee._id}?from=tokhirgoo`);
        }}
        onCredentialsUpdate={() => {}}
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
