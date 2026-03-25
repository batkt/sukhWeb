# Excel Импорт/Экспорт Функц

## Тойм

Энэхүү баримт бичиг нь "Turees" системд Excel файлаас импорт хийх болон Excel экспорт хийх функцийн ажиллагаа, дизайн загвар, хэрэглээ зэрэг талаар дэлгэрэнгүй мэдээллийг агуулна. Системд `exceljs` болон `xlsx-js-style` npm пакетууд ашиглана.

## Технологи

- **Excel Library**: exceljs 4.4.0
- **Style Library**: xlsx-js-style 1.2.0
- **UI Components**: Ant Design Upload, DatePicker, Select
- **HTTP**: axios (blob responseType)

## Excel функцуудын жагсаалт

| Функц | Тайлбар | Файл байршил |
|-------|---------|--------------|
| Гэрээ импорт | Гэрээний мэдээлэл Excel-ээс импорт | `GereeExceleesOruulakh.js` |
| Нэхэмжлэл загвар импорт | Нэхэмжлэл загвар Excel-ээс импорт | `ZagvarExceleesOruulakh.js` |
| Загвар татах | Excel загвар файлыг татах | `GereeExceleesOruulakh.js` |
| Гүйлгээ импорт | Гүйлгээний түүх Excel-ээс импорт | `GuilgeeExceleesOruulakhOlnoor.js` |
| Эхний үлдэгдэл импорт | Эхний үлдэгдэл Excel-ээс импорт | `GuilgeeEkhniiUldegdelExceleesOruulakhOlnoor.js` |
| Тайлан экспорт | Тайлан Excel хэлбэрээр экспорт | Олон файлууд |

## Гэрээ импорт (Excel Import)

### 1. Үндсэн бүрэлдэхүүн хэсэг

```javascript
import React from "react";
import { DatePicker, message, Select, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import uilchilgee, { url } from "services/uilchilgee";
import moment from "moment";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function GereeExceleesOruulakh(
  { token, destroy, zam, garchig, tailbar, zagvariinZam, onFinish, baiguullaga, barilgiinId },
  ref
) {
  const [zagvariinId, setGereeniiZagvar] = React.useState(null);
  const [ognoo, setOgnoo] = React.useState(null);
  const [aldaa, setAldaa] = React.useState(null);
  const { t, i18n } = useTranslation();
```

### 2. Upload компонент

```javascript
<Upload
  type="drag"
  multiple={false}
  name="file"
  data={{
    barilgiinId,
    zagvariinId,
    ognoo: moment(ognoo).format("YYYY-MM-01 00:00:00"),
  }}
  action={`${url}/${zam}`}
  method="POST"
  headers={{ Authorization: `bearer ${token}` }}
  beforeUpload={(file) => {
    if (!zagvariinId) {
      toast.warning(t("Гэрээний загвар сонгоно уу"));
      return false;
    }
    return file;
  }}
  onChange={({ file }) => {
    if (file.response === "Amjilttai") {
      toast.success(t("Гэрээний мэдээлэл Excel -ээс амжилттай орууллаа"));
      _.isFunction(onFinish) && onFinish();
      destroy();
    } else if (!!file.response?.aldaa) setAldaa(file.response?.aldaa);
  }}
>
  <p className="ant-upload-drag-icon">
    <InboxOutlined />
  </p>
  <p className="ant-upload-text">{garchig}</p>
  <p className="ant-upload-hint">{tailbar}</p>
</Upload>
```

### 3. Upload стиль

```css
/* Ant Design Upload drag area */
.ant-upload-drag {
  @apply border-2 border-dashed border-gray-300 rounded-lg;
  @apply p-8 text-center hover:border-blue-400 transition-colors;
}

/* Drag icon */
.ant-upload-drag-icon {
  @apply text-4xl text-blue-500 mb-4;
}

/* Drag text */
.ant-upload-text {
  @apply text-base font-medium text-gray-700 dark:text-gray-200;
}

/* Drag hint */
.ant-upload-hint {
  @apply text-sm text-gray-400 mt-2;
}

/* Error display */
.max-h-52 {
  max-height: 13rem;
  @apply overflow-auto text-red-600 p-2 bg-red-50 rounded;
}
```

## Загвар татах (Template Download)

### 1. Функц

