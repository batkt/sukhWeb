# Negtgel Tailan (Consolidated Report) - Complete Implementation Guide

A comprehensive guide for implementing the Consolidated Financial Report page with dynamic columns, dark/light mode support, and advanced table features.

## Overview

The Negtgel Tailan (Consolidated Report) is a financial reporting page that displays rent/lease payment summaries by customer with dynamic monthly columns. It features:

- **Dynamic Column Generation**: Columns auto-generate based on available data months
- **Multi-Select Filtering**: Filter by customers and date ranges
- **Expandable Columns**: Toggle additional customer details columns
- **Excel Export**: Export report to Excel with formatting
- **Print Support**: Optimized print view with signatures
- **Dark/Light Mode**: Full theme support
- **Summary Row**: Totals calculation at the bottom

## Architecture

### File Structure

```
pages/khyanalt/tailan/
├── negtgelTailan.js          # Main page component
hooks/tailan/
├── useNegtgelTailan.js        # Data fetching hook
```

### Data Flow

```
User Filters (Date/Customer)
    ↓
useNegtgelTailan Hook (SWR)
    ↓
API: /negtgelTailanAvya
    ↓
Column Generation (Dynamic)
    ↓
Table Render with Summary
```

## Core Implementation

### 1. Main Page Component

```jsx
import shalgaltKhiikh from "services/shalgaltKhiikh";
import Admin from "components/Admin";
import local from "antd/lib/date-picker/locale/mn_MN";
import {
  DatePicker,
  Select,
  Table,
  Dropdown,
  Menu,
  Button,
  Spin,
  Checkbox,
  Tooltip,
  Table as AntdTable,
} from "antd";
import { Excel } from "antd-table-saveas-excel";
import uilchilgee, { aldaaBarigch } from "services/uilchilgee";
import formatNumber from "tools/function/formatNumber";
import useNegtgelTailan from "hooks/tailan/useNegtgelTailan";
import { useAuth } from "services/auth";
import React, { useMemo, useRef, useState } from "react";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import useJagsaalt from "hooks/useJagsaalt";
import BaganiinSongolt from "components/table/BaganiinSongolt";
import { useTranslation } from "react-i18next";

function negtgelTailan({ token }) {
  const { barilgiinId, baiguullaga, ajiltan } = useAuth();
  const [excelUnshijBaina, setExcelUnshijBaina] = useState(false);
  const [khadgalsanKhuudaslalt, setKhadgalsaKhuudaslalt] = useState(null);
  const [niitDunJagsaalt, setNiitDunJagsaalt] = useState([]);
  const [avlaga, setAvlaga] = useState([]);
  const [jagsaaltOgnoo, setJagsaaltOgnoo] = useState([]);
  const [shineBagana, setShineBagana] = useState([]);
  const { t } = useTranslation();

  const searchKeys = ["ner", "register", "customerTin", "gereeniiDugaar"];
  const [songogdsonIds, setSongogdsonIds] = useState([]);

  const printRef = useRef(null);
  const [ognoo, setOgnoo] = useState([
    moment().startOf("month"),
    moment().endOf("month"),
  ]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: "print",
  });

  const query = useMemo(() => {
    return {
      baiguullagiinId: baiguullaga?._id,
      barilgiinId: barilgiinId,
      ekhlekhOgnoo: ognoo && ognoo[0].format("YYYY-MM-DD 00:00:00"),
      duusakhOgnoo: ognoo && ognoo[1].format("YYYY-MM-DD 23:59:59"),
      khariltsagchiinId: songogdsonIds.length > 0 ? songogdsonIds : undefined,
    };
  }, [ognoo, baiguullaga, barilgiinId, songogdsonIds]);

  const { tailanGaralt, unshijBaina, setTailanKhuudaslalt } = useNegtgelTailan(
    token,
    query,
    searchKeys,
    500
  );

  // ... rest of implementation
}
```

### 2. Custom Hook - useNegtgelTailan

