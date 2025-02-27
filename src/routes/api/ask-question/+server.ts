/* eslint-disable @typescript-eslint/no-explicit-any */
import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_KEY } from '$env/static/private';

export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const pdfFile = formData.get('base64');
		const question = formData.get('question');

		if (!pdfFile || !question) {
			return json({ error: 'PDF file and question are required' }, { status: 400 });
		}

		const genAI = new GoogleGenerativeAI(GEMINI_KEY);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

		const prompt = `
        Based on the following PDF content, please generate a report for all of the rates
        
        Provide a clear, concise answer based only on the information in the document.
        If the answer cannot be determined from the document, state that clearly. and generate an excel file with the rates.
      `;

		const result = await model.generateContent([
			{
				inlineData: {
					data: pdfFile?.toString() || '',
					mimeType: 'application/pdf'
				}
			},
			prompt
		]);
		const response = await result.response;
		console.log(response)
		const answer = response.text();

		return json({
			answer
		});
	} catch (error: any) {
		console.error('Error processing question:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