```javascript
function zagvarAvya() {
  uilchilgee(token)
    .get(`/${zagvariinZam}/${barilgiinId}`, { responseType: "blob" })
    .then(({ data }) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${zagvariinZam}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    });
}
```

### 2. Загвар татах холбоос

```javascript
<a
  className="cursor-pointer font-medium text-blue-600 hover:text-blue-800"
  onClick={zagvarAvya}
>
  Загвар татах
</a>
```

## Нэхэмжлэл загвар импорт

### 1. Бүрэлдэхүүн хэсэг

```javascript
import React from "react";
import { message, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { url } from "services/uilchilgee";
import { toast } from "sonner";
import { t } from "i18next";

function ZagvarExceleesOruulakh(
  { token, destroy, zam, garchig, tailbar, nekhemjlelZagvar, barilgiinId },
  ref
) {
  const [aldaa, setAldaa] = React.useState(null);

  React.useImperativeHandle(
    ref,
    () => ({
      khaaya() {
        destroy();
      },
    }),
    []
  );
```

### 2. Upload тохиргоо

```javascript
<Upload
  type="drag"
  className="mt-2"
  multiple={false}
  name="file"
  action={`${url}/${zam}`}
  method="POST"
  headers={{ Authorization: `bearer ${token}` }}
  data={{
    turul: "nekhemjlel",
    excelNer: nekhemjlelZagvar?.ner,
    barilgiinId: barilgiinId,
  }}
  onChange={({ file }) => {
    if (file.response === "Amjilttai") {
      toast.success(t("Excel -ээс загвар амжилттай орууллаа"));
    }
    if (!!file.response?.aldaa) setAldaa(file.response?.aldaa);
  }}
>
  <p className="ant-upload-drag-icon">
    <InboxOutlined />
  </p>
  <p className="ant-upload-text">{t(garchig)}</p>
  <p className="ant-upload-hint">{t(tailbar)}</p>
</Upload>
```

### 3. Алдааны мэдэгдэл

```javascript
{aldaa && (
  <div
    className="max-h-52 overflow-auto text-red-600"
    dangerouslySetInnerHTML={{
      __html: aldaa,
    }}
  />
)}
```

## Тайлан Экспорт (Excel Export)

### 1. ExcelJS хэрэглээ

```javascript
import ExcelJS from "exceljs";

// Шинэ workbook үүсгэх
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet("Тайлан");

// Багана тохиргоо
worksheet.columns = [
  { header: "№", key: "dugaar", width: 5 },
  { header: "Нэр", key: "ner", width: 20 },
  { header: "Дүн", key: "dun", width: 15 },
];

// Өгөгдөл нэмэх
worksheet.addRow({ dugaar: 1, ner: "Бараа 1", dun: 10000 });

// Файл хадгалах
workbook.xlsx.writeBuffer().then((buffer) => {
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tailan.xlsx";
  a.click();
  window.URL.revokeObjectURL(url);
});
```

### 2. Стиль тохируулах

```javascript
// Толгой мөрийн стиль
const headerRow = worksheet.getRow(1);
headerRow.font = { bold: true, size: 12 };
headerRow.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFB8CCE4" },
};
headerRow.alignment = { horizontal: "center", vertical: "middle" };

// Хил хүрээ
worksheet.eachRow({ includeEmpty: false }, (row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
});
```

## Дизайн загвар

### 1. Upload Area (Drag & Drop)

```css
/* Container */
.excel-upload-container {
  @apply p-6 border-2 border-dashed border-gray-300 rounded-lg;
  @apply hover:border-blue-500 hover:bg-blue-50 transition-all duration-300;
}

/* Dark mode */
.dark .excel-upload-container {
  @apply border-gray-600 bg-gray-800 hover:border-blue-400 hover:bg-gray-700;
}

/* Icon */
.upload-icon {
  @apply text-4xl text-blue-500 mb-4;
}

/* Text */
.upload-title {
  @apply text-lg font-semibold text-gray-800 dark:text-gray-100;
}

.upload-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-2;
}
```

### 2. Form хэсэг

```css
/* Grid layout */
.form-grid {
  @apply grid w-full grid-cols-2 gap-4 mb-5;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .form-grid {
    @apply grid-cols-1;
  }
}
```

### 3. Алдааны харуулах