```jsx
import { useState } from "react";
import axios, { aldaaBarigch } from "services/uilchilgee";
import useSWR from "swr";

const searchGenerator = (search, fields) => {
  if (!!search && !!fields)
    return {
      $or: fields.map((key) => ({ [key]: { $regex: search, $options: "i" } })),
    };
  else return {};
};

const fetcher = (url, token, query, searchKeys, { search = "", ...khuudaslalt }) => {
  const searchQuery = searchGenerator(search, searchKeys);
  
  return axios(token)
    .post(url, {
      ...khuudaslalt,
      ...query,
      ...(Object.keys(searchQuery).length > 0 ? searchQuery : {}),
    })
    .then((res) => res.data)
    .catch(aldaaBarigch);
};

function useNegtgelTailan(token, query, searchKeys, khuudasniiKhemjee) {
  const [khuudaslalt, setTailanKhuudaslalt] = useState({
    khuudasniiKhemjee: khuudasniiKhemjee || 100,
    khuudasniiDugaar: 1,
    search: "",
  });
  
  const { data, mutate, isValidating } = useSWR(
    !!token
      ? ["/negtgelTailanAvya", token, query, searchKeys, khuudaslalt]
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  return {
    tailanGaralt: data,
    tailanMutate: mutate,
    unshijBaina: isValidating,
    setTailanKhuudaslalt,
  };
}

export default useNegtgelTailan;
```

## Dynamic Column Generation

### Core Column Structure

```jsx
const columns = useMemo(() => {
  var jagsaalt = [
    {
      title: "№",
      key: "index",
      align: "center",
      width: "3rem",
      className: "text-mashJijig",
      fixed: "left",
      render: (a, b, index) => index + 1,
    },
    {
      title: "Регистер/ТИН",
      dataIndex: "_id",
      width: "12rem",
      className: "text-mashJijig",
      ellipsis: true,
      align: "center",
      fixed: "left",
      render: (b) => <div className="flex justify-start">{b?.register}</div>,
    },
    {
      title: t("Харилцагч нэр"),
      dataIndex: "_id",
      className: "text-mashJijig",
      width: "12rem",
      align: "center",
      ellipsis: true,
      fixed: "left",
      render: (a) => <div className="flex justify-start truncate">{a?.ner}</div>,
    },
    {
      title: t("Талбайн хэмжээ"),
      className: "text-mashJijig",
      dataIndex: ["_id", "talbainKhemjee"],
      width: "8rem",
      ellipsis: true,
      align: "center",
      fixed: "left",
      render: (e) => formatNumber(e, 2),
    },
    {
      title: t("Түрээс үнэ"),
      className: "text-mashJijig",
      dataIndex: ["_id", "talbainNegjUne"],
      width: "8rem",
      ellipsis: true,
      align: "center",
      fixed: "left",
      render: (e) => formatNumber(e, 2),
    },
  ];

  // Add expandable columns
  jagsaalt = [...jagsaalt, ...shineBagana];

  // Generate dynamic month columns
  var avlaga = [];
  var jagsaaltOgnoo = [];
  
  (Array.isArray(tailanGaralt) ? tailanGaralt : [])?.forEach((a) => {
    a.avlaga?.forEach((b) => {
      var tempOgnoo = moment(b.ognoo).format("YYYY-MM");
      if (jagsaaltOgnoo.filter((a) => a === tempOgnoo)?.length === 0)
        jagsaaltOgnoo.push(tempOgnoo);
      if (
        avlaga.filter((c) => c.tailbar === b.tailbar && c.ognoo === tempOgnoo)
          ?.length === 0
      ) {
        if (b.tailbar?.includes("Менежментийн төлбөр"))
          avlaga.push({
            tailbar: "Менежмент нэгж",
            ognoo: tempOgnoo,
            index: Number(tempOgnoo?.split("-")[1]),
          });
        avlaga.push({
          tailbar: b.tailbar,
          ognoo: tempOgnoo,
          index: Number(tempOgnoo?.split("-")[1]),
        });
      }
    });
  });

  avlaga.sort((a, b) => a.index - b.index);
  setJagsaaltOgnoo(jagsaaltOgnoo);
  setAvlaga(avlaga);

  // Generate month group columns with children
  var temp = [];
  jagsaaltOgnoo.sort();
  jagsaaltOgnoo.forEach((a) => {
    var col = {
      title: a,  // YYYY-MM format
      dataIndex: "avlaga",
      className: "text-mashJijig",
      align: "center",
      ellipsis: true,
      children: avlaga
        .filter((v) => v.ognoo === a)
        .map((assessment) => ({
          title: assessment.tailbar,
          className: "text-mashJijig",
          dataIndex: "avlaga",
          align: "center",
          width: "12rem",
          summary: true,
          render: (values) => {
            // Calculate and render payment amounts
            if (assessment.tailbar === "Менежмент нэгж") {
              var valFilter = values?.filter(
                (e) =>
                  e.tailbar?.includes("Менежментийн төлбөр") &&
                  moment(e.ognoo).format("YYYY-MM") === a &&
                  e.tulukhDun > 0
              );
              var dun = valFilter?.reduce((a, b) => a + b.tulukhDun, 0);
              return (
                <div className="flex justify-center truncate">
                  {valFilter?.length > 0
                    ? formatNumber(dun / (valFilter[0]?.talbainKhemjee || 1) || 0)
                    : ""}
                </div>
              );
            } else {
              var valFilterDun = values?.filter(
                (s) =>
                  s.tailbar === assessment.tailbar &&
                  moment(s.ognoo).format("YYYY-MM") === a &&
                  s.tulukhDun > 0
              );
              return (
                <div className="flex justify-end truncate">
                  {valFilterDun?.length > 0
                    ? formatNumber(valFilterDun?.reduce((a, b) => a + b.tulukhDun, 0))
                    : ""}
                </div>
              );
            }
          },
        })),
    };
    temp.push(col);
  });

  // Add total column
  temp.push({
    title: t("Нийт"),
    className: "text-mashJijig",
    dataIndex: "niitTulukhDun",
    width: "8rem",
    ellipsis: true,
    align: "right",
    fixed: "right",
    render: (e) => formatNumber(e, 2),
  });

  jagsaalt = [...jagsaalt, ...temp];
  return jagsaalt;
}, [shineBagana, tailanGaralt]);
```

