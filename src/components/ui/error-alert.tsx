import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
      <span>{message}</span>
    </div>
  );
}
