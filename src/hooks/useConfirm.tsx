'use client';

import { useState, useCallback } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

export function useConfirm() {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: '',
        description: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'default',
    });
    const [resolvePromise, setResolvePromise] = useState<
        ((value: boolean) => void) | null
    >(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions({
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            variant: 'default',
            ...opts,
        });
        setIsOpen(true);

        return new Promise<boolean>((resolve) => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        resolvePromise?.(true);
        setIsOpen(false);
    }, [resolvePromise]);

    const handleCancel = useCallback(() => {
        resolvePromise?.(false);
        setIsOpen(false);
    }, [resolvePromise]);

    const ConfirmDialog = useCallback(
        () => (
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options.title}</AlertDialogTitle>
                        <AlertDialogDescription>{options.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {options.cancelText}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={
                                options.variant === 'destructive'
                                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                    : ''
                            }
                        >
                            {options.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        ),
        [isOpen, options, handleConfirm, handleCancel]
    );

    return { confirm, ConfirmDialog };
}

// Example usage:
// const { confirm, ConfirmDialog } = useConfirm();
//
// const handleDelete = async () => {
//   const confirmed = await confirm({
//     title: 'Delete appointment?',
//     description: 'This action cannot be undone.',
//     confirmText: 'Delete',
//     variant: 'destructive',
//   });
//
//   if (confirmed) {
//     // Proceed with deletion
//   }
// };
//
// return (
//   <>
//     <button onClick={handleDelete}>Delete</button>
//     <ConfirmDialog />
//   </>
// );
