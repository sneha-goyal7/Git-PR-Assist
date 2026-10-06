import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, ChevronDown, ChevronUp } from 'lucide-react';
import './DiffViewer.css';

// A minimal diff parser for split-view layout without external bloated libraries
function parseDiff(diffStr) {
  if (!diffStr) return [];
  const files = [];
  let currentFile = null;

  const lines = diffStr.split('\n');
  lines.forEach((line) => {
    if (line.startsWith('diff --git')) {
      if (currentFile) files.push(currentFile);
      currentFile = { name: line.split(' b/')[1] || 'Unknown', chunks: [] };
    } else if (currentFile) {
      if (line.match(/^index |^\+\+\+ |^--- |^@@ /)) {
        // Skip metadata
      } else {
        currentFile.chunks.push(line);
      }
    }
  });
  if (currentFile) files.push(currentFile);
  return files;
}

function DiffFile({ file }) {
  const leftLines = [];
  const rightLines = [];

  file.chunks.forEach((line) => {
    if (line.startsWith('-')) {
      leftLines.push(line.substring(1));
      rightLines.push(null); // padding for alignment
    } else if (line.startsWith('+')) {
      rightLines.push(line.substring(1));
      leftLines.push(null);  // padding for alignment
    } else {
      leftLines.push(line.startsWith(' ') ? line.substring(1) : line);
      rightLines.push(line.startsWith(' ') ? line.substring(1) : line);
    }
  });

  return (
    <div className="diff-file">
      <div className="diff-file-header">{file.name}</div>
      <div className="diff-split-container">
        {/* Left Side */}
        <div className="diff-pane diff-left">
          {leftLines.map((content, idx) => (
            <div key={`l-${idx}`} className={`diff-line ${content === null ? 'diff-empty' : file.chunks[idx]?.startsWith('-') ? 'diff-removed' : 'diff-context'}`}>
              <span className="diff-line-number">{idx + 1}</span>
              <span className="diff-line-content">{content === null ? ' ' : content}</span>
            </div>
          ))}
        </div>
        
        {/* Right Side */}
        <div className="diff-pane diff-right">
          {rightLines.map((content, idx) => (
            <div key={`r-${idx}`} className={`diff-line ${content === null ? 'diff-empty' : file.chunks[idx]?.startsWith('+') ? 'diff-added' : 'diff-context'}`}>
              <span className="diff-line-number">{idx + 1}</span>
              <span className="diff-line-content">{content === null ? ' ' : content}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DiffViewer({ diff }) {
  const [expanded, setExpanded] = useState(false);
  const files = parseDiff(diff);

  if (!diff) return null;

  return (
    <div className="diff-viewer card">
      <div className="card-title-wrap diff-viewer-wrap" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCompare size={16} className="card-title-icon" />
          <span className="card-title-text">Raw Diff Viewer ({files.length} files)</span>
        </div>
        <button className="btn-icon">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.2 }, height: { duration: 0.4, type: "spring", bounce: 0 } }}
            style={{ overflow: 'hidden' }}
          >
            <div className="diff-files-wrap">
              {files.map((file, i) => (
                <DiffFile key={i} file={file} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
