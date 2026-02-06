
import { KCCData } from '@/types';

const MOCK_KCC_DATABASE: Record<string, KCCData> = {
    'MH-1234567890': {
        kcc_id: 'MH-1234567890',
        farmer_name: 'Ramesh Patil',
        phone: '+919876543210',
        land_acres: 8.5,
        registered_crops: ['Cotton', 'Soybean'],
        kcc_issue_date: '2022-06-15',
        kcc_expiry_date: '2027-06-14',
        total_loans_taken: 3,
        loans_repaid_ontime: 3,
        repayment_rate_percent: 92,
        outstanding_amount: 45000,
        receives_pm_kisan: true,
        last_subsidy_date: '2024-12-01',
        village: 'Shirur',
        district: 'Pune',
        state: 'Maharashtra',
        approximate_location: { lat: 18.8232, lng: 74.3768 }
    },
    'MH-9876543210': {
        kcc_id: 'MH-9876543210',
        farmer_name: 'Suresh Jadhav',
        phone: '+919123456789',
        land_acres: 3.2,
        registered_crops: ['Sugarcane'],
        kcc_issue_date: '2021-04-10',
        kcc_expiry_date: '2026-04-09',
        total_loans_taken: 5,
        loans_repaid_ontime: 4,
        repayment_rate_percent: 78,
        outstanding_amount: 120000,
        receives_pm_kisan: true,
        last_subsidy_date: '2024-11-15',
        village: 'Baramati',
        district: 'Pune',
        state: 'Maharashtra',
        approximate_location: { lat: 18.1530, lng: 74.5775 }
    },
    'MH-5555666677': {
        kcc_id: 'MH-5555666677',
        farmer_name: 'Vijay Deshmukh',
        phone: '+918765432109',
        land_acres: 12.0,
        registered_crops: ['Cotton', 'Wheat', 'Soybean'],
        kcc_issue_date: '2023-02-20',
        kcc_expiry_date: '2028-02-19',
        total_loans_taken: 2,
        loans_repaid_ontime: 2,
        repayment_rate_percent: 100,
        outstanding_amount: 0,
        receives_pm_kisan: true,
        last_subsidy_date: '2024-12-15',
        village: 'Amravati',
        district: 'Amravati',
        state: 'Maharashtra',
        approximate_location: { lat: 20.9320, lng: 77.7523 }
    },
    'MH-1111222233': {
        kcc_id: 'MH-1111222233',
        farmer_name: 'Prakash Gaikwad',
        phone: '+917654321098',
        land_acres: 5.5,
        registered_crops: ['Rice', 'Sugarcane'],
        kcc_issue_date: '2020-08-05',
        kcc_expiry_date: '2025-08-04',
        total_loans_taken: 6,
        loans_repaid_ontime: 4,
        repayment_rate_percent: 65,
        outstanding_amount: 180000,
        receives_pm_kisan: false,
        last_subsidy_date: '2023-06-30',
        village: 'Kolhapur',
        district: 'Kolhapur',
        state: 'Maharashtra',
        approximate_location: { lat: 16.7050, lng: 74.2433 }
    },
    'MH-8888999900': {
        kcc_id: 'MH-8888999900',
        farmer_name: 'Manoj Shinde',
        phone: '+916543210987',
        land_acres: 2.0,
        registered_crops: ['Cotton'],
        kcc_issue_date: '2022-11-12',
        kcc_expiry_date: '2027-11-11',
        total_loans_taken: 2,
        loans_repaid_ontime: 1,
        repayment_rate_percent: 55,
        outstanding_amount: 95000,
        receives_pm_kisan: true,
        last_subsidy_date: '2024-10-20',
        village: 'Yavatmal',
        district: 'Yavatmal',
        state: 'Maharashtra',
        approximate_location: { lat: 20.3888, lng: 78.1204 }
    }
};

export function getKCCData(kcc_id: string): KCCData | null {
    // Normalize KCC ID
    const normalizedId = kcc_id.toUpperCase().trim();
    return MOCK_KCC_DATABASE[normalizedId] || null;
}

export function searchKCCByPhone(phone: string): KCCData | null {
    const normalizedPhone = phone.replace(/\s/g, '');
    return Object.values(MOCK_KCC_DATABASE).find(
        kcc => kcc.phone.replace(/\s/g, '') === normalizedPhone
    ) || null;
}

export const allMockFarmers = Object.values(MOCK_KCC_DATABASE);
