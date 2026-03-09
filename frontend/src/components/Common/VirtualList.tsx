import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
    items: T[];
    height?: string | number;
    itemHeight?: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    className?: string;
    onScrollBottom?: () => void;
}

export const VirtualList = <T,>({
    items,
    height = '600px',
    itemHeight = 80,
    renderItem,
    className = '',
    onScrollBottom
}: VirtualListProps<T>) => {
    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => itemHeight,
        overscan: 5,
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!onScrollBottom) return;
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop === target.clientHeight) {
            onScrollBottom();
        }
    };

    return (
        <div
            ref={parentRef}
            onScroll={handleScroll}
            className={`overflow-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 ${className}`}
            style={{ height }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                    >
                        {renderItem(items[virtualItem.index], virtualItem.index)}
                    </div>
                ))}
            </div>
        </div>
    );
};
