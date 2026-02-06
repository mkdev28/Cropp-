

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/shared/MetricCard';
import { RiskScoreGauge } from '@/components/shared/RiskScoreGauge';
import {
    Leaf,
    FileText,
    TrendingDown,
    Users,
    AlertTriangle,
    MapPin,
    Search,
    Bell,
    Settings,
    ChevronRight,
    Shield,
    Eye,
    IndianRupee,
    Loader2
} from 'lucide-react';
import { FraudFlag, KCCData, AssessmentResponse, FraudCase } from '@/types';
import { allMockFarmers } from '@/lib/data/mock-kcc';
import LiveRiskMap from '@/components/maps/LiveRiskMap';

// Mock portfolio data
const portfolioMetrics = {
    total_policies: 45823,
    avg_risk_score: 52,
    projected_loss_ratio: 92,
    total_premium: 2890000000,
    low_risk_count: 18234,
    medium_risk_count: 19567,
    high_risk_count: 8022
};

export default function InsuranceDashboard() {
    const [realFraudCases, setRealFraudCases] = useState<FraudCase[]>([]);

    useEffect(() => {
        const fetchFraudCases = async () => {
            try {
                const response = await fetch('/api/dashboard/fraud');
                const data = await response.json();
                if (data.success) {
                    setRealFraudCases(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch fraud cases:', error);
            }
        };

        fetchFraudCases();
    }, []);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<AssessmentResponse['data'] | null>(null);

    const handleQuickAssess = async () => {
        if (!searchQuery) return;

        setIsSearching(true);
        try {
            const response = await fetch('/api/assess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kcc_id: searchQuery,
                    crop_type: 'Cotton',
                    season: 'kharif',
                    gps_latitude: 18.5,
                    gps_longitude: 73.8,
                    irrigation_type: 'drip'
                })
            });

            const data = await response.json();
            if (data.success) {
                setSearchResult(data.data);
            }
        } catch (error) {
            console.error('Assessment failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const markers = allMockFarmers.map(f => ({
        id: f.kcc_id,
        lat: f.approximate_location.lat,
        lng: f.approximate_location.lng,
        farmer: f.farmer_name,
        risk: f.risk_level || 'medium'
    }));


    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(1)} Cr`;
        }
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)} L`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                                <Leaf className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-xl">AgriRisk Pro</span>
                        </Link>
                        <Badge variant="secondary">Insurance Dashboard</Badge>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5" />
                        </Button>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">IC</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Portfolio Dashboard</h1>
                    <p className="text-muted-foreground">
                        Real-time risk monitoring and portfolio analytics for Maharashtra
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Policies"
                        value={portfolioMetrics.total_policies.toLocaleString()}
                        change="+12.3%"
                        trend="up"
                        status="neutral"
                        icon={<FileText className="h-5 w-5" />}
                    />
                    <MetricCard
                        title="Avg Risk Score"
                        value={`${portfolioMetrics.avg_risk_score}/100`}
                        change="-3 pts"
                        trend="down"
                        status="good"
                        subtitle="Lower is better"
                        icon={<TrendingDown className="h-5 w-5" />}
                    />
                    <MetricCard
                        title="Projected Loss Ratio"
                        value={`${portfolioMetrics.projected_loss_ratio}%`}
                        change="-23%"
                        trend="down"
                        status="good"
                        subtitle="vs industry 115%"
                        icon={<IndianRupee className="h-5 w-5" />}
                    />
                    <MetricCard
                        title="Total Premium"
                        value={formatCurrency(portfolioMetrics.total_premium)}
                        change="+8.5%"
                        trend="up"
                        status="neutral"
                        icon={<Users className="h-5 w-5" />}
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content - 2 columns */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Risk Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Risk Distribution Map
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <LiveRiskMap markers={markers} />


                                {/* Legend */}
                                <div className="flex items-center justify-center gap-8 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                                        <span className="text-sm">Low Risk ({portfolioMetrics.low_risk_count.toLocaleString()})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                        <span className="text-sm">Medium ({portfolioMetrics.medium_risk_count.toLocaleString()})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                                        <span className="text-sm">High Risk ({portfolioMetrics.high_risk_count.toLocaleString()})</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Assessment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-5 w-5 text-primary" />
                                    Quick Risk Assessment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 mb-6">
                                    <Input
                                        placeholder="Enter KCC ID or Phone Number"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAssess()}
                                        className="flex-1"
                                    />
                                    <Button onClick={handleQuickAssess} disabled={isSearching}>
                                        {isSearching ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Search className="h-4 w-4 mr-2" />
                                                Assess
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="text-sm text-muted-foreground mb-4">
                                    Try: MH-1234567890, MH-9876543210
                                </div>

                                {searchResult && (
                                    <div className="border rounded-lg p-6 bg-gray-50">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">{searchResult.farmer_name}</h3>
                                                <p className="text-sm text-muted-foreground">{searchQuery}</p>
                                            </div>
                                            <RiskScoreGauge score={searchResult.final_risk_score} size="sm" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-white rounded-lg">
                                                <span className="text-muted-foreground">Recommended Premium</span>
                                                <p className="font-bold text-lg text-primary">
                                                    {formatCurrency(searchResult.recommended_premium)}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-white rounded-lg">
                                                <span className="text-muted-foreground">District Average</span>
                                                <p className="font-bold text-lg">
                                                    {formatCurrency(searchResult.district_avg_premium)}
                                                </p>
                                            </div>
                                        </div>

                                        {searchResult.fraud_flags.length > 0 && (
                                            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                                <div className="flex items-center gap-2 text-red-700 font-medium">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    {searchResult.fraud_flags.length} Fraud Flag(s) Detected
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-4">
                                            <Button size="sm" className="flex-1">
                                                View Full Report
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Eye className="h-4 w-4 mr-1" />
                                                History
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - 1 column */}
                    <div className="space-y-8">
                        {/* Active Alerts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        Active Alerts
                                    </div>
                                    <Badge variant="destructive">0</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center text-muted-foreground text-sm py-4">
                                    No active alerts at this time.
                                </div>

                                <Button variant="outline" className="w-full">
                                    View All Alerts
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Fraud Detection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Fraud Detection
                                    </div>
                                    <Badge variant="secondary">{realFraudCases.length} flags</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {realFraudCases.length === 0 ? (
                                    <div className="text-center text-muted-foreground text-sm py-4">
                                        No fraud cases detected.
                                    </div>
                                ) : (
                                    realFraudCases.map(fraudCase => (
                                        <div
                                            key={fraudCase.id}
                                            className={`p-4 rounded-lg border ${fraudCase.severity === 'high' || fraudCase.severity === 'critical'
                                                ? 'border-red-200 bg-red-50'
                                                : 'border-yellow-200 bg-yellow-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-medium text-sm">{fraudCase.farmer_name}</h4>
                                                    <p className="text-xs text-muted-foreground">{fraudCase.kcc_id}</p>
                                                </div>
                                                <Badge variant={fraudCase.severity === 'high' || fraudCase.severity === 'critical' ? 'destructive' : 'secondary'}>
                                                    {fraudCase.fraud_score}% risk
                                                </Badge>
                                            </div>

                                            {fraudCase.flags.map((flag, idx) => (
                                                <div key={idx} className="text-xs text-muted-foreground mb-2">
                                                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                                                    {flag.details}
                                                </div>
                                            ))}

                                            <div className="flex gap-2 mt-3">
                                                <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs">
                                                    Reject
                                                </Button>
                                                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                                                    Verify
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <Link href="/dashboard/fraud">
                                    <Button variant="outline" className="w-full">
                                        View All Cases
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}