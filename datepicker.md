# Огноо сонгох (Date Picker) Бүрэлдэхүүн хэсэг

## Тойм

Энэхүү баримт бичиг нь "Огноо сонгох" (Date Picker) бүрэлдэхүүн хэсгийн ажиллагаа, хэрэглээ, дизайн зэрэг талаар дэлгэрэнгүй мэдээллийг агуулна. Системд Ant Design-ийн DatePicker бүрэлдэхүүн хэсгийг ашигладаг бөгөөд Mongolian хэл дээр локалчлагдсан байна.

## Технологи

- **Framework**: Next.js 16.1.1
- **UI Library**: Ant Design 4.24.16
- **Date Library**: Moment.js 2.30.1, Day.js 1.11.6
- **Styling**: Tailwind CSS 3.1.8
- **Language**: Mongolian (Монгол)

## Үндсэн бүрэлдэхүүн хэсэг

### DatePicker Хэсэг

```javascript
import { DatePicker } from "antd";
import moment from "moment";

<DatePicker
  style={{ width: "100%" }}
  placeholder="Огноо сонгоно уу"
  allowClear={false}
  disabledDate={disabledDate}
  onChange={handleChange}
/>
```

## Гол функцууд

### 1. Огноо сонгох үндсэн функц

- **Placeholder**: "Огноо сонгоно уу" / "Гэрээ хийх огноо"
- **Format**: YYYY-MM-DD
- **Locale**: Mongolian
- **Clearable**: false (default)

### 2. Огноог хязгаарлах функц

```javascript
function disabledDate(current) {
  return value._id && current && current < moment().startOf("day");
}
```

### 3. Огноо өөрчлөх функц

```javascript
const onValuesChange = (values, v) => {
  if (!!values?.gereeniiOgnoo && !!value?.khugatsaa) {
    value.duusakhOgnoo = moment(values.gereeniiOgnoo).add(
      value.khugatsaa,
      gereeniiZagvar.turGereeEsekh === true ? "d" : "M"
    );
    form.setFieldsValue({ ...value, ...values });
  }
  onChange({ ...value, ...values });
};
```

## Хэрэглээний жишээ

### 1. Гэрээний огноо сонгох

```javascript
<Form.Item
  rules={[{ required: true, message: "Гэрээ хийх огноо бүртгэнэ үү!" }]}
  name="gereeniiOgnoo"
  label="Гэрээ хийх огноо"
>
  <DatePicker
    disabled={!!value._id}
    style={{ width: "100%" }}
    allowClear={false}
    placeholder="Гэрээ хийх огноо"
    prefix={<SolutionOutlined />}
    onChange={() => form.getFieldInstance("khugatsaa").focus()}
  />
</Form.Item>
```

### 2. Гэрээ дуусах огноо сонгох

```javascript
<Form.Item
  name="duusakhOgnoo"
  label="Гэрээ дуусах хугацаа"
  rules={[{ required: true, message: "Гэрээ дуусах хугацаа бүртгэнэ үү!" }]}
>
  <DatePicker
    disabledDate={disabledDate}
    onChange={() => document.getElementById("tureesinTalbaiButton").focus()}
    style={{ width: "100%" }}
    allowClear
    placeholder="Гэрээ дуусах хугацаа"
    prefix={<SolutionOutlined />}
  />
</Form.Item>
```

### 3. Алданги бодож эхлэх огноо

```javascript
<Form.Item
  rules={[{ required: true, message: "Алданги бодож эхлэх огноо оруулна уу!" }]}
  name="aldangiBodojEkhlekhOgnoo"
  label="Алданги бодож эхлэх огноо"
  required={true}
>
  <DatePicker
    style={{ width: "100%" }}
    placeholder="Огноо сонгоно уу"
    allowClear={false}
  />
</Form.Item>
```

## Дизайн шинж чанар

### 1. Стиль

```css
/* DatePicker үндсэн стиль */
.ant-picker {
  width: 100%;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
}

.ant-picker:hover {
  border-color: #40a9ff;
}

.ant-picker-focused {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* Dark mode стиль */
.dark .ant-picker {
  background-color: #1f1f1f;
  border-color: #434343;
}

.dark .ant-picker:hover {
  border-color: #165dff;
}
```

### 2. Responsive дизайн

