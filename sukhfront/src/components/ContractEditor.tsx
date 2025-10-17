"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewProps,
} from "@tiptap/react";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Save,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

import { useAuth } from "@/lib/useAuth";
import uilchilgee, { aldaaBarigch } from "../../lib/uilchilgee";

type TagType =
  | "ovog"
  | "ner"
  | "register"
  | "utas"
  | "email"
  | "hayag"
  | "baingiinHayag"
  | "gereeniiDugaar"
  | "gereeniiOgnoo"
  | "suhNer"
  | "suhRegister"
  | "suhHayag"
  | "suhUtas"
  | "suhMail"
  | "suhGariinUseg"
  | "suhTamga"
  | "bankName"
  | "bankAccount"
  | "tuluhOgnoo"
  | "gereeniiHugatsaa"
  | "suhTulbur"
  | "suhTulburUsgeer"
  | "suhHugatsaa"
  | "suhHungulult"
  | "ashiglaltiinZardal"
  | "ashiglaltiinZardalUsgeer"
  | "niitTulbur"
  | "niitTulburUsgeer"
  | "lateFee"
  | "totalMaintenanceFee"
  | "bairNer"
  | "Orts"
  | "Toot"
  | "talbainHemjee"
  | "zoriulalt"
  | "davhar"
  | "burtgesenAjiltan"
  | "temdeglel"
  | "actOgnoo"
  | "EhlehOn"
  | "EhlehSar"
  | "EhlehUdur"
  | "DuusahOn"
  | "DuusahSar"
  | "DuusahUdur"
  | "TulultHiigdehOgnoo";

// Tag categories and labels
const tagCategories = {
  basic: {
    label: "Үндсэн мэдээлэл",
    tags: [
      { type: "ovog" as TagType, label: "Овог" },
      { type: "ner" as TagType, label: "Нэр" },
      { type: "register" as TagType, label: "Регистр" },
      { type: "utas" as TagType, label: "Утас" },
      { type: "email" as TagType, label: "И-мэйл" },
      { type: "hayag" as TagType, label: "Хаяг" },
      { type: "baingiinHayag" as TagType, label: "Байнгын хаяг" },
      { type: "gereeniiDugaar" as TagType, label: "Гэрээний дугаар" },
      { type: "gereeniiOgnoo" as TagType, label: "Гэрээний огноо" },
      { type: "suhNer" as TagType, label: "СӨХ-ийн нэр" },
      { type: "suhRegister" as TagType, label: "СӨХ-ийн регистр" },
      { type: "suhHayag" as TagType, label: "СӨХ-ийн хаяг" },
      { type: "suhUtas" as TagType, label: "СӨХ-ийн утас" },
      { type: "suhMail" as TagType, label: "СӨХ-ийн и-мэйл" },
      { type: "suhGariinUseg" as TagType, label: "СӨХ гарын үсэг" },
      { type: "suhTamga" as TagType, label: "СӨХ тамга" },
    ],
  },
  duration: {
    label: "Хугацаа ба төлөлт",
    tags: [
      { type: "bankName" as TagType, label: "Банкны нэр" },
      { type: "bankAccount" as TagType, label: "Дансны дугаар" },
      { type: "tuluhOgnoo" as TagType, label: "Төлөх огноо" },
      { type: "gereeniiHugatsaa" as TagType, label: "Гэрээний хугацаа" },
    ],
  },
  payment: {
    label: "Төлбөр, хураамж",
    tags: [
      { type: "suhTulbur" as TagType, label: "СӨХ хураамж" },
      { type: "suhTulburUsgeer" as TagType, label: "СӨХ хураамж үсгээр" },
      { type: "suhHugatsaa" as TagType, label: "Хураамжийн хугацаа" },
      { type: "suhHungulult" as TagType, label: "Хөнгөлөлт" },
      { type: "ashiglaltiinZardal" as TagType, label: "Ашиглалтын зардал" },
      { type: "ashiglaltiinZardalUsgeer" as TagType, label: "Ашиглалт үсгээр" },
      { type: "niitTulbur" as TagType, label: "Нийт төлбөр" },
      { type: "niitTulburUsgeer" as TagType, label: "Нийт төлбөр үсгээр" },
      { type: "lateFee" as TagType, label: "Хоцрогдлын төлбөр" },
      { type: "totalMaintenanceFee" as TagType, label: "Нийт ашиглалт" },
    ],
  },
  property: {
    label: "Байр, талбайн мэдээлэл",
    tags: [
      { type: "bairNer" as TagType, label: "Байрны нэр" },
      { type: "Orts" as TagType, label: "Орц" },
      { type: "Toot" as TagType, label: "Тоот" },
      { type: "talbainHemjee" as TagType, label: "Талбайн хэмжээ" },
      { type: "zoriulalt" as TagType, label: "Зориулалт" },
      { type: "davhar" as TagType, label: "Давхар" },
    ],
  },
  additional: {
    label: "Нэмэлт мэдээлэл",
    tags: [
      { type: "burtgesenAjiltan" as TagType, label: "Бүртгэсэн ажилтан" },
      { type: "temdeglel" as TagType, label: "Тэмдэглэл" },
      { type: "actOgnoo" as TagType, label: "Актын огноо" },
    ],
  },
  dates: {
    label: "Хугацааны хувьсагч",
    tags: [
      { type: "EhlehOn" as TagType, label: "Эхлэх он" },
      { type: "EhlehSar" as TagType, label: "Эхлэх сар" },
      { type: "EhlehUdur" as TagType, label: "Эхлэх өдөр" },
      { type: "DuusahOn" as TagType, label: "Дуусах он" },
      { type: "DuusahSar" as TagType, label: "Дуусах сар" },
      { type: "DuusahUdur" as TagType, label: "Дуусах өдөр" },
      { type: "TulultHiigdehOgnoo" as TagType, label: "Төлөлт хийгдэх огноо" },
    ],
  },
};

