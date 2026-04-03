# Zassan Tuukh (Edit History) - Implementation Guide

Complete documentation for the Edit History tracking system that records and displays all modifications made to contracts, areas, and penalties.

## Overview

**Zassan Tuukh** (Зассан түүх) is an audit trail system that tracks every modification made to records in the system. It provides:

- **Change Tracking**: Records all edits with before/after values
- **Filterable History**: Search by date, employee, or record type
- **Detailed Comparison**: Side-by-side view of changes
- **Complex Object Support**: Handles nested data like expenses, segments, discounts

## Architecture

### File Structure

```
pages/khyanalt/zassanTuukh/
├── index.js                              # Main page component
components/pageComponents/zassanTuukh/
├── ZassanMedegdelKharakh.js              # Change detail modal
```

### Data Flow

```
User Edit Action
    ↓
Backend saves to /zassanBarimt (audit collection)
    ↓
useJagsaalt hook fetches history
    ↓
Table displays edit records
    ↓
Modal shows detailed field-by-field comparison
```

## Core Implementation

### 1. Main Page Component

```jsx
import { Button, Card, DatePicker, Select, Table } from "antd";
import Admin from "components/Admin";
import moment from "moment";
import useJagsaalt from "hooks/useJagsaalt";
import React, { useMemo, useState } from "react";
import shalgaltKhiikh from "services/shalgaltKhiikh";
import { EyeOutlined } from "@ant-design/icons";
import { modal } from "components/ant/Modal";
import ZassanDelgerenguiKharakh from "components/pageComponents/zassanTuukh/ZassanMedegdelKharakh";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;
const order = { createdAt: -1 };  // Newest first

// Searchable fields
const searchKeys = ["className", "ajiltniiNer", "classDugaar"];

// Record types filter
const turluud = [
  { turul: "Geree", text: "Гэрээ" },           // Contract
  { turul: "Talbai", text: "Талбай бүртгэл" }, // Area registration
  { turul: "Aldangi", text: "Алданги" },       // Penalty
];

function ZassanTuukh() {
  const { t } = useTranslation();
  const { token, ajiltan, baiguullaga, barilgiinId } = useAuth();
  const [ajiltankhaikh, setAjiltankhaikh] = useState();
  const [turul, setTurul] = useState();
  const ref = React.useRef();
  
  // Default date range: last month to today
  const [shuukhOgnoo, setShuukhOgnoo] = useState([
    moment().subtract(1, "months"),
    moment(),
  ]);

  // Build query with filters
  const query = useMemo(() => {
    return {
      baiguullagiinId: baiguullaga?._id,
      barilgiinId: barilgiinId,
      ...(ajiltankhaikh && { ajiltniiId: ajiltankhaikh }),
      classType: turul,
      createdAt: shuukhOgnoo
        ? {
            $gte: moment(shuukhOgnoo[0]).format("YYYY-MM-DD 00:00:00"),
            $lte: moment(shuukhOgnoo[1]).format("YYYY-MM-DD 23:59:59"),
          }
        : undefined,
    };
  }, [ajiltankhaikh, shuukhOgnoo, turul, baiguullaga, barilgiinId]);

  // Fetch edit history
  const zassanBarimt = useJagsaalt(
    "/zassanBarimt",
    query,
    order,
    undefined,
    searchKeys
  );
  
  // Fetch employee list for filter
  const ajiltanJagsaalt = useJagsaalt("/ajiltan");

  // Open detail modal
  function medeelelKharakh(mur) {
    const footer = [
      <Button onClick={() => ref.current.khaaya()}>{t("Хаах")}</Button>,
    ];
    modal({
      title: t("Дэлгэрэнгүй Мэдээлэл"),
      content: (
        <ZassanDelgerenguiKharakh
          ref={ref}
          data={mur}
          token={token}
          barilgiinId={barilgiinId}
          baiguullaga={baiguullaga}
          ajiltan={ajiltan}
        />
      ),
      width: "80vw",
      footer,
    });
  }

  // ... columns and render
}
```

### 2. Table Columns

