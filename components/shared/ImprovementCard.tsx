'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    TrendingUp,
    IndianRupee,
    Leaf,
    Droplets,
    Award,
    ChevronRight
} from 'lucide-react';
import { Suggestion } from '@/types';

interface ImprovementCardProps {
    suggestions: Suggestion[];
    currentScore: number;
    className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
    'irrigation': <Droplets className="h-5 w-5" />,
    'drip': <Droplets className="h-5 w-5" />,
    'water': <Droplets className="h-5 w-5" />,
    'crop': <Leaf className="h-5 w-5" />,
    'diversify': <Leaf className="h-5 w-5" />,
    'livestock': <Award className="h-5 w-5" />,
    'default': <TrendingUp className="h-5 w-5" />
};

function getIcon(action: string): React.ReactNode {
    const lowerAction = action.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerAction.includes(key)) return icon;
    }
    return iconMap['default'];
}

export function ImprovementCard({
    suggestions,
    currentScore,
    className
}: ImprovementCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const topSuggestions = suggestions.slice(0, 3);

    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    How to Improve Your Score
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {topSuggestions.map((suggestion, index) => (
                    <div
                        key={index}
                        className="rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50"
                    >
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                {getIcon(suggestion.action)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium">{suggestion.action}</h4>
                                    <Badge
                                        variant={suggestion.impact === 'high' ? 'default' : 'secondary'}
                                        className={cn(
                                            suggestion.impact === 'high' && 'bg-green-600'
                                        )}
                                    >
                                        +{suggestion.score_increase} pts
                                    </Badge>
                                </div>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {suggestion.description}
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1 text-green-600">
                                        <IndianRupee className="h-3 w-3" />
                                        Save {formatCurrency(suggestion.premium_savings)}/yr
                                    </span>

                                    {suggestion.govt_subsidy_available && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                            {suggestion.subsidy_percent}% Govt Subsidy
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Est. cost: {formatCurrency(suggestion.estimated_cost)}</span>
                                    <span>
                                        New score: <strong className="text-primary">{currentScore + suggestion.score_increase}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {suggestions.length > 3 && (
                    <Button variant="ghost" className="w-full justify-center gap-1 text-primary">
                        View all {suggestions.length} suggestions
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
