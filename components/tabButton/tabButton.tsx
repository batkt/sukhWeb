import { ReactNode } from "react";

const TabButton = ({
  id,
  active,
  onClick,
  children,
}: {
  id?: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    id={id}
    onClick={onClick}
    aria-pressed={active}
    className={`neu-btn w-full px-2 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm  rounded-xl sm:rounded-2xl whitespace-nowrap ${
      active
        ? "neu-panel ring-1 ring-(--surface-border) shadow-sm"
        : "hover:scale-105"
    }`}
  >
    {children}
  </button>
);

export default TabButton;
