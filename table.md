# Хүснэгт (Table) Бүрэлдэхүүн хэсэг

## Тойм

Энэхүү баримт бичиг нь "Turees" системд ашиглагдах хүснэгт бүрэлдэхүүн хэсгийн ажиллагаа, дизайн загвар, хэрэглээ зэрэг талаар дэлгэрэнгүй мэдээллийг агуулна. Системд Ant Design Table болон Custom HTML Table хоёуланг ашиглана.

## Технологи

- **UI Library**: Ant Design 4.24.16 (Table компонент)
- **Custom Tables**: Tailwind CSS ашиглан HTML table
- **Sorting**: Manual sort with useState
- **Pagination**: Ant Design Pagination
- **Scroll**: Virtual scroll with fixed headers

## Table төрлүүд

| Төрөл             | Ангилал                        | Хэрэглээ                           |
| ----------------- | ------------------------------ | ---------------------------------- |
| Ant Design Table  | `import { Table } from "antd"` | Бүртгэлийн жагсаалт, Camera хяналт |
| Custom HTML Table | `<table className="...">`      | Алдангийн түүх, тайлан             |
| Printable Table   | Custom with print styles       | Хэвлэх тайлан                      |

## Ant Design Table

### 1. Үндсэн бүрэлдэхүүн хэсэг

```javascript
import { Table } from "antd";
import React from "react";

const ZogsoolCameraTable = ({
  uilchluulegchGaralt,
  columns,
  onChangeTable,
  setUilchluulegchKhuudaslalt,
  isValidating,
  summary,
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <Table
        className="cameraTable mt-2"
        tableLayout="auto"
        dataSource={uilchluulegchGaralt?.jagsaalt}
        scroll={{ y: "calc(100vh - 47.5rem)" }}
        size="small"
        bordered
        rowKey={(row) => row._id}
        columns={columns}
        onChange={onChangeTable}
        loading={isValidating}
        summary={summary}
        rowClassName={(record, index) => {
          const d = record.tuukh[0];
          if (d?.tuluv === 0 && record.turul !== "Үнэгүй" && d?.tulukhDun)
            return "green";
        }}
        pagination={{
          current: uilchluulegchGaralt?.khuudasniiDugaar,
          pageSize: uilchluulegchGaralt?.khuudasniiKhemjee,
          total: uilchluulegchGaralt?.niitMur,
          showSizeChanger: true,
          onChange: (khuudasniiDugaar, khuudasniiKhemjee) =>
            setUilchluulegchKhuudaslalt((kh) => ({
              ...kh,
              khuudasniiDugaar,
              khuudasniiKhemjee,
            })),
        }}
      />
    </div>
  );
};
```

### 2. Columns тохиргоо

```javascript
const columns = [
  {
    title: "№",
    dataIndex: "dugaar",
    key: "dugaar",
    width: 60,
    align: "center",
  },
  {
    title: "Нэр",
    dataIndex: "ner",
    key: "ner",
    width: 150,
    ellipsis: true,
  },
  {
    title: "Огноо",
    dataIndex: "ognoo",
    key: "ognoo",
    width: 120,
    render: (text) => moment(text).format("YYYY-MM-DD"),
  },
  {
    title: "Төлөв",
    dataIndex: "tuluv",
    key: "tuluv",
    render: (tuluv) => (
      <Tag color={tuluv === 1 ? "green" : "red"}>
        {tuluv === 1 ? "Идэвхтэй" : "Идэвхгүй"}
      </Tag>
    ),
  },
  {
    title: "Үйлдэл",
    key: "action",
    width: 120,
    render: (_, record) => (
      <Space>
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => edit(record)}
        >
          Засах
        </Button>
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => remove(record)}
        >
          Устгах
        </Button>
      </Space>
    ),
  },
];
```

### 3. Table стиль

```css
/* Ant Design Table customization */
.ant-table {
  @apply bg-white dark:bg-gray-800;
}

/* Small size table */
.ant-table-small {
  @apply text-xs;
}

/* Bordered table */
.ant-table-bordered .ant-table-cell {
  @apply border-gray-200 dark:border-gray-600;
}

/* Header style */
.ant-table-thead > tr > th {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold;
}

/* Row hover */
.ant-table-tbody > tr:hover > td {
  @apply bg-gray-50 dark:bg-gray-600;
}

/* Row class - green highlight */
.green {
  @apply bg-green-100 dark:bg-green-900/30;
}

/* Pagination */
.ant-pagination {
  @apply mt-4;
}

.ant-pagination-item-active {
  @apply border-blue-500 bg-blue-500 text-white;
}
```

