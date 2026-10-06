/**
 * Complexity Analyzer — Phase 2 Feature 2
 *
 * Analyzes a unified diff to produce per-file complexity delta scores.
 * Measures how much more (or less) complex each changed file became.
 */

// Keywords that indicate control-flow nesting / complexity
const COMPLEXITY_KEYWORDS = /\b(if|else|for|while|switch|catch|case)\b/g;

/**
 * Split a unified diff into per-file chunks.
 *
 * @param {string} diff - Raw unified diff string
 * @returns {Array<{ file: string, lines: string[] }>}
 */
function splitDiffByFile(diff) {
  if (!diff) return [];

  const chunks = [];
  const fileSections = diff.split(/^diff --git /m);

  for (const section of fileSections) {
    if (!section.trim()) continue;

    // Extract filename from the diff header: "a/path/to/file b/path/to/file"
    const headerMatch = section.match(/^a\/(.+?) b\/(.+)/m);
    if (!headerMatch) continue;

    const file = headerMatch[2];

    // Skip binary files
    if (section.includes('Binary files')) continue;

    const lines = section.split('\n');
    chunks.push({ file, lines });
  }

  return chunks;
}

/**
 * Count complexity-related keywords in a line.
 *
 * @param {string} line - A single line of code
 * @returns {number} Number of complexity keywords found
 */
function countKeywords(line) {
  const matches = line.match(COMPLEXITY_KEYWORDS);
  return matches ? matches.length : 0;
}

/**
 * Analyze the complexity delta for a single file chunk from a diff.
 *
 * @param {{ file: string, lines: string[] }} chunk - File chunk from diff
 * @returns {{ file: string, before: number, after: number, delta: number, verdict: string }}
 */
function analyzeFileChunk(chunk) {
  let removedLines = 0;
  let addedLines = 0;
  let removedKeywords = 0;
  let addedKeywords = 0;

  for (const line of chunk.lines) {
    // Only process actual diff content lines (skip headers, @@ markers)
    if (line.startsWith('@@') || line.startsWith('diff ') ||
        line.startsWith('index ') || line.startsWith('---') ||
        line.startsWith('+++')) {
      continue;
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      removedLines++;
      removedKeywords += countKeywords(line);
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      addedLines++;
      addedKeywords += countKeywords(line);
    }
  }

  // Score formula: (keyword_count * 2) + (line_count * 0.5)
  const before = (removedKeywords * 2) + (removedLines * 0.5);
  const after = (addedKeywords * 2) + (addedLines * 0.5);
  const delta = Math.round((after - before) * 100) / 100; // round to 2 decimals

  let verdict;
  if (delta < -2) {
    verdict = 'improved';
  } else if (delta > 2) {
    verdict = 'degraded';
  } else {
    verdict = 'neutral';
  }

  return {
    file: chunk.file,
    before: Math.round(before * 100) / 100,
    after: Math.round(after * 100) / 100,
    delta,
    verdict,
  };
}

/**
 * Analyze complexity deltas for all files in a unified diff.
 *
 * @param {string} diff - Raw unified diff string
 * @returns {Array<{ file: string, before: number, after: number, delta: number, verdict: string }>}
 */
function analyzeComplexity(diff) {
  if (!diff) return [];

  const chunks = splitDiffByFile(diff);
  const scores = [];

  for (const chunk of chunks) {
    const score = analyzeFileChunk(chunk);
    // Only include files with actual changes
    if (score.before > 0 || score.after > 0) {
      scores.push(score);
    }
  }

  return scores;
}

module.exports = { analyzeComplexity };