## Dark/Light Mode Table Design

### Responsive Table Container

```jsx
<div className="text-mashJijig col-span-12 mt-12 flex items-center justify-center 2xl:mt-0">
  <Table
    sticky={{ offsetHeader: 0 }}
    scroll={{ y: "calc(100vh - 22rem)", x: "calc(100vw - 25rem)" }}
    tableLayout="fixed"
    bordered
    size="small"
    className="
      overflow-auto text-xs
      /* Dark mode support */
      [&_.ant-table]:bg-white dark:[&_.ant-table]:bg-gray-800
      [&_.ant-table-cell]:text-gray-900 dark:[&_.ant-table-cell]:text-white
      [&_.ant-table-thead>tr>th]:bg-gray-50 dark:[&_.ant-table-thead>tr>th]:bg-gray-900
      [&_.ant-table-thead>tr>th]:text-gray-900 dark:[&_.ant-table-thead>tr>th]:text-white
      [&_.ant-table-tbody>tr:hover>td]:bg-gray-100 dark:[&_.ant-table-tbody>tr:hover>td]:bg-gray-700
      [&_.ant-table-summary]:bg-gray-50 dark:[&_.ant-table-summary]:bg-gray-900
      [&_.ant-pagination]:bg-white dark:[&_.ant-pagination]:bg-gray-800
    "}
    rowClassName={(record, index) =>
      `${index % 2 === 0 
        ? "bg-white dark:bg-gray-800" 
        : "bg-gray-50 dark:bg-gray-700/50"
      } text-gray-900 dark:text-white transition-colors`
    }
    pagination={{
      current: tailanGaralt?.khuudasniiDugaar,
      total: tailanGaralt?.length,
      pageSizeOptions: [100, 300, 500],
      defaultPageSize: [500],
      showSizeChanger: true,
      className: "bg-white dark:bg-gray-800 px-4",
    }}
    summary={(e) => (
      <AntdTable.Summary 
        className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" 
        fixed={"bottom"}
      >
        <AntdTable.Summary.Cell index={0} colSpan={1}>
          <div className="space-x-2 truncate text-base font-bold text-gray-900 dark:text-white">
            {t("Нийт")}
          </div>
        </AntdTable.Summary.Cell>
        {/* ... other summary cells with dark mode classes */}
      </AntdTable.Summary>
    )}
    dataSource={tailanGaralt || []}
    columns={columns}
  />
</div>
```

### Column Header Dark Mode

```jsx
const columns = [
  {
    title: "№",
    key: "index",
    align: "center",
    width: "3rem",
    className: "text-mashJijig bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
    fixed: "left",
    render: (a, b, index) => index + 1,
  },
  // ... other columns with dark mode classes
];
```

## UI Components

### Filter Section with Dark Mode

