const express = require('express');
const { fetchPRData } = require('../services/githubService');
const { analyzeCode, analyzeSecurityIssues } = require('../services/aiService');
const { analyzeComplexity } = require('../utils/complexityAnalyzer');

const router = express.Router();

// Regex to validate GitHub PR URL format
const GITHUB_PR_PATTERN =
  /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

/**
 * POST /api/review
 *
 * Accepts a GitHub PR URL, fetches the PR data from GitHub,
 * sends the diff to Gemini AI for analysis (code review + security scan),
 * computes complexity scores, and returns a structured response
 * matching the shared API contract + Phase 2 extensions.
 */
router.post('/', async (req, res, next) => {
  try {
    const { prUrl } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!prUrl || typeof prUrl !== 'string') {
      const err = new Error('Missing required field: prUrl');
      err.statusCode = 400;
      throw err;
    }

    if (!GITHUB_PR_PATTERN.test(prUrl.trim())) {
      const err = new Error(
        'Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123'
      );
      err.statusCode = 400;
      throw err;
    }

    // ── Fetch PR data from GitHub ───────────────────────────
    console.log(`[REVIEW] Fetching PR data for: ${prUrl}`);
    const prData = await fetchPRData(prUrl.trim());

    // ── Run AI analysis + security scan in parallel ─────────
    console.log(`[REVIEW] Analyzing PR: "${prData.title}" (${prData.files} files changed)`);

    const prContext = {
      title: prData.title,
      diff: prData.diff,
      filesList: prData.filesList,
    };

    const [aiResult, securityIssues] = await Promise.all([
      analyzeCode(prContext),
      analyzeSecurityIssues(prContext),
    ]);

    // ── Compute complexity scores (no AI needed) ────────────
    const complexityScores = analyzeComplexity(prData.diff);

    // ── Build response matching the shared API contract ─────
    const response = {
      // Base contract
      pr: {
        title: prData.title,
        author: prData.author,
        base: prData.base,
        head: prData.head,
        additions: prData.additions,
        deletions: prData.deletions,
        files: prData.files,
      },
      summary: aiResult.summary,
      bugs: aiResult.bugs,
      improvements: aiResult.improvements,
      score: aiResult.score,

      // Phase 2 — Feature 1: Security Scan
      securityIssues,

      // Phase 2 — Feature 2: Complexity Scores
      complexityScores,

      // Phase 2 — Feature 3: Raw diff for Diff Viewer
      diff: prData.diff,
    };

    console.log(
      `[REVIEW] Review complete. Score: ${aiResult.score}/100, Bugs: ${aiResult.bugs.length}, Security: ${securityIssues.length}, Suggestions: ${aiResult.improvements.length}`
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
