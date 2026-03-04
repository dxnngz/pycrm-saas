import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
    return (
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-2 hover:text-primary-500 cursor-pointer transition-colors group">
                <Home size={12} className="group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Portal</span>
            </div>

            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <ChevronRight size={10} className="opacity-50" />
                    <button
                        onClick={item.onClick}
                        disabled={!item.onClick}
                        className={`transition-colors ${item.onClick
                                ? 'hover:text-primary-500 cursor-pointer'
                                : 'cursor-default text-slate-900 dark:text-white'
                            } ${index === items.length - 1 ? 'text-slate-900 dark:text-white' : ''}`}
                    >
                        {item.label}
                    </button>
                </div>
            ))}
        </nav>
    );
};
