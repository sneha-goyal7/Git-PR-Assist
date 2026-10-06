import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ReviewForm from './components/ReviewForm';
import ReviewResult from './components/ReviewResult';
import LoadingState from './components/LoadingState';
import './App.css';

function App() {
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = () => {
    setPrUrl('');
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1a1a1a',
            fontSize: '0.85rem',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          },
        }}
      />

      <div className="container" style={{ position: 'relative' }}>


        <header className="app-header">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            PR Reviewer
          </motion.h1>
          <motion.p 
            className="app-tagline"
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            AI-powered code review ✧
          </motion.p>
        </header>

        <main className={`app-main ${!result && !loading ? 'app-main--centered' : ''}`}>
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%' }}
              >
                <ReviewForm
                  prUrl={prUrl}
                  setPrUrl={setPrUrl}
                  setLoading={setLoading}
                  setResult={setResult}
                  setError={setError}
                />
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%' }}
              >
                <LoadingState />
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%' }}
              >
                <ReviewResult result={result} onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}

export default App;