```css
/* Error container */
.error-container {
  @apply max-h-52 overflow-auto text-red-600;
  @apply p-3 bg-red-50 border border-red-200 rounded-lg;
  @apply mt-4 text-sm;
}

.dark .error-container {
  @apply bg-red-900/20 border-red-800 text-red-400;
}
```

### 4. Загвар татах холбоос

```css
/* Download link */
.template-link {
  @apply cursor-pointer font-medium text-blue-600;
  @apply hover:text-blue-800 hover:underline;
  @apply transition-colors duration-200;
}

.dark .template-link {
  @apply text-blue-400 hover:text-blue-300;
}
```

## Интеграц

### 1. Modal дотор ашиглах

```javascript
import { Modal } from "antd";

function zaaltOruulakhExcel() {
  const footer = [
    <Button key="close" onClick={() => excelref.current.khaaya()}>
      {t("Хаах")}
    </Button>,
  ];
  
  modal({
    title: t("Excel-ээс оруулах"),
    footer,
    children: (
      <ZagvarExceleesOruulakh
        ref={excelref}
        token={token}
        zam="nekhemjlelZagvarExcel"
        garchig="Файл чирж оруулна уу"
        tailbar="Excel файлаа энд чирж оруулна уу"
        nekhemjlelZagvar={nekhemjlelZagvar}
        barilgiinId={barilgiinId}
      />
    ),
  });
}
```

### 2. ForwardRef хэрэглээ

```javascript
import React, { forwardRef, useImperativeHandle } from "react";

const ExcelImportComponent = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    khaaya() {
      destroy();
    },
    ilgeeye() {
      // Custom action
    },
  }));
  
  return <div>...</div>;
});

export default ExcelImportComponent;
```

### 3. Escape key дэмжлэг

```javascript
useEffect(() => {
  function keyUp(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      destroy();
    }
  }
  document.addEventListener("keyup", keyUp);
  return () => document.removeEventListener("keyup", keyUp);
}, []);
```

## Хэрэглээний жишээ

### 1. Бүрэн жишээ - Гэрээ импорт

```javascript
import React, { useState } from "react";
import { Modal, DatePicker, Select, Upload, Button } from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import moment from "moment";

const GereeImportModal = ({ visible, onClose, token, barilgiinId }) => {
  const [zagvariinId, setZagvariinId] = useState(null);
  const [ognoo, setOgnoo] = useState(null);
  const [aldaa, setAldaa] = useState(null);

  const uploadProps = {
    name: "file",
    action: `${process.env.NEXT_PUBLIC_API_URL}/geree/excelOruulakh`,
    headers: { Authorization: `bearer ${token}` },
    data: {
      barilgiinId,
      zagvariinId,
      ognoo: ognoo ? moment(ognoo).format("YYYY-MM-01 00:00:00") : null,
    },
    beforeUpload: (file) => {
      if (!zagvariinId) {
        message.warning("Гэрээний загвар сонгоно уу");
        return false;
      }
      return true;
    },
    onChange: ({ file }) => {
      if (file.status === "done") {
        message.success("Гэрээ амжилттай импортлогдлоо");
        onClose();
      } else if (file.status === "error") {
        setAldaa(file.response?.aldaa || "Алдаа гарлаа");
      }
    },
  };

  return (
    <Modal
      title="Excel-ээс гэрээ импорт"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Хаах
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <DatePicker.MonthPicker
            placeholder="Сар сонгох"
            onChange={setOgnoo}
            className="w-full"
          />
          <Select
            placeholder="Гэрээний загвар"
            onChange={setZagvariinId}
            className="w-full"
          >
            <Select.Option value="1">Стандарт</Select.Option>
            <Select.Option value="2">Түрээс</Select.Option>
          </Select>
        </div>

        <Upload.Dragger {...uploadProps} className="excel-upload-container">
          <p className="upload-icon">
            <InboxOutlined />
          </p>
          <p className="upload-title">Excel файлаа энд чирж оруулна уу</p>
          <p className="upload-subtitle">Эсвэл дарж файл сонгоно уу</p>
        </Upload.Dragger>

        {aldaa && (
          <div className="error-container">
            {aldaa}
          </div>
        )}

        <Button
          type="link"
          icon={<DownloadOutlined />}
          className="template-link"
        >
          Загвар татах
        </Button>
      </div>
    </Modal>
  );
};

export default GereeImportModal;
```