## Custom HTML Table

### 1. Бүрэн бүрэлдэхүүн хэсэг

```javascript
const TableContent = () => (
  <div className="mt-4 overflow-x-auto">
    <table className="w-full min-w-[50rem]">
      {/* Table Header */}
      <thead className="w-full">
        <tr className="flex min-w-[50rem] divide-x divide-white border-b border-gray-200 bg-gray-200 pr-1 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <td
            onClick={() => toggleSortOrder("ognoo")}
            className="min-w-[8rem] cursor-pointer overflow-hidden p-1 text-center"
          >
            Огноо
          </td>
          <td
            onClick={() => toggleSortOrder("ajiltan")}
            className="min-w-[8rem] cursor-pointer overflow-hidden p-1 text-center"
          >
            Ажилтан
          </td>
          <td
            onClick={() => toggleSortOrder("dun")}
            className="min-w-[8rem] cursor-pointer overflow-hidden p-1 text-center"
          >
            Дүн
          </td>
          <td className="w-full min-w-[8rem] overflow-hidden p-1 text-center">
            Тайлбар
          </td>
        </tr>
      </thead>

      {/* Table Body */}
      <tbody
        className="min-w-[50rem] overflow-y-scroll"
        style={{ height: "calc(90vh - 15rem)" }}
      >
        {sortedData?.map((a, i) => (
          <tr
            key={i}
            className="flex min-w-[50rem] divide-x border-b border-gray-200 bg-gray-50 text-gray-700 hover:bg-green-100 dark:bg-gray-700 dark:text-gray-400"
          >
            <td className="min-w-[8rem] overflow-hidden p-1 text-center">
              {moment(a.ognoo).format("YYYY-MM-DD")}
            </td>
            <td className="min-w-[8rem] overflow-hidden p-1">
              {a.guilgeeKhiisenAjiltniiNer}
            </td>
            <td className="min-w-[8rem] overflow-hidden p-1 text-end">
              {formatNumber(a.dun, 2)}
            </td>
            <td className="w-full min-w-[8rem] overflow-hidden p-1">
              {a.tailbar}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

### 2. Custom Table стиль

```css
/* Table container */
.table-container {
  @apply mt-4 overflow-x-auto;
}

/* Base table */
.custom-table {
  @apply w-full min-w-[50rem] border-collapse;
}

/* Table header */
.custom-table thead {
  @apply w-full sticky top-0 z-10;
}

.custom-table thead tr {
  @apply flex min-w-[50rem] divide-x divide-white border-b border-gray-200 
         bg-gray-200 pr-1 text-gray-700 dark:bg-gray-800 dark:text-gray-400;
}

.custom-table thead td {
  @apply overflow-hidden p-1 text-center font-medium select-none;
}

/* Sortable header */
.custom-table thead td[cursor-pointer] {
  @apply hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors;
}

/* Table body */
.custom-table tbody {
  @apply min-w-[50rem] overflow-y-scroll;
}

.custom-table tbody tr {
  @apply flex min-w-[50rem] divide-x border-b border-gray-200 
         bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-400;
}

/* Row hover */
.custom-table tbody tr:hover {
  @apply bg-green-100 dark:bg-green-900/30 transition-colors;
}

.custom-table tbody td {
  @apply overflow-hidden p-1;
}

/* Text alignment */
.text-center {
  @apply text-center;
}

.text-end {
  @apply text-right;
}

/* Column widths */
.col-w-8 {
  @apply min-w-[8rem];
}

.col-w-12 {
  @apply min-w-[12rem];
}

.col-w-16 {
  @apply min-w-[16rem];
}

.col-w-full {
  @apply w-full;
}
```

## Sort функц

### 1. Sorting logic

```javascript
const [sortOrders, setSortOrders] = useState({
  ognoo: null, // 'ascend' | 'descend' | null
  dun: null,
  ajiltan: null,
});

const [sortColumn, setSortColumn] = useState(null);

const toggleSortOrder = (column) => {
  setSortOrders((prev) => {
    const currentOrder = prev[column];
    let newOrder = null;

    if (!currentOrder) {
      newOrder = "ascend";
    } else if (currentOrder === "ascend") {
      newOrder = "descend";
    } else {
      newOrder = null;
    }

    return {
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: null }), {}),
      [column]: newOrder,
    };
  });

  setSortColumn(newOrder ? column : null);
};

