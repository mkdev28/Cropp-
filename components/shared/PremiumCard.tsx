'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingDown, Sparkles } from 'lucide-react';

interface PremiumCardProps {
    recommendedPremium: number;
    districtAverage: number;
    savings: number;
    savingsPercent: number;
    sumInsured?: number;
    className?: string;
}

export function PremiumCard({
    recommendedPremium,
    districtAverage,
    savings,
    savingsPercent,
    sumInsured = 200000,
    className
}: PremiumCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const hasSavings = savings > 0;

    return (
        <Card className={cn(
            'relative overflow-hidden',
            hasSavings && 'ring-2 ring-green-500/20',
            className
        )}>
            {/* Success banner */}
            {hasSavings && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-white">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4" />
                        <span>Your Fair Premium - Based on Real Data</span>
                    </div>
                </div>
            )}

            <CardContent className="p-6">
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        Recommended Premium
                    </p>
                    <p className="mt-2 text-4xl font-bold text-primary">
                        {formatCurrency(recommendedPremium)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        For sum insured of {formatCurrency(sumInsured)}
                    </p>
                </div>

                {hasSavings && (
                    <>
                        <div className="my-4 border-t border-dashed" />

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">District Average</span>
                            <span className="font-medium line-through text-muted-foreground">
                                {formatCurrency(districtAverage)}
                            </span>
                        </div>

                        <div className="mt-4 rounded-lg bg-green-50 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-full bg-green-100 p-1">
                                        <TrendingDown className="h-4 w-4 text-green-600" />
                                    </div>
                                    <span className="font-medium text-green-700">You Save</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-700">
                                        {formatCurrency(savings)}
                                    </p>
                                    <p className="text-xs text-green-600">
                                        {savingsPercent}% less than district average
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!hasSavings && (
                    <div className="mt-4 rounded-lg bg-yellow-50 p-4">
                        <p className="text-sm text-yellow-700 text-center">
                            Your premium is at district average. Check improvement suggestions
                            to reduce your premium.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
