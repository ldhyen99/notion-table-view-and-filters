import { useCallback, useEffect, useState } from "react";
import { ColumnState, MIN_COLUMN_WIDTH, ResizingColumn } from "@/types/notion-table.type";

export const useColumnResize = (columns: ColumnState[], setColumns: (columns: ColumnState[]) => void) => {
    const [resizingColumn, setResizingColumn] = useState<ResizingColumn | null>(null);
  
    const handleMouseDownResize = (e: React.MouseEvent<HTMLDivElement>, key: string) => {
      e.preventDefault();
      const column = columns.find((col) => col.key === key);
      if (!column) return;
      setResizingColumn({ key, startX: e.clientX, startWidth: column.width });
    };
  
    const handleMouseMoveResize = useCallback(
      (e: MouseEvent) => {
        if (!resizingColumn) return;
        const dx = e.clientX - resizingColumn.startX;
        const newWidth = Math.max(resizingColumn.startWidth + dx, MIN_COLUMN_WIDTH);
        setColumns(
          columns.map((col) =>
            col.key === resizingColumn.key ? { ...col, width: newWidth } : col
          )
        );
      },
      [resizingColumn, columns, setColumns]
    );
  
    const handleMouseUpResize = useCallback(() => {
      setResizingColumn(null);
    }, []);
  
    useEffect(() => {
      if (resizingColumn) {
        document.addEventListener("mousemove", handleMouseMoveResize);
        document.addEventListener("mouseup", handleMouseUpResize);
      }
      return () => {
        document.removeEventListener("mousemove", handleMouseMoveResize);
        document.removeEventListener("mouseup", handleMouseUpResize);
      };
    }, [resizingColumn, handleMouseMoveResize, handleMouseUpResize]);
  
    return { resizingColumn, handleMouseDownResize };
};