```jsx
const columns = useMemo(() => {
  return [
    {
      title: t("Огноо"),           // Date
      dataIndex: "classOgnoo",
      align: "center",
      width: "3rem",
      render: (a) => moment(a).format("YYYY-MM-DD"),
    },
    {
      title: t("Төрөл"),           // Type
      dataIndex: "className",
      align: "left",
      width: "3rem",
    },
    {
      title: t("Дугаар"),          // Number
      width: "5rem",
      dataIndex: "classDugaar",
      align: "center",
    },
    {
      title: t("Зассан ажилтан"),  // Edited by
      dataIndex: "ajiltniiNer",
      align: "left",
      width: "3rem",
    },
    {
      title: t("Зассан огноо"),    // Edit date
      dataIndex: "createdAt",
      align: "center",
      width: "3rem",
      render: (data) => moment(data).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: t("Өөрчлөлт"),        // Changes
      width: "2rem",
      align: "center",
      render(a, record) {
        return (
          <Button
            className="dark:bg-gray-700"
            shape="circle"
            size="small"
            icon={
              <EyeOutlined
                style={{ fontSize: "16px" }}
                className="dark:bg-gray-700"
                onClick={() => medeelelKharakh(record)}
              />
            }
          />
        );
      },
    },
  ];
});
```

### 3. UI Layout

```jsx
return (
  <Admin
    title={t("Зассан түүх")}
    khuudasniiNer="zassanTuukh"
    onSearch={(search) =>
      zassanBarimt.setKhuudaslalt((a) => ({
        ...a,
        search,
        khuudasniiDugaar: 1,
      }))
    }
    loading={zassanBarimt.isValidating}
    className="p-0 md:p-4"
  >
    <Card className="col-span-12 rounded-md bg-white dark:bg-gray-900">
      {/* Filter Section */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        
        {/* Date Range Filter */}
        <RangePicker
          style={{ marginBottom: "20px" }}
          size="middle"
          value={shuukhOgnoo}
          onChange={ognooShuultOnChange}
        />
        
        {/* Employee Filter */}
        <Select
          className="w-full sm:w-36"
          placeholder={t("Ажилтан")}
          onChange={(v) => setAjiltankhaikh(v)}
          allowClear
        >
          {ajiltanJagsaalt?.jagsaalt.map((a) => (
            <Select.Option key={a._id} value={a._id}>
              {a.ner}
            </Select.Option>
          ))}
        </Select>
        
        {/* Type Filter */}
        <Select
          className="w-full sm:w-36"
          placeholder={t("Төрөл")}
          onChange={(v) => setTurul(v)}
          allowClear
        >
          {turluud.map((a) => (
            <Select.Option value={a.turul}>{t(a.text)}</Select.Option>
          ))}
        </Select>
      </div>

      {/* History Table */}
      <Table
        bordered
        size="small"
        className="hidden overflow-auto md:block"
        columns={columns}
        scroll={{ y: "calc(100vh - 20rem)" }}
        dataSource={zassanBarimt?.jagsaalt}
        rowKey={(row) => row._id}
        pagination={{
          current: Number(zassanBarimt?.data?.khuudasniiDugaar),
          pageSize: zassanBarimt?.data?.khuudasniiKhemjee,
          total: zassanBarimt?.data?.niitMur,
          showSizeChanger: true,
        }}
      />
    </Card>
  </Admin>
);
```

## Change Detail Modal (ZassanMedegdelKharakh)

### Overview

Displays a side-by-side comparison of all field changes with special handling for complex nested objects.

### Component Structure

```jsx
import React, { useImperativeHandle, useState } from "react";
import { Form } from "antd";
import moment from "moment";
import formatNumber from "tools/function/formatNumber";
import useGereeniiZagvar from "hooks/useGereeniiZagvar";
import useAktiinZagvar from "hooks/useAktiinZagvar";

function ZassanMedegdelKharakh(
  { token, barilgiinId, baiguullaga, data, ajiltan, destroy },
  ref
) {
  const [form] = Form.useForm();
  
  // For tracking complex object IDs
  const [zardluudId, setZardluudId] = useState([]);
  const [segmentuudId, setSegmentuudId] = useState([]);
  const [khungulultuudId, setKhungulultuudId] = useState([]);

  // Expose close method to parent
  useImperativeHandle(ref, () => ({
    khaaya() {
      destroy();
    },
  }));

  // Escape key closes modal
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

  // ... render logic
}

export default React.forwardRef(ZassanMedegdelKharakh);
```

### Change Comparison Table