```jsx
<div className="col-span-12 grid grid-cols-2 items-center gap-5 px-5 md:px-0 lg:flex">
  <DatePicker.RangePicker
    className="col-span-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
    locale={local}
    value={ognoo}
    onChange={setOgnoo}
  />
  <Select
    bordered={false}
    className="overflow-y-scroll bg-white dark:bg-gray-800 rounded-md md:w-1/4 
      border border-gray-300 dark:border-gray-600"
    style={{ textOverflow: "ellipsis" }}
    showSearch
    mode="multiple"
    filterOption={(o) => o}
    allowClear={true}
    onSearch={(search) =>
      khariltsagchiinGaralt.setKhuudaslalt((a) => ({ ...a, search }))
    }
    onChange={(v) => setSongogdsonIds(v)}
    placeholder={t("Харилцагч сонгох")}
    dropdownClassName="dark:bg-gray-800 dark:text-white"
  >
    {khariltsagchiinGaralt?.jagsaalt?.map((data) => (
      <Select.Option
        key={!!data?.register ? data?.register : data?.customerTin}
        className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {data?.ner}
      </Select.Option>
    ))}
  </Select>
  
  {/* Action Buttons */}
  <div className="ml-auto flex gap-2">
    <button
      onClick={handlePrint}
      className="btn btn-outline-secondary mr-2 text-sm font-normal sm:w-auto
        text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <PrinterIcon className="mr-2 h-4 w-4" />
      Хэвлэх
    </button>
    
    <Dropdown
      overlay={
        <Menu 
          disabled={excelUnshijBaina}
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Menu.Item
            key="ExcelTatakh"
            onClick={() => exceleerTatya()}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Тайлан татах
          </Menu.Item>
        </Menu>
      }
      trigger={["click"]}
      className="cursor-pointer"
      disabled={excelUnshijBaina}
    >
      <button
        className="dropdown-toggle btn btn-outline-secondary h-8 w-full text-sm font-normal sm:w-auto
          bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
          border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {excelUnshijBaina ? (
          <Spin className="mr-3 h-[24px] w-[24px] text-blue-500 dark:text-blue-400" />
        ) : (
          <FileTextIcon className="mr-2 h-4 w-4" />
        )}
        Excel
        <ChevronDownIcon className="ml-auto h-4 w-4 sm:ml-2" />
      </button>
    </Dropdown>
  </div>

  {/* Column Selector */}
  <BaganiinSongolt
    shineBagana={shineBagana}
    setShineBagana={setShineBagana}
    columns={expandableColumns}
  />
</div>
```

## Expandable Columns (BaganiinSongolt)

```jsx
const expandableColumns = [
  {
    key: "gereeniiDugaar",
    title: t("Гэрээ №"),
    dataIndex: ["_id", "gereeniiDugaar"],
    className: "text-center bg-gray-50 dark:bg-gray-900",
    align: "center",
    ellipsis: true,
    width: "7rem",
  },
  {
    title: t("Гэрээний огноо"),
    dataIndex: ["_id", "gereeniiOgnoo"],
    ellipsis: true,
    width: "8rem",
    align: "center",
    className: "bg-gray-50 dark:bg-gray-900",
    render(date) {
      return moment(date).format("YYYY-MM-DD");
    },
  },
  {
    title: t("Овог"),
    dataIndex: ["_id", "ovog"],
    align: "center",
    ellipsis: true,
    width: "6rem",
    className: "bg-gray-50 dark:bg-gray-900",
  },
  {
    title: t("Утас"),
    dataIndex: ["_id", "utas"],
    align: "center",
    ellipsis: true,
    width: "6rem",
    className: "bg-gray-50 dark:bg-gray-900",
  },
  {
    title: t("И-мэйл"),
    dataIndex: ["_id", "mail"],
    align: "center",
    ellipsis: true,
    width: "6rem",
    className: "bg-gray-50 dark:bg-gray-900",
  },
  {
    title: t("Талбайн №"),
    dataIndex: ["_id", "talbainDugaar"],
    className: "text-center bg-gray-50 dark:bg-gray-900",
    align: "center",
    ellipsis: true,
    width: "7rem",
  },
];
```

## Excel Export

