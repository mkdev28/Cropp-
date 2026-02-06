'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    RiskScoreGauge,
    PremiumCard,
    RiskBreakdown,
    createBreakdownItems,
    ImprovementCard
} from '@/components/shared';
import {
    CreditCard,
    MapPin,
    Leaf,
    Droplets,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    ArrowRight,
    Download,
    Send,
    User,
    Phone,
    Tractor,
    Warehouse,
} from 'lucide-react';
import { KCCData, AssessmentResponse } from '@/types';

// --- CONSTANTS ---
const STEPS = [
    { id: 1, title: 'KCC Verification', icon: CreditCard },
    { id: 2, title: 'Farm Location', icon: MapPin },
    { id: 3, title: 'Crop Details', icon: Leaf },
    { id: 4, title: 'Infrastructure', icon: Droplets },
    { id: 5, title: 'Results', icon: CheckCircle2 },
];

const CROPS = ['Cotton', 'Soybean', 'Wheat', 'Rice', 'Sugarcane', 'Maize', 'Jowar', 'Bajra'];
const IRRIGATION_TYPES = ['Drip', 'Sprinkler', 'Flood', 'Canal', 'Rainfed'];

// --- TYPES ---
// Update the form data interface to handle array for crop_types
interface AssessFormData {
    kcc_id: string;
    gps_latitude: number;
    gps_longitude: number;
    crop_types: string[]; // <--- Changed from crop_type to crop_types (Array)
    season: 'kharif' | 'rabi';
    irrigation_type: string;
    borewell_count: number;
    borewell_depth_ft: number;
    has_canal_access: boolean;
    owns_tractor: boolean;
    has_storage: boolean;
    livestock_count: number;
    sum_insured: number;
}

