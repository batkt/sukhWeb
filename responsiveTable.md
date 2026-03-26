# Responsive Table Sizing Control

A guide for implementing responsive tables that adapt to screen sizes - showing full width on large screens and auto-shrinking on small screens.

## Core Concepts

### 1. Container-Based Responsive Tables

Use percentage-based widths and overflow handling:

```jsx
<div className="w-full overflow-x-auto">
  <table className="w-full min-w-[800px]">
    {/* table content */}
  </table>
</div>
```

**Key Classes:**
- `w-full` - Full width of parent container
- `overflow-x-auto` - Horizontal scroll on small screens
- `min-w-[800px]` - Minimum width to maintain readability

### 2. CSS Grid-Based Responsive Tables

For modern layouts using CSS Grid:

```jsx
<div className="grid w-full grid-cols-1">
  <div className="overflow-x-auto">
    <table className="w-full">
      {/* table content */}
    </table>
  </div>
</div>
```

### 3. Flex Container with Responsive Table

```jsx
<div className="flex w-full flex-col">
  <div className="w-full overflow-hidden overflow-x-auto">
    <table className="w-full table-auto">
      {/* table content */}
    </table>
  </div>
</div>
```

## Ant Design Table Specific

### Basic Responsive Setup

```jsx
import { Table } from "antd";

function ResponsiveTable({ columns, data }) {
  return (
    <div className="w-full overflow-x-auto">
      <Table
        columns={columns}
        dataSource={data}
        scroll={{ x: "max-content" }}  // Horizontal scroll when needed
        className="min-w-[800px]"      // Minimum width before scrolling
      />
    </div>
  );
}
```

### Screen-Responsive Column Hiding

```jsx
const columns = [
  {
    title: "Name",
    dataIndex: "name",
    // Always visible
  },
  {
    title: "Email",
    dataIndex: "email",
    className: "hidden md:table-cell",  // Hide on mobile, show on medium+
  },
  {
    title: "Address",
    dataIndex: "address",
    className: "hidden lg:table-cell",  // Hide on mobile/tablet, show on large+
  },
];
```

### Responsive Column Widths

```jsx
const columns = [
  {
    title: "Name",
    dataIndex: "name",
    width: 150,           // Fixed width
  },
  {
    title: "Description",
    dataIndex: "description",
    width: "30%",         // Percentage width
  },
  {
    title: "Status",
    dataIndex: "status",
    width: "auto",        // Auto width based on content
  },
];
```

## Tailwind Responsive Patterns

### Standard Responsive Container

```jsx
<div className="
  w-full
  overflow-hidden
  overflow-x-auto
  sm:overflow-x-visible
  md:rounded-lg
  md:border
  md:border-gray-200
">
  <table className="
    w-full
    min-w-[600px]
    sm:min-w-full
    table-auto
  ">
    {/* table content */}
  </table>
</div>
```

### Card-Based Responsive Table

```jsx
<Card className="w-full">
  <div className="w-full overflow-x-auto">
    <Table
      columns={columns}
      dataSource={data}
      pagination={false}
      className="min-w-[700px] lg:min-w-full"
      scroll={{ x: true }}
    />
  </div>
</Card>
```

## Advanced Patterns

### Collapsible Columns on Mobile

```jsx
const ResponsiveTable = ({ data }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const allColumns = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Name", dataIndex: "name", width: 150 },
    { title: "Email", dataIndex: "email", width: 200 },
    { title: "Phone", dataIndex: "phone", width: 150 },
    { title: "Address", dataIndex: "address", width: 250 },
  ];

  // Show only essential columns on mobile
  const columns = isMobile 
    ? allColumns.filter(col => ["id", "name"].includes(col.dataIndex))
    : allColumns;

  return (
    <div className="w-full overflow-x-auto">
      <Table columns={columns} dataSource={data} />
    </div>
  );
};
```

### Horizontal Scroll with Shadow Indicators

```jsx
function TableWithScrollIndicators({ children }) {
  return (
    <div className="relative w-full">
      {/* Left shadow indicator */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 
        bg-gradient-to-r from-gray-100 to-transparent z-10 opacity-0" 
        id="scroll-left-indicator"
      />
      
      {/* Right shadow indicator */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 
        bg-gradient-to-l from-gray-100 to-transparent z-10" 
        id="scroll-right-indicator"
      />
      
      <div className="w-full overflow-x-auto" id="table-container">
        {children}
      </div>
    </div>
  );
}
```

