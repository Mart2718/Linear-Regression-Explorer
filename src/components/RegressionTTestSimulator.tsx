import React, { useState, useEffect } from 'react';
import { Dataset, DatasetItem, Point, RegressionStats } from '../types';
import { STATS_DATASETS, calculateRegressionStats, getPValue } from '../utils/stats';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Info, RefreshCw, Sliders, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RegressionTTestSimulator() {
  // Simulator State
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(STATS_DATASETS[0].id);
  const [sampleSize, setSampleSize] = useState<number>(10);
  const [activeSample, setActiveSample] = useState<DatasetItem[]>([]);
  const [wizardStep, setWizardStep] = useState<number>(1);
  
  // Step 1: Hypotheses
  const [testTail, setTestTail] = useState<'two' | 'right' | 'left'>('two');
  
  // Step 2: Assumptions checked by student
  const [assumptionsChecked, setAssumptionsChecked] = useState<{
    linear: boolean;
    normal: boolean;
    equalVar: boolean;
  }>({
    linear: false,
    normal: false,
    equalVar: false
  });

  // Step 3: Significance level
  const [alpha, setAlpha] = useState<number>(0.05);

  // Step 4: Dropdowns for filling in verdict sentence
  const [verdictInput, setVerdictInput] = useState<{
    comparison: string; // 'less' or 'greater'
    decision: string; // 'reject' or 'fail'
    evidence: string; // 'sufficient' or 'insufficient'
    direction: string; // 'positive', 'negative', or 'any'
  }>({
    comparison: '',
    decision: '',
    evidence: '',
    direction: ''
  });
  const [verdictChecked, setVerdictChecked] = useState<boolean>(false);
  const [verdictResult, setVerdictResult] = useState<{
    correct: boolean;
    graded: boolean;
    feedback: string;
  }>({ correct: false, graded: false, feedback: '' });

  // Predictor Tool values
  const [predictionX, setPredictionX] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<{
    yPredicted: number;
    usedMean: boolean;
    equationStr: string;
  } | null>(null);

  // Get active dataset metadata
  const activeDataset = STATS_DATASETS.find(d => d.id === selectedDatasetId) || STATS_DATASETS[0];

  // Draw random sample helper
  const drawRandomSample = (datasetId: string, size: number) => {
    const ds = STATS_DATASETS.find(d => d.id === datasetId) || STATS_DATASETS[0];
    const pool = [...ds.population];
    
    // Shuffle and slice
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const sample = shuffled.slice(0, Math.min(size, pool.length));
    
    // Sort active sample by X to render plots nicely
    sample.sort((a, b) => a.x - b.x);
    
    setActiveSample(sample);
    
    // Reset steps and states
    setWizardStep(1);
    setAssumptionsChecked({ linear: false, normal: false, equalVar: false });
    setVerdictInput({ comparison: '', decision: '', evidence: '', direction: '' });
    setVerdictChecked(false);
    setVerdictResult({ correct: false, graded: false, feedback: '' });
    setPredictionX('');
    setPredictionResult(null);
  };

  // Run on load and whenever dataset/sample size changes
  useEffect(() => {
    drawRandomSample(selectedDatasetId, sampleSize);
  }, [selectedDatasetId]);

  // Handle sample size adjustment safely based on population limits
  const handleSampleSizeChange = (newSize: number) => {
    const limit = activeDataset.population.length;
    const size = Math.min(newSize, limit);
    setSampleSize(size);
    drawRandomSample(selectedDatasetId, size);
  };

  // Map active sample items to Points array for calculation
  const samplePoints: Point[] = activeSample.map(item => ({
    id: item.id,
    x: item.x,
    y: item.y
  }));

  // Standard stats calculation
  const stats = calculateRegressionStats(samplePoints);

  // Compute stats of active test specific to the current alternative hypothesis test tail
  const computedStatsWithTail = stats ? {
    ...stats,
    pValue: getPValue(stats.tStat, stats.df, testTail)
  } : null;

  // Compute residuals for plots
  const getResidualData = () => {
    if (!stats || !activeSample.length) return [];
    return activeSample.map(item => {
      const predY = stats.intercept + stats.slope * item.x;
      const residual = item.y - predY;
      return {
        x: item.x,
        y: item.y,
        predY,
        residual
      };
    });
  };

  const residuals = getResidualData();

  // Draw Custom Inline SVG Scatterplot
  const renderScatterplot = () => {
    if (!activeSample.length) return null;
    
    const w = 240, h = 180, pad = 24;
    const xValues = activeSample.map(d => d.x);
    const yValues = activeSample.map(d => d.y);
    const minX = Math.min(...xValues) * 0.9;
    const maxX = Math.max(...xValues) * 1.1;
    const minY = Math.min(...yValues) * 0.9;
    const maxY = Math.max(...yValues) * 1.1;

    const sx = (x: number) => pad + ((x - minX) / (maxX - minX)) * (w - 2 * pad);
    const sy = (y: number) => pad + (1 - (y - minY) / (maxY - minY)) * (h - 2 * pad);

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="bg-slate-50 border border-slate-100 rounded-lg">
        {/* Axes */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#cbd5e1" strokeWidth={1} />
        
        {/* Regression Line */}
        {stats && (
          <line
            x1={sx(minX)}
            y1={sy(stats.intercept + stats.slope * minX)}
            x2={sx(maxX)}
            y2={sy(stats.intercept + stats.slope * maxX)}
            stroke="#6366f1"
            strokeWidth={2}
          />
        )}

        {/* Data points */}
        {activeSample.map((d) => (
          <circle
            key={d.id}
            cx={sx(d.x)}
            cy={sy(d.y)}
            r={3.5}
            fill="#4f46e5"
            stroke="#ffffff"
            strokeWidth={0.75}
          />
        ))}

        <text x={w / 2} y={h - 6} textAnchor="middle" className="text-[8px] fill-slate-500 font-mono">
          X variable values
        </text>
        <text x={10} y={h / 2} textAnchor="middle" transform={`rotate(-90 10 ${h/2})`} className="text-[8px] fill-slate-500 font-mono">
          Y values
        </text>
      </svg>
    );
  };

  // Draw Custom Inline SVG Residual Plot
  const renderResidualPlot = () => {
    if (!residuals.length || !stats) return null;

    const w = 240, h = 180, pad = 24;
    const xValues = residuals.map(d => d.x);
    const resValues = residuals.map(d => d.residual);
    const minX = Math.min(...xValues) * 0.9;
    const maxX = Math.max(...xValues) * 1.1;
    
    // Symmetrical Residual Range
    const maxAbsRes = Math.max(...resValues.map(r => Math.abs(r))) || 1;
    const minRes = -maxAbsRes * 1.1;
    const maxRes = maxAbsRes * 1.1;

    const sx = (x: number) => pad + ((x - minX) / (maxX - minX)) * (w - 2 * pad);
    const sy = (res: number) => pad + (1 - (res - minRes) / (maxRes - minRes)) * (h - 2 * pad);

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="bg-slate-50 border border-slate-100 rounded-lg">
        {/* Zero Line */}
        <line x1={pad} y1={sy(0)} x2={w - pad} y2={sy(0)} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 2" />
        
        {/* Left vertical axis */}
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#cbd5e1" strokeWidth={1} />

        {/* Residual nodes */}
        {residuals.map((r, i) => (
          <g key={i}>
            {/* Stem to line 0 */}
            <line x1={sx(r.x)} y1={sy(0)} x2={sx(r.x)} y2={sy(r.residual)} stroke="#94a3b8" strokeWidth={0.5} opacity={0.6} />
            <circle
              cx={sx(r.x)}
              cy={sy(r.residual)}
              r={3.5}
              fill="#0ea5e9"
              stroke="#ffffff"
              strokeWidth={0.75}
            />
          </g>
        ))}

        <text x={w / 2} y={h - 6} textAnchor="middle" className="text-[8px] fill-slate-500 font-mono">
          X variable values
        </text>
        <text x={10} y={h / 2} textAnchor="middle" transform={`rotate(-90 10 ${h/2})`} className="text-[8px] fill-slate-500 font-mono">
          Residual (y - ŷ)
        </text>
      </svg>
    );
  };

  // Draw Custom Inline SVG Residual Histogram
  const renderResidualHistogram = () => {
    if (!residuals.length) return null;

    const w = 240, h = 180, pad = 24;
    const resValues = residuals.map(d => d.residual);
    const maxAbs = Math.max(...resValues.map(r => Math.abs(r))) || 1;
    
    // Standard bin calculation (5 bins for intro statistics sample size)
    const binsCount = 5;
    const minVal = -maxAbs * 1.1;
    const maxVal = maxAbs * 1.1;
    const rRange = maxVal - minVal;
    const binWidth = rRange / binsCount;

    const bins = Array.from({ length: binsCount }, (_, idx) => {
      const lower = minVal + idx * binWidth;
      const upper = lower + binWidth;
      return {
        lower,
        upper,
        count: 0
      };
    });

    resValues.forEach(v => {
      let allocated = false;
      for (let idx = 0; idx < binsCount; idx++) {
        if (v >= bins[idx].lower && v <= bins[idx].upper) {
          bins[idx].count++;
          allocated = true;
          break;
        }
      }
      if (!allocated) {
        bins[binsCount - 1].count++;
      }
    });

    const maxCount = Math.max(...bins.map(b => b.count)) || 1;

    const scaleXPos = (val: number) => pad + ((val - minVal) / rRange) * (w - 2 * pad);
    const scaleYPos = (count: number) => h - pad - (count / maxCount) * (h - 2 * pad);

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="bg-slate-50 border border-slate-100 rounded-lg">
        {/* Horizontal & Vertical baseline */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#cbd5e1" strokeWidth={1} />
        
        {/* Draw bins */}
        {bins.map((b, idx) => {
          const binX = scaleXPos(b.lower);
          const binW = scaleXPos(b.upper) - binX;
          const binY = scaleYPos(b.count);
          const binH = h - pad - binY;

          return (
            <rect
              key={idx}
              x={binX + 1}
              y={binY}
              width={Math.max(2, binW - 2)}
              height={Math.max(0, binH)}
              fill="#10b981"
              opacity={0.8}
              stroke="#047857"
              strokeWidth={0.5}
            />
          );
        })}

        <text x={w / 2} y={h - 6} textAnchor="middle" className="text-[8px] fill-slate-500 font-mono">
          Residual bins Range
        </text>
        <text x={10} y={h / 2} textAnchor="middle" transform={`rotate(-90 10 ${h/2})`} className="text-[8px] fill-slate-500 font-mono">
          Frequency count
        </text>
      </svg>
    );
  };

  // Grade student verdict
  const checkVerdict = () => {
    if (!computedStatsWithTail) return;
    const { pValue } = computedStatsWithTail;

    // Correct logic definitions:
    const expectedComparison = pValue < alpha ? 'less' : 'greater';
    const expectedDecision = pValue < alpha ? 'reject' : 'fail';
    const expectedEvidence = pValue < alpha ? 'sufficient' : 'insufficient';
    
    // Establish relationship direction from alternative hypothesis parameter
    let expectedDirection = 'any';
    if (testTail === 'left') expectedDirection = 'negative';
    if (testTail === 'right') expectedDirection = 'positive';

    const isMatch =
      verdictInput.comparison === expectedComparison &&
      verdictInput.decision === expectedDecision &&
      verdictInput.evidence === expectedEvidence &&
      verdictInput.direction === expectedDirection;

    let feedText = '';
    if (isMatch) {
      feedText = `🎉 Absolutely Correct! Outstanding work. Since the P-value (${pValue.toFixed(4)}) is ${
        pValue < alpha ? 'less than or equal to' : 'strictly greater than'
      } alpha (${alpha}), we logically ${
        pValue < alpha ? 'reject the Null Hypothesis (H₀)' : 'fail to reject the Null Hypothesis (H₀)'
      }. Consequently, we have ${
        pValue < alpha ? 'sufficient statistical evidence' : 'insufficient statistical evidence'
      } to declare that a statistically significant ${expectedDirection} linear association exists between the variables!`;
    } else {
      // Find the mismatching element to help the student learn
      const mismatches: string[] = [];
      if (verdictInput.comparison !== expectedComparison) mismatches.push('the P-value Comparison');
      if (verdictInput.decision !== expectedDecision) mismatches.push('the Statistical Decision');
      if (verdictInput.evidence !== expectedEvidence) mismatches.push('the Level of Evidence status');
      if (verdictInput.direction !== expectedDirection) mismatches.push('the Direction parameter matching your HA selection');
      
      feedText = `❌ Not quite! Review ${mismatches.join(', ')}. Remember: If P-value (${pValue.toFixed(4)}) is less than alpha (${alpha}), we "REJECT" the null hypothesis on behalf of "SUFFICIENT" evidence. Otherwise, we "FAIL TO REJECT" on behalf of "INSUFFICIENT" evidence.`;
    }

    setVerdictResult({
      correct: isMatch,
      graded: true,
      feedback: feedText
    });
    setVerdictChecked(true);
  };

  // Predictor calculator logic
  const handlePredictionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!computedStatsWithTail) return;
    
    const xVal = parseFloat(predictionX);
    if (isNaN(xVal)) return;

    const { pValue, slope, intercept, meanY } = computedStatsWithTail;
    const isSignificant = pValue < alpha;

    if (isSignificant) {
      // Predict with line
      const predY = intercept + slope * xVal;
      setPredictionResult({
        yPredicted: predY,
        usedMean: false,
        equationStr: `ŷ = ${intercept.toFixed(2)} + ${slope.toFixed(2)}x`
      });
    } else {
      // Predict with mean (Rule from Notes pages 9 & 11)
      setPredictionResult({
        yPredicted: meanY,
        usedMean: true,
        equationStr: `ȳ = ${meanY.toFixed(2)} (Sample Mean)`
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800" id="regression-simulator-section">
      
      {/* Sampling configuration column (Left) */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Simulator Control Board */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="text-indigo-600 shrink-0" size={18} />
            <span className="font-bold text-slate-900 tracking-tight">Inference Control Board</span>
          </div>

          {/* Dataset Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">1. Select Target Population</label>
            <select
              value={selectedDatasetId}
              id="dataset-select"
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full text-sm font-semibold rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {STATS_DATASETS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 block pt-0.5">
              Available population pool: <strong className="text-slate-600">{activeDataset.population.length}</strong> possible observations.
            </span>
          </div>

          {/* Sample size configurator */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">2. Select Sample Size (n)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max={Math.min(25, activeDataset.population.length)}
                value={sampleSize}
                onChange={(e) => handleSampleSizeChange(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
              <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-sm shrink-0">
                n = {sampleSize}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Drawing samples models random sampling variation. Each trial creates unique stats!
            </p>
          </div>

          {/* Resample Button */}
          <button
            onClick={() => drawRandomSample(selectedDatasetId, sampleSize)}
            id="draw-sample-btn"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent font-semibold rounded-xl text-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            <RefreshCw size={15} />
            Draw New Random Sample
          </button>
        </div>

        {/* Population vs Samples Cards */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <span className="font-bold text-xs text-slate-650 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-slate-500" />
            Current Sample Log (n = {sampleSize})
          </span>
          
          <div className="max-h-[160px] overflow-y-auto border border-slate-200/80 bg-white rounded-xl divide-y divide-slate-100">
            {activeSample.map((item, idx) => (
              <div key={item.id} className="p-2 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 truncate max-w-[120px]">{idx+1}. {item.name}</span>
                <span className="text-slate-800 font-semibold">{activeDataset.xLabel.substring(0,6)}: {item.x} | {activeDataset.yLabel.substring(0,6)}: {item.y}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-indigo-50/40 p-2.5 border border-indigo-100/40 rounded-lg">
            🧑‍🏫 <strong>Stat Lesson</strong>: Draw sample multiple times. Pay attention to how of sample slope fluctuation (sampling variation). The t-test helps verify whether our sample slope is far enough from zero to rule out pure coincidence!
          </div>
        </div>

      </div>

      {/* Structured Wizard Section (Right) */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* Step tab header */}
        <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1 rounded-xl">
          {[
            { step: 1, label: 'Hypotheses' },
            { step: 2, label: 'LINER Checks' },
            { step: 3, label: 'Results' },
            { step: 4, label: 'Verdict' }
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => {
                // Prevent skipping too far without checking assumptions in step 2
                if (item.step > 2 && !assumptionsChecked.linear && !assumptionsChecked.normal && !assumptionsChecked.equalVar) {
                  setWizardStep(2);
                } else {
                  setWizardStep(item.step);
                }
              }}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition ${
                wizardStep === item.step
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              Step {item.step}: {item.label}
            </button>
          ))}
        </div>

        {/* Wizard Panel Content Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={wizardStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              {/* STEP 1: HYPOTHESIS SPECIFICATION */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-750 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Define Your Hypotheses Statements</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choose the direction (directionality) of your theoretical association test.
                      </p>
                    </div>
                  </div>

                  {/* Dropdown test input */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-md space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Alternative Hypothesis (HA) Tail</label>
                      <select
                        value={testTail}
                        id="test-tail-select"
                        onChange={(e) => setTestTail(e.target.value as any)}
                        className="w-full text-sm font-semibold rounded-lg bg-white border border-slate-250 p-2.5 text-slate-800 focus:outline-none"
                      >
                        <option value="two">Two-Tailed (Any Linear Association: β ≠ 0)</option>
                        <option value="right">Right-Tailed (Positive association: β &gt; 0)</option>
                        <option value="left">Left-Tailed (Negative association: β &lt; 0)</option>
                      </select>
                    </div>

                    {/* Hypothesis Formula Board */}
                    <div className="bg-white border border-slate-200/70 rounded-lg p-4 text-center space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Drafted Models Formulas</span>
                      <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                        <div>
                          <p className="text-xs text-slate-500 font-semibold mb-1">Null Hypothesis</p>
                          <p className="font-mono font-bold text-slate-900 text-lg">H₀: β = 0</p>
                          <span className="text-[10px] text-slate-400 block pt-0.5">(No linear correlation)</span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold mb-1">Alternative Hypothesis</p>
                          <p className="font-mono font-bold text-indigo-600 text-lg">
                            H<sub>A</sub>: β {testTail === 'two' ? '≠' : testTail === 'right' ? '>' : '<'} 0
                          </p>
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            {testTail === 'two' ? '(Associated)' : testTail === 'right' ? '(Positive association)' : '(Negative association)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-600 text-xs leading-relaxed max-w-xl space-y-2 pt-2">
                    <p className="font-semibold text-slate-800">Why parameter &beta;?</p>
                    <p>
                      In linear regression, the population model is represented as Y = &alpha; + &beta;X + &epsilon;. We use sample points to estimate slope <strong>b</strong> (which corresponds to estimated sample parameter). To test relationship existence, our Null asserts that the population slope &beta; is exactly 0. If &beta; = 0, changing X has zero effect on predicted Y.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: ASSUMPTIONS CHECKS (LINER) */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-750 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Verify LINER Core Assumptions</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Introductory statistics requires testing conditions using statistical graphics.
                      </p>
                    </div>
                  </div>

                  {/* SVG Graphs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 text-center">
                      <span className="font-bold text-xs text-indigo-700">1. Fitted Line Plot</span>
                      {renderScatterplot()}
                      <p className="text-[10px] text-slate-400">Verifies linearity &amp; outliers</p>
                    </div>
                    <div className="space-y-1.5 text-center">
                      <span className="font-bold text-xs text-emerald-700">2. Histogram of Residuals</span>
                      {renderResidualHistogram()}
                      <p className="text-[10px] text-slate-400">Verifies symmetric normality of error</p>
                    </div>
                    <div className="space-y-1.5 text-center">
                      <span className="font-bold text-xs text-sky-700">3. Residual Plot (X vs. e)</span>
                      {renderResidualPlot()}
                      <p className="text-[10px] text-slate-400">Verifies equal variance (homoscedasticity)</p>
                    </div>
                  </div>

                  {/* Interactive checkboxes check off checklist */}
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
                    <span className="font-bold text-xs text-slate-600 block uppercase tracking-wider">Assumption Grading Verification Checklist</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* Check 1 */}
                      <label id="linear-check-label" className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                        assumptionsChecked.linear ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-slate-200/50 hover:bg-slate-200/40'
                      }`}>
                        <input
                          type="checkbox"
                          checked={assumptionsChecked.linear}
                          onChange={(e) => setAssumptionsChecked(prev => ({ ...prev, linear: e.target.checked }))}
                          className="mt-1 h-3.5 w-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="text-[11px] leading-tight">
                          <strong className="text-slate-800 block">Linearity L-I</strong>
                          <span className="text-slate-400">No apparent curved shapes in either Plot 1 or Plot 3.</span>
                        </div>
                      </label>

                      {/* Check 2 */}
                      <label id="normality-check-label" className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                        assumptionsChecked.normal ? 'bg-white border-emerald-200 shadow-sm' : 'bg-transparent border-slate-200/50 hover:bg-slate-200/40'
                      }`}>
                        <input
                          type="checkbox"
                          checked={assumptionsChecked.normal}
                          onChange={(e) => setAssumptionsChecked(prev => ({ ...prev, normal: e.target.checked }))}
                          className="mt-1 h-3.5 w-3.5 text-emerald-600 rounded border-slate-300 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="text-[11px] leading-tight">
                          <strong className="text-slate-800 block">Normality - N</strong>
                          <span className="text-slate-400">Residual Histogram appears relatively symmetric and unimodal.</span>
                        </div>
                      </label>

                      {/* Check 3 */}
                      <label id="eqvar-check-label" className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                        assumptionsChecked.equalVar ? 'bg-white border-sky-200 shadow-sm' : 'bg-transparent border-slate-200/50 hover:bg-slate-200/40'
                      }`}>
                        <input
                          type="checkbox"
                          checked={assumptionsChecked.equalVar}
                          onChange={(e) => setAssumptionsChecked(prev => ({ ...prev, equalVar: e.target.checked }))}
                          className="mt-1 h-3.5 w-3.5 text-sky-600 rounded border-slate-300 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="text-[11px] leading-tight">
                          <strong className="text-slate-800 block">Equal Variance - E-R</strong>
                          <span className="text-slate-400">Plot 3 displays random spread with no distinct funnel pattern.</span>
                        </div>
                      </label>

                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: STATISTICAL DISCOVERIES (RESULTS) */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-750 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Calculations and Decision Logic</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Perform our slope inference test against standard significance targets.
                      </p>
                    </div>
                  </div>

                  {computedStatsWithTail ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Left: Significance Level Selection */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Configure Significance Level (α)</span>
                        <div className="flex gap-2">
                          {[0.01, 0.05, 0.10].map((val) => (
                            <button
                              key={val}
                              onClick={() => setAlpha(val)}
                              className={`flex-1 py-1.5 rounded-lg font-mono text-sm font-bold transition border ${
                                alpha === val
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              α = {val}
                            </button>
                          ))}
                        </div>

                        {/* Critical values explanation card */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                            <span>Significance Threshold (α):</span>
                            <span className="font-mono font-bold text-slate-900">{alpha.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Sample P-Value computed:</span>
                            <span className="font-mono font-bold text-indigo-600">{computedStatsWithTail.pValue.toFixed(4)}</span>
                          </div>
                        </div>

                        {/* Visual Compare Bar */}
                        <div className="pt-2">
                          {computedStatsWithTail.pValue < alpha ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-emerald-800 text-xs flex gap-1.5 items-start">
                              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                              <div>
                                <strong className="block text-emerald-900">P-value &lt; α (Significant)</strong>
                                We reject the Null Hypothesis. We have evidence of association in the population.
                              </div>
                            </div>
                          ) : (
                            <div className="bg-rose-50 border border-rose-100/80 rounded-lg p-2.5 text-rose-800 text-xs flex gap-1.5 items-start">
                              <Info size={15} className="shrink-0 mt-0.5 text-rose-600" />
                              <div>
                                <strong className="block text-rose-900 font-bold">P-value &ge; α (Not Significant)</strong>
                                Fail to reject the Null. Sample variance could easily explain this layout.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Inference statistics summary table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="bg-slate-50 border-b border-slate-100 p-2.5 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">
                          Sample Slope T-Test Report
                        </div>
                        <div className="divide-y divide-slate-100 font-mono text-xs p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-550 font-sans font-medium">Estimated Slope (b):</span>
                            <span className="font-bold text-slate-900">{computedStatsWithTail.slope.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-slate-550 font-sans font-medium">Slope Standard Error (SE_b):</span>
                            <span className="text-slate-800">{computedStatsWithTail.seSlope.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-slate-550 font-sans font-medium">Degrees of Freedom (df):</span>
                            <span className="text-slate-800">n - 2 = {computedStatsWithTail.df}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-slate-550 font-sans font-medium">Test t-Statistic (t):</span>
                            <span className="font-bold text-indigo-600">{computedStatsWithTail.tStat.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 bg-indigo-50/40 p-1.5 rounded">
                            <span className="text-indigo-900 font-sans font-bold">Computed P-Value:</span>
                            <span className="font-extrabold text-indigo-700">{computedStatsWithTail.pValue.toFixed(6)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-10 text-center text-slate-400">Loading Stats...</div>
                  )}
                </div>
              )}

              {/* STEP 4: INFRENCE VERDICT (SENTENCE BUILDER) */}
              {wizardStep === 4 && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-750 flex items-center justify-center font-bold text-sm shrink-0">4</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Define the Theoretical Inference Verdict</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Build the standard formal conclusion statement. Complete the blanks appropriately!
                      </p>
                    </div>
                  </div>

                  {/* Standardized sentence form */}
                  <div className="bg-slate-50 border border-slate-200.8 px-5 py-4 rounded-xl leading-8 text-[13px] text-slate-700 max-w-3xl font-medium">
                    Since the sample p-value (<span className="bg-slate-200/80 px-2 font-semibold font-mono text-slate-900 rounded">{computedStatsWithTail?.pValue.toFixed(4)}</span>) is{' '}
                    
                    {/* Sentence builder slot 1 */}
                    <select
                      value={verdictInput.comparison}
                      onChange={(e) => {
                        setVerdictInput(prev => ({ ...prev, comparison: e.target.value }));
                        setVerdictChecked(false);
                      }}
                      id="verdict-comparison"
                      className="inline-block bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-indigo-600 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">[select...]</option>
                      <option value="less">less than or equal to</option>
                      <option value="greater">strictly greater than</option>
                    </select>{' '}
                    significance level α (<span className="bg-slate-200 font-semibold font-mono px-2 rounded text-slate-800">{alpha}</span>), we{' '}
                    
                    {/* Sentence builder slot 2 */}
                    <select
                      value={verdictInput.decision}
                      onChange={(e) => {
                        setVerdictInput(prev => ({ ...prev, decision: e.target.value }));
                        setVerdictChecked(false);
                      }}
                      id="verdict-decision"
                      className="inline-block bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-indigo-600 focus:outline-none"
                    >
                      <option value="">[select...]</option>
                      <option value="reject">reject</option>
                      <option value="fail">fail to reject</option>
                    </select>{' '}
                    the null hypothesis. Therefore, there is{' '}
                    
                    {/* Sentence builder slot 3 */}
                    <select
                      value={verdictInput.evidence}
                      onChange={(e) => {
                        setVerdictInput(prev => ({ ...prev, evidence: e.target.value }));
                        setVerdictChecked(false);
                      }}
                      id="verdict-evidence"
                      className="inline-block bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-indigo-600 focus:outline-none"
                    >
                      <option value="">[select...]</option>
                      <option value="sufficient">sufficient</option>
                      <option value="insufficient">insufficient</option>
                    </select>{' '}
                    evidence to show that a statistically significant{' '}
                    
                    {/* Sentence builder slot 4 */}
                    <select
                      value={verdictInput.direction}
                      onChange={(e) => {
                        setVerdictInput(prev => ({ ...prev, direction: e.target.value }));
                        setVerdictChecked(false);
                      }}
                      id="verdict-direction"
                      className="inline-block bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-indigo-600 focus:outline-none"
                    >
                      <option value="">[select...]</option>
                      <option value="any">any</option>
                      <option value="positive">positive</option>
                      <option value="negative">negative</option>
                    </select>{' '}
                    linear relationship exists between <span className="font-bold underline text-slate-800">{activeDataset.xLabel}</span> and <span className="font-bold underline text-slate-800">{activeDataset.yLabel}</span>.
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={checkVerdict}
                      disabled={!verdictInput.comparison || !verdictInput.decision || !verdictInput.evidence || !verdictInput.direction}
                      className="py-2 px-5 text-xs font-bold rounded-lg text-white bg-slate-900 border border-transparent hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    >
                      Verify Verdict Formula Score
                    </button>
                  </div>

                  {/* Verdict Graded Feedback */}
                  {verdictChecked && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed transition ${
                      verdictResult.correct
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                      {verdictResult.feedback}
                    </div>
                  )}

                  {/* NOTE PAGE 9 & 11 CONDITIONAL PREDICTION WRAPPER */}
                  {verdictResult.correct && computedStatsWithTail && (
                    <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 space-y-3">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-600" />
                        Page 9 &amp; 11 Predictor Engine Tool
                      </span>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Lecture notes rule: If relationship is significant (&lt; α), predict using the regression equation. Otherwise, the regression slope is unsupported, so the sample mean <strong>ȳ</strong> is your best predictor!
                      </p>

                      <form onSubmit={handlePredictionSubmit} className="flex gap-2 max-w-sm items-center">
                        <input
                          type="number"
                          step="any"
                          required
                          value={predictionX}
                          onChange={(e) => setPredictionX(e.target.value)}
                          placeholder={`Enter ${activeDataset.xLabel}...`}
                          className="flex-1 text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition"
                        >
                          Estimate Y
                        </button>
                      </form>

                      {predictionResult && (
                        <div className="bg-white border border-indigo-100 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-[9px] text-slate-400 block pb-0.5">ESTIMATE STRATEGY USED</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${predictionResult.usedMean ? 'bg-amber-100 text-amber-800':'bg-indigo-100 text-indigo-800'}`}>
                              {predictionResult.usedMean ? 'Fail-Safe (Sample Mean ȳ)' : 'Association Formula (LSRL)'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-sans text-slate-500 block">PREDICTED VALUE ({activeDataset.yLabel.substring(0,6)})</span>
                            <span className="font-extrabold text-slate-900 text-sm">{predictionResult.yPredicted.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 block font-normal font-sans pt-0.5">{predictionResult.equationStr}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Stepper Buttons footer */}
          <div className="flex border-t border-slate-100 pt-5 mt-5 justify-between">
            <button
              onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
              disabled={wizardStep === 1}
              className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-slate-650 text-xs font-bold bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            
            {widgetStepHasNext(wizardStep, assumptionsChecked) ? (
              <button
                onClick={() => setWizardStep(prev => Math.min(4, prev + 1))}
                className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-xs font-bold transition cursor-pointer"
              >
                Next Step
                <ArrowRight size={14} />
              </button>
            ) : (
              <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 rounded-lg px-2.5 py-1 border border-amber-100">
                <AlertCircle /> Please check off all 3 LINER conditions to unlock Step 3 calculations.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

// Micro structural check: helper to lock Step 3 until assumptions checked off!
function widgetStepHasNext(currentStep: number, assumptions: { linear: boolean, normal: boolean, equalVar: boolean }) {
  if (currentStep === 4) return false;
  if (currentStep === 2) {
    return assumptions.linear && assumptions.normal && assumptions.equalVar;
  }
  return true;
}

// Inline alert icon
function AlertCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16"/></svg>
  );
}