```jsx
<div className="flex dark:text-gray-400">
  <div className="h-[600px] w-full overflow-y-scroll pr-3">
    
    {/* Header Info */}
    <div className="flex w-full pl-1 pr-1">
      <div className="mr-5 flex flex-col">
        <div className="flex gap-2">
          <div className="font-bold">{t("Төрөл")}:</div>
          <div>{data.className}</div>
        </div>
        <div className="flex gap-2">
          <div className="font-bold">{t("Дугаар")}:</div>
          <div>{data.classDugaar}</div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex gap-2">
          <div className="font-bold">{t("Зассан ажилтан")}:</div>
          <div>{data.ajiltniiNer}</div>
        </div>
        <div className="flex gap-2">
          <div className="font-bold">{t("Зассан огноо")}:</div>
          <div>{moment(data.createdAt).format("YYYY-MM-DD HH:mm")}</div>
        </div>
      </div>
    </div>

    {/* Changes Table */}
    <table className="w-full font-semibold">
      <thead>
        <tr className="flex border-b">
          <th className="w-2/12 overflow-hidden border-r p-1 text-center">
            {t("Талбарын нэр")}  {/* Field Name */}
          </th>
          <th className="w-5/12 overflow-hidden border-r p-1 text-center">
            {t("Өмнөх утга")}    {/* Previous Value */}
          </th>
          <th className="w-5/12 overflow-hidden p-1 text-center">
            {t("Шинэ утга")}     {/* New Value */}
          </th>
        </tr>
      </thead>
      <tbody>
        {data?.uurchlult
          ?.filter(
            (data) =>
              data.talbar !== "gereeniiTuukhuud" &&
              data.talbar !== "talbainIdnuud" &&
              data.talbar !== "avlaga"
          )
          .map((a) => (
            <tr className="flex border-b border-gray-200 bg-gray-50 
                         text-gray-700 hover:bg-green-100 
                         dark:bg-gray-700 dark:text-gray-400">
              <td className="flex w-2/12 items-center justify-center 
                           overflow-hidden border-l border-r p-1">
                <div>{a.talbarNer}</div>
              </td>
              <td className="w-5/12 overflow-hidden border-r p-1 text-right">
                {/* Previous value rendering based on type */}
                {renderValue(a.umnukhUtga, a.utganiiTurul, a.talbar, "prev")}
              </td>
              <td className="w-5/12 overflow-hidden border-r p-1 text-right">
                {/* New value rendering based on type */}
                {renderValue(a.shineUtga, a.utganiiTurul, a.talbar, "new")}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
</div>
```

## Value Type Rendering

### Simple Types

```jsx
// Number formatting
if (a.utganiiTurul === "number") {
  return formatNumber(value, 2);
}

// Date formatting
if (a.utganiiTurul === "date") {
  return moment(value).format("YYYY-MM-DD");
}

// Reference lookup (Contract template)
if (a.talbar === "gereeniiZagvariinId") {
  return gereeniiZagvarGaralt?.jagsaalt
    .filter((data) => data._id === value)
    .map((b) => b.ner);
}

// Reference lookup (Act template)
if (a.talbar === "aktiinZagvariinId") {
  return aktiinZagvarGaralt?.jagsaalt
    .filter((data) => data._id === value)
    .map((b) => b.ner);
}
```

### Complex Objects

#### 1. Expenses (zardluud)