- **Mobile**: 100% өргөн, touch-friendly
- **Tablet**: 100% өргөн, optimal height
- **Desktop**: 100% өргөн, consistent spacing

### 3. Анимаци

- **Fade-in**: AOS library ашиглан
- **Duration**: 1000ms
- **Delay**: 100ms-500ms (progressive)

## Валидаци

### 1. Шаардлагатай талбар

```javascript
rules={[
  { required: true, message: "Огноо оруулна уу!" }
]}
```

### 2. Огноог хязгаарлах

```javascript
function disabledDate(current) {
  // Өнгөрсөн огноог сонгохгүй
  return current && current < moment().startOf("day");
}
```

### 3. Custom валидаци

```javascript
{
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    if (value < moment().startOf("day")) {
      return Promise.reject("Ирээдүйн огноо сонгоно уу!");
    }
    return Promise.resolve();
  },
}
```

## Локалчлал

### 1. Mongolian хэл

```javascript
import moment from "moment";
import "moment/locale/mn";

moment.locale("mn");
```

### 2. Орчуулга

- "Огноо сонгоно уу" - "Select date"
- "Гэрээ хийх огноо" - "Contract date"
- "Гэрээ дуусах хугацаа" - "Contract end date"

## Интеграц

### 1. Form integration

```javascript
import { Form } from "antd";

const [form] = Form.useForm();

<Form
  form={form}
  onValuesChange={onValuesChange}
  initialValues={initialValues}
>
  <Form.Item name="dateField">
    <DatePicker />
  </Form.Item>
</Form>
```

### 2. State management

```javascript
const [value, setValue] = useState({
  gereeniiOgnoo: moment(),
  duusakhOgnoo: moment().add(12, "months"),
});

const onChange = (newValue) => {
  setValue(newValue);
};
```

## Accessibility

### 1. Keyboard navigation

- **Tab**: Focus DatePicker
- **Enter/Space**: Open calendar
- **Arrow keys**: Navigate dates
- **Escape**: Close calendar

### 2. Screen reader

```javascript
<DatePicker
  aria-label="Гэрээ хийх огноо сонгох"
  placeholder="Огноо сонгоно уу"
/>
```

## Performance

### 1. Optimization

- **Memoization**: React.useMemo хэрэглэх
- **Lazy loading**: Компонент хуудаслах үед ачаалах
- **Debouncing**: onChange events-д debounce хэрэглэх

### 2. Best practices

```javascript
const optimizedDatePicker = React.memo(({ value, onChange }) => {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      style={{ width: "100%" }}
    />
  );
});
```

## Testing

### 1. Unit tests

```javascript
import { render, fireEvent } from '@testing-library/react';
import DatePicker from './DatePicker';

test('should select date', () => {
  const onChange = jest.fn();
  const { getByPlaceholderText } = render(
    <DatePicker onChange={onChange} placeholder="Огноо сонгоно уу" />
  );
  
  fireEvent.click(getByPlaceholderText('Огноо сонгоно уу'));
  // Continue with date selection test
});
```

### 2. Integration tests

- Form submission with date fields
- Date validation
- Locale testing

## Troubleshooting

### 1. Common issues

**Issue**: DatePicker not showing Mongolian locale
**Solution**: 
```javascript
import moment from "moment";
import "moment/locale/mn";
moment.locale("mn");
```

**Issue**: Date format inconsistency
**Solution**: 
```javascript
moment(date).format("YYYY-MM-DD");
```

### 2. Debugging

```javascript
console.log("Selected date:", moment(value).format("YYYY-MM-DD"));
console.log("Moment object:", moment(value));
```

## Future enhancements

### 1. Planned features

- Date range picker
- Custom date formats
- Time picker integration
- Mobile-optimized date picker

### 2. Improvements

- Better mobile experience
- Enhanced accessibility
- Performance optimizations
- More validation options

## Conclusion

"Огноо сонгох" бүрэлдэхүүн хэсэг нь төслийн гол хэсэг бөгөөд Mongolian хэл дээр бүрэн ажилладаг, Ant Design-ийн DatePicker-д суурилсан, хэрэглэхэд хялбар, уян хатан шийдэл юм. Дизайн нь төслийн ерөнхий загварын дагуу бөгөөд бүх төхөөрөмжөд дээр тогтвортой ажилладаг.