const CustomTagComponent = ({ node, deleteNode }: NodeViewProps) => {
  const tagType = node.attrs.tagType as TagType;

  const label =
    Object.values(tagCategories)
      .flatMap((category) => category.tags)
      .find((t) => t.type === tagType)?.label || tagType;

  return (
    <NodeViewWrapper
      as="span"
      className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded border text-xs font-medium cursor-move select-none bg-blue-100 text-blue-700 border-blue-300"
      draggable="true"
      data-drag-handle
    >
      <span>{label}</span>
      <button
        onClick={deleteNode}
        className="hover:bg-blue-200 rounded px-1 leading-none"
        contentEditable={false}
      >
        ×
      </button>
    </NodeViewWrapper>
  );
};

const CustomTag = Node.create({
  name: "customTag",
  group: "inline",
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      tagType: {
        default: "ner" as const,
        parseHTML: (element) => element.getAttribute("data-tag-type"),
        renderHTML: (attributes) => {
          return {
            "data-tag-type": attributes.tagType,
          };
        },
      },
    };
  },

  parseHTML() {
    const allTags: TagType[] = Object.values(tagCategories).flatMap((cat) =>
      cat.tags.map((t) => t.type)
    );
    return allTags.map((tag) => ({
      tag: tag,
      getAttrs: () => ({ tagType: tag }),
    }));
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "custom-tag",
        "data-tag-type": node.attrs.tagType,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomTagComponent);
  },
});

interface ContractEditorProps {
  onSave?: (data: { ner: string; tailbar: string; aguulga: string }) => void;
  onBack?: () => void;
  initialData?: any;
  isEditMode?: boolean;
}

