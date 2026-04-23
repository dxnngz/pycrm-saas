import { type ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useUI } from '../../hooks/useUI';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
    align?: 'left' | 'center' | 'right';
    width?: string; // e.g. '200px' or '1fr'
}

export interface VirtualTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    height?: string; // e.g. '600px' or 'calc(100vh - 300px)'
    rowHeight?: number;
}

export function VirtualTable<T>({
    data,
    columns,
    onRowClick,
    isLoading,
    emptyMessage = 'No data found',
    height = '600px',
    rowHeight,
}: VirtualTableProps<T>) {
    const { isDense } = useUI();
    const parentRef = useRef<HTMLDivElement>(null);

    const actualRowHeight = rowHeight || (isDense ? 40 : 52);

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => actualRowHeight,
        overscan: 10,
    });

    if (isLoading && data.length === 0) {
        return (
            <div className="w-full h-64 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 font-medium">Loading records...</span>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-64 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-slate-500 text-sm italic shadow-sm">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div
            className="w-full border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex flex-col focus-within:ring-1 focus-within:ring-primary-500/20"
            role="grid"
            aria-label="Data Grid"
            aria-rowcount={data.length + 1}
            aria-colcount={columns.length}
        >
            {/* Header - Sticky */}
            <div
                className="flex items-center bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-10"
                role="rowgroup"
            >
                <div className="flex w-full" role="row">
                    {columns.map((column, index) => (
                        <div
                            key={index}
                            role="columnheader"
                            aria-sort="none"
                            className={`px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800/50 last:border-r-0 ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                                } ${column.className || ''}`}
                            style={{ width: column.width || `${100 / columns.length}%`, flexShrink: 0 }}
                        >
                            {column.header}
                        </div>
                    ))}
                </div>
            </div>

            {/* Virtualized Body */}
            <div
                ref={parentRef}
                className="overflow-auto custom-scrollbar focus:outline-none"
                style={{ height }}
                role="rowgroup"
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const item = data[virtualItem.index];
                        return (
                            <div
                                key={virtualItem.key}
                                onClick={() => onRowClick?.(item)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onRowClick?.(item);
                                    }
                                }}
                                tabIndex={onRowClick ? 0 : -1}
                                role="row"
                                aria-rowindex={virtualItem.index + 2}
                                className={`absolute top-0 left-0 w-full flex items-center border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-slate-50/50 dark:focus:bg-slate-800/50 focus:outline-none ${onRowClick ? 'cursor-pointer' : ''
                                    } ${virtualItem.index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}
                                style={{
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                {columns.map((column, colIndex) => {
                                    const content =
                                        typeof column.accessor === 'function'
                                            ? column.accessor(item)
                                            : (item[column.accessor] as ReactNode);

                                    return (
                                        <div
                                            key={colIndex}
                                            role="gridcell"
                                            className={`px-4 text-[13px] text-slate-600 dark:text-slate-400 truncate ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                                                } ${column.className || ''}`}
                                            style={{ width: column.width || `${100 / columns.length}%`, flexShrink: 0 }}
                                        >
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
