import fs from 'fs';
import path from 'path';
import { FraudCase, FraudFlag } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data/fraud_cases.json');

// Ensure data directory exists
const ensureDb = () => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    }
};

export const getFraudCases = (): FraudCase[] => {
    ensureDb();
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading fraud cases:', error);
        return [];
    }
};

export const saveFraudCase = (fraudCase: FraudCase): void => {
    ensureDb();
    try {
        const cases = getFraudCases();
        // Check for duplicates based on assessment ID or logic
        const existingIndex = cases.findIndex(c => c.id === fraudCase.id);

        if (existingIndex >= 0) {
            cases[existingIndex] = fraudCase;
        } else {
            cases.push(fraudCase);
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(cases, null, 2));
    } catch (error) {
        console.error('Error saving fraud case:', error);
    }
};
