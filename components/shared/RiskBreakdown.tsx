'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface BreakdownItem {
    category: string;
    score: number;
    maxScore: number;
    status: 'excellent' | 'good' | 'medium' | 'poor';
    details: string;
    icon?: React.ReactNode;
}

interface RiskBreakdownProps {
    items: BreakdownItem[];
    className?: string;
}

const statusConfig = {
    excellent: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        progressColor: 'bg-green-500',
        label: 'EXCELLENT'
    },
    good: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        progressColor: 'bg-green-500',
        label: 'GOOD'
    },
    medium: {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        progressColor: 'bg-yellow-500',
        label: 'MEDIUM'
    },
    poor: {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        progressColor: 'bg-red-500',
        label: 'POOR'
    }
};

export function RiskBreakdown({ items, className }: RiskBreakdownProps) {
    return (
        <div className={cn('space-y-4', className)}>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Info className="h-5 w-5 text-primary" />
                Risk Score Breakdown
            </h3>

            <div className="space-y-4">
                {items.map((item, index) => {
                    const config = statusConfig[item.status];
                    const StatusIcon = config.icon;
                    const percentage = (item.score / item.maxScore) * 100;

                    return (
                        <div
                            key={index}
                            className={cn(
                                'rounded-lg border p-4 transition-all hover:shadow-sm',
                                config.bgColor
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {item.icon || <StatusIcon className={cn('h-5 w-5', config.color)} />}
                                    <span className="font-medium">{item.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn('text-sm font-semibold', config.color)}>
                                        {item.score}/{item.maxScore}
                                    </span>
                                    <span className={cn(
                                        'text-xs font-medium px-2 py-0.5 rounded-full',
                                        config.color,
                                        item.status === 'excellent' || item.status === 'good'
                                            ? 'bg-green-100'
                                            : item.status === 'medium'
                                                ? 'bg-yellow-100'
                                                : 'bg-red-100'
                                    )}>
                                        {config.label}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-2">
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={cn('h-full rounded-full transition-all duration-500', config.progressColor)}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {item.details}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function createBreakdownItems(scores: {
    weather_risk: number;
    infrastructure: number;
    diversification: number;
    financial_health: number;
}): BreakdownItem[] {
    const getStatus = (score: number, max: number, isInverse = false): BreakdownItem['status'] => {
        const percentage = score / max;
        if (isInverse) {
            // For weather risk, lower is better
            if (percentage <= 0.3) return 'excellent';
            if (percentage <= 0.5) return 'good';
            if (percentage <= 0.7) return 'medium';
            return 'poor';
        } else {
            if (percentage >= 0.8) return 'excellent';
            if (percentage >= 0.6) return 'good';
            if (percentage >= 0.4) return 'medium';
            return 'poor';
        }
    };

    return [
        {
            category: 'Weather Risk',
            score: 25 - scores.weather_risk, // Invert for display (higher is better)
            maxScore: 25,
            status: getStatus(scores.weather_risk, 25, true),
            details: scores.weather_risk > 15
                ? 'High weather variability expected. Consider weather-resistant varieties.'
                : scores.weather_risk > 10
                    ? 'Moderate weather risk. Monitor forecasts closely.'
                    : 'Favorable weather conditions predicted.'
        },
        {
            category: 'Infrastructure',
            score: scores.infrastructure,
            maxScore: 25,
            status: getStatus(scores.infrastructure, 25),
            details: scores.infrastructure >= 20
                ? 'Excellent irrigation and water infrastructure.'
                : scores.infrastructure >= 15
                    ? 'Good infrastructure. Consider adding backup water source.'
                    : 'Limited infrastructure. Irrigation improvements recommended.'
        },
        {
            category: 'Diversification',
            score: scores.diversification,
            maxScore: 25,
            status: getStatus(scores.diversification, 25),
            details: scores.diversification >= 20
                ? 'Well-diversified with multiple income sources.'
                : scores.diversification >= 15
                    ? 'Moderate diversification. Consider adding livestock.'
                    : 'Low diversification. High dependency on single crop.'
        },
        {
            category: 'Financial Health',
            score: scores.financial_health,
            maxScore: 25,
            status: getStatus(scores.financial_health, 25),
            details: scores.financial_health >= 20
                ? 'Excellent loan repayment history.'
                : scores.financial_health >= 15
                    ? 'Good financial standing with manageable debt.'
                    : 'Improve loan repayment rate for better score.'
        }
    ];
}
