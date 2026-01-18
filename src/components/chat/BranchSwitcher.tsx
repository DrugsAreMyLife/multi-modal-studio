import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BranchSwitcherProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function BranchSwitcher({ current, total, onPrev, onNext, className }: BranchSwitcherProps) {
  if (total <= 1) return null;

  return (
    <div
      className={cn('text-muted-foreground flex items-center gap-1 text-xs select-none', className)}
    >
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-muted h-5 w-5"
        onClick={onPrev}
        disabled={current === 0}
      >
        <ChevronLeft size={12} />
      </Button>
      <span className="min-w-[2rem] text-center">
        {current + 1} / {total}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-muted h-5 w-5"
        onClick={onNext}
        disabled={current === total - 1}
      >
        <ChevronRight size={12} />
      </Button>
    </div>
  );
}