export default function AssessPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [kccData, setKccData] = useState<KCCData | null>(null);
    const [result, setResult] = useState<AssessmentResponse['data'] | null>(null);

    // Form state initialized with crop_types as an empty array
    const [formData, setFormData] = useState<AssessFormData>({
        kcc_id: '',
        gps_latitude: 18.5204,
        gps_longitude: 73.8567,
        crop_types: [], // <--- Initialized as empty array
        season: 'kharif',
        irrigation_type: '',
        borewell_count: 0,
        borewell_depth_ft: 0,
        has_canal_access: false,
        owns_tractor: false,
        has_storage: false,
        livestock_count: 0,
        sum_insured: 200000
    });

    const handleKCCLookup = async () => {
        if (!formData.kcc_id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/kcc/${formData.kcc_id}`);
            const data = await response.json();

            if (data.success) {
                setKccData(data.data);
                setFormData(prev => ({
                    ...prev,
                    gps_latitude: data.data.approximate_location.lat,
                    gps_longitude: data.data.approximate_location.lng
                }));
            }
        } catch (error) {
            console.error('KCC lookup failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssessment = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/assess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    // Pass the first selected crop as primary if backend expects single string, 
                    // or pass the whole array if backend is updated.
                    crop_type: formData.crop_types[0],
                    kcc_id: formData.kcc_id ? formData.kcc_id : alert("Invalid KCC ID.")
                })
            });

            const data = await response.json();

            if (data.success) {
                setResult(data.data);
                setCurrentStep(5);
            }
        } catch (error) {
            console.error('Assessment failed:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const handleDownloadReport = async () => {
        if (!result) return;

        try {
            const response = await fetch('/api/download-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(result),
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AgriRisk-Report-${result.farmer_name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading report:', error);
        }
    };

    const nextStep = () => {
        if (currentStep === 4) {
            handleAssessment();
        } else {
            setCurrentStep(prev => Math.min(prev + 1, 5));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const progress = (currentStep / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <Leaf className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl">AgriRisk Pro</span>
                    </Link>

                    <div className="text-sm text-muted-foreground">
                        Step {currentStep} of {STEPS.length}
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-secondary">
                <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Step Indicators */}
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between max-w-3xl mx-auto">
                    {STEPS.map((step) => {
                        const StepIcon = step.icon;
                        const isActive = step.id === currentStep;
                        const isComplete = step.id < currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                                <div className={`
                  h-10 w-10 rounded-full flex items-center justify-center transition-all border
                  ${isActive ? 'bg-primary text-primary-foreground shadow-lg scale-110 border-primary' : ''}
                  ${isComplete ? 'bg-green-600 text-white border-green-600' : ''}
                  ${!isActive && !isComplete ? 'bg-secondary text-muted-foreground border-border' : ''}
                `}>
                                    {isComplete ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        <StepIcon className="h-5 w-5" />
                                    )}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 pb-24">
                <div className="max-w-2xl mx-auto">

                    {/* Step 1: KCC Verification */}
                    {currentStep === 1 && (
                        <Card className="shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">Verify Your KCC Card</CardTitle>
                                <CardDescription>
                                    Enter your Kisan Credit Card number to auto-fill your details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter KCC ID (e.g., MH-1234567890)"
                                        value={formData.kcc_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, kcc_id: e.target.value.toUpperCase() }))}
                                        className="flex-1"
                                    />
                                    <Button onClick={handleKCCLookup} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
                                    </Button>
                                </div>

                                <div className="text-center text-sm text-muted-foreground">
                                    <p>Try these demo IDs: MH-1234567890, MH-9876543210</p>
                                </div>

                                {kccData && (
                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-primary">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="font-medium">KCC Card Verified!</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{kccData.farmer_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{kccData.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{kccData.village}, {kccData.district}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Leaf className="h-4 w-4 text-muted-foreground" />
                                                <span>{kccData.land_acres} acres</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {kccData.registered_crops.map(crop => (
                                                <Badge key={crop} variant="secondary">{crop}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Farm Location */}
                    {currentStep === 2 && (
                        <Card className="shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">Farm Location</CardTitle>
                                <CardDescription>
                                    Confirm or update your farm coordinates
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden border">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-50" />
                                    <div className="text-center z-10">
                                        <MapPin className="h-12 w-12 mx-auto text-primary mb-2" />
                                        <p className="font-medium">Interactive Map Placeholder</p>
                                        <p className="text-sm text-muted-foreground">
                                            {kccData?.village || 'Maharashtra'}, {kccData?.district || 'India'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Latitude</label>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={formData.gps_latitude}
                                            onChange={(e) => setFormData(prev => ({ ...prev, gps_latitude: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Longitude</label>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={formData.gps_longitude}
                                            onChange={(e) => setFormData(prev => ({ ...prev, gps_longitude: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" onClick={() => {
                                    if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                gps_latitude: pos.coords.latitude,
                                                gps_longitude: pos.coords.longitude
                                            }));
                                        });
                                    }
                                }}>
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Use Current Location
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Crop Details (Multi-Select Enabled) */}
                    {currentStep === 3 && (
                        <Card className="shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">Crop & Season</CardTitle>
                                <CardDescription>
                                    Select all crops you grow and the season
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium block mb-3">Select Crops (Multi-select)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {CROPS.map(crop => {
                                            // Check if this crop is currently in the array
                                            const isSelected = formData.crop_types?.includes(crop);

                                            return (
                                                <Button
                                                    key={crop}
                                                    type="button"
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    // Apply primary styling if selected, otherwise outline
                                                    className={isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                                                    onClick={() => {
                                                        setFormData(prev => {
                                                            const currentCrops = prev.crop_types || [];

                                                            if (currentCrops.includes(crop)) {
                                                                // If found, remove it (Filter out)
                                                                return {
                                                                    ...prev,
                                                                    crop_types: currentCrops.filter(c => c !== crop)
                                                                };
                                                            } else {
                                                                // If not found, add it
                                                                return {
                                                                    ...prev,
                                                                    crop_types: [...currentCrops, crop]
                                                                };
                                                            }
                                                        });
                                                    }}
                                                >
                                                    {crop}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formData.crop_types?.length > 0
                                            ? `${formData.crop_types.length} crops selected`
                                            : "Select at least one crop"}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-3">Season</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            variant={formData.season === 'kharif' ? 'default' : 'outline'}
                                            className={`h-20 ${formData.season === 'kharif' ? 'bg-primary text-primary-foreground' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, season: 'kharif' }))}
                                        >
                                            <div className="text-center">
                                                <span className="block font-bold">Kharif</span>
                                                <span className="text-xs opacity-80">June - October</span>
                                            </div>
                                        </Button>
                                        <Button
                                            variant={formData.season === 'rabi' ? 'default' : 'outline'}
                                            className={`h-20 ${formData.season === 'rabi' ? 'bg-primary text-primary-foreground' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, season: 'rabi' }))}
                                        >
                                            <div className="text-center">
                                                <span className="block font-bold">Rabi</span>
                                                <span className="text-xs opacity-80">November - March</span>
                                            </div>
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-2">Sum Insured (₹)</label>
                                    <Input
                                        type="number"
                                        value={formData.sum_insured}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sum_insured: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 4: Infrastructure */}
                    {currentStep === 4 && (
                        <Card className="shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">Farm Infrastructure</CardTitle>
                                <CardDescription>
                                    Tell us about your irrigation and assets
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium block mb-3">Irrigation Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {IRRIGATION_TYPES.map(type => (
                                            <Button
                                                key={type}
                                                variant={formData.irrigation_type === type.toLowerCase() ? 'default' : 'outline'}
                                                className={formData.irrigation_type === type.toLowerCase() ? 'bg-primary text-primary-foreground' : ''}
                                                onClick={() => setFormData(prev => ({ ...prev, irrigation_type: type.toLowerCase() }))}
                                            >
                                                <Droplets className="h-4 w-4 mr-1" />
                                                {type}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Number of Borewells</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.borewell_count}
                                            onChange={(e) => setFormData(prev => ({ ...prev, borewell_count: parseInt(e.target.value) || 0 }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Borewell Depth (feet)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.borewell_depth_ft}
                                            onChange={(e) => setFormData(prev => ({ ...prev, borewell_depth_ft: parseInt(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-3">Farm Assets</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={formData.owns_tractor ? 'default' : 'outline'}
                                            className={formData.owns_tractor ? 'bg-primary text-primary-foreground' : ''}
                                            onClick={() => setFormData(prev => ({ ...prev, owns_tractor: !prev.owns_tractor }))}
                                        >
                                            <Tractor className="h-4 w-4 mr-2" />
                                            Own Tractor
                                        </Button>
                                        <Button
                                            variant={formData.has_storage ? 'default' : 'outline'}
                                            className={formData.has_storage ? 'bg-primary text-primary-foreground' : ''}
                                            onClick={() => setFormData(prev => ({ ...prev, has_storage: !prev.has_storage }))}
                                        >
                                            <Warehouse className="h-4 w-4 mr-2" />
                                            Storage Facility
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Number of Dairy Cows</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.livestock_count}
                                        onChange={(e) => setFormData(prev => ({ ...prev, livestock_count: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 5: Results */}
                    {currentStep === 5 && result && (
                        <div className="space-y-6">
                            <Card className="shadow-lg text-center">
                                <CardContent className="py-8">
                                    <h2 className="text-2xl font-bold mb-2">
                                        Hello, {result.farmer_name}!
                                    </h2>
                                    <p className="text-muted-foreground mb-6">
                                        Here's your personalized risk assessment
                                    </p>
                                    <RiskScoreGauge score={result.final_risk_score} size="lg" />
                                </CardContent>
                            </Card>

                            <PremiumCard
                                recommendedPremium={result.recommended_premium}
                                districtAverage={result.district_avg_premium}
                                savings={result.savings_amount}
                                savingsPercent={result.savings_percent}
                                sumInsured={formData.sum_insured}
                            />

                            <RiskBreakdown items={createBreakdownItems(result.scores)} />

                            <ImprovementCard
                                suggestions={result.improvement_suggestions}
                                currentScore={result.final_risk_score}
                            />

                            <div className="flex gap-4">
                                <Button className="flex-1 bg-primary text-primary-foreground h-12 shadow-lg"
                                    onClick={() => window.open("https://pmfby.gov.in/", "_blank", "noopener,noreferrer")}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Apply for Insurance
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12"
                                    onClick={handleDownloadReport}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Report
                                </Button>
                            </div>

                            <p className="text-center text-xs text-muted-foreground">
                                Data sources: {result.data_sources.join(' • ')} |
                                Processed in {result.processing_time_ms}ms
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Navigation Footer */}
            {currentStep < 5 && (
                <div className="fixed bottom-0 left-0 right-0 glass border-t p-4 z-40">
                    <div className="container mx-auto max-w-2xl flex gap-4">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="flex-1"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            onClick={nextStep}
                            disabled={
                                isLoading ||
                                (currentStep === 1 && !kccData) ||
                                (currentStep === 3 && formData.crop_types.length === 0) // Disabled if 0 crops selected
                            }
                            className="flex-1 bg-primary text-primary-foreground"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : currentStep === 4 ? (
                                'Calculate Risk Score'
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}