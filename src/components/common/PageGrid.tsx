// components/layout/PageGrid.tsx
import { ReactNode } from "react";

interface PageGridProps {
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
}

export function PageGrid({ left, center, right }: PageGridProps) {
  return (
    <div className="pt-20 pb-5 min-h-screen">
      <div className="max-w-full mx-auto px-[5px] grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)_380px] gap-2">

        {/* Left column */}
        <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
          {left}
        </aside>

        {/* Center column */}
        <main className="w-full">
          {center}
        </main>

        {/* Right column */}
        <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
          {right}
        </aside>

      </div>
    </div>
  );
}
