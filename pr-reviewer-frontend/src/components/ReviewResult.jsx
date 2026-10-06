import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';

import PRMeta from './PRMeta';
import SummaryCard from './SummaryCard';
import BugList from './BugList';
import ImprovementList from './ImprovementList';
import SecurityPanel from './SecurityPanel';
import ComplexityChart from './ComplexityChart';
import DiffViewer from './DiffViewer';
import { exportReviewAsPDF } from '../utils/exportPDF';
import './ReviewResult.css';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ReviewResult({ result, onReset }) {
  const [exporting, setExporting] = useState(false);
  const { pr, summary, bugs, improvements, score, securityIssues, complexityScores, diff } = result;

  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading('Generating PDF...');
    try {
      await exportReviewAsPDF(result);
      toast.success('PDF Exported', { id: toastId });
    } catch (e) {
      toast.error('Failed to export PDF', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="review-result">
      <div className="review-result-header">
        <button
          className="btn btn-secondary review-result-back"
          onClick={onReset}
        >
          <ArrowLeft size={16} /> New Review
        </button>

        <button
          className="btn btn-secondary review-result-back"
          onClick={handleExport}
          disabled={exporting}
          style={{ marginLeft: 'auto' }}
        >
          <Download size={16} /> Export PDF
        </button>
      </div>

      <motion.div 
        className="review-result-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <PRMeta pr={pr} score={score} />
        </motion.div>

        {/* Phase 2: Security Scan goes immediately below Meta */}
        {securityIssues !== undefined && (
          <motion.div variants={itemVariants}>
            <SecurityPanel securityIssues={securityIssues} />
          </motion.div>
        )}
        
        <motion.div variants={itemVariants}>
          <SummaryCard summary={summary} />
        </motion.div>

        {/* Phase 2: Complexity Chart placed securely before Bugs */}
        {complexityScores !== undefined && (
          <motion.div variants={itemVariants}>
            <ComplexityChart complexityScores={complexityScores} />
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <BugList bugs={bugs} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ImprovementList improvements={improvements} />
        </motion.div>

        {/* Phase 2: Collapsible Diff Viewer at the bottom */}
        {diff && (
          <motion.div variants={itemVariants}>
            <DiffViewer diff={diff} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
