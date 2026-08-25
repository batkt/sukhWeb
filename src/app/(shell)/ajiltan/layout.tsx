import { GereeProvider } from "../geree/GereeContext";

export default function AjiltanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GereeProvider>{children}</GereeProvider>;
}
