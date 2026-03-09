import { type ReactNode } from 'react';
import { useUI } from '../../context/UIContext';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    className?: string;
}

export function Table<T>({
    data,
    columns,
    onRowClick,
    isLoading,
    emptyMessage = 'No se encontraron datos',
    className = '',
}: TableProps<T>) {
    const { isDense } = useUI();
    return (
        <div className={`w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md ${className}`}>
            <table className="w-full text-sm text-left border-collapse zebra-table">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                className={`${isDense ? 'px-4 py-1.5' : 'px-4 py-2.5'} text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                                    } ${column.className || ''}`}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {isLoading ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                                    <span>Cargando datos...</span>
                                </div>
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onClick={() => onRowClick?.(item)}
                                className={`
                  transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                            >
                                {columns.map((column, colIndex) => {
                                    const content =
                                        typeof column.accessor === 'function'
                                            ? column.accessor(item)
                                            : (item[column.accessor] as ReactNode);

                                    return (
                                        <td
                                            key={colIndex}
                                            className={`${isDense ? 'px-4 py-1.5' : 'px-4 py-2'} text-[13px] text-slate-600 dark:text-slate-400 whitespace-nowrap border-r border-slate-100/50 dark:border-slate-800/30 last:border-r-0 ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                                                } ${column.className || ''}`}
                                        >
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
