import type { ReactNode } from "react";
import { CwaProvider, useOptionalCwaContext } from "../provider/provider";

export function RecipeScope({ children }: { children: ReactNode }) {
  const parent = useOptionalCwaContext();
  return parent ? children : <CwaProvider>{children}</CwaProvider>;
}
