/* Footing cross-section diagram — real-time SVG */

export default function FootingDiagram({ B, Df, shape, waterTableDepth, gamma }) {
  // SVG viewport
  const W = 400;
  const H = 320;
  const pad = 40;

  // Scale: max depth shown = max(Df*2.5, 5m), max width = max(B*3, 5m)
  const maxDepth = Math.max(Df * 2.5, 4);
  const maxWidth = Math.max(B * 3, 4);

  // Ground level Y
  const groundY = pad + 40;
  const drawH = H - groundY - pad;
  const drawW = W - pad * 2;

  // Scale factors
  const scaleY = drawH / maxDepth;
  const scaleX = drawW / maxWidth;

  // Footing dimensions in px
  const footW = B * scaleX;
  const footH = Math.max(12, Math.min(24, Df * scaleX * 0.15));
  const footX = W / 2 - footW / 2;
  const footY = groundY + Df * scaleY;

  // Column
  const colW = Math.max(16, footW * 0.25);
  const colH = groundY - pad + 10;
  const colX = W / 2 - colW / 2;

  // Water table
  const wtY = waterTableDepth < maxDepth ? groundY + waterTableDepth * scaleY : null;

  // Soil zone below footing (influence zone ~2B)
  const bulbDepth = Math.min(B * 2, maxDepth - Df);
  const bulbY = footY + footH;
  const bulbH = bulbDepth * scaleY;

  // Hatch pattern for soil
  const hatchId = 'soilHatch';
  const waterPatternId = 'waterPattern';

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 overflow-hidden">
      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Seccion transversal</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }}>
        <defs>
          {/* Soil hatch */}
          <pattern id={hatchId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#d4d4d4" strokeWidth="0.8" />
          </pattern>
          {/* Dots for soil */}
          <pattern id="soilDots" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#a3a3a3" />
            <circle cx="8" cy="8" r="0.8" fill="#a3a3a3" />
            <circle cx="8" cy="2" r="0.6" fill="#d4d4d4" />
          </pattern>
          {/* Water pattern */}
          <pattern id={waterPatternId} width="20" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 3 Q5 0 10 3 Q15 6 20 3" fill="none" stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
          </pattern>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width={W} height={groundY} fill="#f8fafc" />

        {/* Soil body */}
        <rect x="0" y={groundY} width={W} height={H - groundY} fill="#fafaf9" />
        <rect x="0" y={groundY} width={W} height={H - groundY} fill={`url(#soilDots)`} />

        {/* Excavation (lighter zone) */}
        <rect x={footX - 8} y={groundY} width={footW + 16} height={Df * scaleY + footH} fill="#f5f5f4" stroke="none" />
        <rect x={footX - 8} y={groundY} width={footW + 16} height={Df * scaleY} fill="none" stroke="#a3a3a3" strokeWidth="0.5" strokeDasharray="3 3" />

        {/* Water table */}
        {wtY && wtY < H - pad && (
          <>
            <rect x="0" y={wtY} width={W} height={H - wtY - pad + 20} fill="rgba(191,219,254,0.15)" />
            <line x1={pad - 10} y1={wtY} x2={W - pad + 10} y2={wtY} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" />
            <text x={W - pad + 12} y={wtY + 4} fontSize="9" fill="#3b82f6" fontWeight="600">NF</text>
            {/* Water level label */}
            <text x={W - pad + 12} y={wtY + 14} fontSize="8" fill="#93c5fd">{waterTableDepth}m</text>
          </>
        )}

        {/* Pressure bulb (influence zone) */}
        <ellipse
          cx={W / 2}
          cy={bulbY + bulbH * 0.45}
          rx={footW * 0.7}
          ry={bulbH * 0.55}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.35"
        />

        {/* Ground surface */}
        <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#525252" strokeWidth="2" />
        {/* Ground surface hatch marks */}
        {Array.from({ length: Math.floor(W / 10) }).map((_, i) => (
          <line key={i} x1={i * 10 + 5} y1={groundY} x2={i * 10 - 2} y2={groundY - 7} stroke="#737373" strokeWidth="0.8" />
        ))}

        {/* Column */}
        <rect x={colX} y={pad - 10} width={colW} height={colH + 10 + Df * scaleY} fill="#e5e5e5" stroke="#525252" strokeWidth="1.5" rx="1" />
        <rect x={colX + 2} y={pad - 8} width={colW - 4} height={colH + 8 + Df * scaleY} fill="#f5f5f5" stroke="none" />
        {/* Column hatching */}
        <rect x={colX} y={pad - 10} width={colW} height={colH + 10 + Df * scaleY} fill={`url(#${hatchId})`} opacity="0.4" />

        {/* Footing (zapata) */}
        <rect x={footX} y={footY} width={footW} height={footH} fill="#404040" stroke="#262626" strokeWidth="1.5" rx="2" />
        <rect x={footX + 1.5} y={footY + 1.5} width={footW - 3} height={footH - 3} fill="#525252" stroke="none" rx="1" />
        {/* Footing hatch */}
        <rect x={footX} y={footY} width={footW} height={footH} fill={`url(#${hatchId})`} opacity="0.3" />

        {/* ── Dimension: B (width) ── */}
        {(() => {
          const dimY = footY + footH + 18;
          return (
            <>
              <line x1={footX} y1={footY + footH + 4} x2={footX} y2={dimY + 4} stroke="#3b82f6" strokeWidth="0.8" />
              <line x1={footX + footW} y1={footY + footH + 4} x2={footX + footW} y2={dimY + 4} stroke="#3b82f6" strokeWidth="0.8" />
              <line x1={footX} y1={dimY} x2={footX + footW} y2={dimY} stroke="#3b82f6" strokeWidth="1" markerStart="url(#arrowL)" markerEnd="url(#arrowR)" />
              {/* Arrows */}
              <polygon points={`${footX},${dimY} ${footX + 5},${dimY - 2.5} ${footX + 5},${dimY + 2.5}`} fill="#3b82f6" />
              <polygon points={`${footX + footW},${dimY} ${footX + footW - 5},${dimY - 2.5} ${footX + footW - 5},${dimY + 2.5}`} fill="#3b82f6" />
              <rect x={W / 2 - 22} y={dimY - 8} width="44" height="14" rx="3" fill="white" stroke="#3b82f6" strokeWidth="0.8" />
              <text x={W / 2} y={dimY + 3} textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563eb" fontFamily="monospace">
                B={B}m
              </text>
            </>
          );
        })()}

        {/* ── Dimension: Df (depth) ── */}
        {(() => {
          const dimX = footX - 20;
          return (
            <>
              <line x1={dimX - 4} y1={groundY} x2={dimX + 4} y2={groundY} stroke="#525252" strokeWidth="0.8" />
              <line x1={dimX - 4} y1={footY} x2={dimX + 4} y2={footY} stroke="#525252" strokeWidth="0.8" />
              <line x1={dimX} y1={groundY} x2={dimX} y2={footY} stroke="#525252" strokeWidth="1" />
              {/* Arrows */}
              <polygon points={`${dimX},${groundY} ${dimX - 2.5},${groundY + 5} ${dimX + 2.5},${groundY + 5}`} fill="#525252" />
              <polygon points={`${dimX},${footY} ${dimX - 2.5},${footY - 5} ${dimX + 2.5},${footY - 5}`} fill="#525252" />
              {/* Label */}
              {(() => {
                const midY = (groundY + footY) / 2;
                return (
                  <>
                    <rect x={dimX - 28} y={midY - 7} width="56" height="14" rx="3" fill="white" stroke="#525252" strokeWidth="0.8" />
                    <text x={dimX} y={midY + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#404040" fontFamily="monospace">
                      Df={Df}m
                    </text>
                  </>
                );
              })()}
            </>
          );
        })()}

        {/* ── Shape label ── */}
        <rect x={pad - 5} y={pad - 18} width="80" height="18" rx="4" fill="#2563eb" />
        <text x={pad + 35} y={pad - 5} textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="sans-serif">
          {shape === 'square' ? 'CUADRADA' : shape === 'circular' ? 'CIRCULAR' : 'CORRIDA'}
        </text>

        {/* Soil label */}
        <text x={W - pad} y={H - pad + 15} textAnchor="end" fontSize="8" fill="#a3a3a3" fontFamily="sans-serif">
          γ = {gamma} kN/m³
        </text>

        {/* q label on ground surface */}
        {(() => {
          const qVal = (gamma * Df).toFixed(1);
          const arrowX = footX + footW + 25;
          return (
            <>
              <line x1={arrowX} y1={groundY - 15} x2={arrowX} y2={footY - 2} stroke="#ef4444" strokeWidth="1.2" />
              <polygon points={`${arrowX},${footY - 2} ${arrowX - 3},${footY - 8} ${arrowX + 3},${footY - 8}`} fill="#ef4444" />
              <text x={arrowX + 8} y={(groundY + footY) / 2 + 2} fontSize="8" fill="#ef4444" fontWeight="600" fontFamily="monospace">
                q={qVal}kPa
              </text>
            </>
          );
        })()}

        {/* Ground level label */}
        <text x={pad - 5} y={groundY - 5} fontSize="8" fill="#737373" fontWeight="500">Nivel terreno</text>

      </svg>
    </div>
  );
}
