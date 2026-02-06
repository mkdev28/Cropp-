import { NextResponse } from "next/server";
import puppeteer from "puppeteer";



export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { farmer_name, final_risk_score, recommended_premium, district_avg_premium, savings_amount, scores, improvement_suggestions } = data;

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Dynamic HTML Report
        await page.setContent(`
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                h1 { color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px; }
                .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .score-card { background: #f1f8e9; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
                .score-value { font-size: 48px; font-weight: bold; color: #2e7d32; }
                .premium-box { border: 1px solid #c8e6c9; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
                .premium-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .savings { color: #2e7d32; font-weight: bold; }
                .section-title { font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #2e7d32; padding-left: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
                th { background-color: #f5f5f5; }
                .footer { margin-top: 50px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1>AgriRisk Assessment Report</h1>
                    <p>Generated for: <strong>${farmer_name}</strong></p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0;">AgriRisk Pro</h2>
                    <p>AI-Powered Risk Analysis</p>
                </div>
            </div>

            <div class="score-card">
                <h2>Final Risk Score</h2>
                <div class="score-value">${final_risk_score}/100</div>
                <p>Status: ${final_risk_score < 30 ? 'Low Risk' : final_risk_score < 70 ? 'Medium Risk' : 'High Risk'}</p>
            </div>

            <h3 class="section-title">Premium Analysis</h3>
            <div class="premium-box">
                <div class="premium-row">
                    <span>Recommended Premium:</span>
                    <strong>₹${recommended_premium.toLocaleString()}</strong>
                </div>
                <div class="premium-row">
                    <span>District Average:</span>
                    <span>₹${district_avg_premium.toLocaleString()}</span>
                </div>
                <div class="premium-row">
                    <span>Potential Savings:</span>
                    <span class="savings">₹${savings_amount.toLocaleString()}</span>
                </div>
            </div>

            <h3 class="section-title">Risk Breakdown</h3>
            <table>
                <tr>
                    <th>Factor</th>
                    <th>Score (0-100)</th>
                    <th>Impact</th>
                </tr>
                <tr>
                    <td>Weather Risk</td>
                    <td>${scores.weather_risk}</td>
                    <td>${scores.weather_risk > 50 ? 'High' : 'Low'}</td>
                </tr>
                <tr>
                    <td>Infrastructure</td>
                    <td>${scores.infrastructure}</td>
                    <td>${scores.infrastructure > 50 ? 'Strong' : 'Weak'}</td>
                </tr>
                <tr>
                    <td>Crop Diversification</td>
                    <td>${scores.diversification}</td>
                    <td>${scores.diversification > 50 ? 'High' : 'Low'}</td>
                </tr>
                <tr>
                    <td>Financial Health</td>
                    <td>${scores.financial_health}</td>
                    <td>${scores.financial_health > 50 ? 'Healthy' : 'Needs Improvement'}</td>
                </tr>
            </table>

            <h3 class="section-title">Improvement Suggestions</h3>
            <ul>
                ${improvement_suggestions.map((suggestion: any) => `
                    <li>
                        <strong>${suggestion.action}</strong>: ${suggestion.description}
                        <br/><span style="font-size: 12px; color: #666;">Potential Score Increase: +${suggestion.score_increase}</span>
                    </li>
                `).join('')}
            </ul>

            <div class="footer">
                <p>This report is generated by AgriRisk Pro AI system. It is an estimate based on provided and satellite data.</p>
                <p>&copy; ${new Date().getFullYear()} AgriRisk Pro</p>
            </div>
        </body>
        </html>
        `);

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20px", bottom: "40px", left: "20px", right: "20px" }
        });

        await browser.close();

        return new NextResponse(pdfBuffer as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=AgriRisk-Report.pdf",
            },
        });
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}
