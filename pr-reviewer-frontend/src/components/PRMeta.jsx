import { motion } from 'framer-motion';
import { GitPullRequest, GitMerge, FileArchive, Plus, Minus } from 'lucide-react';
import './PRMeta.css';

function ScoreRing({ score }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = '#388e3c'; // green
  if (score < 40) color = '#d32f2f'; // red
  else if (score < 70) color = '#f57c00'; // amber

  return (
    <div className="score-ring">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="3"
        />
        <motion.circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
        />
      </svg>
      <motion.span 
        className="score-ring-label" 
        style={{ color }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        {score}
      </motion.span>
    </div>
  );
}

export default function PRMeta({ pr, score }) {
  return (
    <div className="pr-meta card">
      <div className="pr-meta-main">
        <div className="pr-meta-info">
          <h3 className="pr-meta-title">{pr.title}</h3>
          
          <div className="pr-meta-details">
            <span className="pr-meta-author">
              <img src={`https://github.com/${pr.author}.png?size=32`} alt="avatar" className="pr-meta-avatar" onError={(e) => e.target.style.display = 'none'} />
              {pr.author}
            </span>
            <span className="pr-meta-branch">
              <GitPullRequest size={14} className="pr-meta-icon" />
              {pr.base} <span className="pr-meta-arrow">←</span> {pr.head}
            </span>
          </div>

          <div className="pr-meta-stats">
            <span className="pr-meta-stat stat-add"><Plus size={12}/> {pr.additions}</span>
            <span className="pr-meta-stat stat-del"><Minus size={12}/> {pr.deletions}</span>
            <span className="pr-meta-stat stat-files"><FileArchive size={12}/> {pr.files} file{pr.files !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="pr-meta-score-wrap">
          <ScoreRing score={score} />
          <span className="score-subtitle">Quality</span>
        </div>
      </div>
    </div>
  );
}
