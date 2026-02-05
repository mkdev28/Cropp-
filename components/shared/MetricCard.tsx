'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    status?: 'good' | 'warning' | 'bad' | 'neutral';
    icon?: React.ReactNode;
    subtitle?: string;
    className?: string;
}

export function MetricCard({
    title,
    value,
    change,
    trend = 'neutral',
    status = 'neutral',
    icon,
    subtitle,
    className
}: MetricCardProps) {
    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4" />;
            case 'down':
                return <TrendingDown className="h-4 w-4" />;
            default:
                return <Minus className="h-4 w-4" />;
        }
    };

    const getTrendColor = () => {
        // For some metrics, down is good (like loss ratio, risk score)
        if (status === 'good') return 'text-green-600 bg-green-50';
        if (status === 'bad') return 'text-red-600 bg-red-50';
        if (status === 'warning') return 'text-yellow-600 bg-yellow-50';

        // Default trend colors
        if (trend === 'up') return 'text-green-600 bg-green-50';
        if (trend === 'down') return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <Card className={cn(
            'relative overflow-hidden transition-all hover:shadow-md',
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>
                        <p className="mt-2 text-3xl font-bold tracking-tight">
                            {value}
                        </p>

                        {(change || subtitle) && (
                            <div className="mt-2 flex items-center gap-2">
                                {change && (
                                    <span className={cn(
                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                        getTrendColor()
                                    )}>
                                        {getTrendIcon()}
                                        {change}
                                    </span>
                                )}
                                {subtitle && (
                                    <span className="text-xs text-muted-foreground">
                                        {subtitle}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {icon && (
                        <div className="rounded-lg bg-primary/10 p-3 text-primary">
                            {icon}
                        </div>
                    )}
                </div>

                {/* Decorative gradient */}
                <div
                    className={cn(
                        'absolute bottom-0 left-0 right-0 h-1',
                        status === 'good' && 'bg-gradient-to-r from-green-400 to-green-600',
                        status === 'warning' && 'bg-gradient-to-r from-yellow-400 to-yellow-600',
                        status === 'bad' && 'bg-gradient-to-r from-red-400 to-red-600',
                        status === 'neutral' && 'bg-gradient-to-r from-primary to-primary/70'
                    )}
                />
            </CardContent>
        </Card>
    );
}
