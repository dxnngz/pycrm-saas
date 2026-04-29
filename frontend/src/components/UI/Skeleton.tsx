import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
    const variantClasses = {
        text: 'h-4 w-full rounded',
        rectangular: 'h-24 w-full rounded-lg',
        circular: 'h-12 w-12 rounded-full',
    };

    return (
        <div
            className={`
                animate-pulse bg-surface-muted-bg
                ${variantClasses[variant]}
                ${className}
            `}
        />
    );
};
