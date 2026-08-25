"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
 
import ContractEditor from "@/components/ContractEditor";
import { ErrorOverlayHost, openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";

export default function GereeniiZagvarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, ajiltan } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [templateData, setTemplateData] = useState<any>(null);

  const templateId = searchParams.get("id");

  useEffect(() => {
    if (templateId && token && ajiltan?.baiguullagiinId) {
      fetchTemplateData();
    }
  }, [templateId, token, ajiltan]);

  const fetchTemplateData = async () => {
    if (!templateId || !token) return;

    setIsLoading(true);
    try {
      const response = await uilchilgee(token).get(
        `/gereeniiZagvar/${templateId}`
      );
      if (response.data) {
        setTemplateData(response.data);
      }
    } catch (error) {

      openErrorOverlay("Загварын мэдээлэл татахад алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: {
    ner: string;
    tailbar: string;
    aguulga: string;
  }) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    try {
      if (templateId) {
        // Update existing template
        const response = await uilchilgee(token).put(
          `/gereeniiZagvar/${templateId}`,
          {
            ...data,
            baiguullagiinId: ajiltan.baiguullagiinId,
          }
        );

        if (response.status === 200 || response.data?.success) {
          openSuccessOverlay("Загвар амжилттай шинэчлэгдлээ!");
          setTimeout(() => router.push("/geree"), 1000);
        }
      } else {
        // Create new template
        const response = await uilchilgee(token).post("/gereeniiZagvar", {
          ...data,
          baiguullagiinId: ajiltan.baiguullagiinId,
        });

        if (response.status === 200 || response.data?.success) {
          openSuccessOverlay("Загвар амжилттай үүсгэгдлээ!");
          setTimeout(() => router.push("/geree"), 1000);
        }
      }
    } catch (error: any) {
       
      openErrorOverlay(
        templateId
          ? "Загвар шинэчлэхэд алдаа гарлаа"
          : "Загвар үүсгэхэд алдаа гарлаа"
      );
    }
  };

  const handleBack = () => {
    router.push("/geree");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <ContractEditor
      onSave={handleSave}
      onBack={handleBack}
      initialData={templateData}
      isEditMode={!!templateId}
    />
  );
}