const sortedData = useMemo(() => {
  if (!sortColumn || !sortOrders[sortColumn]) return data;

  const sorted = [...data].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Date comparison
    if (sortColumn === "ognoo") {
      aVal = moment(aVal).valueOf();
      bVal = moment(bVal).valueOf();
    }
    // Number comparison
    else if (["dun", "tulukhAldangi", "tulsunAldangi"].includes(sortColumn)) {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }
    // String comparison
    else {
      aVal = String(aVal || "").toLowerCase();
      bVal = String(bVal || "").toLowerCase();
    }

    if (aVal < bVal) return sortOrders[sortColumn] === "ascend" ? -1 : 1;
    if (aVal > bVal) return sortOrders[sortColumn] === "ascend" ? 1 : -1;
    return 0;
  });

  return sorted;
}, [data, sortColumn, sortOrders]);
```

### 2. Sort indicator

```javascript
const SortIndicator = ({ column, sortOrders }) => {
  const order = sortOrders[column];

  return (
    <span className="ml-1 text-xs">
      {order === "ascend" && "▲"}
      {order === "descend" && "▼"}
      {!order && "⇅"}
    </span>
  );
};

// Header дээр ашиглах
<td
  onClick={() => toggleSortOrder("ognoo")}
  className="min-w-[8rem] cursor-pointer overflow-hidden p-1 text-center"
>
  Огноо <SortIndicator column="ognoo" sortOrders={sortOrders} />
</td>;
```

## Хэвлэх Table (Print Table)

### 1. Print стиль

```javascript
const pageStyle = `
  @page {
    size: A4;
    margin: 15mm;
  }

  @media print {
    body, html {
      margin: 0;
      padding: 0;
    }
    .print-content {
      width: 100%;
      font-size: 11px;
      line-height: 1.3;
    }
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 15px;
    }
    .print-table th,
    .print-table td {
      border: 1px solid #000;
      padding: 3px;
      text-align: center;
      font-size: 9px;
    }
    .print-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .print-header {
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: bold;
    }
    .mb-8 {
      margin-bottom: 20px;
    }
  }
`;

const handlePrint = useReactToPrint({
  pageStyle,
  contentRef: printRef,
});
```

### 2. Print table бүрэлдэхүүн

```javascript
<div ref={printRef} className="print-content">
  <div className="print-header">
    Гүйлгээний түүх - {moment().format("YYYY-MM-DD")}
  </div>
  <table className="print-table">
    <thead>
      <tr>
        <th>№</th>
        <th>Огноо</th>
        <th>Ажилтан</th>
        <th>Дүн</th>
        <th>Тайлбар</th>
      </tr>
    </thead>
    <tbody>
      {data.map((item, index) => (
        <tr key={index}>
          <td>{index + 1}</td>
          <td>{moment(item.ognoo).format("YYYY-MM-DD")}</td>
          <td>{item.ajiltan}</td>
          <td>{formatNumber(item.dun, 2)}</td>
          <td>{item.tailbar}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## Дизайн систем

### 1. Light mode стиль

```css
/* Light theme table */
.table-light {
  /* Header */
  --table-header-bg: #e5e7eb; /* gray-200 */
  --table-header-text: #374151; /* gray-700 */

  /* Body */
  --table-body-bg: #f9fafb; /* gray-50 */
  --table-body-text: #374151; /* gray-700 */
  --table-row-hover: #dcfce7; /* green-100 */

  /* Border */
  --table-border: #e5e7eb; /* gray-200 */
  --table-divider: #ffffff; /* white */
}
```

### 2. Dark mode стиль

```css
/* Dark theme table */
.table-dark {
  /* Header */
  --table-header-bg: #1f2937; /* gray-800 */
  --table-header-text: #9ca3af; /* gray-400 */

  /* Body */
  --table-body-bg: #374151; /* gray-700 */
  --table-body-text: #9ca3af; /* gray-400 */
  --table-row-hover: rgba(16, 185, 129, 0.2); /* green-900/30 */

  /* Border */
  --table-border: #4b5563; /* gray-600 */
  --table-divider: #1f2937; /* gray-800 */
}
```

### 3. Tailwind классууд

```javascript
// Table wrapper
const tableWrapper = "mt-4 overflow-x-auto";

// Table base
const tableBase = "w-full min-w-[50rem] border-collapse";

// Header row
const headerRow =
  "flex min-w-[50rem] divide-x divide-white border-b border-gray-200 bg-gray-200 pr-1 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

// Header cell
const headerCell = "overflow-hidden p-1 text-center font-medium select-none";
const sortableHeader =
  "cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors";

// Body row
const bodyRow =
  "flex min-w-[50rem] divide-x border-b border-gray-200 bg-gray-50 text-gray-700 hover:bg-green-100 dark:bg-gray-700 dark:text-gray-400 transition-colors";

// Body cell
const bodyCell = "overflow-hidden p-1";
const bodyCellCenter = "overflow-hidden p-1 text-center";
const bodyCellEnd = "overflow-hidden p-1 text-end";

// Column widths
const colW8 = "min-w-[8rem]";
const colW12 = "min-w-[12rem]";
const colW16 = "min-w-[16rem]";
const colWFull = "w-full";

// Scrollable body
const scrollableBody = "min-w-[50rem] overflow-y-scroll";
```

## Хэрэглээний жишээ

### 1. Бүртгэлийн жагсаалт (Ant Design)

```javascript
import { Table, Tag, Space, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import moment from "moment";

const RegistrationTable = ({ data, loading, onEdit, onDelete }) => {
  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Гэрээний №",
      dataIndex: "gereeniiDugaar",
      key: "gereeniiDugaar",
      width: 120,
    },
    {
      title: "Харилцагч",
      dataIndex: "khariltsagch",
      key: "khariltsagch",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Огноо",
      dataIndex: "ognoo",
      key: "ognoo",
      width: 120,
      render: (text) => moment(text).format("YYYY-MM-DD"),
    },
    {
      title: "Төлөв",
      dataIndex: "tuluv",
      key: "tuluv",
      width: 100,
      render: (tuluv) => {
        const statusMap = {
          1: { color: "green", text: "Идэвхтэй" },
          0: { color: "red", text: "Идэвхгүй" },
          2: { color: "orange", text: "Хүлээгдэж байна" },
        };
        const status = statusMap[tuluv] || {
          color: "default",
          text: "Unknown",
        };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: "Үйлдэл",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Засах
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record)}
          >
            Устгах
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="_id"
        size="small"
        bordered
        scroll={{ x: 800, y: 400 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Нийт ${total} бичлэг`,
        }}
      />
    </div>
  );
};