### 2. Экспорт жишээ

```javascript
import ExcelJS from "exceljs";

const exportToExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Гүйлгээний түүх");

  // Багана тодорхойлох
  worksheet.columns = [
    { header: "№", key: "dugaar", width: 5 },
    { header: "Огноо", key: "ognoo", width: 12 },
    { header: "Гүйлгээний дугаар", key: "guilgeeniiDugaar", width: 20 },
    { header: "Харилцагч", key: "khariltsagch", width: 25 },
    { header: "Тайлбар", key: "tailbar", width: 30 },
    { header: "Дүн", key: "dun", width: 15 },
    { header: "Төлөв", key: "tuluv", width: 12 },
  ];

  // Өгөгдөл нэмэх
  data.forEach((item, index) => {
    worksheet.addRow({
      dugaar: index + 1,
      ognoo: moment(item.ognoo).format("YYYY-MM-DD"),
      guilgeeniiDugaar: item.guilgeeniiDugaar,
      khariltsagch: item.khariltsagch,
      tailbar: item.tailbar,
      dun: item.dun,
      tuluv: item.tuluv,
    });
  });

  // Толгой мөрийн стиль
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // Хил хүрээ нэмэх
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
  });

  // Файл татах
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "guilgeenii_tuukh.xlsx");
};
```

## Best Practices

### 1. Алдаа барих

```javascript
const handleUpload = ({ file }) => {
  if (file.status === "done") {
    toast.success("Амжилттай импортлогдлоо");
  } else if (file.status === "error") {
    const errorMsg = file.response?.aldaa || "Алдаа гарлаа";
    toast.error(errorMsg);
    setAldaa(errorMsg);
  }
};
```

### 2. Validation

```javascript
const beforeUpload = (file) => {
  const isExcel =
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";
  
  if (!isExcel) {
    message.error("Зөвхөн Excel файл оруулна уу!");
    return false;
  }
  
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("Файлын хэмжээ 2MB-аас бага байх ёстой!");
    return false;
  }
  
  return true;
};
```

### 3. Token security

```javascript
const headers = {
  Authorization: `bearer ${token}`,
};
```

### 4. Loading state

```javascript
const [uploading, setUploading] = useState(false);

<Upload
  onChange={({ file }) => {
    if (file.status === "uploading") {
      setUploading(true);
    } else {
      setUploading(false);
    }
  }}
>
  <Button icon={<UploadOutlined />} loading={uploading}>
    {uploading ? "Уншиж байна..." : "Файл сонгох"}
  </Button>
</Upload>
```

## Troubleshooting

### 1. CORS алдаа

**Problem**: `Access-Control-Allow-Origin` алдаа

**Solution**: 
```javascript
// API серверийн тохиргоо шалгах
// headers дээр authorization зөв илгээж байгаа эсэх
headers: { 
  Authorization: `bearer ${token}`,
  "Content-Type": "multipart/form-data"
}
```

### 2. Файл хэмжээ

**Problem**: Файл хэт том

**Solution**:
```javascript
beforeUpload={(file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    message.error("Файлын хэмжээ 5MB-аас бага байх ёстой!");
    return false;
  }
  return true;
}}
```

### 3. Format алдаа

**Problem**: Excel биш файл оруулсан

**Solution**:
```javascript
const allowedTypes = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

beforeUpload={(file) => {
  if (!allowedTypes.includes(file.type)) {
    message.error("Зөвхөн .xlsx эсвэл .xls файл оруулна уу!");
    return false;
  }
  return true;
}}
```

## Future Enhancements

### 1. Planned Features

- CSV импорт/экспорт дэмжлэг
- Batch upload (олон файл)
- Excel preview харах
- Import progress bar
- Data validation improvements

### 2. Performance

- Chunk upload for large files
- Web Workers for Excel processing
- Client-side data validation
- Caching for templates

## Conclusion

Excel импорт/экспорт функц нь "Turees" системд чухал хэсэг бөгөөд Ant Design-ийн Upload компонент, ExcelJS болон xlsx-js-style сангуудыг ашиглан бий болгосон. Drag-and-drop интерфэйстэй, алдааны мэдээлэл харуулдаг, dark mode дэмждэг, хэрэглэхэд хялбар шийдэл юм.