### Responsive Fixed Columns

```jsx
<Table
  columns={columns}
  dataSource={data}
  scroll={{ x: 1200 }}
  className="w-full"
  // Fixed left column (e.g., Name)
  rowClassName={() => "whitespace-nowrap"}
/>
```

Column configuration with fixed columns:
```jsx
const columns = [
  {
    title: "Name",
    dataIndex: "name",
    fixed: "left",        // Fixed on left when scrolling
    width: 150,
  },
  {
    title: "Details",
    dataIndex: "details",
    // This column scrolls
  },
  {
    title: "Actions",
    dataIndex: "actions",
    fixed: "right",       // Fixed on right when scrolling
    width: 120,
  },
];
```

## CSS-Only Solutions

### Pure CSS Responsive Table

```css
/* styles.css */
.responsive-table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.responsive-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
}

/* Large screens */
@media (min-width: 1024px) {
  .responsive-table {
    min-width: 100%;
  }
}

/* Medium screens */
@media (max-width: 768px) {
  .responsive-table {
    font-size: 14px;
  }
  
  .responsive-table th,
  .responsive-table td {
    padding: 8px 12px;
  }
}
```

## Common Patterns in the Codebase

### Pattern 1: Hide Scrollbar but Keep Functionality

```jsx
<div className="w-full overflow-x-auto hide-scrollbar">
  <Table ... />
</div>

// CSS
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### Pattern 2: Grid Layout with Responsive Table

```jsx
<div className="cardgrid col-span-12">
  <Card className="w-full">
    <div className="w-full overflow-x-auto py-3">
      <Table 
        className="min-w-[800px]"
        scroll={{ x: "max-content" }}
        ...
      />
    </div>
  </Card>
</div>
```

### Pattern 3: Action Column Fixed Right

```jsx
const columns = [
  // ... other columns
  {
    title: "Үйлдэл",
    width: "15rem",
    align: "center",
    fixed: "right",
    render: (text, row) => (
      <div className="flex flex-row items-center justify-center">
        {/* action buttons */}
      </div>
    ),
  },
];
```

## Best Practices

1. **Always wrap tables in overflow container**
   ```jsx
   <div className="w-full overflow-x-auto">
     <table>...</table>
   </div>
   ```

2. **Set minimum widths appropriately**
   - Content-focused: `min-w-[600px]`
   - Data-heavy: `min-w-[1000px]`
   - Full-width: `min-w-full`

3. **Use responsive breakpoints**
   - `sm:` (640px+)
   - `md:` (768px+)
   - `lg:` (1024px+)
   - `xl:` (1280px+)

4. **Consider column priorities**
   - Essential columns: Always visible
   - Secondary columns: `hidden md:table-cell`
   - Detail columns: `hidden lg:table-cell`

5. **Test with real data**
   - Empty states
   - Long text content
   - Many columns
   - Small screens (320px)

## Utility Classes Reference

| Class | Purpose |
|-------|---------|
| `w-full` | Full width of parent |
| `min-w-[Xpx]` | Minimum width before scroll |
| `max-w-full` | Maximum width constraint |
| `overflow-x-auto` | Horizontal scroll when needed |
| `overflow-hidden` | Clip overflow content |
| `table-auto` | Auto column widths |
| `table-fixed` | Fixed column widths |
| `whitespace-nowrap` | Prevent text wrapping |

## Example: Complete Responsive Table Component

```jsx
import { Table } from "antd";
import { useTranslation } from "react-i18next";

function ResponsiveDataTable({ 
  columns, 
  data, 
  loading,
  minWidth = 800,
  scrollX = "max-content" 
}) {
  const { t } = useTranslation();

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200">
      <div className="w-full overflow-x-auto">
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: scrollX }}
          className={`min-w-[${minWidth}px]`}
          pagination={{
            className: "px-4",
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          locale={{
            emptyText: t("Мэдээлэл олдсонгүй"),
          }}
        />
      </div>
    </div>
  );
}

export default ResponsiveDataTable;
```

## Usage

```jsx
<ResponsiveDataTable
  columns={myColumns}
  data={myData}
  loading={isLoading}
  minWidth={1000}
  scrollX={1500}
/>
```
