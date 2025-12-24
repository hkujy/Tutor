import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'rectangular' | 'circular';
    lines?: number;
}

export function Skeleton({
    className,
    width,
    height,
    variant = 'rectangular',
    lines = 1
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-muted rounded';

    const variantClasses = {
        text: 'h-4',
        rectangular: '',
        circular: 'rounded-full'
    };

    const style: React.CSSProperties = {};
    if (width) {
        style.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height) {
        style.height = typeof height === 'number' ? `${height}px` : height;
    }

    // Multi-line text variant
    if (variant === 'text' && lines > 1) {
        return (
            <div className={cn('space-y-2', className)}>
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(baseClasses, variantClasses[variant],
                            index === lines - 1 ? 'w-3/4' : 'w-full'
                        )}
                        style={index === lines - 1 ? { ...style, width: '75%' } : style}
                        aria-hidden="true"
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(baseClasses, variantClasses[variant], className)}
            style={style}
            aria-hidden="true"
        />
    );
}

// Preset skeleton components for common use cases
export function SkeletonCard({ lines = 3, showAvatar = false, className }: { lines?: number; showAvatar?: boolean; className?: string }) {
    return (
        <div className={cn("space-y-3 rounded-lg border p-4", className)}>
            <div className="flex items-start space-x-3">
                {showAvatar && (
                    <Skeleton variant="circular" width={40} height={40} />
                )}
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" lines={lines} />
                </div>
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, index) => (
                    <Skeleton key={`header-${index}`} height={20} className="bg-gray-300" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={`cell-${rowIndex}-${colIndex}`} height={16} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-16 w-16',
    };

    return <Skeleton className={cn('rounded-full', sizeClasses[size])} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn('h-4', i === lines - 1 ? 'w-3/5' : 'w-full')}
                />
            ))}
        </div>
    );
}

export function SkeletonList({ items = 5, showAvatar = true }: { items?: number; showAvatar?: boolean }) {
    return (
        <div className="space-y-4" data-testid="skeleton-list">
            {Array.from({ length: items }).map((_, index) => (
                <SkeletonCard key={index} showAvatar={showAvatar} lines={2} />
            ))}
        </div>
    );
}

export default Skeleton;
