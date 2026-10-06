const { GoogleGenAI } = require('@google/genai');
const Groq = require('groq-sdk');

let geminiClient = null;
let groqClient = null;

function getAIProvider() {
  // if (process.env.GEMINI_API_KEY) {
  //   if (!geminiClient) {
  //     geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  //   }
  //   return { provider: 'gemini', client: geminiClient };
  // }

  if (process.env.GROQ_API_KEY) {
    if (!groqClient) {
      groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return { provider: 'groq', client: groqClient };
  }

  throw new Error("No AI provider keys found. Please set GROQ_API_KEY or GEMINI_API_KEY in the .env file.");
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const GROQ_MODEL = 'qwen/qwen3.8-27b';


// ─── Prompts ────────────────────────────────────────────────

const SYSTEM_PROMPT = `/no_think You are an expert senior software engineer conducting a thorough code review.
Analyze the provided GitHub Pull Request diff and return a structured JSON review.
Be specific, actionable, and reference actual code from the diff.
Focus on real issues — do not invent problems that aren't there.
Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

const SECURITY_SYSTEM_PROMPT = `/no_think You are a security-focused code auditor. Scan the diff ONLY for security vulnerabilities.
Look for: hardcoded credentials (API keys, passwords, tokens), SQL injection risks,
XSS vulnerabilities, use of eval/exec, unvalidated user input, insecure HTTP usage,
exposed .env values, weak crypto. Return ONLY JSON. No false positives.`;

/**
 * Build the user prompt for code review with PR context and diff.
 *
 * @param {object} params
 * @param {string} params.title - PR title
 * @param {string} params.diff - Truncated unified diff
 * @param {string[]} params.filesList - List of changed file paths
 * @returns {string} Formatted user prompt
 */
function buildUserPrompt({ title, diff, filesList }) {
  return `PR Title: ${title}
Changed Files: ${filesList.join(', ')}

Diff:
${diff}

Return a JSON object with this exact structure:
{
  "summary": "2-3 paragraph plain-English explanation of what changed and why",
  "bugs": [
    {
      "file": "filename",
      "line": "line number or range",
      "severity": "high|medium|low",
      "issue": "description of the problem",
      "suggestion": "how to fix it"
    }
  ],
  "improvements": [
    {
      "category": "Performance|Security|Readability|Testing|Architecture",
      "description": "what to improve",
      "codeSnippet": "optional improved code example"
    }
  ],
  "score": <integer 0-100 representing overall code quality>
}`;
}

/**
 * Build the user prompt for the security scan AI call.
 *
 * @param {object} params
 * @param {string} params.title - PR title
 * @param {string} params.diff - Truncated unified diff
 * @param {string[]} params.filesList - List of changed file paths
 * @returns {string} Formatted user prompt
 */
function buildSecurityPrompt({ title, diff, filesList }) {
  return `PR Title: ${title}
Changed Files: ${filesList.join(', ')}

Diff:
${diff}

Scan this diff for security vulnerabilities. Return a JSON object with this exact structure:
{
  "securityIssues": [
    {
      "file": "filename",
      "line": "line number or range",
      "type": "hardcoded-secret|sql-injection|exposed-env|dangerous-function|insecure-pattern",
      "severity": "critical|high|medium",
      "description": "what the vulnerability is",
      "remediation": "how to fix it"
    }
  ]
}

If there are no security issues, return: { "securityIssues": [] }`;
}

/**
 * Extract the first top-level JSON object from raw AI output.
 * Handles: markdown fences, <think>...</think> reasoning blocks (qwen/deepseek),
 * and any other text surrounding the JSON.
 *
 * @param {string} text - Raw text from the AI
 * @returns {string} Extracted JSON string ready for JSON.parse
 */
function extractJSON(text) {
  let cleaned = text.trim();

  // Strip <think>...</think> blocks emitted by reasoning models (e.g. qwen3, deepseek-r1)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // Extract the first complete JSON object {...} to handle any remaining preamble/postamble
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.slice(start, end + 1);
  }

  return cleaned;
}

/**
 * Send a prompt to the active AI provider and get the text response.
 *
 * @param {string} systemPrompt - System instruction for the model
 * @param {string} userPrompt - User message content
 * @returns {Promise<string>} Raw text response from the AI provider
 */
async function callAIProvider(systemPrompt, userPrompt) {
  const { provider, client } = getAIProvider();

  if (provider === 'groq') {
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 8192,
    });
    return response.choices[0]?.message?.content || '';
  }

  if (provider === 'gemini') {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
    return response.text || '';
  }

  throw new Error("No active AI provider detected.");
}

/**
 * Analyze PR code using Gemini and return a structured review.
 *
 * @param {object} prData
 * @param {string} prData.title - PR title
 * @param {string} prData.diff - Truncated unified diff
 * @param {string[]} prData.filesList - List of changed file paths
 * @returns {Promise<{ summary: string, bugs: Array, improvements: Array, score: number }>}
 */
async function analyzeCode({ title, diff, filesList }) {
  const userPrompt = buildUserPrompt({ title, diff, filesList });

  let responseText;

  try {
    responseText = await callAIProvider(SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error('AI Provider API error:', error.message);

    return buildFallbackResponse(
      `AI analysis failed: ${error.message}. Please check your API Keys (.env) and try again.`
    );
  }

  // Parse the JSON response
  try {
    const cleaned = extractJSON(responseText);
    const parsed = JSON.parse(cleaned);

    // Validate and sanitize the response structure
    return {
      summary: parsed.summary || 'No summary provided.',
      bugs: Array.isArray(parsed.bugs) ? parsed.bugs : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements
        : [],
      score:
        typeof parsed.score === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.score)))
          : 50,
    };
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', parseError.message);
    console.error('Raw response:', responseText.slice(0, 500));

    return buildFallbackResponse(
      'AI returned an unparseable response. The review could not be generated. Please try again.'
    );
  }
}

/**
 * Analyze PR diff for security vulnerabilities using a separate Gemini call.
 * (Phase 2 — Feature 1: Security Scan Layer)
 *
 * @param {object} prData
 * @param {string} prData.title - PR title
 * @param {string} prData.diff - Truncated unified diff
 * @param {string[]} prData.filesList - List of changed file paths
 * @returns {Promise<Array>} Array of security issue objects
 */
async function analyzeSecurityIssues({ title, diff, filesList }) {
  const userPrompt = buildSecurityPrompt({ title, diff, filesList });

  let responseText;

  try {
    responseText = await callAIProvider(SECURITY_SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error('AI Security Scan error:', error.message);
    return []; // Return empty array on failure — don't block the main review
  }

  try {
    const cleaned = extractJSON(responseText);
    const parsed = JSON.parse(cleaned);

    return Array.isArray(parsed.securityIssues) ? parsed.securityIssues : [];
  } catch (parseError) {
    console.error('Failed to parse security scan response:', parseError.message);
    return [];
  }
}

/**
 * Build a fallback response when AI analysis or parsing fails.
 *
 * @param {string} errorNote - Description of what went wrong
 * @returns {{ summary: string, bugs: Array, improvements: Array, score: number }}
 */
function buildFallbackResponse(errorNote) {
  return {
    summary: errorNote,
    bugs: [],
    improvements: [],
    score: 50,
  };
}

module.exports = { analyzeCode, analyzeSecurityIssues };
