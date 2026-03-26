# Table Dark Mode Implementation

A guide for implementing dark mode support in tables using Tailwind CSS with Ant Design.

## Core Dark Mode Classes

### Background Colors

| Light Mode    | Dark Mode           | Usage                        |
| ------------- | ------------------- | ---------------------------- |
| `bg-white`    | `dark:bg-gray-800`  | Table background             |
| `bg-gray-50`  | `dark:bg-gray-900`  | Header background            |
| `bg-gray-100` | `dark:bg-gray-700`  | Row hover state              |
| `bg-gray-200` | `dark:bg-gray-800`  | Alternating row              |
| `bg-green-50` | `dark:bg-green-950` | Success/highlight background |

### Text Colors

| Light Mode       | Dark Mode             | Usage          |
| ---------------- | --------------------- | -------------- |
| `text-gray-900`  | `dark:text-white`     | Primary text   |
| `text-gray-700`  | `dark:text-gray-200`  | Secondary text |
| `text-gray-500`  | `dark:text-gray-400`  | Muted text     |
| `text-gray-400`  | `dark:text-gray-500`  | Disabled text  |
| `text-green-600` | `dark:text-green-400` | Success accent |
| `text-red-500`   | `dark:text-red-400`   | Error accent   |
| `text-blue-500`  | `dark:text-blue-400`  | Info accent    |

### Border Colors

| Light Mode         | Dark Mode               | Usage          |
| ------------------ | ----------------------- | -------------- |
| `border-gray-200`  | `dark:border-gray-700`  | Table borders  |
| `border-gray-300`  | `dark:border-gray-600`  | Cell borders   |
| `border-green-200` | `dark:border-green-800` | Accent borders |

## Ant Design Table Dark Mode

### Basic Dark Mode Table

```jsx
import { Table } from "antd";

function DarkModeTable({ columns, data }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <Table
        columns={columns}
        dataSource={data}
        className="dark-table"
        rowClassName={() =>
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        }
      />
    </div>
  );
}
```

### Row Alternating Colors with Dark Mode

```jsx
<Table
  columns={columns}
  dataSource={data}
  rowClassName={(record, index) => {
    const base =
      index % 2 === 0
        ? "bg-white dark:bg-gray-600"
        : "bg-gray-200 dark:bg-gray-800";
    return base;
  }}
/>
```

### Header Dark Mode

```jsx
const columns = [
  {
    title: "Name",
    dataIndex: "name",
    className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
  },
  {
    title: "Email",
    dataIndex: "email",
    className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
  },
];
```

## Complete Responsive Dark Mode Table

```jsx
import { Table } from "antd";

function ResponsiveDarkTable({ columns, data, loading }) {
  // Apply dark classes to column definitions
  const darkColumns = columns.map((col) => ({
    ...col,
    className: `
      bg-gray-50 dark:bg-gray-900 
      text-gray-900 dark:text-white 
      border-b border-gray-200 dark:border-gray-700
      ${col.className || ""}
    `,
  }));

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="w-full overflow-x-auto">
        <Table
          columns={darkColumns}
          dataSource={data}
          loading={loading}
          rowClassName={(record, index) => `
            ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}
            text-gray-900 dark:text-white
            hover:bg-gray-100 dark:hover:bg-gray-600
            transition-colors
          `}
          className="min-w-[800px]"
          scroll={{ x: "max-content" }}
          pagination={{
            className:
              "px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
          }}
        />
      </div>
    </div>
  );
}
```

## Action Buttons with Dark Mode

### Button Colors

```jsx
// Primary action
text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300

// Secondary action
text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300

// Danger action
text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300

// Neutral action
text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
```

### Action Column Example

```jsx
const actionColumn = {
  title: t("Үйлдэл"),
  width: "15rem",
  align: "center",
  fixed: "right",
  className: "bg-gray-50 dark:bg-gray-900",
  render: (text, row) => (
    <div className="flex flex-row items-center justify-center divide-x divide-gray-200 dark:divide-gray-700">
      {/* View history button */}
      <a
        onClick={() => viewHistory(row)}
        className="text-green-500 dark:text-green-400 hover:scale-110 px-[6px]"
      >
        <Tooltip title={t("Нэхэмжлэлийн түүх харах")}>
          <FolderIcon className="w-6 h-6" />
        </Tooltip>
      </a>

      {/* Send invoice button */}
      <a
        onClick={() => sendInvoice(row)}
        className="text-blue-500 dark:text-blue-400 hover:scale-110 px-[6px]"
      >
        <Tooltip title={t("Нэхэмжлэл илгээх")}>
          <MailIcon className="w-6 h-6" />
        </Tooltip>
      </a>

      {/* Delete button */}
      <a
        onClick={() => deleteRow(row)}
        className="text-red-500 dark:text-red-400 hover:scale-110 px-[6px]"
      >
        <Tooltip title={t("Устгах")}>
          <DeleteIcon className="w-6 h-6" />
        </Tooltip>
      </a>
    </div>
  ),
};
```

