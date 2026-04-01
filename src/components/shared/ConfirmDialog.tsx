'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  loading?: boolean;
  variant?: 'destructive' | 'default';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  loading = false,
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {variant === 'destructive' && (
              <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
              </div>
            )}
            <DialogTitle className="text-base font-bold text-slate-900">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500 leading-relaxed">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-1">
          <Button variant="outline" onClick={onClose} disabled={loading} className="h-9">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`h-9 font-semibold ${variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white border-0' : 'bg-indigo-600 hover:bg-indigo-700 text-white border-0'}`}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