export default function ContractEditor({
  onSave,
  onBack,
  initialData,
  isEditMode,
}: ContractEditorProps) {
  const router = useRouter();
  const { token, ajiltan, barilgiinId } = useAuth();

  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {
      basic: true,
    }
  );

  useEffect(() => {
    if (initialData) {
      setTemplateName(initialData.ner || "");
      setTemplateDesc(initialData.tailbar || "");
    }
  }, [initialData]);

  const editor = useEditor({
    extensions: [StarterKit, Underline, CustomTag],
    content:
      initialData?.aguulga ||
      `
      <h2 style="text-align: center;"><strong>ОРОН СУУЦНЫ ТҮРЭЭСИЙН ГЭРЭЭ</strong></h2>
      <p style="text-align: center;">Дугаар: <gereeniiDugaar></gereeniiDugaar></p>
      <p><br></p>
      <p><strong>1. ГЭРЭЭНИЙ ТАЛУУД</strong></p>
      <p>Түрээслэгч: <ovog></ovog> <ner></ner></p>
      <p>Регистр: <register></register>, Утас: <utas></utas></p>
      <p>Хаяг: <hayag></hayag></p>
      <p><br></p>
      <p>Түрээслүүлэгч: <suhNer></suhNer></p>
      <p>Регистр: <suhRegister></suhRegister>, Утас: <suhUtas></suhUtas></p>
      <p><br></p>
      <p><strong>2. ГЭРЭЭНИЙ ХУГАЦАА</strong></p>
      <p>Эхлэх: <EhlehOn></EhlehOn> оны <EhlehSar></EhlehSar> сарын <EhlehUdur></EhlehUdur></p>
      <p>Дуусах: <DuusahOn></DuusahOn> оны <DuusahSar></DuusahSar> сарын <DuusahUdur></DuusahUdur></p>
      <p><br></p>
      <p><strong>3. ТҮРЭЭСИЙН ТӨЛБӨР</strong></p>
      <p>Сарын хураамж: <suhTulbur></suhTulbur>₮ (<suhTulburUsgeer></suhTulburUsgeer>)</p>
      <p>Ашиглалтын зардал: <ashiglaltiinZardal></ashiglaltiinZardal>₮</p>
      <p>Нийт: <niitTulbur></niitTulbur>₮ (<niitTulburUsgeer></niitTulburUsgeer>)</p>
      <p>Төлөх огноо: Сар бүрийн <tuluhOgnoo></tuluhOgnoo>-ны өдөр</p>
      <p><br></p>
      <p><strong>4. БАЙРНЫ МЭДЭЭЛЭЛ</strong></p>
      <p>Байр: <bairNer></bairNer>, Орц: <Orts></Orts>, Тоот: <Toot></Toot></p>
      <p>Талбай: <talbainHemjee></talbainHemjee> м², Давхар: <davhar></davhar></p>
      <p><br></p>
      <p><strong>Талуудын гарын үсэг:</strong></p>
      <p>Түрээслэгч: _______________</p>
      <p>Түрээслүүлэгч: <suhGariinUseg></suhGariinUseg></p>
    `,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[29.7cm]",
      },
    },
    immediatelyRender: false,
  });

  const addCustomTag = useCallback(
    (tagType: TagType) => {
      if (editor) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "customTag",
            attrs: { tagType },
          })
          .run();
      }
    },
    [editor]
  );

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSave = async () => {
    if (!editor || !templateName.trim()) {
      toast.error("Загварын нэр оруулна уу!");
      return;
    }

    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }

    setIsSaving(true);

    try {
      const htmlContent = editor.getHTML();

      const data = {
        ner: templateName,
        tailbar: templateDesc,
        aguulga: htmlContent,
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: barilgiinId || undefined,
      };

      if (onSave) {
        onSave(data);
        return;
      }

      const response = await uilchilgee(token).post("/gereeniiZagvar", data);

      if (
        response.status === 200 ||
        response.data === "Amjilttai" ||
        response.data.success
      ) {
        toast.success("Загвар амжилттай хадгалагдлаа!");

        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            router.push("/geree");
          }
        }, 1000);
      } else {
        toast.error("Хадгалахад алдаа гарлаа");
      }
    } catch (error: any) {
      aldaaBarigch(error);
      toast.error("Хадгалахад алдаа гарлаа");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex h-screen bg-gray-50 rounded-2xl">
      <div className="w-80 bg-white border-r rounded-2xl border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Хувьсагчид</h3>
          <p className="text-xs text-gray-500 mt-1">Дарж оруулах</p>
        </div>

        <div className="p-2">
          {Object.entries(tagCategories).map(([key, category]) => (
            <div key={key} className="mb-2">
              <button
                onClick={() => toggleCategory(key)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <span>{category.label}</span>
                {openCategories[key] ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {openCategories[key] && (
                <div className="mt-1 space-y-1 pl-2">
                  {category.tags.map((tag) => (
                    <button
                      key={tag.type}
                      onClick={() => addCustomTag(tag.type)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-transparent border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => (onBack ? onBack() : router.push("/geree"))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Буцах"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {isEditMode ? "Гэрээний загвар засах" : "Гэрээний загвар үүсгэх"}
          </h1>
        </div>

        <div className="bg-transparent border-b border-gray-200">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                Загварын мэдээлэл
              </h3>
              {!isFormOpen && templateName && (
                <span className="text-xs text-gray-500">— {templateName}</span>
              )}
            </div>
            {isFormOpen ? (
              <ChevronUp size={18} className="text-gray-500" />
            ) : (
              <ChevronDown size={18} className="text-gray-500" />
            )}
          </button>

          {isFormOpen && (
            <div className="px-4 pb-4">
              <div className="max-w-4xl mx-auto space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Загварын нэр *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Жишээ: Орон сууцны түрээсийн гэрээ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тайлбар
                  </label>
                  <input
                    type="text"
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Энэ загварын тухай товч тайлбар"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-transparent border-b border-gray-200 p-2">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor.isActive("bold") ? "bg-gray-200" : ""
              }`}
            >
              <Bold size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor.isActive("italic") ? "bg-gray-200" : ""
              }`}
            >
              <Italic size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor.isActive("underline") ? "bg-gray-200" : ""
              }`}
            >
              <UnderlineIcon size={18} />
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor.isActive("bulletList") ? "bg-gray-200" : ""
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor.isActive("orderedList") ? "bg-gray-200" : ""
              }`}
            >
              <ListOrdered size={18} />
            </button>

            <div className="flex-1" />

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div
            className="max-w-[21cm] mx-auto bg-white shadow-lg"
            style={{ minHeight: "29.7cm" }}
          >
            <div className="p-[2cm]">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