## Status Indicators with Dark Mode

### Progress Circle

```jsx
<Progress
  type="circle"
  percent={percentage}
  width={22}
  strokeColor={
    percentage < 0
      ? "rgba(245, 158, 18, 1)" // Warning - same for both modes
      : "rgba(16, 185, 129, 1)" // Success - same for both modes
  }
  trailColor={
    percentage === 0
      ? "rgba(239, 68, 68, 1)" // Error
      : undefined
  }
/>
```

### Status Badges

```jsx
// Success status
<span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
  {t("Актив")}
</span>

// Warning status
<span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
  {t("Хүлээгдэж байна")}
</span>

// Error status
<span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
  {t("Цуцлагдсан")}
</span>

// Neutral status
<span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
  {t("Идэвхгүй")}
</span>
```

## Card-Based Tables with Dark Mode

### Statistics Cards

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
  {stats.map((stat) => (
    <div
      key={stat.turul}
      className={`
        group relative cursor-pointer overflow-hidden rounded-2xl 
        transition-all duration-300 
        hover:-translate-y-2 hover:scale-105 hover:shadow-2xl 
        hover:shadow-gray-300 dark:hover:shadow-gray-800
        border-2 
        ${
          active
            ? "border-green-500 bg-green-50/60 dark:border-green-700 dark:bg-green-950/40"
            : "border-green-200 bg-green-50/60 dark:border-green-800 dark:bg-green-950/40"
        }
      `}
    >
      <div className="p-4">
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
          {stat.value}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {stat.label}
        </div>
      </div>
    </div>
  ))}
</div>
```

## Custom CSS for Ant Design Tables

### Global Dark Mode Styles

```css
/* styles.css */

/* Table container */
.ant-table {
  @apply bg-white dark:bg-gray-800;
}

/* Table header */
.ant-table-thead > tr > th {
  @apply bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700;
}

/* Table body */
.ant-table-tbody > tr > td {
  @apply text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700;
}

/* Row hover */
.ant-table-tbody > tr:hover > td {
  @apply bg-gray-100 dark:bg-gray-700;
}

/* Selected row */
.ant-table-tbody > tr.ant-table-row-selected > td {
  @apply bg-blue-50 dark:bg-blue-900/30;
}

/* Pagination */
.ant-pagination-item {
  @apply bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600;
}

.ant-pagination-item a {
  @apply text-gray-900 dark:text-white;
}

.ant-pagination-item-active {
  @apply bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600;
}

/* Empty state */
.ant-empty-description {
  @apply text-gray-500 dark:text-gray-400;
}
```

## Tooltips and Popovers

### Dark Mode Tooltips

```jsx
<Tooltip title={t("Хуулга харах")} overlayClassName="dark-tooltip">
  <Button
    className="
      bg-white dark:bg-gray-700 
      text-gray-900 dark:text-white
      border-gray-300 dark:border-gray-600
    "
  >
    {t("Харах")}
  </Button>
</Tooltip>
```

### Popover Content

```jsx
<Popover
  content={
    <div
      className="
      flex w-32 flex-col 
      bg-white dark:bg-gray-800 
      rounded-lg 
      shadow-lg
    "
    >
      <a
        className="
        flex cursor-pointer items-center space-x-2 
        rounded-lg p-2 
        hover:bg-green-100 dark:hover:bg-gray-700
        text-gray-900 dark:text-white
      "
      >
        <EditIcon />
        <span>{t("Засах")}</span>
      </a>
    </div>
  }
>
  <Button>{t("Үйлдэл")}</Button>
</Popover>
```

## Checkbox and Selection

### Row Selection with Dark Mode

```jsx
<Table
  rowSelection={{
    type: "checkbox",
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(selectedRowKeys, selectedRows);
    },
  }}
  columns={columns}
  dataSource={data}
  className="
    [&_.ant-checkbox-wrapper]:text-gray-900 
    dark:[&_.ant-checkbox-wrapper]:text-white
    [&_.ant-checkbox]:bg-white dark:[&_.ant-checkbox]:bg-gray-700
    [&_.ant-checkbox-checked_.ant-checkbox-inner]:bg-blue-500
  "
