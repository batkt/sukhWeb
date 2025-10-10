interface Props {
  ajiltan: any;
  setSongogdsonTsonkhniiIndex?: (index: number) => void;
  children?: React.ReactNode;
}

export default function KhuviinMedeelel({
  ajiltan,
  setSongogdsonTsonkhniiIndex,
  children,
}: Props) {
  return (
    <div>
      <h2>Хувийн мэдээлэл</h2>
      <p>Нэр: {ajiltan?.ner}</p>
      {children}
    </div>
  );
}
