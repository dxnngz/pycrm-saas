import React from 'react';
import { useUI } from '../../hooks/useUI';

interface AvatarProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    name = 'U',
    size = 'md',
    className = ''
}) => {
    const { isDense } = useUI();
    const sizeClasses = {
        xs: isDense ? 'w-5 h-5 text-[7px]' : 'w-6 h-6 text-[8px]',
        sm: isDense ? 'w-6 h-6 text-[8px]' : 'w-8 h-8 text-[10px]',
        md: isDense ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs',
        lg: isDense ? 'w-10 h-10 text-xs' : 'w-12 h-12 text-sm',
    };

    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div
            className={`
                relative shrink-0 rounded-md bg-surface-muted-bg
                border border-surface-border
                flex items-center justify-center overflow-hidden
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {src ? (
                <img src={src} alt={alt || name} className="w-full h-full object-cover" />
            ) : (
                <span className="font-bold text-surface-muted tracking-tighter">
                    {initials}
                </span>
            )}
        </div>
    );
};
