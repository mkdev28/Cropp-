import { NextRequest, NextResponse } from 'next/server';
import { getKCCData, generateRandomKCC } from '@/lib/data/mock-kcc';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ kcc_id: string }> }
) {
    try {
        const { kcc_id } = await params;

        if (!kcc_id) {
            return NextResponse.json(
                { success: false, error: 'KCC ID is required' },
                { status: 400 }
            );
        }

        // Try to get from mock database
        let kccData = getKCCData(kcc_id);

        // If not found, generate random data for demo
        if (!kccData) {
            kccData = generateRandomKCC(kcc_id);
        }

        return NextResponse.json({
            success: true,
            data: kccData
        });

    } catch (error) {
        console.error('KCC API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
