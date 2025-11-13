/**
 * Confirmation Dialog Component
 *
 * A reusable confirmation dialog for destructive or important actions.
 * Provides accessible keyboard navigation and clear visual hierarchy.
 */

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when the dialog open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog description/message
   */
  description: string;

  /**
   * Text for the confirm button
   * @default "Confirm"
   */
  confirmText?: string;

  /**
   * Text for the cancel button
   * @default "Cancel"
   */
  cancelText?: string;

  /**
   * Callback when user confirms
   */
  onConfirm: () => void | Promise<void>;

  /**
   * Callback when user cancels (optional)
   */
  onCancel?: () => void;

  /**
   * Whether this is a destructive action (uses red/warning styling)
   * @default false
   */
  destructive?: boolean;

  /**
   * Whether the confirm action is currently loading
   * @default false
   */
  loading?: boolean;

  /**
   * Additional content to display in the dialog body
   */
  children?: React.ReactNode;
}

/**
 * Confirmation Dialog Component
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <ConfirmationDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Clear All Data"
 *   description="This will permanently delete all your data. This action cannot be undone."
 *   confirmText="Clear Data"
 *   destructive
 *   onConfirm={async () => {
 *     await clearAllData();
 *     setOpen(false);
 *   }}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
  children,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children && <div className="py-4">{children}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