export default RegistrationTable;
```

### 2. Алдангийн түүх (Custom Table with Sort)

```javascript
import React, { useState, useMemo } from "react";
import moment from "moment";
import formatNumber from "tools/function/formatNumber";

const AldangiHistoryTable = ({ data }) => {
  const [sortOrders, setSortOrders] = useState({
    ognoo: null,
    dun: null,
  });
  const [sortColumn, setSortColumn] = useState(null);

  const toggleSortOrder = (column) => {
    setSortOrders((prev) => {
      const currentOrder = prev[column];
      let newOrder = null;

      if (!currentOrder) newOrder = "ascend";
      else if (currentOrder === "ascend") newOrder = "descend";

      // Reset бусад баганыг
      const resetOrders = Object.keys(prev).reduce(
        (acc, key) => ({ ...acc, [key]: null }),
        {},
      );

      return { ...resetOrders, [column]: newOrder };
    });

    setSortColumn(newOrder ? column : null);
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortOrders[sortColumn]) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === "ognoo") {
        aVal = moment(aVal).valueOf();
        bVal = moment(bVal).valueOf();
      } else if (sortColumn === "dun") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) return sortOrders[sortColumn] === "ascend" ? -1 : 1;
      if (aVal > bVal) return sortOrders[sortColumn] === "ascend" ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortOrders]);

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[40rem]">
        <thead>
          <tr className="flex min-w-[40rem] divide-x divide-white border-b border-gray-200 bg-gray-200 pr-1 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <td
              onClick={() => toggleSortOrder("ognoo")}
              className="min-w-[8rem] cursor-pointer overflow-hidden p-1 text-center"
            >
              Огноо{" "}
              {sortOrders.ognoo === "ascend"
                ? "▲"
                : sortOrders.ognoo === "descend"
                  ? "▼"
                  : "⇅"}
            </td>
            <td className="min-w-[10rem] overflow-hidden p-1 text-center">
              Ажилтан
            </td>
            <td
              onClick={() => toggleSortOrder("dun")}
              className="min-w-[10rem] cursor-pointer overflow-hidden p-1 text-center"
            >
              Дүн{" "}
              {sortOrders.dun === "ascend"
                ? "▲"
                : sortOrders.dun === "descend"
                  ? "▼"
                  : "⇅"}
            </td>
            <td className="w-full min-w-[10rem] overflow-hidden p-1 text-center">
              Тайлбар
            </td>
          </tr>
        </thead>
        <tbody
          className="min-w-[40rem] overflow-y-scroll"
          style={{ height: "calc(80vh - 10rem)" }}
        >
          {sortedData?.map((item, index) => (
            <tr
              key={index}
              className="flex min-w-[40rem] divide-x border-b border-gray-200 bg-gray-50 text-gray-700 hover:bg-green-100 dark:bg-gray-700 dark:text-gray-400"
            >
              <td className="min-w-[8rem] overflow-hidden p-1 text-center">
                {moment(item.ognoo).format("YYYY-MM-DD")}
              </td>
              <td className="min-w-[10rem] overflow-hidden p-1">
                {item.ajiltan}
              </td>
              <td className="min-w-[10rem] overflow-hidden p-1 text-end">
                {formatNumber(item.dun, 2)}
              </td>
              <td className="w-full min-w-[10rem] overflow-hidden p-1">
                {item.tailbar}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AldangiHistoryTable;
```

## Pagination

### 1. Server-side pagination

```javascript
import { Table } from "antd";
import { useState } from "react";

const ServerPaginatedTable = ({ fetchData }) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const handleTableChange = async (newPagination, filters, sorter) => {
    setLoading(true);

    const response = await fetchData({
      page: newPagination.current,
      pageSize: newPagination.pageSize,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });

    setData(response.data);
    setPagination({
      ...newPagination,
      total: response.total,
    });
    setLoading(false);
  };

  return (
    <Table
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={handleTableChange}
      scroll={{ y: 400 }}
    />
  );
};
```

### 2. Pagination стиль

```css
/* Ant Design Pagination customization */
.ant-pagination {
  @apply mt-4 flex justify-end;
}

.ant-pagination-item {
  @apply border-gray-300 dark:border-gray-600;
}

.ant-pagination-item a {
  @apply text-gray-700 dark:text-gray-300;
}

.ant-pagination-item-active {
  @apply border-blue-500 bg-blue-500;
}

.ant-pagination-item-active a {
  @apply text-white;
}

.ant-pagination-prev,
ant-pagination-next {
  @apply border-gray-300 dark:border-gray-600;
}

.ant-pagination-disabled {
  @apply opacity-50;
}
```

## Best Practices

### 1. Performance optimization

```javascript
// Virtual scrolling for large datasets
<Table
  scroll={{ y: 400 }}
  virtual // For very large datasets
  pagination={false} // Disable pagination for virtual scroll
/>;

// Memoize columns
const columns = useMemo(
  () => [
    // column definitions
  ],
  [],
);

// Memoize data
const tableData = useMemo(() => {
  return data.map((item, index) => ({
    ...item,
    key: item._id || index,
  }));
}, [data]);
```

### 2. Accessibility

```javascript
// Proper ARIA labels
<Table
  aria-label="Гэрээний жагсаалт"
  summary="Нийт 100 бичлэг"
>

// Keyboard navigation support
<td
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      toggleSortOrder(column);
    }
  }}
