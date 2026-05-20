import React, { useState, useRef, useEffect } from 'react';
import { Point, RegressionStats } from '../types';
import { calculateRegressionStats } from '../utils/stats';
import { Trash2, RefreshCw, BarChart2, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Built-in presets for teaching
const PRESETS: { name: string; description: string; points: Point[] }[] = [
  {
    name: 'Strong Positive',
    description: 'A tight, upward-sloping linear trend. High correlation, high R².',
    points: [
      { id: '1', x: 15, y: 20 },
      { id: '2', x: 25, y: 32 },
      { id: '3', x: 40, y: 45 },
      { id: '4', x: 50, y: 55 },
      { id: '5', x: 65, y: 72 },
      { id: '6', x: 75, y: 80 },
      { id: '7', x: 85, y: 92 },
    ]
  },
  {
    name: 'Strong Negative',
    description: 'A tight, downward-sloping linear trend. Direct inverse relationship.',
    points: [
      { id: '1', x: 15, y: 88 },
      { id: '2', x: 28, y: 76 },
      { id: '3', x: 42, y: 62 },
      { id: '4', x: 55, y: 48 },
      { id: '5', x: 68, y: 35 },
      { id: '6', x: 80, y: 22 },
      { id: '7', x: 90, y: 12 },
    ]
  },
  {
    name: 'Weak / Random',
    description: 'Points scattered widely with no apparent linear pattern. Correlation near 0.',
    points: [
      { id: '1', x: 20, y: 45 },
      { id: '2', x: 35, y: 78 },
      { id: '3', x: 50, y: 22 },
      { id: '4', x: 65, y: 85 },
      { id: '5', x: 80, y: 50 },
      { id: '6', x: 30, y: 15 },
      { id: '7', x: 75, y: 30 },
    ]
  },
  {
    name: 'Nonlinear (U-Shaped)',
    description: 'A perfect curved relationship. Notice that r is close to 0, despite a very strong pattern!',
    points: [
      { id: '1', x: 10, y: 80 },
      { id: '2', x: 25, y: 42 },
      { id: '3', x: 40, y: 22 },
      { id: '4', x: 50, y: 15 },
      { id: '5', x: 60, y: 22 },
      { id: '6', x: 75, y: 42 },
      { id: '7', x: 90, y: 80 },
    ]
  },
  {
    name: 'Outlier Leverage',
    description: 'A great positive trend ruined by a single extreme outlier. Drastically pulls the slope and r.',
    points: [
      { id: '1', x: 15, y: 15 },
      { id: '2', x: 25, y: 25 },
      { id: '3', x: 35, y: 35 },
      { id: '4', x: 45, y: 45 },
      { id: '5', x: 55, y: 55 },
      { id: '6', x: 65, y: 65 },
      { id: '7', x: 85, y: 10 }, // Outlier in bottom right (influential)
    ]
  }
];

export default function CorrelationArchitect() {
  const [points, setPoints] = useState<Point[]>(PRESETS[0].points);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [showVarianceVisualization, setShowVarianceVisualization] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'explanation' | 'discussion'>('explanation');
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Grid / SVG Dimensions
  const svgWidth = 550;
  const svgHeight = 440;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 50;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Convert stats coordinates (0 to 100) to SVG viewbox coordinates
  const scaleX = (x: number) => paddingLeft + (x / 100) * plotWidth;
  const scaleY = (y: number) => paddingTop + ((100 - y) / 100) * plotHeight;

  // Convert SVG coordinate back to stats values
  const invertX = (pixelX: number) => {
    const val = ((pixelX - paddingLeft) / plotWidth) * 100;
    return Math.max(0, Math.min(100, Math.round(val)));
  };
  const invertY = (pixelY: number) => {
    const val = (1 - (pixelY - paddingTop) / plotHeight) * 100;
    return Math.max(0, Math.min(100, Math.round(val)));
  };

  // Drag handlers
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingId(id);
    setSelectedPointId(id);
  };

  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    e.stopPropagation();
    setDraggingId(id);
    setSelectedPointId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = invertX(e.clientX - rect.left);
    const y = invertY(e.clientY - rect.top);

    setPoints((prev) =>
      prev.map((p) => (p.id === draggingId ? { ...p, x, y } : p))
    );
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = invertX(touch.clientX - rect.left);
    const y = invertY(touch.clientY - rect.top);

    setPoints((prev) =>
      prev.map((p) => (p.id === draggingId ? { ...p, x, y } : p))
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Add point on empty space click
  const handleGridClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Boundary check so we don't add outside the grid labels
    if (
      clickX >= paddingLeft &&
      clickX <= svgWidth - paddingRight &&
      clickY >= paddingTop &&
      clickY <= svgHeight - paddingBottom
    ) {
      const x = invertX(clickX);
      const y = invertY(clickY);
      const newPoint: Point = {
        id: Date.now().toString(),
        x,
        y,
      };
      setPoints((prev) => [...prev, newPoint]);
      setSelectedPointId(newPoint.id);
    }
  };

  const deletePoint = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPoints((prev) => prev.filter((p) => p.id !== id));
    if (selectedPointId === id) setSelectedPointId(null);
    if (hoveredPointId === id) setHoveredPointId(null);
  };

  const clearAll = () => {
    setPoints([]);
    setSelectedPointId(null);
    setHoveredPointId(null);
  };

  const loadPreset = (presetPoints: Point[]) => {
    setPoints(presetPoints);
    setSelectedPointId(null);
    setHoveredPointId(null);
  };

  // Apply calculations
  const stats = calculateRegressionStats(points);

  // Helper for R value strength feedback
  const getStrengthLabel = (r: number) => {
    const absR = Math.abs(r);
    if (absR >= 0.75) return { text: 'Strong', color: 'bg-emerald-500 text-white', border: 'border-emerald-500', textCol: 'text-emerald-600' };
    if (absR >= 0.4) return { text: 'Moderate', color: 'bg-amber-500 text-white', border: 'border-amber-500', textCol: 'text-amber-600' };
    return { text: 'Weak', color: 'bg-rose-500 text-white', border: 'border-rose-500', textCol: 'text-rose-600' };
  };

  // Generate ticks for SVG grid
  const ticks = [0, 20, 40, 60, 80, 100];

  // Selected or hovered point properties
  const activeFocusPoint = points.find(p => p.id === (hoveredPointId || selectedPointId));

  // Determine shading polygon points for explained variance
  // Let's create a visual polygon shaded area between the mean variable line y = meanY
  // and the LSRL line y = mx + c. We can cap it within the range of points or full grid.
  const getShadingPolygonPath = () => {
    if (!stats || points.length < 3) return '';
    const xCoords = points.map(p => p.x);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);

    // If min and max are too close, use the full grid range
    const startX = minX === maxX ? 10 : Math.max(5, minX - 10);
    const endX = minX === maxX ? 90 : Math.min(95, maxX + 10);

    const steps = 10;
    const pathPoints: string[] = [];

    // Left edge (x = startX): meanY down/up to the regression estimate
    const yAtStart = stats.intercept + stats.slope * startX;
    pathPoints.push(`${scaleX(startX)},${scaleY(stats.meanY)}`);
    pathPoints.push(`${scaleX(startX)},${scaleY(yAtStart)}`);

    // Top / Bottom curve of regression line
    for (let i = 1; i <= steps; i++) {
      const stepX = startX + (i / steps) * (endX - startX);
      const stepY = stats.intercept + stats.slope * stepX;
      pathPoints.push(`${scaleX(stepX)},${scaleY(stepY)}`);
    }

    // Right edge (x = endX): regression estimate back to meanY
    pathPoints.push(`${scaleX(endX)},${scaleY(stats.meanY)}`);

    // Baseline back to starting point (horizontal along meanY)
    pathPoints.push(`${scaleX(startX)},${scaleY(stats.meanY)}`);

    return pathPoints.join(' ');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800" id="correlation-architect-section">
      {/* Left panel: Interactive SVG Sandbox */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Interactive Sandbox Grid
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click anywhere in the workspace to add data points. Drag existing points to adjust.
              </p>
            </div>
            
            <button
              onClick={clearAll}
              id="clear-all-btn"
              disabled={points.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              Clear Grid
            </button>
          </div>

          {/* SVG Interactive Area */}
          <div className="relative border border-slate-100 rounded-xl bg-slate-50 overflow-hidden select-none">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto cursor-crosshair"
              onClick={handleGridClick}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onMouseUp={handleMouseUp}
              onTouchEnd={handleMouseUp}
              onMouseLeave={handleMouseUp}
              id="sandbox-svg"
            >
              {/* Background gridlines */}
              {ticks.map((t) => (
                <React.Fragment key={`grid-${t}`}>
                  {/* Vertical lines */}
                  <line
                    x1={scaleX(t)}
                    y1={paddingTop}
                    x2={scaleX(t)}
                    y2={svgHeight - paddingBottom}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                    strokeDasharray={t === 0 ? undefined : "3 3"}
                  />
                  {/* Horizontal lines */}
                  <line
                    x1={paddingLeft}
                    y1={scaleY(t)}
                    x2={svgWidth - paddingRight}
                    y2={scaleY(t)}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                    strokeDasharray={t === 0 ? undefined : "3 3"}
                  />
                </React.Fragment>
              ))}

              {/* Grid Label ticks */}
              {ticks.map((t) => (
                <React.Fragment key={`label-${t}`}>
                  {/* X labels */}
                  <text
                    x={scaleX(t)}
                    y={svgHeight - paddingBottom + 20}
                    textAnchor="middle"
                    className="font-mono text-[10px] fill-slate-400"
                  >
                    {t}
                  </text>
                  {/* Y labels */}
                  <text
                    x={paddingLeft - 12}
                    y={scaleY(t) + 4}
                    textAnchor="end"
                    className="font-mono text-[10px] fill-slate-400"
                  >
                    {t}
                  </text>
                </React.Fragment>
              ))}

              {/* Axis Labels */}
              <text
                x={paddingLeft + plotWidth / 2}
                y={svgHeight - 12}
                textAnchor="middle"
                className="text-xs font-semibold fill-slate-500 tracking-wider"
              >
                X Variable (Predictor / Associated)
              </text>
              <text
                x={14}
                y={paddingTop + plotHeight / 2}
                textAnchor="middle"
                transform={`rotate(-90 14 ${paddingTop + plotHeight / 2})`}
                className="text-xs font-semibold fill-slate-500 tracking-wider"
              >
                Y Variable (Outcome / Dependent)
              </text>

              {/* R² Explained Variance Shading */}
              {showVarianceVisualization && stats && points.length >= 3 && (
                <polygon
                  points={getShadingPolygonPath()}
                  fill="url(#varianceGrad)"
                  opacity="0.3"
                  className="pointer-events-none"
                />
              )}

              {/* Gradients definition */}
              <defs>
                <linearGradient id="varianceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
              </defs>

              {/* Horizontal Mean Y line */}
              {stats && points.length >= 1 && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={scaleY(stats.meanY)}
                    x2={svgWidth - paddingRight}
                    y2={scaleY(stats.meanY)}
                    stroke="#475569"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    className="transition-all duration-150"
                  />
                  <text
                    x={svgWidth - paddingRight - 8}
                    y={scaleY(stats.meanY) - 6}
                    textAnchor="end"
                    className="font-mono text-[10px] fill-slate-600 font-semibold"
                  >
                    Mean Y (ȳ = {stats.meanY.toFixed(1)})
                  </text>
                </g>
              )}

              {/* Regression LSRL line */}
              {stats && points.length >= 3 && (
                <g>
                  <line
                    x1={scaleX(0)}
                    y1={scaleY(stats.intercept)}
                    x2={scaleX(100)}
                    y2={scaleY(stats.intercept + stats.slope * 100)}
                    stroke="#4f46e5"
                    strokeWidth={3}
                    className="transition-all duration-150"
                  />
                  <text
                    x={scaleX(90)}
                    y={scaleY(stats.intercept + stats.slope * 90) - 10}
                    textAnchor="middle"
                    className="text-xs font-bold fill-indigo-700 bg-white"
                  >
                    LSRL: ŷ = {stats.intercept.toFixed(1)} + {stats.slope.toFixed(2)}x
                  </text>
                </g>
              )}

              {/* Selected Point Deviation Detail Bars */}
              {stats && activeFocusPoint && points.length >= 3 && (
                <g className="opacity-95 pointer-events-none">
                  {/* Actual point coordinates */}
                  {(() => {
                    const px = scaleX(activeFocusPoint.x);
                    const py = scaleY(activeFocusPoint.y);
                    const pMeanY = scaleY(stats.meanY);
                    const pHatY = scaleY(stats.intercept + stats.slope * activeFocusPoint.x);

                    return (
                      <>
                        {/* 1. Total deviation (Point Y to Mean Y) */}
                        <line
                          x1={px + 4}
                          y1={py}
                          x2={px + 4}
                          y2={pMeanY}
                          stroke="#64748b"
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                        />
                        {/* 2. Unexplained / Residual deviation (Point Y to LSRL Hat Y) */}
                        <line
                          x1={px - 4}
                          y1={py}
                          x2={px - 4}
                          y2={pHatY}
                          stroke="#ef4444"
                          strokeWidth={2.5}
                        />
                        {/* 3. Explained deviation (LSRL Hat Y to Mean Y) */}
                        <line
                          x1={px}
                          y1={pHatY}
                          x2={px}
                          y2={pMeanY}
                          stroke="#10b981"
                          strokeWidth={2.5}
                        />

                        {/* Text Tags for selected point segments */}
                        <text x={px + 8} y={(py + pMeanY) / 2} className="font-mono text-[9px] fill-slate-500">
                          Total (y - ȳ)
                        </text>
                        <text x={px - 38} y={(py + pHatY) / 2} className="font-mono text-[9px] fill-red-500 font-semibold" textAnchor="end">
                          Residual (error)
                        </text>
                        <text x={px + 8} y={(pHatY + pMeanY) / 2} className="font-mono text-[9px] fill-emerald-600 font-bold">
                          Shared pattern
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Data points (Interactive nodes) */}
              {points.map((p) => {
                const isHovered = hoveredPointId === p.id;
                const isSelected = selectedPointId === p.id;
                const isDragging = draggingId === p.id;

                return (
                  <g
                    key={p.id}
                    onMouseEnter={() => setHoveredPointId(p.id)}
                    onMouseLeave={() => setHoveredPointId(null)}
                    className="cursor-grab active:cursor-grabbing group"
                    id={`point-node-${p.id}`}
                  >
                    {/* Ring indicator for selected or hovered */}
                    {(isSelected || isHovered || isDragging) && (
                      <circle
                        cx={scaleX(p.x)}
                        cy={scaleY(p.y)}
                        r={12}
                        fill="transparent"
                        stroke={isDragging ? '#818cf8' : '#cbd5e1'}
                        strokeWidth={1.5}
                        className="transition-all duration-100"
                      />
                    )}

                    {/* Plot Marker */}
                    <circle
                      cx={scaleX(p.x)}
                      cy={scaleY(p.y)}
                      r={isSelected ? 6 : 5}
                      fill={isDragging ? '#4f46e5' : isSelected ? '#3730a3' : '#6366f1'}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      onMouseDown={(e) => handleMouseDown(p.id, e)}
                      onTouchStart={(e) => handleTouchStart(p.id, e)}
                      className="transition-transform duration-75 shadow-sm"
                    />

                    {/* Numeric tag on active point */}
                    {(isHovered || isSelected || isDragging) && (
                      <g className="pointer-events-none">
                        <rect
                          x={scaleX(p.x) - 26}
                          y={scaleY(p.y) - 30}
                          width="52"
                          height="18"
                          rx="4"
                          fill="#1e293b"
                          className="opacity-90"
                        />
                        <text
                          x={scaleX(p.x)}
                          y={scaleY(p.y) - 18}
                          textAnchor="middle"
                          className="font-mono text-[9px] font-semibold fill-white"
                        >
                          ({p.x}, {p.y})
                        </text>
                      </g>
                    )}

                    {/* Delete X control on hover */}
                    {isHovered && !isDragging && (
                      <circle
                        cx={scaleX(p.x) + 12}
                        cy={scaleY(p.y) - 12}
                        r={7}
                        fill="#ef4444"
                        onClick={(e) => deletePoint(p.id, e)}
                        className="cursor-pointer hover:scale-110 transition-transform"
                      />
                    )}
                    {isHovered && !isDragging && (
                      <text
                        x={scaleX(p.x) + 12}
                        y={scaleY(p.y) - 10}
                        textAnchor="middle"
                        onClick={(e) => deletePoint(p.id, e)}
                        className="font-bold text-[7px] fill-white pointer-events-none select-none"
                      >
                        x
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            
            {points.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50/70 backdrop-blur-[1px]">
                <BarChart2 size={40} className="text-slate-300 mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-slate-600">The grid is currently empty</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Click inside this box to add points, or choose a pre-designed pattern beneath to begin your exploration.
                </p>
              </div>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Teaching Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset.points)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50/70 border border-indigo-100/85 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 transition"
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Real-time analysis metrics & teaching content */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        
        {/* Statistics Feedback Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
            Real-Time Analysis Metrics
          </h3>

          {/* Sample Size */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Sample Size (n):</span>
            <span className="font-mono font-bold text-slate-900 text-base">{points.length} points</span>
          </div>

          {points.length < 3 ? (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Add More Points!</p>
                <p className="mt-1">
                  Please click to add at least <strong>3 points</strong> to plot the Least Squares Regression Line (LSRL) and compute standard statistics.
                </p>
              </div>
            </div>
          ) : stats ? (
            <React.Fragment>
              
              {/* Correlation Coefficient r */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-1">
                    Correlation Coefficient (r)
                    <span className="text-[10px] bg-slate-100 px-1 py-0.5 text-slate-500 rounded font-mono">r</span>
                  </span>
                  <span className="font-mono font-extrabold text-indigo-600 text-xl">
                    {stats.r >= 0 ? '+' : ''}{stats.r.toFixed(4)}
                  </span>
                </div>
                
                {/* Strength Meter Bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    {/* Normalized marker point on line -1 to 1 */}
                    <div
                      style={{ width: `${((stats.r + 1) / 2) * 100}%` }}
                      className="bg-indigo-500"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Negative (-1)</span>
                    <span>No Association (0)</span>
                    <span>Positive (+1)</span>
                  </div>
                </div>

                {/* Strength Meter Label */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">Qualitative Strength:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide tracking-wider ${getStrengthLabel(stats.r).color}`}>
                    {getStrengthLabel(stats.r).text}
                  </span>
                </div>
              </div>

              {/* Coefficient of Determination R-squared */}
              <div className="bg-slate-55 rounded-xl border border-slate-100 p-4 space-y-2 relative group hover:bg-indigo-50/10 transition">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 flex items-center gap-1.5">
                    Coefficient of Determination
                    <span className="text-[10px] bg-indigo-50 px-1 py-0.5 text-indigo-600 rounded font-mono font-semibold">r²</span>
                  </span>
                  <span className="font-mono font-extrabold text-slate-800 text-lg">
                    {stats.r2.toFixed(4)} ({Math.round(stats.r2 * 100)}%)
                  </span>
                </div>

                {/* Explanation text - the 'Honest Phrasing' */}
                <div className="text-xs text-slate-600 bg-white rounded-lg p-3 border border-slate-100 shadow-sm leading-relaxed">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-semibold mb-1">
                    <BookOpen size={14} />
                    <span>Statistically Precise Interpretation</span>
                  </div>
                  <strong>r² = {stats.r2.toFixed(2)}</strong> indicates that <span className="text-indigo-600 font-bold">{Math.round(stats.r2 * 100)}%</span> of the variation in <span className="font-semibold">y</span> can be accounted for by its statistical association with <span className="font-semibold">x</span>.
                </div>

                {/* Interactive Explanation Bubble Info Icon */}
                <div className="flex items-center justify-between text-[11px] text-indigo-500 pt-1 pointer-events-none">
                  <span className="flex items-center gap-1">
                    <HelpCircle size={12} />
                    Hover anywhere to reveal visual explained variance
                  </span>
                  <span className="font-mono text-slate-400">R-Squared</span>
                </div>
              </div>

              {/* Fitted Line Equation */}
              <div className="bg-indigo-50 border border-indigo-100/70 rounded-xl p-3.5 text-center">
                <span className="text-xs text-indigo-700 font-semibold uppercase tracking-wider block mb-1">Predicted Regression Line (LSRL)</span>
                <span className="font-mono font-bold text-indigo-900 text-base">
                  ŷ = {stats.intercept.toFixed(4)} + {stats.slope.toFixed(4)}x
                </span>
              </div>

              {/* Variance Shading toggle */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-600 font-medium">Show Explained Variance shading on graph:</span>
                <button
                  onClick={() => setShowVarianceVisualization(!showVarianceVisualization)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                    showVarianceVisualization
                      ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {showVarianceVisualization ? 'Enabled' : 'Disabled'}
                </button>
              </div>

            </React.Fragment>
          ) : null}
        </div>

        {/* Educational Content / Discussion Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex-1">
          <div className="flex border-b border-slate-100 pb-0.5 mb-4">
            <button
              onClick={() => setActiveTab('explanation')}
              className={`flex-1 pb-2.5 text-sm font-semibold transition-all relative ${
                activeTab === 'explanation' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              How R² Works
              {activeTab === 'explanation' && (
                <motion.div layoutId="corrTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`flex-1 pb-2.5 text-sm font-semibold transition-all relative ${
                activeTab === 'discussion' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Misleading R² Discussion
              {activeTab === 'discussion' && (
                <motion.div layoutId="corrTabBorder" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          </div>

          <div className="min-h-[160px]">
            {activeTab === 'explanation' ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                <p>
                  In statistics, we quantify the strength of a relationship by splitting the total variance of <span className="font-semibold text-slate-800">Y</span> into two piles:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2 border border-emerald-100 bg-emerald-50/50 rounded-lg">
                    <span className="font-bold text-emerald-700 block mb-0.5">Shared Pattern</span>
                    The purple-teal shaded area on the grid. This is variation in y that maps perfectly with the slope of x.
                  </div>
                  <div className="p-2 border border-red-100 bg-red-50/50 rounded-lg">
                    <span className="font-bold text-red-600 block mb-0.5">Residual Error</span>
                    The vertical distances from points to the line (red segments). This represents random fluctuation.
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic mt-2">
                  💡 <strong>Try this</strong>: Load the &quot;Outlier Leverage&quot; preset. Watch how a single point far from the cluster forces the regression line to rotate, completely turning a positive slope into a weak flat-lining correlation.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                <div className="border-l-4 border-amber-400 pl-3 py-1 bg-amber-50/40 rounded-r-lg mb-2">
                  <p className="font-semibold text-amber-800 mb-0.5">⚠️ Caution: Correlation != Causation</p>
                  <p className="text-[11px]">
                     Textbooks use the phrase <em>&quot;explained by the workload&quot;</em>. This can inadvertently teach students that background tasks directly cause hardware wear or immediate power depletion physically in every isolated microsecond. Real R² measures purely <strong>statistical covariance</strong>.
                  </p>
                </div>
                
                <p className="font-semibold text-slate-800">
                  The Shoe Size &amp; Reading Ability Example:
                </p>
                <p>
                  For elementary school students, shoe size shares an R² of about **0.65** with reading level. A mathematical formula predicts reading grade based on shoe size with high accuracy! 
                </p>
                <p>
                  But obviously, buying larger shoes doesn&apos;t make a child read better. Both shoe size and reading level are powered by a third lurking variable: <strong>Age</strong>. Since age causes both variables to grow, they co-vary tightly.
                </p>
                
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg mt-1 text-indigo-950">
                  <span className="font-semibold block text-indigo-800">Discussion Challenge:</span>
                  Can you think of other real-life variables where R² is high but drawing a causal line would be ridiculous?
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
