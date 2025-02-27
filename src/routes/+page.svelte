<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Button,
		FileUploader,
		Grid,
		Row,
		Column,
		Tile,
		TextInput,
		Loading,
		Tag,
		SideNav,
		SideNavItems,
		SideNavDivider,
		Content,
		Header,
		HeaderUtilities,
		HeaderGlobalAction,
		SkipToContent
	} from 'carbon-components-svelte';
	import { BarChartSimple } from '@carbon/charts-svelte';
	import { DocumentAdd, TrashCan, Information, OverflowMenuHorizontal } from 'carbon-icons-svelte';

	import {
		db,
		saveQuestion,
		getRecentQuestions,
		clearQuestionHistory,
		saveDocument,
		getDocument,
		clearDocuments,
		getRecentDocuments,

		saveDocumentOutput,

		getDocumentOutput


	} from '$lib';

	let pdfFile: string | Blob | null = null;
	let excelFile: string | Blob | null = null;
	let pdfFileName: string | Blob = '';
	let pdfBase64: string = '';
	let loading = false;
	let summary = '';
	let chartData: { data: { group: any; value: any; }[]; options: { title: any; height: string; axes: { left: { mapsTo: string; }; bottom: { mapsTo: string; scaleType: string; }; }; color: { scale: { Data: string; }; }; }; } | null = null;
	let question = '';
	let answer = '';

	let recentQuestions: string | any[] = [];
	let recentDocuments: string | any[] = [];
	let recentDocumentOutputs: string | any[] = [];
	let totalQuestions = 0;
	let paginationSettings = { pageSize: 10, page: 1 };
	let isSideNavExpanded = true;
	let activeHistoryItem: {
		id?: any;
		question?: string;
		answer?: string;
		timestamp?: string;
	} | null = null;

	onMount(async () => {
		// Initialize database and load recent questions
		await loadRecentQuestions();
		await loadSavedDocuments();
		await loadSavedDocumentOutputs();
	});

	async function loadSavedDocuments() {
		console.log(await getRecentDocuments(paginationSettings.pageSize));
		recentDocuments = await getRecentDocuments(paginationSettings.pageSize);
	}
	

	async function loadSavedDocumentOutputs() {
		console.log(await getRecentDocuments(paginationSettings.pageSize));
		recentDocumentOutputs = await getRecentDocuments(paginationSettings.pageSize);
	}


	async function processExcel(){
		if (!excelFile) return;

		loading = true;
		if (excelFile instanceof Blob) {
			pdfFileName = excelFile;
		} else if (typeof excelFile === 'string') {
			pdfFileName = excelFile.split('/').pop() || excelFile;
		}

		try {
			const formData = new FormData();
			formData.append('pdf', excelFile);

			pdfBase64 = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const base64String = reader.result as string;
					const base64Data = base64String.split(',')[1];
					resolve(base64Data);
				};
				reader.onerror = reject;
				reader.readAsDataURL(excelFile as Blob);
			});

			// Check if we have this document already processed
			const existingDoc = await getDocumentOutput(pdfFile.name);
			if (existingDoc) {
				summary = existingDoc.summary;
				chartData = prepareChartData(existingDoc.chartData);
				console.log('Using cached document data');
			} else {
				// Send the pdf to the server for processing
				formData.append('base64', pdfBase64);

				const response = await fetch('/api/process-pdf', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) throw new Error('Failed to process PDF');

				const data = await response.json();
				summary = data.summary;
				chartData = prepareChartData(data.chartData);

				// Save the document data
				await saveDocumentOutput(pdfFile.name, pdfBase64, summary, data.chartData);
			}
		} catch (error: any) {
			console.error('Error processing PDF:', error);
		} finally {
			loading = false;
			await loadSavedDocuments();
		}
	}

	async function processPDF() {
		if (!pdfFile) return;

		loading = true;
		if (pdfFile instanceof Blob) {
			pdfFileName = pdfFile;
		} else if (typeof pdfFile === 'string') {
			pdfFileName = pdfFile.split('/').pop() || pdfFile;
		}

		try {
			const formData = new FormData();
			formData.append('pdf', pdfFile);

			pdfBase64 = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const base64String = reader.result as string;
					const base64Data = base64String.split(',')[1];
					resolve(base64Data);
				};
				reader.onerror = reject;
				reader.readAsDataURL(pdfFile as Blob);
			});

			// Check if we have this document already processed
			const existingDoc = await getDocument(pdfFile.name);
			if (existingDoc) {
				summary = existingDoc.summary;
				chartData = prepareChartData(existingDoc.chartData);
				console.log('Using cached document data');
			} else {
				// Send the pdf to the server for processing
				formData.append('base64', pdfBase64);

				const response = await fetch('/api/process-pdf', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) throw new Error('Failed to process PDF');

				const data = await response.json();
				summary = data.summary;
				chartData = prepareChartData(data.chartData);

				// Save the document data
				await saveDocument(pdfFile.name, pdfBase64, summary, data.chartData);
			}
		} catch (error: any) {
			console.error('Error processing PDF:', error);
		} finally {
			loading = false;
			await loadSavedDocuments();
		}
	}

	async function saveOutputExcel(){
		if (!pdfFile) return;

		loading = true;
		if (pdfFile instanceof Blob) {
			pdfFileName = pdfFile;
		} else if (typeof pdfFile === 'string') {
			pdfFileName = pdfFile.split('/').pop() || pdfFile;
		}

		try {
			const formData = new FormData();
			formData.append('pdf', pdfFile);

			pdfBase64 = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const base64String = reader.result as string;
					const base64Data = base64String.split(',')[1];
					resolve(base64Data);
				};
				reader.onerror = reject;
				reader.readAsDataURL(pdfFile as Blob);
			});

			// Check if we have this document already processed
			const existingDoc = await getDocumentOutput(pdfFile.name);
			if (existingDoc) {
				summary = existingDoc.summary;
				console.log('Using cached document data');
			} else {
				// Send the pdf to the server for processing
				formData.append('base64', pdfBase64);

				const response = await fetch('/api/process-pdf', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) throw new Error('Failed to process PDF');

				const data = await response.json();
				summary = data.summary;
				chartData = prepareChartData(data.chartData);

				// Save the document data
				await saveDocumentOutput(pdfFile.name, pdfBase64, summary, data.chartData);
			}
		} catch (error: any) {
			console.error('Error processing PDF:', error);
		} finally {
			loading = false;
			await loadSavedDocumentOutputs();
		}
	} 

	function prepareChartData(data: { labels: any[]; values: { [x: string]: any }; title: any }) {
		if (!data) return null;
		return {
			data: data.labels.map((label: any, index: string | number) => ({
				group: label,
				value: data.values[index]
			})),
			options: {
				title: data.title,
				height: '400px',
				axes: {
					left: {
						mapsTo: 'value'
					},
					bottom: {
						mapsTo: 'group',
						scaleType: 'labels'
					}
				},
				color: {
					scale: {
						Data: '#8a3ffc'
					}
				}
			}
		};
	}

	async function askQuestion() {
		if (!pdfFile || !question) return;

		loading = true;

		try {
			const formData = new FormData();
			formData.append('pdf', pdfFile);
			formData.append('question', question);

			// Use cached base64 if available
			pdfBase64 = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const base64String = reader.result as string;
					const base64Data = base64String.split(',')[1];
					resolve(base64Data);
				};
				reader.onerror = reject;
				reader.readAsDataURL(pdfFile as Blob);
			});

			formData.append('base64', pdfBase64);

			const response = await fetch('/api/ask-question', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) throw new Error('Failed to get answer');

			const data = await response.json();
			answer = data.answer;

			await saveQuestion(question, answer, pdfFileName);

			await loadRecentQuestions();
		} catch (error) {
			console.error('Error asking question:', error);
		} finally {
			loading = false;
		}
	}

	function handleFileChange(e: CustomEvent) {
		const files = e.detail;
		if (files && files.length > 0) {
			pdfFile = files[0];
			pdfBase64 = ''; // Reset base64 when file changes
		}
	}

	function handleFileOutputChange(e: CustomEvent) {
		const files = e.detail;
		if (files && files.length > 0) {
			pdfFile = files[0];
			pdfBase64 = ''; // Reset base64 when file changes
		}
	}

	async function handleClearHistory() {
		const confirmed = confirm(
			'Are you sure you want to clear all history? This includes questions and document data.'
		);
		if (confirmed) {
			await clearQuestionHistory();
			await clearDocuments();
			await loadRecentQuestions();
			await loadSavedDocuments();
			activeHistoryItem = null;
		}
	}

	async function loadRecentQuestions() {
		recentQuestions = await getRecentQuestions(30); // Load more for sidebar
		totalQuestions = recentQuestions.length;
	}

	async function useHistoryQuestion(historyItem: { id: string, question: string; filename: string | Blob }) {
		question = historyItem.question;
		activeHistoryItem = historyItem;

		const doc = await getDocument(historyItem.id);
		if (doc) {
			pdfFileName = doc.filename;
			summary = doc.summary;
			chartData = prepareChartData(doc.chartData);
			pdfBase64 = doc.base64;
			if (typeof doc.filename === 'string') {
				console.log("Document found in history, but can't recreate file object");
			}
		}
	}

	function viewHistoryItem(historyItem: {
		id: any;
		answer: string;
		question: string;
		timestamp: string;
		filename: string | Blob;
	}) {
		activeHistoryItem = historyItem;
		question = historyItem.question;
		answer = historyItem.answer;
		id = historyItem.id;

		useHistoryQuestion(historyItem);
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleString();
	}

	function formatShortDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function toggleSideNav() {
		isSideNavExpanded = !isSideNavExpanded;
	}

	function truncateText(text: string, maxLength = 25) {
		if (!text) return '';
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<div class="app-container">
	{#if loading}
		<Loading active />
	{/if}
	<Header company="Nibble" platformName="Aero: PDF Analyzer">
		<div slot="skip-to-content">
			<SkipToContent />
		</div>

		<HeaderUtilities>
			<HeaderGlobalAction
				aria-label="Clear History"
				icon={TrashCan}
				on:click={handleClearHistory}
				disabled={recentDocuments.length === 0}
			/>
		</HeaderUtilities>
	</Header>
	<SideNav bind:isOpen={isSideNavExpanded} rail={false}>
		<SideNavItems>
			<div class="sidebar-header">
				<h3 style="padding: 0.5rem;">History</h3>
			</div>

			<SideNavDivider />

			{#if recentDocuments.length === 0}
				<div class="empty-history" style="padding: 1rem;">
					<p>No data yet</p>
				</div>
			{:else}
				{#each recentDocuments as item, i}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="history-item {activeHistoryItem && activeHistoryItem.id === item.id
							? 'active'
							: ''}"
						on:click={() => viewHistoryItem(item)}
						style="cursor: pointer; padding: 1rem;"
					>
						<div class="history-item-content">
							<div class="history-item-header">
								<Tag type="blue">{truncateText(item.filename || 'Unknown', 15)}</Tag>
								<span class="history-time">{formatShortDate(item.timestamp)}</span>
							</div>
							<p class="history-question">{truncateText(item.question, 60)}</p>
						</div>
					</div>
					{#if i < recentDocuments.length - 1}
						<SideNavDivider />
					{/if}
				{/each}
			{/if}
		</SideNavItems>
	</SideNav>

	<Content>
		<div class="content-container">
			<Grid fullWidth={true} narrow={false}>
				<Row>
					<Column>
						<Tile class="upload-tile">
							<h2>Upload PDF</h2>
							<FileUploader
								labelTitle="Upload a PDF file"
								buttonLabel="Choose file"
								labelDescription="Max file size: 10MB"
								accept={['.pdf', '.docx']}
								on:change={handleFileChange}
								class="mb-4"
							/>
							<Button on:click={processPDF} disabled={!pdfFile || loading} kind="primary">
								Analyze PDF
							</Button>
						</Tile>
					</Column>
					<Column>
						<Tile class="upload-tile">
							<h2>Upload Output Excel</h2>
							<FileUploader
								labelTitle="Upload an Excel file"
								buttonLabel="Choose file"
								labelDescription="Max file size: 10MB"
								accept={['.xlsx']}
								on:change={handleFileOutputChange}
								class="mb-4"
							/>
							<Button on:click={saveOutputExcel} disabled={!excelFile || loading} kind="primary">
								Uplaod Excel Output
							</Button>
						</Tile>
					</Column>
				</Row>
				{#if summary}
					<Row>
						<Column lg={8} md={8} sm={4}>
							<Tile class="summary-tile">
								<h2>Document Summary</h2>
								<div class="summary-content">
									{summary}
								</div>
							</Tile>
						</Column>
						<Column lg={8} md={8} sm={4}>
							<Tile class="chart-tile">
								<h2>Key Metrics</h2>
								{#if chartData}
									<BarChartSimple data={chartData.data} options={chartData.options} />
								{:else}
									<div class="no-chart-data">
										<p>No chart data available</p>
									</div>
								{/if}
							</Tile>
						</Column>
					</Row>
				{/if}

				<!-- <Row>
					<Column>
						<Tile class="question-tile">
							<h2>Ask Questions About the Document</h2>
							<TextInput
								labelText="Your Question"
								placeholder="Enter your question about the document..."
								bind:value={question}
								disabled={!pdfFile}
							/>
							<Button
								on:click={askQuestion}
								disabled={!pdfFile || !question}
								kind="tertiary"
								class="mt-4"
							>
								Ask Question
							</Button>

							{#if answer}
								<div class="answer-box">
									<h3>Answer:</h3>
									<p>{answer}</p>
								</div>
							{/if}
						</Tile>
					</Column>
				</Row> -->
			</Grid>
		</div>
	</Content>
</div>
