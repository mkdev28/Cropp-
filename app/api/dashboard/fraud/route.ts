
import { NextResponse } from 'next/server';
import { getFraudCases } from '@/lib/fraud-service';

export async function GET() {
    try {
        const cases = getFraudCases();
        return NextResponse.json({ success: true, data: cases });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch fraud cases' }, { status: 500 });
    }
}
