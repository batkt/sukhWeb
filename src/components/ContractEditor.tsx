"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
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
  Save,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import { useGereeniiZagvar, useGereeZagvarCRUD } from "@/lib/useGereeniiZagvar";
import { useAuth } from "@/lib/useAuth";
import { aldaaBarigch } from "../../lib/uilchilgee";
import { useSpinner } from "@/context/SpinnerContext";

type TagType = string;

const tagCategories = {
  basic: {
    label: "Үндсэн мэдээлэл",
    tags: [
      { type: "ovog", label: "Овог" },
      { type: "ner", label: "Нэр" },
      { type: "register", label: "Регистр" },
      { type: "utas", label: "Утас" },
      { type: "mail", label: "И-мэйл" },
      { type: "khayag", label: "Хаяг" },
      { type: "baingiinKhayag", label: "Байнгын хаяг" },
      { type: "gereeniiDugaar", label: "Гэрээний дугаар" },
      { type: "gereeniiOgnoo", label: "Гэрээний огноо" },
      { type: "turul", label: "Төрөл" },
    ],
  },
  suh: {
    label: "СӨХ мэдээлэл",
    tags: [
      { type: "suhNer", label: "СӨХ-ийн нэр" },
      { type: "suhRegister", label: "СӨХ-ийн регистр" },
      { type: "suhUtas", label: "СӨХ-ийн утас" },
      { type: "suhMail", label: "СӨХ-ийн и-мэйл" },
      { type: "suhGariinUseg", label: "СӨХ гарын үсэг" },
      { type: "suhTamga", label: "СӨХ тамга" },
    ],
  },
  duration: {
    label: "Хугацаа",
    tags: [
      { type: "khugatsaa", label: "Хугацаа" },
      { type: "ekhlekhOgnoo", label: "Эхлэх огноо" },
      { type: "duusakhOgnoo", label: "Дуусах огноо" },
      { type: "tulukhOgnoo", label: "Төлөх огноо" },
      { type: "tsutsalsanOgnoo", label: "Цуцалсан огноо" },
      { type: "khungulukhKhugatsaa", label: "Хөнгөлөх хугацаа" },
      { type: "gereeniiKhugatsaa", label: "Гэрээний хугацаа" },
      { type: "actOgnoo", label: "Актын огноо" },
    ],
  },
  payment: {
    label: "Төлбөр, хураамж",
    tags: [
      { type: "suhTulbur", label: "СӨХ хураамж" },
      { type: "suhTulburUsgeer", label: "СӨХ хураамж үсгээр" },
      { type: "suhKhugatsaa", label: "Хураамжийн хугацаа" },
      { type: "sukhKhungulult", label: "Хөнгөлөлт" },
      { type: "ashiglaltiinZardal", label: "Ашиглалтын зардал" },
      { type: "ashiglaltiinZardalUsgeer", label: "Ашиглалт үсгээр" },
      { type: "niitTulbur", label: "Нийт төлбөр" },
      { type: "niitTulburUsgeer", label: "Нийт төлбөр үсгээр" },
      { type: "baritsaaAvakhDun", label: "Барьцаа авах дүн" },
      { type: "baritsaaniiUldegdel", label: "Барьцааны үлдэгдэл" },
    ],
    property: {
      label: "Байр, талбайн мэдээлэл",
      tags: [
        { type: "bairNer", label: "Байрны нэр" },
        { type: "orts", label: "Орц" },
        { type: "toot", label: "Тоот" },
        { type: "talbainKhemjee", label: "Талбайн хэмжээ" },
        { type: "zoriulalt", label: "Зориулалт" },
        { type: "davkhar", label: "Давхар" },
        { type: "tooluuriinDugaar", label: "Тоолуурын дугаар" },
      ],
    },
    additional: {
      label: "Нэмэлт мэдээлэл",
      tags: [
        { type: "burtgesenAjiltan", label: "Бүртгэсэн ажилтан" },
        { type: "temdeglel", label: "Тэмдэглэл" },
      ],
    },
    dates: {
      label: "Хугацааны хувьсагч",
      tags: [
        { type: "EhlehOn", label: "Эхлэх он" },
        { type: "EhlehSar", label: "Эхлэх сар" },
        { type: "EhlehUdur", label: "Эхлэх өдөр" },
        { type: "DuusahOn", label: "Дуусах он" },
        { type: "DuusahSar", label: "Дуусах сар" },
        { type: "DuusahUdur", label: "Дуусах өдөр" },
        { type: "TulultHiigdehOgnoo", label: "Төлөлт хийгдэх огноо" },
      ],
    },
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
  onSave?: (data: {
    ner: string;
    tailbar: string;
    aguulga: string;
    turul: string;
    zuunTolgoi?: string;
    baruunTolgoi?: string;
    zuunKhul?: string;
    baruunKhul?: string;
  }) => void;
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
  const { showSpinner, hideSpinner } = useSpinner();
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateTuluv, setTemplateTuluv] = useState("");
  const { zagvarJagsaaltMutate } = useGereeniiZagvar();
  const { zagvarUusgekh, zagvarZasakh } = useGereeZagvarCRUD();
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {
      basic: true,
    }
  );
  const [activeEditor, setActiveEditor] = useState<
    "main" | "zuunTolgoi" | "baruunTolgoi" | "zuunKhul" | "baruunKhul"
  >("main");

  const zuunTolgoiEditor = useEditor({
    extensions: [StarterKit, Underline, CustomTag],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-xs min-h-[120px]",
      },
    },
    onFocus: () => setActiveEditor("zuunTolgoi"),
    immediatelyRender: false,
  });
  const baruunTolgoiEditor = useEditor({
    extensions: [StarterKit, Underline, CustomTag],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-xs min-h-[120px]",
      },
    },
    onFocus: () => setActiveEditor("baruunTolgoi"),
    immediatelyRender: false,
  });

  const zuunKhulEditor = useEditor({
    extensions: [StarterKit, Underline, CustomTag],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-xs min-h-[180px]",
      },
    },
    onFocus: () => setActiveEditor("zuunKhul"),
    immediatelyRender: false,
  });

  const baruunKhulEditor = useEditor({
    extensions: [StarterKit, Underline, CustomTag],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-xs min-h-[180px]",
      },
    },
    onFocus: () => setActiveEditor("baruunKhul"),
    immediatelyRender: false,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      Underline,
      CustomTag,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content:
      initialData?.aguulga ||
      `
    <h2 style="text-align: center;"><strong>ОРОН СУУЦНЫ ТҮРЭЭСИЙН ГЭРЭЭ</strong></h2>
    <p style="text-align: center;">Дугаар: <span class="custom-tag" data-tag-type="gereeniiDugaar"></span></p>
    <p><br></p>
    <p><strong>1. ГЭРЭЭНИЙ ТАЛУУД</strong></p>
    <p>Түрээслэгч: <span class="custom-tag" data-tag-type="ovog"></span> <span class="custom-tag" data-tag-type="ner"></span></p>
    <p>Регистр: <span class="custom-tag" data-tag-type="register"></span>, Утас: <span class="custom-tag" data-tag-type="utas"></span></p>
    <p>Хаяг: <span class="custom-tag" data-tag-type="khayag"></span></p>
    <p><br></p>
    <p>Түрээслүүлэгч: <span class="custom-tag" data-tag-type="suhNer"></span></p>
    <p>Регистр: <span class="custom-tag" data-tag-type="suhRegister"></span>, Утас: <span class="custom-tag" data-tag-type="suhUtas"></span></p>
    <p><br></p>
    <p><strong>2. ГЭРЭЭНИЙ ХУГАЦАА</strong></p>
    <p>Эхлэх: <span class="custom-tag" data-tag-type="EhlehOn"></span> оны <span class="custom-tag" data-tag-type="EhlehSar"></span> сарын <span class="custom-tag" data-tag-type="EhlehUdur"></span></p>
    <p>Дуусах: <span class="custom-tag" data-tag-type="DuusahOn"></span> оны <span class="custom-tag" data-tag-type="DuusahSar"></span> сарын <span class="custom-tag" data-tag-type="DuusahUdur"></span></p>
    <p><br></p>
    <p><strong>3. ТҮРЭЭСИЙН ТӨЛБӨР</strong></p>
    <p>Сарын хураамж: <span class="custom-tag" data-tag-type="suhTulbur"></span>₮ (<span class="custom-tag" data-tag-type="suhTulburUsgeer"></span>)</p>
    <p>Ашиглалтын зардал: <span class="custom-tag" data-tag-type="ashiglaltiinZardal"></span>₮</p>
    <p>Нийт: <span class="custom-tag" data-tag-type="niitTulbur"></span>₮ (<span class="custom-tag" data-tag-type="niitTulburUsgeer"></span>)</p>
    <p>Төлөх огноо: Сар бүрийн <span class="custom-tag" data-tag-type="tulukhOgnoo"></span>-ны өдөр</p>
    <p><br></p>
    <p><strong>4. БАЙРНЫ МЭДЭЭЛЭЛ</strong></p>
    <p>Байр: <span class="custom-tag" data-tag-type="bairNer"></span>, Орц: <span class="custom-tag" data-tag-type="orts"></span>, Тоот: <span class="custom-tag" data-tag-type="toot"></span></p>
    <p>Талбай: <span class="custom-tag" data-tag-type="talbainKhemjee"></span> м², Давхар: <span class="custom-tag" data-tag-type="davkhar"></span></p>
    <p><br></p>
    <p><strong>Талуудын гарын үсэг:</strong></p>
    <p>Түрээслэгч: _______________</p>
    <p>Түрээслүүлэгч: <span class="custom-tag" data-tag-type="suhGariinUseg"></span></p>
  `,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[29.7cm]",
      },
    },
    onFocus: () => setActiveEditor("main"),
    immediatelyRender: false,
  });

  const [, setEditorUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const update = () => setEditorUpdate((prev) => prev + 1);
    editor.on("transaction", update);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("transaction", update);
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  useEffect(() => {
    if (initialData && isEditMode) {
      if (editor && initialData.aguulga) {
        editor.commands.setContent(initialData.aguulga);
      }

      if (zuunTolgoiEditor && initialData.zuunTolgoi) {
        zuunTolgoiEditor.commands.setContent(initialData.zuunTolgoi);
      }
      if (baruunTolgoiEditor && initialData.baruunTolgoi) {
        baruunTolgoiEditor.commands.setContent(initialData.baruunTolgoi);
      }

      if (zuunKhulEditor && initialData.zuunKhul) {
        zuunKhulEditor.commands.setContent(initialData.zuunKhul);
      }
      if (baruunKhulEditor && initialData.baruunKhul) {
        baruunKhulEditor.commands.setContent(initialData.baruunKhul);
      }

      if (initialData.ner) setTemplateName(initialData.ner);
      if (initialData.tailbar) setTemplateDesc(initialData.tailbar);
      if (initialData.turul) setTemplateTuluv(initialData.turul);
    }
  }, [
    initialData,
    isEditMode,
    editor,
    zuunTolgoiEditor,
    baruunTolgoiEditor,
    zuunKhulEditor,
    baruunKhulEditor,
  ]);

  const addCustomTag = useCallback(
    (tagType: TagType) => {
      let targetEditor = null;

      switch (activeEditor) {
        case "zuunTolgoi":
          targetEditor = zuunTolgoiEditor;
          break;
        case "baruunTolgoi":
          targetEditor = baruunTolgoiEditor;
          break;
        case "zuunKhul":
          targetEditor = zuunKhulEditor;
          break;
        case "baruunKhul":
          targetEditor = baruunKhulEditor;
          break;
        case "main":
        default:
          targetEditor = editor;
          break;
      }

      if (targetEditor && !targetEditor.isDestroyed) {
        targetEditor
          .chain()
          .focus()
          .insertContent({
            type: "customTag",
            attrs: { tagType },
          })
          .run();
      }
    },
    [
      activeEditor,
      editor,
      zuunTolgoiEditor,
      baruunTolgoiEditor,
      zuunKhulEditor,
      baruunKhulEditor,
    ]
  );

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };
  const insertTagInTextarea = (
    textareaRef: HTMLTextAreaElement | null,
    tagType: TagType,
    setValue: (value: string) => void,
    currentValue: string
  ) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const tagText = `<${tagType}>`;

    const newValue =
      currentValue.substring(0, start) + tagText + currentValue.substring(end);

    setValue(newValue);

    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(
        start + tagText.length,
        start + tagText.length
      );
    }, 0);
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

    showSpinner();

    try {
      const htmlContent = editor.getHTML();

      const baseData = {
        ...(isEditMode && initialData?._id && { _id: initialData._id }),
        ner: templateName,
        tailbar: templateDesc,
        turul: templateTuluv,
        aguulga: htmlContent,
        zuunTolgoi: zuunTolgoiEditor?.getHTML() || "",
        baruunTolgoi: baruunTolgoiEditor?.getHTML() || "",
        zuunKhul: zuunKhulEditor?.getHTML() || "",
        baruunKhul: baruunKhulEditor?.getHTML() || "",

        ...(isEditMode &&
          initialData?.barilgiinId && {
            barilgiinId: initialData.barilgiinId,
          }),

        ...(!isEditMode &&
          barilgiinId && {
            barilgiinId: barilgiinId,
          }),
      };

      if (onSave) {
        onSave(baseData);
        return;
      }

      let success = false;

      if (isEditMode && initialData?._id) {
        success = await zagvarZasakh(initialData._id, baseData);
      } else {
        success = await zagvarUusgekh(baseData);
      }

      if (success) {
        zagvarJagsaaltMutate();

        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            router.push("/geree");
          }
        }, 1000);
      }
    } catch (error: any) {
      aldaaBarigch(error);
      toast.error("Хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 rounded-2xl">
      <div className="w-80 bg-white border-r rounded-2xl border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-slate-900">Хувьсагчид</h3>
          <p className="text-xs text-slate-500 mt-1">Дарж оруулах</p>
        </div>

        <div className="p-2">
          {Object.entries(tagCategories).map(([key, category]) => (
            <div key={key} className="mb-2">
              <button
                onClick={() => toggleCategory(key)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-gray-100 rounded-2xl"
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
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
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
            className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
            title="Буцах"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            {isEditMode ? "Гэрээний загвар засах" : "Гэрээний загвар үүсгэх"}
          </h1>
        </div>

        <div className="bg-transparent border-b border-gray-200">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-slate-900">
                Загварын мэдээлэл
              </h3>
              {!isFormOpen && templateName && (
                <span className="text-xs text-slate-500">— {templateName}</span>
              )}
            </div>
            {isFormOpen ? (
              <ChevronUp size={18} className="text-slate-500" />
            ) : (
              <ChevronDown size={18} className="text-slate-500" />
            )}
          </button>

          {isFormOpen && (
            <div className="px-4 pb-4">
              <div className="max-w-4xl mx-auto space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Загварын нэр *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Жишээ: Орон сууцны түрээсийн гэрээ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Тайлбар
                  </label>
                  <input
                    type="text"
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Энэ загварын тухай товч тайлбар"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Төрөл
                  </label>
                  <input
                    type="text"
                    value={templateTuluv}
                    onChange={(e) => setTemplateTuluv(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Энэ загварын аль төрөлд хамаарах вэ"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-transparent border-b border-gray-200 p-2">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-1">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              disabled={!editor}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("bold")
                  ? "bg-violet-600 text-white"
                  : "hover:bg-gray-100 text-slate-700"
              }`}
              title="Тод (Ctrl+B)"
            >
              <Bold size={18} />
            </button>

            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              disabled={!editor}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("italic")
                  ? "bg-violet-600 text-white"
                  : "hover:bg-gray-100 text-slate-700"
              }`}
              title="Налуу (Ctrl+I)"
            >
              <Italic size={18} />
            </button>

            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              disabled={!editor}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("underline")
                  ? "bg-violet-600 text-white"
                  : "hover:bg-gray-100 text-slate-700"
              }`}
              title="Доогуур зураас (Ctrl+U)"
            >
              <UnderlineIcon size={18} />
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            <button
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              disabled={!editor}
              className={`p-2 rounded transition-colors ${
                editor?.isActive({ textAlign: "left" })
                  ? "bg-violet-600 text-white"
                  : "hover:bg-gray-100 text-slate-700"
              }`}
              title="Зүүн тийш"
            >
              <AlignLeft size={18} />
            </button>
            <button
              onClick={() =>
                editor?.chain().focus().setTextAlign("center").run()
              }
              disabled={!editor}
              className={`p-2 rounded transition-colors ${
                editor?.isActive({ textAlign: "center" })
                  ? "bg-violet-600 text-white"
                  : "hover:bg-gray-100 text-slate-700"
              }`}
              title="Төвлөх"
            >
              <AlignCenter size={18} />
            </button>
            <button
              onClick={() =>
                editor?.chain().focus().setTextAlign("right").run()
              }
              disabled={!editor}
              className={`p-2 rounded transition-colors ${
                editor?.isActive({ textAlign: "right" })
                  ? "bg-violet-600 text-white"
                  : "hover:bg-gray-100 text-slate-700"
              }`}
              title="Баруун тийш"
            >
              <AlignRight size={18} />
            </button>
            <button
              onClick={() =>
                editor?.chain().focus().setTextAlign("justify").run()
              }
              disabled={!editor}
              className={`p-2 rounded transition-colors ${
                editor?.isActive({ textAlign: "justify" })
                  ? "bg-violet-600 text-white"
                  : "hover:bg-gray-100 text-slate-700"
              }`}
              title="Тэгшлэх"
            >
              <AlignJustify size={18} />
            </button>

            <div className="w-px bg-gray-300 mx-1" />

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-2xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              Хадгалах
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div
            className="max-w-[21cm] mx-auto bg-white shadow-lg"
            style={{ minHeight: "29.7cm", padding: "2cm" }}
          >
            {/* Header Section */}
            <div className="flex justify-between items-start gap-8 pb-4 mb-4 border-b border-gray-300">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Зүүн толгой
                </label>
                <div
                  onClick={() => {
                    setActiveEditor("zuunTolgoi");
                    zuunTolgoiEditor?.commands.focus();
                  }}
                  className="border border-gray-200 rounded p-2 min-h-[120px] cursor-text hover:border-violet-300 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500"
                >
                  <EditorContent editor={zuunTolgoiEditor} />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Баруун толгой
                </label>
                <div
                  onClick={() => {
                    setActiveEditor("baruunTolgoi");
                    baruunTolgoiEditor?.commands.focus();
                  }}
                  className="border border-gray-200 rounded p-2 min-h-[120px] cursor-text hover:border-violet-300 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500"
                >
                  <EditorContent editor={baruunTolgoiEditor} />
                </div>
              </div>
            </div>

            {/* Body Section */}
            <div
              className="my-6"
              onClick={() => {
                setActiveEditor("main");
                editor?.commands.focus();
              }}
            >
              <EditorContent editor={editor} />
            </div>

            {/* Footer Section */}
            <div className="flex justify-between items-start gap-8 pt-4 mt-6 border-t border-gray-300">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Зүүн хөл
                </label>
                <div
                  onClick={() => {
                    setActiveEditor("zuunKhul");
                    zuunKhulEditor?.commands.focus();
                  }}
                  className="border border-gray-200 rounded p-2 min-h-[180px] cursor-text hover:border-violet-300 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500"
                >
                  <EditorContent editor={zuunKhulEditor} />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Баруун хөл
                </label>
                <div
                  onClick={() => {
                    setActiveEditor("baruunKhul");
                    baruunKhulEditor?.commands.focus();
                  }}
                  className="border border-gray-200 rounded p-2 min-h-[180px] cursor-text hover:border-violet-300 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500"
                >
                  <EditorContent editor={baruunKhulEditor} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
