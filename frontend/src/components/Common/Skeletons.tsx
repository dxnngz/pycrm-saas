export const SkeletonTable = () => {
    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
            </div>

            <div className="w-full">
                {/* Header Skeleton */}
                <div className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>

                {/* Rows Skeleton */}
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-5 border-b border-slate-50 dark:border-slate-800/50">
                        <div className="flex items-center gap-4 w-1/4">
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0"></div>
                            <div className="space-y-2 w-full">
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-900 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="w-1/4">
                            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                        </div>
                        <div className="w-1/4">
                            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                        </div>
                        <div className="w-1/4 flex justify-end gap-2">
                            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const SkeletonDashboard = () => {
    return (
        <div className="w-full space-y-8 animate-pulse">
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    <div className="h-16 w-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                </div>
                <div className="flex gap-4">
                    <div className="h-16 w-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="h-16 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
                <div className="lg:col-span-1 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            </div>
        </div>
    );
}

export const AppViewSkeleton = () => {
    return (
        <div className="w-full h-full p-8 flex flex-col gap-6 animate-pulse">
            <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-[600px] w-full bg-slate-200 dark:bg-slate-800 rounded-[3rem]"></div>
        </div>
    );
};
