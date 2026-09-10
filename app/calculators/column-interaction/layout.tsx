import type { ReactNode } from "react";

export const metadata = {
  title: "Column P-M Interaction | RCalcs",
  description:
    "Analyze a short reinforced-concrete column under axial load and bending.",
};

export default function ColumnInteractionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
