import React from 'react';

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
    const sizeClasses = {
        xs: 'w-6 h-6 text-[8px]',
        sm: 'w-8 h-8 text-[10px]',
        md: 'w-10 h-10 text-xs',
        lg: 'w-12 h-12 text-sm',
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
                relative shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700 
                flex items-center justify-center overflow-hidden
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {src ? (
                <img src={src} alt={alt || name} className="w-full h-full object-cover" />
            ) : (
                <span className="font-bold text-slate-600 dark:text-slate-400 tracking-tighter">
                    {initials}
                </span>
            )}
        </div>
    );
};
