"use client";

import React, { useEffect, useState } from "react";
import { ModalPortal } from "../../../../components/golContent";
import ContractEditor from "@/components/ContractEditor";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { X } from "lucide-react";

interface ZagvarEditorModalProps {
  show: boolean;
  onClose: () => void;
  templateId: string | null;
  onSuccess?: () => void;
}

export default function ZagvarEditorModal({
  show,
  onClose,
  templateId,
  onSuccess,
}: ZagvarEditorModalProps) {
  const { token, ajiltan } = useAuth();
  const [templateData, setTemplateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (show && templateId && token) {
      fetchTemplateData();
    } else if (show && !templateId) {
      setTemplateData(null);
      setIsLoading(false);
    }
  }, [show, templateId, token]);

  const fetchTemplateData = async () => {
    if (!templateId || !token) return;
    setIsLoading(true);
    try {
      const response = await uilchilgee(token).get(`/gereeniiZagvar/${templateId}`);
      setTemplateData(response.data);
    } catch {
      openErrorOverlay("Загварын мэдээлэл татахад алдаа гарлаа");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    try {
      const { _id, ...rest } = data;
      const payload = {
        ...rest,
        baiguullagiinId: ajiltan.baiguullagiinId,
      };

      if (templateId) {
        await uilchilgee(token).put(`/gereeniiZagvar/${templateId}`, payload);
        openSuccessOverlay("Загвар амжилттай шинэчлэгдлээ!");
      } else {
        await uilchilgee(token).post("/gereeniiZagvar", payload);
        openSuccessOverlay("Загвар амжилттай үүсгэгдлээ!");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      openErrorOverlay(
        templateId ? "Загвар шинэчлэхэд алдаа гарлаа" : "Загвар үүсгэхэд алдаа гарлаа"
      );
    }
  };

  const handleBack = () => {
    onClose();
  };

  if (!show) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] flex flex-col bg-[color:var(--surface-bg)]">
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[color:var(--surface-hover)] transition-colors"
            aria-label="Хаах"
          >
            <X className="w-6 h-6 text-theme" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden pt-2 pb-4 px-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
                <p className="text-theme/70">Уншиж байна...</p>
              </div>
            </div>
          ) : (
            <ContractEditor
              onSave={handleSave}
              onBack={handleBack}
              initialData={templateData}
              isEditMode={!!templateId}
            />
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
