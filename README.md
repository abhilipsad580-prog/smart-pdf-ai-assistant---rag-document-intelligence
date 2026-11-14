# Smart PDF AI Assistant — RAG-Based Document Intelligence

An AI-powered document assistant that allows users to upload PDF files, ask questions about their content, and receive context-aware answers with page-number citations.

## Project Overview

Finding specific information in lengthy PDF documents can be time-consuming. This project uses Retrieval-Augmented Generation (RAG) to make document interaction easier, faster, and more accessible.

Users can upload PDF documents, ask questions in natural language, generate summaries, and review relevant source information.

## Key Features

- **PDF Upload:** Upload PDF documents for processing.
- **Multi-PDF Support:** Work with multiple documents.
- **AI-Powered Question Answering:** Ask natural-language questions about uploaded documents.
- **RAG-Based Retrieval:** Retrieve relevant document content before generating answers.
- **Page-Number Citations:** Identify the document pages supporting an answer.
- **Document Summarization:** Generate summaries of uploaded documents.
- **Conversation History:** Maintain question-and-answer context.
- **Document Comparison:** Compare information across documents.
- **Source Inspection:** View retrieved source passages.
- **Grounded Responses:** Handle questions when the requested information is not available in the uploaded documents.

## How It Works — RAG Architecture

The application follows a Retrieval-Augmented Generation workflow.

1. **PDF Ingestion:** The user uploads a PDF document.
2. **Text Extraction:** Text is extracted from the uploaded document.
3. **Chunking:** Extracted text is divided into smaller sections.
4. **Embeddings:** Text chunks are converted into vector embeddings.
5. **Vector Retrieval:** Relevant chunks are retrieved based on the user's question.
6. **AI Response Generation:** Retrieved context is supplied to the AI model to generate an answer.
7. **Source Citations:** Relevant page references help users verify the generated response.

## Technology Stack

- **AI Platform:** Google Gemini
- **Application Development:** Google AI Studio
- **Programming:** JavaScript / TypeScript
- **Frontend:** React-based application
- **Backend:** Node.js
- **Document Processing:** PDF text extraction
- **AI Architecture:** Retrieval-Augmented Generation (RAG)
- **Version Control:** Git and GitHub

*Note: The technology list should reflect the actual libraries and implementation in the project.*

## Project Structure

```text
smart-pdf-ai-assistant/
├── server/
├── src/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── server.ts
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Google Gemini API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/abhilipsad580-prog/smart-pdf-ai-assistant---rag-document-intelligence.git
```

2. Open the project directory:

```bash
cd smart-pdf-ai-assistant---rag-document-intelligence
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env.local` file in the project root and configure your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

5. Start the application:

```bash
npm run dev
```

6. Open the local application at:

```text
http://localhost:3000
```

## Testing and Validation

The following checks have been performed during development:

| Test | Result |
|---|---|
| PDF upload | Successful |
| PDF text processing | Successful |
| Document chunking and vectorization | Successful |
| Question answering with page citations | Tested in the AI Studio preview |
| Document summarization | Tested in the AI Studio preview |
| Unsupported question handling | Tested in the AI Studio preview |
| Local summary generation | Encountered a temporary Gemini 503 high-demand error |

Further testing is required to confirm consistent performance across different PDFs and local AI requests.

## Screenshots and Demo

Screenshots and a demonstration video will be added here.

## Known Limitations

- Response generation depends on the availability of the AI model and API service.
- Answer quality depends on PDF text extraction and retrieval relevance.
- Scanned PDFs may require OCR support.
- AI-generated answers should be verified against the cited document pages.
- API usage may be subject to provider quotas and rate limits.

## Security

- API keys must remain in local environment variables or secure server-side secrets.
- Never upload `.env.local`, API keys, private PDFs, or personal documents to GitHub.
- `.env.example` should contain placeholders only.
- `.gitignore` should exclude sensitive files and local dependencies.

## Future Improvements

- Improve retrieval accuracy and evaluation.
- Expand testing across different document formats and sizes.
- Improve error handling and API reliability.
- Add more comprehensive document-grounding tests.
- Enhance the user experience and deployment readiness.

## Author

Developed as an AI portfolio project to explore Generative AI, document intelligence, embeddings, and Retrieval-Augmented Generation.

**Project:** Smart PDF AI Assistant — RAG-Based Document Intelligence  

**GitHub Repository:**  
https://github.com/abhilipsad580-prog/smart-pdf-ai-assistant---rag-document-intelligence
