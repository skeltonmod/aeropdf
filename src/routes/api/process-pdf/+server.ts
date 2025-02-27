/* eslint-disable @typescript-eslint/no-explicit-any */
import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_KEY } from '$env/static/private';

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
		
		1. A concise summary (max 300 words) of the key points.
		2. Extract 5 or more key metrics from the document that could be visualized in a chart.
		
		For the metrics, format your response as a JSON object with the following structure:
		{
		  "title": "Title for the chart",
		  "labels": ["Label1", "Label2", "Label3", "Label4", "Label5"],
		  "values": [value1, value2, value3, value4, value5]
		}
		
		Make sure the values are numeric and represent important quantitative information from the document.
		If exact numbers aren't available, always provide reasonable estimates based on the text.
		
		Start your response with "SUMMARY:" followed by the summary text, then "CHART_DATA:" followed by the JSON object.
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
