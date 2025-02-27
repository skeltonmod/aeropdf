/* eslint-disable @typescript-eslint/no-explicit-any */
import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_KEY } from '$env/static/private';

async function remotePdfToPart(url, path, displayName) {
    const pdfBuffer = await fetch(url).then((response) => response.arrayBuffer());
    const binaryPdf = Buffer.from(pdfBuffer);
    fs.writeFileSync(path, binaryPdf, 'binary');

    const uploadResult = await fileManager.uploadFile(
        path,
        {
            mimeType: "application/pdf",
            displayName,
        },
    );

    return {
        fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
        },
    };
}

export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const pdfBase64 = formData.get('base64');
		const pdfFile = formData.get('pdf');

		if (!pdfFile || !(pdfFile instanceof File)) {
			return json({ error: 'No PDF file provided' }, { status: 400 });
		}

		const genAI = new GoogleGenerativeAI(GEMINI_KEY);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		// Generate structured summary and chart data with a specific prompt
		const prompt = `
		Analyze the following PDF content and provide:
		- A summary of the rates and a table with the rates
		- Make sure that all rates are included in the summary and chart
		- After a quick summary of date on rates copy the table data
		
	  `;

		const result = await model.generateContent([
			{
				inlineData: {
					data: pdfBase64?.toString() || '',
					mimeType: 'application/pdf'
				}
			},
			prompt
		]);
		const response = await result.response;
		const text = response.text();

		// Parse the response
		const summaryMatch = text.match(/SUMMARY:([\s\S]*?)CHART_DATA:/);
		const chartDataMatch = text.match(/CHART_DATA:([\s\S]*)/);

		let summary = '';
		let chartData = null;

		if (summaryMatch && summaryMatch[1]) {
			summary = summaryMatch[1].trim();
		}

		if (chartDataMatch && chartDataMatch[1]) {
			try {
				// Find JSON object in the text
			let jsonStr = chartDataMatch[1].trim();
				
				// Remove code fence backticks and language identifier if present
				jsonStr = jsonStr.replace(/```json|```/g, '').trim();
				
				chartData = JSON.parse(jsonStr);
			} catch (error) {
				console.log(chartDataMatch[1].trim());
				console.error('Error parsing chart data:', error);
				// Fallback data if parsing fails
				chartData = {
					title: 'Document Metrics',
					labels: ['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4', 'Metric 5'],
					values: [5, 10, 15, 20, 25]
				};
			}
		}

		return json({
			summary,
			chartData
		});
	} catch (error: any) {
		console.error('Error processing PDF:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