```jsx
function exceleerTatya() {
  const excel = new Excel();
  setExcelUnshijBaina(true);
  
  var excelCol = [
    {
      title: "Регистер/ТИН",
      dataIndex: "_id",
      render: (id) => id?.register,
    },
    {
      title: "Харилцагч нэр",
      dataIndex: "_id",
      render: (id) => id?.ner,
    },
    {
      title: "Талбайн хэмжээ",
      dataIndex: ["_id", "talbainKhemjee"],
      __numFmt__: "#,##0.00",
      __cellType__: "TypeNumeric",
      render: (une) => une || 0,
    },
    {
      title: "Түрээс үнэ",
      dataIndex: ["_id", "talbainNegjUne"],
      __style__: { h: "right" },
      __numFmt__: "#,##0.00",
      __cellType__: "TypeNumeric",
      render: (une) => une || 0,
    },
    ...excelNemekhCol,
  ];

  // Generate dynamic month columns
  jagsaaltOgnoo.forEach((a) => {
    var col = {
      title: a,
      dataIndex: "avlaga",
      children: avlaga
        .filter((v) => v.ognoo === a)
        .map((assessment) => ({
          title: assessment.tailbar,
          dataIndex: "avlaga",
          __style__: { h: "right", fontName: "arial" },
          __numFmt__: "#,##0.00",
          __cellType__: "TypeNumeric",
          render: (values) => {
            // Calculate totals
            var tempVal = values.filter(
              (value) =>
                moment(value.ognoo).format("YYYY-MM") === assessment.ognoo &&
                (value.tailbar === assessment.tailbar ||
                  (assessment.tailbar === "Менежмент нэгж" &&
                    value.tailbar?.includes("Менежментийн төлбөр")))
            );
            var sumTulukhDun = tempVal
              .filter((v) => v.tulukhDun > 0)
              .reduce((a, b) => a + b.tulukhDun, 0);
            return assessment.tailbar === "Менежмент нэгж"
              ? sumTulukhDun / (tempVal[0]?.talbainKhemjee || 1) || 0
              : sumTulukhDun || 0;
          },
        })),
    };
    excelCol.push(col);
  });

  excelCol.push({
    title: "Нийт",
    dataIndex: "niitTulukhDun",
    __style__: { h: "right" },
    __numFmt__: "#,##0.00",
    __cellType__: "TypeNumeric",
    render: (une) => une || 0,
  });

  excel
    .addSheet("Нэгтгэл тайлан")
    .addColumns(excelCol)
    .addDataSource(tailanGaralt)
    .saveAs("НэгтгэлТайлан.xlsx");
  
  setExcelUnshijBaina(false);
}
```

## Summary Row (Table Footer)

```jsx
summary={(e) => (
  <AntdTable.Summary 
    className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900" 
    fixed={"bottom"}
  >
    <AntdTable.Summary.Cell index={0} colSpan={1}>
      <div className="space-x-2 truncate text-base font-bold text-gray-900 dark:text-white">
        {t("Нийт")}
      </div>
    </AntdTable.Summary.Cell>
    <AntdTable.Summary.Cell index={1}></AntdTable.Summary.Cell>
    <AntdTable.Summary.Cell index={2}></AntdTable.Summary.Cell>
    <AntdTable.Summary.Cell index={3}>
      <div className="truncate text-center font-bold text-gray-900 dark:text-white">
        {formatNumber(
          e?.reduce((a, b) => a + (b?._id?.talbainKhemjee || 0), 0),
          2
        )}
      </div>
    </AntdTable.Summary.Cell>
    <AntdTable.Summary.Cell
      index={4}
      colSpan={shineBagana?.length > 0 ? shineBagana?.length + 1 : 1}
    ></AntdTable.Summary.Cell>
    {avlaga?.map((mur, index) => {
      var dun = niitDunJagsaalt
        ?.filter((a) => a.key === mur.ognoo + ";" + mur.tailbar)
        .reduce((a, b) => a + (b.dun || 0), 0);
      return (
        <AntdTable.Summary.Cell
          index={4 + shineBagana?.length + index + 1}
          key={index}
        >
          <div className="truncate text-right font-bold text-gray-900 dark:text-white">
            {formatNumber(dun)}
          </div>
        </AntdTable.Summary.Cell>
      );
    })}
    <AntdTable.Summary.Cell
      index={4 + niitDunJagsaalt?.length + shineBagana?.length + 1}
    >
      <div className="truncate text-right font-bold text-gray-900 dark:text-white">
        {formatNumber(
          e?.reduce((a, b) => a + (b?.niitTulukhDun || 0), 0),
          2
        )}
      </div>
    </AntdTable.Summary.Cell>
  </AntdTable.Summary>
)}
```

