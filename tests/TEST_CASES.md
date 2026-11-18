# Smart PDF AI Assistant — Manual Test Plan

This document records the manual functional checks for the Smart PDF AI Assistant (RAG).

## 1. Test Environment

- **Application:** Smart PDF AI Assistant
- **Local URL:** http://localhost:3000
- **Runtime:** Node.js and npm
- **AI Provider:** Google Gemini
- **Test Type:** Manual functional testing

## 2. Test Cases

| ID | Test | Expected Result | Current Status |
|---|---|---|---|
| TC-01 | Upload a PDF | PDF is accepted and appears in the document list. | Previously tested locally: upload succeeded. |
| TC-02 | Extract PDF text | Text is extracted and page count is reported. | Previously tested locally: 3 pages extracted. |
| TC-03 | Create retrieval chunks | Chunks are created and document becomes ready. | Previously tested locally: 6 vector chunks reported. |
| TC-04 | Ask a question answered in the PDF | Answer matches the source and includes a relevant page citation. | Previously tested locally: 24 kWh answer with an exact citation reported. |
| TC-05 | Inspect retrieved sources | Relevant source passages and page information are displayed. | Previously tested in AI Studio preview. Retest locally. |
| TC-06 | Generate a document summary | A summary is generated from the uploaded document. | Previously tested in AI Studio preview. Local retry was reported successful after a temporary Gemini 503 error. Retest locally. |
| TC-07 | Ask an unsupported question | App indicates that the information is not in the document instead of inventing an answer. | Previously tested in AI Studio preview. Retest locally. |
| TC-08 | Upload multiple PDFs | Multiple documents are processed and can be used as intended. | Not independently verified locally. |
| TC-09 | Conversation history | Earlier questions and answers remain available as designed. | Not independently verified locally. |
| TC-10 | Compare documents | Comparison is grounded in the uploaded documents. | Not independently verified locally. |
| TC-11 | Handle a temporary model/API error | App displays a clear error and allows retry without exposing secrets. | Gemini 503 high-demand error observed. Retry handling needs verification. |

## 3. How to Run the Manual Tests Locally

1. Open the project folder in the terminal.
2. Run `npm run dev`.
3. Open http://localhost:3000 in a browser.
4. Upload a small, non-confidential, text-based PDF.
5. Run the relevant test cases.
6. Record the test date, result, and any error messages.

## 4. Security Notes

- Never upload API keys or `.env.local` to GitHub.
- Do not upload private PDFs or personal documents.
- Keep real API credentials in local environment variables.

## 5. Important Notes

- This is a **manual test plan**, not an automated test suite.
- Previously tested results are based on reported project-development tests, not a fresh test run.
- Retest features after code changes and before presenting the project.
- Mark a test as passed only after observing the expected result. 
