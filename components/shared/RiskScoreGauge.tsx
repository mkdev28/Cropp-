'use client';

import { cn } from '@/lib/utils';

interface RiskScoreGaugeProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

export function RiskScoreGauge({
    score,
    size = 'md',
    showLabel = true,
    className
}: RiskScoreGaugeProps) {
    const normalizedScore = Math.max(0, Math.min(100, score));

    // Determine risk category and colors
    const getRiskInfo = (score: number) => {
        if (score >= 70) return {
            label: 'LOW RISK',
            color: '#22C55E',
            bgColor: '#DCFCE7',
            textColor: 'text-green-700'
        };
        if (score >= 40) return {
            label: 'MEDIUM RISK',
            color: '#EAB308',
            bgColor: '#FEF9C3',
            textColor: 'text-yellow-700'
        };
        return {
            label: 'HIGH RISK',
            color: '#EF4444',
            bgColor: '#FEE2E2',
            textColor: 'text-red-700'
        };
    };

    const riskInfo = getRiskInfo(normalizedScore);

    // Size configurations
    const sizeConfig = {
        sm: { viewBox: 120, radius: 45, stroke: 8, fontSize: 24, labelSize: 10 },
        md: { viewBox: 160, radius: 60, stroke: 10, fontSize: 36, labelSize: 12 },
        lg: { viewBox: 200, radius: 75, stroke: 12, fontSize: 48, labelSize: 14 }
    };

    const config = sizeConfig[size];
    const circumference = 2 * Math.PI * config.radius;
    const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
    const center = config.viewBox / 2;

    return (
        <div className={cn('flex flex-col items-center', className)}>
            <svg
                width={config.viewBox}
                height={config.viewBox}
                viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={config.radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth={config.stroke}
                />

                {/* Progress circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={config.radius}
                    fill="none"
                    stroke={riskInfo.color}
                    strokeWidth={config.stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="score-gauge transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 6px ${riskInfo.color}40)`
                    }}
                />

                {/* Score text */}
                <text
                    x={center}
                    y={center}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="transform rotate-90 origin-center"
                    fill={riskInfo.color}
                    fontSize={config.fontSize}
                    fontWeight="bold"
                >
                    {normalizedScore}
                </text>
            </svg>

            {showLabel && (
                <div
                    className={cn(
                        'mt-2 px-4 py-1 rounded-full text-xs font-semibold tracking-wide',
                        riskInfo.textColor
                    )}
                    style={{ backgroundColor: riskInfo.bgColor }}
                >
                    {riskInfo.label}
                </div>
            )}
        </div>
    );
}