## Print Layout

```jsx
<div className="hidden">
  <div ref={printRef}>
    {/* Header */}
    <div className="flex w-full items-center justify-between text-sm">
      <div className="w-1/3 text-left text-sm">
        {ognoo ? (
          <div>
            Огноо: {moment(ognoo[0]).format("YYYY-MM-DD")}-{" "}
            {moment(ognoo[1]).format("YYYY-MM-DD")}
          </div>
        ) : (
          <div>{""}</div>
        )}
      </div>
      <div className="w-1/3 text-center text-sm font-bold">
        Нэгтгэл тайлан
      </div>
    </div>
    
    {/* Print Table */}
    <table className="w-full border-2 border-gray-500">
      <thead>
        <tr className="bg-gray-400 text-white">
          <th className="border border-gray-400 text-xs" rowSpan={2}>№</th>
          <th className="border border-gray-400 text-xs" rowSpan={2}>
            Харилцагчийн регистер/Бүртгэлийн дугаар
          </th>
          <th className="border border-gray-400 text-xs" rowSpan={2}>
            Харилцагч нэр
          </th>
          <th className="border border-gray-400 text-xs" rowSpan={2}>
            Талбайн хэмжээ
          </th>
          <th className="border border-gray-400 text-xs" rowSpan={2}>
            Түрээс үнэ
          </th>
          {/* Dynamic headers */}
          {jagsaaltOgnoo?.map((murOgnoo, index) => (
            <th
              key={index}
              className="border border-gray-400 text-xs"
              colSpan={avlaga?.filter((a) => a.ognoo === murOgnoo)?.length}
            >
              {murOgnoo}
            </th>
          ))}
          <th className="border border-gray-400 text-xs" rowSpan={2}>
            Нийт
          </th>
        </tr>
        <tr className="bg-gray-400 text-white">
          {avlaga?.map((murAvlaga, index) => (
            <th key={index} className="border border-gray-400 text-xs">
              {murAvlaga.tailbar}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Data rows */}
        {(Array.isArray(tailanGaralt) ? tailanGaralt : [])?.map((mur, index) => (
          <tr key={index} className="border-gray-500">
            <td className="border border-gray-400 text-center text-xs">
              {index + 1}
            </td>
            <td className="border border-gray-400 pl-4 text-xs">
              {mur?._id?.register}
            </td>
            <td className="border border-gray-400 text-xs">
              {mur?._id?.ner}
            </td>
            <td className="border border-gray-400 text-center text-xs">
              {formatNumber(mur?._id?.talbainKhemjee)}
            </td>
            <td className="border border-gray-400 text-center text-xs">
              {formatNumber(mur?._id?.talbainNegjUne)}
            </td>
            {/* Dynamic data cells */}
            {avlaga?.map((murAvlaga, idx) => {
              var tempAvlaga = mur.avlaga?.filter(
                (v) =>
                  moment(v.ognoo).format("YYYY-MM") === murAvlaga.ognoo &&
                  (v.tailbar === murAvlaga.tailbar ||
                    (murAvlaga.tailbar === "Менежмент нэгж" &&
                      v.tailbar?.includes("Менежментийн төлбөр")))
              );
              var sumTulukhDun = tempAvlaga
                .filter((v) => v.tulukhDun > 0)
                .reduce((a, b) => a + b.tulukhDun, 0);
              return (
                <th key={idx} className="border border-gray-400 text-xs">
                  {murAvlaga.tailbar === "Менежмент нэгж" ? (
                    <div className="flex justify-center truncate">
                      {tempAvlaga?.length > 0
                        ? formatNumber(
                            sumTulukhDun / (tempAvlaga[0]?.talbainKhemjee || 1) || 0
                          )
                        : ""}
                    </div>
                  ) : (
                    <div className="flex justify-end truncate">
                      {sumTulukhDun > 0 ? formatNumber(sumTulukhDun) : ""}
                    </div>
                  )}
                </th>
              );
            })}
            <td className="border border-gray-400 text-center text-xs">
              {formatNumber(mur?.niitTulukhDun)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        {/* Total row */}
        <tr>
          <td colSpan="1" className="border border-gray-400 text-xs">
            Нийт
          </td>
          <td></td>
          <td></td>
          <td className="border border-gray-400 text-center text-xs">
            {formatNumber(
              (Array.isArray(tailanGaralt) ? tailanGaralt : [])?.reduce(
                (a, b) => a + (b?._id?.talbainKhemjee || 0),
                0
              ),
              2
            )}
          </td>
          {/* ... other totals */}
          <td className="border border-gray-400 text-right text-xs">
            {formatNumber(
              (Array.isArray(tailanGaralt) ? tailanGaralt : [])?.reduce(
                (a, b) => a + (b?.niitTulukhDun || 0),
                0
              ),
              2
            )}
          </td>
        </tr>
      </tfoot>
    </table>
    
    {/* Signatures */}
    <table className="ml-4 mt-4">
      <tfoot>
        <tr>
          <td colSpan="3"></td>
          <td colSpan="3" className="text-right italic">
            Тайлан гаргасан:
          </td>
          <td>
            ................................/
            {ajiltan?.ovog && ajiltan?.ovog[0]}
            {ajiltan?.ovog && "."}
            {ajiltan?.ner}/
          </td>
        </tr>
        <tr>
          <td colSpan="3"></td>
          <td colSpan="3" className="text-right italic">
            Хянасан нягтлан бодогч:
          </td>
          <td> ................................</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>
```

## Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        mashJijig: ["10px", "12px"],
        mashJijigiinJijig: ["8px", "10px"],
      },
    },
  },
};
```

## API Endpoint

### Request

```http
POST /negtgelTailanAvya
Content-Type: application/json

{
  "baiguullagiinId": "string",
  "barilgiinId": "string",
  "ekhlekhOgnoo": "2024-01-01 00:00:00",
  "duusakhOgnoo": "2024-12-31 23:59:59",
  "khariltsagchiinId": ["id1", "id2"], // optional
  "khuudasniiDugaar": 1,
  "khuudasniiKhemjee": 500,
  "search": "optional search term",
  "$or": [
    { "ner": { "$regex": "search", "$options": "i" } },
    { "register": { "$regex": "search", "$options": "i" } }
  ]
}
```

### Response

```json
[
  {
    "_id": {
      "register": "АА00000000",
      "ner": "Customer Name",
      "talbainKhemjee": 100.5,
      "talbainNegjUne": 150000,
      "gereeniiDugaar": "G-001",
      "gereeniiOgnoo": "2024-01-15",
      "ovog": "Lastname",
      "utas": ["99119911"],
      "mail": "email@example.com",
      "talbainDugaar": "T-001"
    },
    "avlaga": [
      {
        "ognoo": "2024-01-01",
        "tailbar": "Түрээсийн төлбөр",
        "tulukhDun": 150000,
        "talbainKhemjee": 100.5
      },
      {
        "ognoo": "2024-01-01",
        "tailbar": "Менежментийн төлбөр",
        "tulukhDun": 50000,
        "talbainKhemjee": 100.5
      }
    ],
    "niitTulukhDun": 200000
  }
]
```

## Dependencies

```json
{
  "dependencies": {
    "antd": "^5.x",
    "moment": "^2.x",
    "swr": "^2.x",
    "react-to-print": "^2.x",
    "antd-table-saveas-excel": "^2.x",
    "tailwindcss": "^3.x"
  }
}
```

## Key Features Summary

1. **Dynamic Columns**: Auto-generates month-based columns from data
2. **Nested Headers**: Month groups contain payment type children
3. **Dark/Light Mode**: Full Tailwind dark: class support
4. **Responsive**: Horizontal scroll on small screens
5. **Summary Row**: Fixed bottom row with totals
6. **Excel Export**: Preserves formatting and formulas
7. **Print View**: Optimized layout with signatures
8. **Column Selection**: Toggle optional columns on/off
9. **Multi-Filter**: Date range + customer multi-select
10. **Loading States**: Spin indicators during data fetch

## CSS Classes Reference

| Class | Light Mode | Dark Mode | Purpose |
|-------|------------|-----------|---------|
| Table BG | `bg-white` | `dark:bg-gray-800` | Main table background |
| Header BG | `bg-gray-50` | `dark:bg-gray-900` | Column headers |
| Text | `text-gray-900` | `dark:text-white` | Primary text |
| Hover | `hover:bg-gray-100` | `dark:hover:bg-gray-700` | Row hover |
| Border | `border-gray-200` | `dark:border-gray-700` | Table borders |
| Summary BG | `bg-gray-50` | `dark:bg-gray-900` | Footer row |