```jsx
if (a.utganiiTurul === "object" && a.talbar === "zardluud") {
  return (
    <table className="w-full">
      <thead>
        <tr className="flex">
          <th className="w-1/3 overflow-hidden border-r p-1 text-center">
            {t("Нэр")}       {/* Name */}
          </th>
          <th className="w-1/6 overflow-hidden border-r p-1 text-center">
            {t("Төрөл")}     {/* Type */}
          </th>
          <th className="w-1/4 overflow-hidden border-r p-1 text-center">
            {t("Үнэ")}       {/* Price */}
          </th>
          <th className="w-1/4 overflow-hidden p-1 text-center">
            {t("Төлөх дүн")} {/* Payment Amount */}
          </th>
        </tr>
      </thead>
      <tbody>
        {zardluudId?.map((z) => {
          const items = JSON.parse(value)?.filter((b) => b._id === z);
          return items?.length > 0 ? (
            items.map((b) => (
              <tr className="flex border-t">
                <td className="w-1/3 overflow-hidden border-r p-1 text-left">
                  {b.ner}
                </td>
                <td className="w-1/6 overflow-hidden border-r p-1 text-center">
                  {b.turul}
                </td>
                <td className="w-1/4 overflow-hidden border-r p-1 text-right">
                  {formatNumber(
                    b.turul === "Дурын" ? b.dun : b.tariff,
                    2
                  )}
                </td>
                <td className="w-1/4 overflow-hidden p-1 text-right">
                  {formatNumber(b.tulukhDun, 2)}
                </td>
              </tr>
            ))
          ) : (
            <tr className="flex border-t">
              <td className="w-1/3 overflow-hidden border-r p-1">&nbsp;</td>
              <td className="w-1/6 overflow-hidden border-r p-1"></td>
              <td className="w-1/4 overflow-hidden border-r p-1"></td>
              <td className="w-1/4 overflow-hidden p-1"></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

#### 2. Segments (segmentuud)

```jsx
if (a.utganiiTurul === "object" && a.talbar === "segmentuud") {
  return (
    <table className="w-full">
      <thead>
        <tr className="flex">
          <td className="w-1/3 overflow-hidden p-1 text-center">
            {t("Нэр")}   {/* Name */}
          </td>
          <td className="w-2/3 overflow-hidden p-1 text-center">
            {t("Утга")}  {/* Value */}
          </td>
        </tr>
      </thead>
      <tbody>
        {segmentuudId?.map((z) => {
          const items = JSON.parse(value)?.filter((b) => b._id === z);
          return items?.length > 0 ? (
            items.map((b) => (
              <tr className="flex border-t">
                <td className="w-1/3 overflow-hidden border-r p-1 text-left">
                  {b.ner}
                </td>
                <td className="w-2/3 overflow-hidden p-1 text-center">
                  {typeof b.utga === "number" 
                    ? formatNumber(b.utga, 2) 
                    : b.utga}
                </td>
              </tr>
            ))
          ) : (
            <tr className="flex border-t">
              <td className="w-1/3 overflow-hidden border-r p-1">&nbsp;</td>
              <td className="w-2/3 overflow-hidden p-1"></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

#### 3. Discounts (khungulultuud)

```jsx
if (a.utganiiTurul === "object" && a.talbar === "khungulultuud") {
  return (
    <table className="w-full">
      <thead>
        <tr className="flex">
          <td className="w-1/4 overflow-hidden p-1 text-center">
            {t("Эхлэх огноо")}      {/* Start Date */}
          </td>
          <td className="w-1/4 overflow-hidden p-1 text-center">
            {t("Дуусах огноо")}     {/* End Date */}
          </td>
          <td className="w-1/6 overflow-hidden p-1 text-center">
            {t("Хувь")}             {/* Percentage */}
          </td>
          <td className="w-1/6 overflow-hidden p-1 text-center">
            {t("Төрөл")}            {/* Type */}
          </td>
          <td className="w-1/6 overflow-hidden p-1 text-center">
            {t("Дүн")}              {/* Amount */}
          </td>
        </tr>
      </thead>
      <tbody>
        {khungulultuudId?.map((z) => {
          const items = JSON.parse(value)?.filter((b) => b._id === z);
          return items?.length > 0 ? (
            items.map((b) => (
              <tr className="flex border-t">
                <td className="w-1/4 overflow-hidden border-r p-1 text-center">
                  {moment(b.ognoonuud?.[0]).format("YYYY-MM-DD")}
                </td>
                <td className="w-1/4 overflow-hidden border-r p-1 text-center">
                  {moment(b.ognoonuud?.[1]).format("YYYY-MM-DD")}
                </td>
                <td className="w-1/6 overflow-hidden border-r p-1 text-center">
                  {formatNumber(b.khungulukhKhuvi, 2)}%
                </td>
                <td className="w-1/6 overflow-hidden border-r p-1 text-center">
                  {b.turul === "turees" ? "Түрээс" : b.turul}
                </td>
                <td className="w-1/6 overflow-hidden p-1 text-right">
                  {formatNumber(b.khungulultiinDun, 2)}
                </td>
              </tr>
            ))
          ) : (
            // Empty row placeholder
            <tr className="flex border-t">
              <td className="w-1/3 overflow-hidden border-r p-1">&nbsp;</td>
              <td className="w-2/3 overflow-hidden p-1"></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

## Backend API

### Endpoint

```
GET /zassanBarimt
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `baiguullagiinId` | string | Organization ID (required) |
| `barilgiinId` | string | Building ID (required) |
| `ajiltniiId` | string | Filter by employee ID |
| `classType` | string | Filter by type: "Geree", "Talbai", "Aldangi" |
| `createdAt` | object | Date range with `$gte` and `$lte` |
| `search` | string | Search in className, ajiltniiNer, classDugaar |
| `sort` | object | Sort order: `{ createdAt: -1 }` |

### Response Structure

```json
{
  "jagsaalt": [
    {
      "_id": "record_id",
      "className": "Geree",
      "classDugaar": "G-2024-001",
      "classOgnoo": "2024-01-15",
      "ajiltniiNer": "Баясгалан",
      "createdAt": "2024-01-20T10:30:00.000Z",
      "uurchlult": [
        {
          "talbar": "talbainKhemjee",
          "talbarNer": "Талбайн хэмжээ",
          "utganiiTurul": "number",
          "umnukhUtga": "100.5",
          "shineUtga": "125.5"
        },
        {
          "talbar": "zardluud",
          "talbarNer": "Зардлууд",
          "utganiiTurul": "object",
          "umnukhUtga": "[{\"_id\":\"z1\",\"ner\":\"Цахилгаан\"}]",
          "shineUtga": "[{\"_id\":\"z1\",\"ner\":\"Цахилгаан\"},{\"_id\":\"z2\",\"ner\":\"Ус\"}]"
        }
      ]
    }
  ],
  "khuudasniiDugaar": 1,
  "khuudasniiKhemjee": 20,
  "niitMur": 100
}
```

### Change Object Schema

```typescript
interface ChangeRecord {
  talbar: string;           // Field key
  talbarNer: string;        // Field display name
  utganiiTurul: "string" | "number" | "date" | "object" | "boolean";
  umnukhUtga: string;       // Previous value (JSON string for objects)
  shineUtga: string;        // New value (JSON string for objects)
}
```

## Backend Implementation (Node.js/Express)

### Middleware to Track Changes

```javascript
// middleware/auditTrail.js
const ZassanBarimt = require('../models/ZassanBarimt');

async function trackChanges(req, res, next) {
  const originalSend = res.json;
  
  res.json = async function(data) {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const changes = [];
      
      // Compare original and updated data
      for (const [key, newValue] of Object.entries(req.body)) {
        if (JSON.stringify(req.originalDoc[key]) !== JSON.stringify(newValue)) {
          changes.push({
            talbar: key,
            talbarNer: getFieldName(key),  // Map to display name
            utganiiTurul: getValueType(newValue),
            umnukhUtga: JSON.stringify(req.originalDoc[key]),
            shineUtga: JSON.stringify(newValue)
          });
        }
      }
      
      // Save audit record if there are changes
      if (changes.length > 0) {
        await ZassanBarimt.create({
          baiguullagiinId: req.body.baiguullagiinId,
          barilgiinId: req.body.barilgiinId,
          className: req.body.className || 'Geree',
          classDugaar: req.body.dugaar,
          classOgnoo: req.body.ognoo,
          ajiltniiId: req.user._id,
          ajiltniiNer: req.user.ner,
          uurchlult: changes,
          createdAt: new Date()
        });
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
}

function getValueType(value) {
  if (typeof value === 'number') return 'number';
  if (value instanceof Date) return 'date';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'object') return 'object';
  return 'string';
}
```

### Model Schema

```javascript
// models/ZassanBarimt.js
const mongoose = require('mongoose');

const zassanBarimtSchema = new mongoose.Schema({
  baiguullagiinId: { type: mongoose.Schema.Types.ObjectId, required: true },
  barilgiinId: { type: mongoose.Schema.Types.ObjectId, required: true },
  className: { type: String, required: true },      // Geree, Talbai, Aldangi
  classDugaar: { type: String },                     // Record number
  classOgnoo: { type: Date },                       // Record date
  ajiltniiId: { type: mongoose.Schema.Types.ObjectId },
  ajiltniiNer: { type: String },
  uurchlult: [{                                      // Changes array
    talbar: String,                                 // Field key
    talbarNer: String,                              // Field display name
    utganiiTurul: String,                           // Value type
    umnukhUtga: String,                             // Previous value
    shineUtga: String                               // New value
  }],
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
zassanBarimtSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
zassanBarimtSchema.index({ createdAt: -1 });
zassanBarimtSchema.index({ ajiltniiId: 1 });
zassanBarimtSchema.index({ className: 1 });

module.exports = mongoose.model('ZassanBarimt', zassanBarimtSchema);
```

## Key Features

1. **Automatic Change Detection**: Backend middleware tracks all modifications
2. **Type-Safe Rendering**: Numbers formatted, dates localized, objects parsed
3. **Complex Object Comparison**: Side-by-side table comparison for nested data
4. **Employee Attribution**: Records who made each change
5. **Date Range Filtering**: Find changes within specific periods
6. **Keyboard Navigation**: ESC key closes modal
7. **Dark Mode Support**: Full dark theme compatibility

## Usage Example

```javascript
// When updating a contract
const updatedContract = await Geree.findByIdAndUpdate(
  id,
  { 
    talbainKhemjee: 125.5,  // Changed from 100.5
    zardluud: [...]         // Added new expense
  },
  { new: true }
);

// Audit record automatically created:
// {
//   className: "Geree",
//   classDugaar: "G-2024-001",
//   ajiltniiNer: "Баясгалан",
//   uurchlult: [
//     { talbar: "talbainKhemjee", umnukhUtga: "100.5", shineUtga: "125.5" },
//     { talbar: "zardluud", utganiiTurul: "object", ... }
//   ]
// }
```
