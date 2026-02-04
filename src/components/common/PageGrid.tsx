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
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-6 xl:gap-8">

        {/* Left column */}
        <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
          {left}
        </aside>

        {/* Center column */}
        <main className="w-full">
          {center}
        </main>

        {/* Right column */}
        <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pl-2 custom-scrollbar">
          {right}
        </aside>

      </div>
    </div>
  );
}
