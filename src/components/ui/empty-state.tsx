import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Calendar,
    FileText,
    Users,
    Bell,
    Search,
} from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-12 px-4 text-center',
                className
            )}
        >
            <div className="rounded-full bg-muted p-4 mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                {description}
            </p>
            {action && <div className="flex gap-2">{action}</div>}
        </div>
    );
}

// Preset empty states for common scenarios
interface PresetEmptyStateProps {
    action?: React.ReactNode;
    className?: string;
}

export function NoAppointmentsEmptyState({
    action,
    className,
}: PresetEmptyStateProps) {
    return (
        <EmptyState
            icon={Calendar}
            title="No appointments yet"
            description="You don't have any scheduled appointments. Book your first session to get started."
            action={action}
            className={className}
        />
    );
}

export function NoAssignmentsEmptyState({
    action,
    className,
}: PresetEmptyStateProps) {
    return (
        <EmptyState
            icon={FileText}
            title="No assignments"
            description="You don't have any assignments at the moment. Check back later for new tasks."
            action={action}
            className={className}
        />
    );
}

export function NoStudentsEmptyState({
    action,
    className,
}: PresetEmptyStateProps) {
    return (
        <EmptyState
            icon={Users}
            title="No students yet"
            description="You haven't added any students yet. Start by inviting students to join your tutoring sessions."
            action={action}
            className={className}
        />
    );
}

export function NoNotificationsEmptyState({ className }: { className?: string }) {
    return (
        <EmptyState
            icon={Bell}
            title="All caught up!"
            description="You don't have any new notifications. We'll notify you when something important happens."
            className={className}
        />
    );
}

export function SearchEmptyState({ className }: { className?: string }) {
    return (
        <EmptyState
            icon={Search}
            title="No results found"
            description="We couldn't find any results matching your search. Try adjusting your filters or search terms."
            className={className}
        />
    );
}
