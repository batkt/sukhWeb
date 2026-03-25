# Товч (Button) Бүрэлдэхүүн хэсэг

## Тойм

Энэхүү баримт бичиг нь "Товч" (Button) бүрэлдэхүүн хэсгийн ажиллагаа, дизайн загвар, хэрэглээ, хэлбэр төрөл зэрэг талаар дэлгэрэнгүй мэдээллийг агуулна. Системд Ant Design-ийн Button бүрэлдэхүүн хэсгийг ашигладаг бөгөөд Tailwind CSS-тэй хослуулан өөрийн гэсэн дизайн загварыг бий болгосон.

## Технологи

- **Framework**: Next.js 16.1.1
- **UI Library**: Ant Design 4.24.16
- **Styling**: Tailwind CSS 3.1.8
- **Icons**: @ant-design/icons, react-icons

## Button төрлүүд

### 1. Үндсэн төрлүүд

| Төрөл | Ангилал | Хэрэглээ |
|-------|---------|----------|
| Primary | `type="primary"` | Гол үйлдэл, хадгалах, илгээх |
| Default | `type="default"` | Хоёрдогч үйлдэл, буцах |
| Dashed | `type="dashed"` | Зөвхөн тодорхой тохиолдолд |
| Text | `type="text"` | Минималист, зөвхөн текст |
| Link | `type="link"` | Холбоос мэт харагдах |

### 2. Хэмжээ

```javascript
import { Button } from "antd";

<Button size="small">Жижиг</Button>
<Button size="middle">Дунд</Button>
<Button size="large">Том</Button>
```

## Дизайн загварууд

### 1. Гол үйлдэл (Primary Action)

```javascript
<Button
  type="primary"
  icon={<ArrowRightOutlined />}
  onClick={() => form.submit()}
>
  {t("Үргэлжлүүлэх")}
</Button>
```