>
```

### 3. Responsive design

```javascript
// Horizontal scroll on mobile
<div className="w-full overflow-x-auto">
  <table className="min-w-[50rem]">{/* table content */}</table>
</div>;

// Responsive columns
const columns = [
  {
    title: "Нэр",
    dataIndex: "ner",
    responsive: ["md"], // Only show on medium+ screens
  },
];
```

## Troubleshooting

### 1. Scroll issues

**Problem**: Header and body not aligned

**Solution**:

```javascript
<Table scroll={{ x: "max-content", y: 400 }} tableLayout="fixed" />
```

### 2. Dark mode flickering

**Problem**: Table colors flashing on load

**Solution**:

```css
/* Use CSS variables for smooth transitions */
.ant-table {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
```

### 3. Sort not working

**Problem**: Custom sort not updating

**Solution**:

```javascript
// Ensure sortedData is properly memoized
const sortedData = useMemo(() => {
  if (!sortColumn) return data;
  return [...data].sort(/* sort logic */);
}, [data, sortColumn, sortOrders]); // Include all dependencies
```

## Future Enhancements

### 1. Planned Features

- Column resize
- Column reorder (drag & drop)
- Advanced filtering
- Export to Excel directly from table
- Row expansion (expandable rows)

### 2. Improvements

- Better virtual scrolling
- Improved mobile experience
- Enhanced accessibility
- More sort options (multi-column sort)

## Conclusion

"Хүснэгт" бүрэлдэхүүн хэсэг нь "Turees" системд чухал хэсэг бөгөөд Ant Design Table болон Custom HTML Table хоёуланг ашиглан бий болгосон. Sort, pagination, scroll дэмжлэгтэй, dark mode тохиромжтой, responsive дизайнтай, хэрэглэхэд хялбар шийдэл юм.