/>
```

## Loading States

### Skeleton Loading with Dark Mode

```jsx
<Table
  loading={{
    spinning: isLoading,
    indicator: <Spin className="text-blue-500 dark:text-blue-400" />,
  }}
  columns={columns}
  dataSource={data}
  className="
    [&_.ant-skeleton]:bg-gray-100 dark:[&_.ant-skeleton]:bg-gray-700
  "
/>
```

## Best Practices

### 1. Always Pair Light and Dark Classes

```jsx
// Good
className = "bg-white dark:bg-gray-800 text-gray-900 dark:text-white";

// Bad (incomplete)
className = "bg-white text-gray-900 dark:bg-gray-800"; // Missing dark:text
```

### 2. Use Semantic Color Names

```jsx
// Good - semantic colors
className = "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";

// Avoid - arbitrary colors
className = "bg-[#f0fdf4] dark:bg-[#14532d]";
```

### 3. Test Both Modes

```jsx
// Force dark mode for testing
<div className="dark">
  <YourTableComponent />
</div>
```

### 4. Use CSS Custom Properties for Complex Cases

```css
:root {
  --table-bg: #ffffff;
  --table-text: #111827;
  --table-border: #e5e7eb;
}

.dark {
  --table-bg: #1f2937;
  --table-text: #f9fafb;
  --table-border: #374151;
}

.responsive-table {
  background-color: var(--table-bg);
  color: var(--table-text);
  border-color: var(--table-border);
}
```

### 5. Handle Images and Icons

```jsx
// Icons with dark mode support
<svg className="text-gray-500 dark:text-gray-400">
  <path d="..." />
</svg>

// Images with dark mode filters
<Image
  src="/logo.png"
  className="dark:brightness-90 dark:contrast-125"
/>
```

## Complete Example

```jsx
import { Table, Card, Spin } from "antd";
import { useTranslation } from "react-i18next";

function DarkModeDataTable({ columns, data, loading, title, className = "" }) {
  const { t } = useTranslation();

  // Wrap column classes with dark mode
  const enhancedColumns = columns.map((col) => ({
    ...col,
    className: `
      bg-gray-50 dark:bg-gray-900 
      text-gray-900 dark:text-white
      font-semibold
      ${col.className || ""}
    `,
    render: col.render
      ? (text, record, index) => {
          const rendered = col.render(text, record, index);
          // Wrap cell content with dark text if it's a simple value
          if (typeof rendered === "string" || typeof rendered === "number") {
            return (
              <span className="text-gray-900 dark:text-white">{rendered}</span>
            );
          }
          return rendered;
        }
      : undefined,
  }));

  return (
    <Card
      className={`
        w-full 
        bg-white dark:bg-gray-800 
        border-gray-200 dark:border-gray-700
        ${className}
      `}
      title={
        title && <span className="text-gray-900 dark:text-white">{title}</span>
      }
    >
      <div className="w-full overflow-x-auto">
        <Table
          columns={enhancedColumns}
          dataSource={data}
          loading={{
            spinning: loading,
            indicator: <Spin className="text-blue-500 dark:text-blue-400" />,
          }}
          rowClassName={(record, index) => `
            ${
              index % 2 === 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-700/50"
            }
            text-gray-900 dark:text-white
            hover:bg-gray-100 dark:hover:bg-gray-600
            transition-colors duration-200
          `}
          className="min-w-[800px]"
          scroll={{ x: "max-content" }}
          pagination={{
            className: `
              px-4 
              bg-white dark:bg-gray-800 
              border-t border-gray-200 dark:border-gray-700
            `,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          locale={{
            emptyText: (
              <span className="text-gray-500 dark:text-gray-400">
                {t("Мэдээлэл олдсонгүй")}
              </span>
            ),
          }}
        />
      </div>
    </Card>
  );
}

export default DarkModeDataTable;
```

## Tailwind Dark Mode Configuration

Ensure your `tailwind.config.js` includes:

```js
module.exports = {
  darkMode: "class", // or "media" for system preference
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Custom dark mode colors if needed
      },
    },
  },
};
```

## Enabling Dark Mode

### Method 1: Class-based (Recommended)

```jsx
// Toggle dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
}

// Layout wrapper
<html className="dark">
  {" "}
  {/* or remove for light mode */}
  <body className="bg-white dark:bg-gray-900">{children}</body>
</html>;
```

### Method 2: System Preference

```css
/* tailwind.config.js */
module.exports = {
  darkmode: "media", // ...;;
}
```

This follows the user's OS preference automatically.
