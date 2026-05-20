/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import CorrelationArchitect from './components/CorrelationArchitect';
import RegressionTTestSimulator from './components/RegressionTTestSimulator';
import { Sparkles, BarChart3, HelpCircle, GraduationCap, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'architect' | 'simulator'>('architect');
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVideoOpen(false);
      }
    };
    if (isVideoOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVideoOpen]);

  useEffect(() => {
    if (isVideoOpen) {
      // Focus close button when modal opens for accessibility
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isVideoOpen]);

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800" id="main-application-container">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Curricular Academic Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6" id="app-header">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600">
              <GraduationCap size={18} className="shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Statistics C 1000 &bull; Santa Ana College</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Linear Regression &amp; Inference Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Explore bivariate linear relationship models, visualize variance accounting coefficients, verify LINER assumptions, and perform slope significance t-tests.
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-center bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 shadow-sm text-xs text-slate-650 shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Module: Linear Regression with Bivariate Data</span>
          </div>
        </header>

        {/* Quick Reference/Explainer Panel */}
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-sm"
            id="regression-explainer-panel"
          >
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <HelpCircle size={18} />
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                      Bivariate Linear Regression Reference Guide
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Fundamental concepts of bivariate analysis, application limits, and proper variable qualification.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="text-xs text-slate-400 hover:text-slate-650 transition font-medium cursor-pointer"
                  id="close-explainer-btn"
                >
                  Dismiss &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Section 1: When do we apply Linear Regression */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    When to Apply Regression
                  </h3>
                  <p className="text-xs text-slate-650 leading-relaxed">
                    Simple Linear Regression is applied when you want to study the statistical relationship between 
                    <strong> two numerical variables</strong>. Specifically:
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc marker:text-indigo-400 leading-relaxed">
                    <li>Evaluating if a change in variable <span className="font-mono font-semibold text-slate-700">X</span> is associated with a change in variable <span className="font-mono font-semibold text-slate-700">Y</span>.</li>
                    <li>Making numerical predictions (estimating <span className="font-mono font-semibold text-slate-700">ŷ</span> values for a specific input <span className="font-mono font-semibold text-slate-700">x</span>).</li>
                    <li>Quantifying the percentage of shared variance accounted for by a mathematical model (<span className="font-mono font-semibold text-slate-700">R²</span>).</li>
                  </ul>
                </div>

                {/* Section 2: Variable Eligibility */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Applicable Variable Types
                  </h3>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-indigo-55/40 rounded-xl border border-indigo-100/60">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded">Explanatory (X)</span>
                        <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase tracking-wider">Quantitative Only</span>
                      </div>
                      <p className="text-[11px] text-indigo-950 leading-relaxed">
                        The independent predictor variable. Must be numerical interval or ratio scale (e.g., background workload tasks, studying hours, ambient temp).
                      </p>
                    </div>
                    
                    <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-150/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded">Response (Y)</span>
                        <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-wider">Quantitative Only</span>
                      </div>
                      <p className="text-[11px] text-emerald-950 leading-relaxed">
                        The dependent outcome variable. Must be a numerical value that fluctuates in statistically significant ways as X changes (e.g., remaining battery %, exam score, power usage).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Boundary / Exclusion rules */}
                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Crucial Exclusion Warnings
                  </h3>
                  <div className="space-y-2 text-xs leading-relaxed text-slate-650">
                    <div className="border-l-2 border-amber-400 pl-3 py-0.5 bg-amber-50/40 rounded-r-lg">
                      <span className="text-amber-800 font-bold block text-[11px]">No Categorical Regressions:</span>
                      Do not attempt simple linear regression with categorical/qualitative data (e.g., favorite food, car brand, binary yes/no responses).
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      💡 <strong>Alternatives</strong>: For categorical explanatory variables, use <strong>T-tests</strong> or <strong>ANOVA</strong>. For categorical response variables, utilize <strong>Logistic Regression</strong>.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      📊 <strong>Linear Assumption</strong>: Before presenting regression statistics, always construct a scatterplot to verify the relationship is reasonably linear!
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* tab layout selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="navigation-tabs-bar">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('architect')}
              id="tab-btn-architect"
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'architect'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={14} />
              Correlation Architect
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              id="tab-btn-simulator"
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 size={14} />
              Regression T-Test Simulator
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 text-right shrink-0">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold font-sans transition-all cursor-pointer ${
                showGuide
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
              id="toggle-guide-btn"
            >
              <HelpCircle size={14} className="shrink-0" />
              {showGuide ? 'Hide Explainer Panel' : 'Show Explainer Panel'}
            </button>
            <div className="hidden sm:block">
              Active: <span className="font-semibold text-slate-600">{activeTab === 'architect' ? 'Correlation Architect' : 'Regression T-Test'}</span>
            </div>
          </div>
        </div>

        {/* Active tab rendered content */}
        <main className="transition-all duration-250" id="main-content-display">
          {activeTab === 'architect' ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <CorrelationArchitect />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <RegressionTTestSimulator />
            </motion.div>
          )}
        </main>

        {/* Footer info banner */}
        <footer className="border-t border-slate-200/65 pt-6 text-center text-[11px] text-slate-400 space-y-1" id="app-footer">
          <p>
            Designed specifically for introductory statistics curricula matching Statistics C 1000 course requirements.
          </p>
          <p className="font-mono">
            Variance Analysis &bull; LINER Assumptional Diagnostics &bull; Student&apos;s T Approximation Models
          </p>
        </footer>

      </div>

      {/* Floating Action Video Guide Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40" id="video-guide-fab-container">
        <button
          onClick={() => setIsVideoOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:from-amber-800 active:to-orange-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-bold text-sm tracking-wide focus:outline-none focus:ring-4 focus:ring-amber-500/50 cursor-pointer group"
          id="video-guide-fab"
          aria-label="Open Video Guide tutorial"
        >
          <Video size={18} className="animate-pulse md:group-hover:scale-110 transition shrink-0" />
          <span>Video Guide</span>
        </button>
      </div>

      {/* Accessible Video Guide Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
            id="video-guide-overlay"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 flex flex-col"
              id="video-guide-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="video-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Warm Palette */}
              <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-6 py-4 border-b border-amber-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-amber-100/80 text-amber-850 rounded-lg shrink-0">
                    <Video size={18} className="text-amber-800 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base" id="video-modal-title">
                      Santa Ana College &bull; Video Guide
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                      Bivariate Analysis &amp; Simple Linear Regression walkthrough
                    </p>
                  </div>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={() => setIsVideoOpen(false)}
                  className="p-1.5 text-slate-405 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                  id="close-video-modal-btn"
                  aria-label="Close Video Guide"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video Content Area */}
              <div className="p-4 sm:p-6 bg-slate-50">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner border border-slate-200 relative">
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/hVdN-yRnG34?rel=0&autoplay=1"
                    title="Statistics Video Tutorial"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  ></iframe>
                </div>
              </div>

              {/* Keep keyboard instruction warm and scannable */}
              <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-amber-850 bg-amber-100/75 px-2 py-0.5 rounded text-[10px] shadow-sm font-mono">ESC Key</span>
                  <span>to exit tutorial</span>
                </p>
                <button
                  onClick={() => setIsVideoOpen(false)}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 cursor-pointer shadow-sm shadow-amber-600/10"
                  id="done-video-modal-btn"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