**Стиль харагдах байдал:**
- Background: Ant Design default primary (#1890ff)
- Text: White
- Border: None
- Icon: ArrowRightOutlined

### 2. Dark Mode дэмжих Primary

```javascript
<Button
  type="primary"
  className="bg-emerald-500 hover:bg-emerald-400 border-none rounded-lg font-bold shadow-lg shadow-emerald-500/20 dark:bg-emerald-600 dark:hover:bg-emerald-500"
  icon={<RightOutlined className="text-[10px]" />}
>
  Дараах
</Button>
```

**Стиль харагдах байдал:**
- Background: Emerald-500 (#10b981)
- Hover: Emerald-400 (#34d399)
- Border-radius: rounded-lg (8px)
- Font-weight: bold (700)
- Shadow: Shadow-lg + emerald tint
- Dark mode: Emerald-600 (#059669)

### 3. Буцах товч (Back Button)

```javascript
<Button
  onClick={prev}
  icon={<ArrowLeftOutlined />}
  className="text-gray-400 dark:!border-white dark:!bg-gray-800 dark:!text-gray-400"
>
  {t("Буцах")}
</Button>
```

**Стиль харагдах байдал:**
- Text: Gray-400 (#9ca3af)
- Light mode: Default Ant Design style
- Dark mode: 
  - Background: Gray-800 (#1f2937)
  - Border: White
  - Text: Gray-400

### 4. Буцах (Tour Style)

```javascript
<Button 
  size="small" 
  onClick={() => setCurrentStep(prev => prev - 1)} 
  className="rounded-lg font-bold border-none bg-slate-200/50 dark:bg-slate-800 dark:text-gray-400"
>
  Буцах
</Button>
```

**Стиль харагдах байдал:**
- Size: small
- Background: Slate-200/50 (light) / Slate-800 (dark)
- Border: None
- Border-radius: rounded-lg (8px)
- Text: Dark mode - Gray-400

### 5. Хаах товч (Close/Cancel)

```javascript
<Button onClick={() => ref.current.khaaya()}>
  {t("Хаах")}
</Button>
```

```javascript
<Button 
  type="text" 
  size="small" 
  icon={<CloseOutlined className="text-gray-400 group-hover:text-emerald-500" />} 
  onClick={onClose} 
  className="hover:bg-emerald-500/10 rounded-lg"
>
</Button>
```

### 6. Илгээх товч (Submit)

```javascript
<Button
  className="space-x-2"
  icon={<FiSend />}
  type="primary"
  onClick={() => sanalKhuseltRef.current.ilgeeye()}
>
  {t("Илгээх")}
</Button>
```

### 7. Text Button (Notification)

```javascript
<Button 
  type="text" 
  size="small" 
  onClick={markAllAsRead}
>
  Бүгдийг уншсан
</Button>
```

```javascript
<Button 
  type="text" 
  shape="circle" 
  icon={<BellOutlined className="text-xl" />}
/>
```

## Деталь стиль систем

### 1. Бүх товчид хамаарах ерөнхий стиль

```css
/* Ant Design Button Base */
.ant-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

/* Custom Tailwind enhancements */
.ant-btn {
  @apply rounded-lg font-medium;
}

/* Dark mode support */
.dark .ant-btn {
  @apply transition-colors duration-200;
}
```

### 2. Primary Button стиль

```css
/* Light mode primary */
.ant-btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
}

.ant-btn-primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

/* Custom emerald primary */
.emerald-btn {
  @apply bg-emerald-500 hover:bg-emerald-400 border-none rounded-lg font-bold;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);
}

/* Dark mode */
.dark .emerald-btn {
  @apply bg-emerald-600 hover:bg-emerald-500;
}
```

### 3. Default Button стиль

```css
/* Light mode */
.ant-btn-default {
  @apply bg-white border-gray-300 text-gray-700;
}

.ant-btn-default:hover {
  @apply border-blue-500 text-blue-500;
}

/* Dark mode */
.dark .ant-btn-default {
  @apply bg-gray-800 border-white text-gray-400;
}

.dark .ant-btn-default:hover {
  @apply bg-gray-700 border-blue-400 text-blue-400;
}
```

### 4. Text Button стиль

```css
/* Light mode */
.ant-btn-text {
  @apply bg-transparent border-none text-gray-600;
}

.ant-btn-text:hover {
  @apply bg-gray-100 text-gray-800;
}

/* Dark mode */
.dark .ant-btn-text {
  @apply text-gray-300;
}

.dark .ant-btn-text:hover {
  @apply bg-gray-700 text-white;
}
```

### 5. Back Button стиль

```css
/* Dark mode specific */
.back-btn-dark {
  @apply !border-white !bg-gray-800 !text-gray-400;
}

.back-btn-dark:hover {
  @apply !bg-gray-700 !text-gray-300;
}
```

## Tailwind классууд

### 1. Common Button Classes

```javascript
// Standard button wrapper
const buttonWrapper = "flex w-full flex-col justify-between gap-4 md:flex-row";

// Primary action
const primaryBtn = "bg-emerald-500 hover:bg-emerald-400 border-none rounded-lg font-bold shadow-lg shadow-emerald-500/20";

// Secondary action
const secondaryBtn = "rounded-lg font-bold border-none bg-slate-200/50 dark:bg-slate-800 dark:text-gray-400";

// Back button
const backBtn = "text-gray-400 dark:!border-white dark:!bg-gray-800 dark:!text-gray-400";

// Close button
const closeBtn = "hover:bg-emerald-500/10 rounded-lg";

// With icon spacing
const iconBtn = "space-x-2";
```

### 2. Dark Mode Classes

```javascript
// Force dark styles (override Ant Design)
const forceDarkBtn = "dark:!border-white dark:!bg-gray-800 dark:!text-gray-400";

// Transparent with hover
const subtleDarkBtn = "dark:bg-slate-800 dark:text-gray-400 hover:dark:bg-slate-700";
```

## Responsive Design

### 1. Mobile Optimization

```javascript
// Mobile: Stack vertically
<div className="flex w-full flex-col justify-between gap-4 md:flex-row">
  <Button 
    className="w-full md:w-auto"
    onClick={prev}
  >
    Буцах
  </Button>
  <Button 
    type="primary"
    className="w-full md:w-auto"
    onClick={submit}
  >
    Илгээх
  </Button>
</div>
```

### 2. Touch-friendly Sizes

```javascript
// Mobile touch targets (min 44px height)
<Button 
  size="large" // Better for mobile
  className="h-11 md:h-9" // Adjust height for desktop
>
  Үйлдэл
</Button>
```

## Accessibility

### 1. Keyboard Navigation

```javascript
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }}
  tabIndex={0}
>
  Илгээх
</Button>
```

### 2. Screen Reader

```javascript
<Button
  aria-label="Гэрээ хадгалах"
  title="Хадгалах"
>
  <SaveOutlined />
</Button>
```

### 3. Focus States

```css
.ant-btn:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

.dark .ant-btn:focus-visible {
  @apply ring-offset-gray-800;
}
```

## Анимаци

### 1. Hover Effects

```css
.ant-btn {
  @apply transition-all duration-300 ease-in-out;
}

.ant-btn:hover {
  @apply transform scale-105;
}

/* Specific to emerald buttons */
.emerald-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.emerald-btn:hover {
  box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}
```

### 2. AOS Integration

```javascript
// Animate buttons on page load
<div data-aos="fade-right" data-aos-duration="1000" data-aos-delay="500">
  <Button
    type="primary"
    onClick={() => form.submit()}
    icon={<ArrowRightOutlined />}
  >
    {t("Үргэлжлүүлэх")}
  </Button>
</div>
```

## Хэрэглээний жишээ

### 1. Navigation Buttons

```javascript
// Back and Next
<div className="flex w-full flex-col justify-between gap-4 md:flex-row">
  <Button
    onClick={prev}
    icon={<ArrowLeftOutlined />}
    className="text-gray-400 dark:!border-white dark:!bg-gray-800 dark:!text-gray-400"
  >
    {t("Буцах")}
  </Button>
  <Button
    id="continueButton"
    type="primary"
    onClick={() => form.submit()}
    icon={<ArrowRightOutlined />}
  >
    {t("Үргэлжлүүлэх")}
  </Button>
</div>
```

### 2. Form Actions

```javascript
// Form submit and cancel
<Form.Item>
  <div className="flex justify-end gap-2">
    <Button onClick={() => setVisible(false)}>
      {t("Болих")}
    </Button>
    <Button
      type="primary"
      onClick={handleSubmit}
      loading={submitting}
    >
      {t("Хадгалах")}
    </Button>
  </div>
</Form.Item>
```

### 3. Modal Footer

```javascript
// Modal footer buttons
const footer = [
  <Button key="back" onClick={() => ref.current.khaaya()}>
    {t("Хаах")}
  </Button>,
  <Button
    key="submit"
    type="primary"
    className="bg-emerald-500 hover:bg-emerald-400 border-none rounded-lg font-bold shadow-lg shadow-emerald-500/20"
    onClick={() => ref.current.ilgeeye()}
    icon={<FiSend />}
  >
    {t("Илгээх")}
  </Button>,
];
```

### 4. Tour/Guide Buttons

```javascript
// Guided tour navigation
<div className="flex gap-2">
  {currentStep > 0 && (
    <Button 
      size="small" 
      onClick={() => setCurrentStep(prev => prev - 1)} 
      className="rounded-lg font-bold border-none bg-slate-200/50 dark:bg-slate-800 dark:text-gray-400"
    >
      Буцах
    </Button>
  )}
  
  {currentStep < steps.length - 1 ? (
    <Button 
      type="primary" 
      size="small" 
      onClick={() => setCurrentStep(prev => prev + 1)} 
      className="bg-emerald-500 hover:bg-emerald-400 border-none rounded-lg font-bold shadow-lg shadow-emerald-500/20"
    >
      Дараах <RightOutlined className="text-[10px]" />
    </Button>
  ) : (
    <Button 
      type="primary" 
      size="small" 
      onClick={onClose} 
      className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-lg font-bold shadow-lg shadow-emerald-600/20"
    >
      Дуусгах
    </Button>
  )}
</div>
```

### 5. Icon Buttons

```javascript
// Notification bell
<Button 
  type="text" 
  shape="circle" 
  icon={<BellOutlined className="text-xl" />}
/>

// Close with icon
<Button 
  type="text" 
  size="small" 
  icon={<CloseOutlined className="text-gray-400 group-hover:text-emerald-500" />} 
  onClick={onClose} 
  className="hover:bg-emerald-500/10 rounded-lg"
/>
```

## Best Practices

### 1. Consistency

```javascript
// Use consistent button patterns
const BUTTON_VARIANTS = {
  primary: "bg-emerald-500 hover:bg-emerald-400 border-none rounded-lg font-bold shadow-lg shadow-emerald-500/20",
  secondary: "rounded-lg font-bold border-none bg-slate-200/50 dark:bg-slate-800 dark:text-gray-400",
  back: "text-gray-400 dark:!border-white dark:!bg-gray-800 dark:!text-gray-400",
  ghost: "hover:bg-emerald-500/10 rounded-lg",
};

// Usage
<Button className={BUTTON_VARIANTS.primary}>Primary</Button>
```

### 2. Loading States

```javascript
<Button
  type="primary"
  loading={isLoading}
  disabled={isLoading}
>
  {isLoading ? "Уншиж байна..." : "Хадгалах"}
</Button>
```

### 3. Disabled States

```javascript
<Button
  type="primary"
  disabled={!isValid}
  className={!isValid ? "opacity-50 cursor-not-allowed" : ""}
>
  Илгээх
</Button>
```

## Troubleshooting

### 1. Dark Mode Override

**Problem**: Tailwind dark classes not overriding Ant Design styles

**Solution**:
```javascript
// Use !important with Tailwind prefix
className="dark:!bg-gray-800 dark:!text-gray-400"
```

### 2. Button Alignment

**Problem**: Buttons not aligning properly in flex container

**Solution**:
```javascript
<div className="flex items-center gap-2">
  <Button>Left</Button>
  <Button className="ml-auto">Right</Button>
</div>
```

### 3. Responsive Issues

**Problem**: Buttons overflow on mobile

**Solution**:
```javascript
<div className="flex flex-col md:flex-row gap-2">
  <Button className="w-full md:w-auto">Button 1</Button>
  <Button className="w-full md:w-auto">Button 2</Button>
</div>
```

## Future Enhancements

### 1. Planned Features

- Custom button variants (danger, warning, success)
- Loading states with skeleton
- Button groups with dropdowns
- Floating action button (FAB)

### 2. Improvements

- Better animation library integration
- Enhanced accessibility
- More consistent dark mode
- Reduced motion support

## Conclusion

"Товч" бүрэлдэхүүн хэсэг нь төслийн гол хэсэг бөгөөд Ant Design болон Tailwind CSS-ийн хослолыг ашиглан бий болгосон, бүх төхөөрөмжөд тогтвортой ажилладаг, хэрэглэхэд хялбар, уян хатан шийдэл юм. Dark mode дэмжлэгтэй, responsive дизайнтай бөгөөд бүх хэрэглэгчдэд тохиромжтой.
