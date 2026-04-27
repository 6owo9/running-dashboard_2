import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
}

export default function StatCard({ label, value, unit, sub, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <div className="flex items-end  gap-1">
            <span className="text-2xl font-bold tracking-tight text-foreground leading-none">
              {value}
            </span>
            {unit && <span className="text-sm text-muted-foreground ">{unit}</span>}
          </div>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {trend && (
            <p
              className={`text-xs  font-medium ${trend.value >= 0 ? 'text-primary' : 'text-destructive'}`}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-accent">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
