/* Footing cross-section + plan view diagram — real-time SVG */

function CrossSection({ B, Df, shape, waterTableDepth, gamma }) {
  const W = 360;
  const H = 300;
  const pad = 36;

  const maxDepth = Math.max(Df * 2.5, 4);
  const maxWidth = Math.max(B * 3, 4);
  const groundY = pad + 36;
  const drawH = H - groundY - pad;
  const drawW = W - pad * 2;
  const scaleY = drawH / maxDepth;
  const scaleX = drawW / maxWidth;

  const footW = B * scaleX;
  const footH = Math.max(12, Math.min(22, Df * scaleX * 0.15));
  const footX = W / 2 - footW / 2;
  const footY = groundY + Df * scaleY;

  const colW = Math.max(14, footW * 0.22);
  const colH = groundY - pad + 8;
  const colX = W / 2 - colW / 2;

  const wtY = waterTableDepth < maxDepth ? groundY + waterTableDepth * scaleY : null;
  const bulbDepth = Math.min(B * 2, maxDepth - Df);
  const bulbY = footY + footH;
  const bulbH = bulbDepth * scaleY;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#d4d4d4" strokeWidth="0.8" />
        </pattern>
        <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="#a3a3a3" />
          <circle cx="8" cy="8" r="0.8" fill="#a3a3a3" />
          <circle cx="8" cy="2" r="0.6" fill="#d4d4d4" />
        </pattern>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width={W} height={groundY} fill="#f8fafc" />

      {/* Soil */}
      <rect x="0" y={groundY} width={W} height={H - groundY} fill="#fafaf9" />
      <rect x="0" y={groundY} width={W} height={H - groundY} fill="url(#dots)" />

      {/* Excavation */}
      <rect x={footX - 8} y={groundY} width={footW + 16} height={Df * scaleY + footH} fill="#f5f5f4" />
      <rect x={footX - 8} y={groundY} width={footW + 16} height={Df * scaleY} fill="none" stroke="#a3a3a3" strokeWidth="0.5" strokeDasharray="3 3" />

      {/* Water table */}
      {wtY && wtY < H - pad && (
        <>
          <rect x="0" y={wtY} width={W} height={H - wtY} fill="rgba(191,219,254,0.12)" />
          <line x1={pad - 10} y1={wtY} x2={W - pad + 10} y2={wtY} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x={W - pad + 12} y={wtY + 4} fontSize="8" fill="#3b82f6" fontWeight="600">NF {waterTableDepth}m</text>
        </>
      )}

      {/* Pressure bulb */}
      <ellipse cx={W / 2} cy={bulbY + bulbH * 0.45} rx={footW * 0.65} ry={bulbH * 0.55}
        fill="none" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.3" />
      <text x={W / 2} y={bulbY + bulbH * 0.45 + 3} textAnchor="middle" fontSize="7" fill="#93c5fd">bulbo ~2B</text>

      {/* Ground surface */}
      <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#525252" strokeWidth="2" />
      {Array.from({ length: Math.floor(W / 10) }).map((_, i) => (
        <line key={i} x1={i * 10 + 5} y1={groundY} x2={i * 10 - 2} y2={groundY - 6} stroke="#737373" strokeWidth="0.7" />
      ))}

      {/* Column */}
      <rect x={colX} y={pad - 8} width={colW} height={colH + 8 + Df * scaleY} fill="#e5e5e5" stroke="#525252" strokeWidth="1.5" rx="1" />
      <rect x={colX} y={pad - 8} width={colW} height={colH + 8 + Df * scaleY} fill="url(#hatch)" opacity="0.3" />

      {/* Footing */}
      {shape === 'circular' ? (
        <>
          <ellipse cx={W / 2} cy={footY + footH / 2} rx={footW / 2} ry={footH / 2 + 2}
            fill="#404040" stroke="#262626" strokeWidth="1.5" />
          <ellipse cx={W / 2} cy={footY + footH / 2} rx={footW / 2 - 2} ry={footH / 2}
            fill="#525252" stroke="none" />
          <ellipse cx={W / 2} cy={footY + footH / 2} rx={footW / 2} ry={footH / 2 + 2}
            fill="url(#hatch)" opacity="0.3" />
        </>
      ) : (
        <>
          <rect x={footX} y={footY} width={footW} height={footH} fill="#404040" stroke="#262626" strokeWidth="1.5" rx="2" />
          <rect x={footX + 1.5} y={footY + 1.5} width={footW - 3} height={footH - 3} fill="#525252" rx="1" />
          <rect x={footX} y={footY} width={footW} height={footH} fill="url(#hatch)" opacity="0.3" />
        </>
      )}

      {/* Dim B */}
      {(() => {
        const dy = footY + footH + 16;
        return (
          <>
            <line x1={footX} y1={footY + footH + 3} x2={footX} y2={dy + 3} stroke="#3b82f6" strokeWidth="0.7" />
            <line x1={footX + footW} y1={footY + footH + 3} x2={footX + footW} y2={dy + 3} stroke="#3b82f6" strokeWidth="0.7" />
            <line x1={footX} y1={dy} x2={footX + footW} y2={dy} stroke="#3b82f6" strokeWidth="1" />
            <polygon points={`${footX},${dy} ${footX + 4},${dy - 2} ${footX + 4},${dy + 2}`} fill="#3b82f6" />
            <polygon points={`${footX + footW},${dy} ${footX + footW - 4},${dy - 2} ${footX + footW - 4},${dy + 2}`} fill="#3b82f6" />
            <rect x={W / 2 - 20} y={dy - 7} width="40" height="13" rx="3" fill="white" stroke="#3b82f6" strokeWidth="0.7" />
            <text x={W / 2} y={dy + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#2563eb" fontFamily="monospace">B={B}m</text>
          </>
        );
      })()}

      {/* Dim Df */}
      {(() => {
        const dx = footX - 18;
        const mid = (groundY + footY) / 2;
        return (
          <>
            <line x1={dx - 3} y1={groundY} x2={dx + 3} y2={groundY} stroke="#525252" strokeWidth="0.7" />
            <line x1={dx - 3} y1={footY} x2={dx + 3} y2={footY} stroke="#525252" strokeWidth="0.7" />
            <line x1={dx} y1={groundY} x2={dx} y2={footY} stroke="#525252" strokeWidth="1" />
            <polygon points={`${dx},${groundY} ${dx - 2},${groundY + 4} ${dx + 2},${groundY + 4}`} fill="#525252" />
            <polygon points={`${dx},${footY} ${dx - 2},${footY - 4} ${dx + 2},${footY - 4}`} fill="#525252" />
            <rect x={dx - 24} y={mid - 6} width="48" height="12" rx="3" fill="white" stroke="#525252" strokeWidth="0.7" />
            <text x={dx} y={mid + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#404040" fontFamily="monospace">Df={Df}m</text>
          </>
        );
      })()}

      {/* q arrow */}
      {(() => {
        const ax = footX + footW + 22;
        return (
          <>
            <line x1={ax} y1={groundY - 12} x2={ax} y2={footY - 2} stroke="#ef4444" strokeWidth="1" />
            <polygon points={`${ax},${footY - 2} ${ax - 2.5},${footY - 7} ${ax + 2.5},${footY - 7}`} fill="#ef4444" />
            <text x={ax + 6} y={(groundY + footY) / 2 + 2} fontSize="7" fill="#ef4444" fontWeight="600" fontFamily="monospace">q={(gamma * Df).toFixed(1)}kPa</text>
          </>
        );
      })()}

      {/* Labels */}
      <text x={pad - 5} y={groundY - 4} fontSize="7" fill="#737373" fontWeight="500">Nivel terreno</text>
      <text x={W - pad} y={H - pad + 12} textAnchor="end" fontSize="7" fill="#a3a3a3">γ={gamma} kN/m³</text>
    </svg>
  );
}

function PlanView({ B, shape }) {
  const S = 220;
  const cx = S / 2;
  const cy = S / 2;
  const maxDim = Math.max(B * 1.8, 3);
  const scale = (S - 60) / maxDim;
  const bPx = B * scale;

  // For strip footing, show a long rectangle (L >> B)
  const stripL = bPx * 2.5;

  // Column size
  const colPx = Math.max(10, bPx * 0.2);

  const shapeLabel = shape === 'square' ? 'CUADRADA' : shape === 'circular' ? 'CIRCULAR' : 'CORRIDA';

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-auto">
      <defs>
        <pattern id="planHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#93c5fd" strokeWidth="0.6" />
        </pattern>
        <pattern id="planHatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#bfdbfe" strokeWidth="0.4" />
        </pattern>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width={S} height={S} fill="#fafafa" rx="8" />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <g key={f}>
          <line x1={S * f} y1="10" x2={S * f} y2={S - 10} stroke="#f0f0f0" strokeWidth="0.5" />
          <line x1="10" y1={S * f} x2={S - 10} y2={S * f} stroke="#f0f0f0" strokeWidth="0.5" />
        </g>
      ))}

      {/* Footing shape */}
      {shape === 'circular' ? (
        <>
          <circle cx={cx} cy={cy} r={bPx / 2} fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={bPx / 2} fill="url(#planHatch)" />
          <circle cx={cx} cy={cy} r={bPx / 2} fill="url(#planHatch2)" />
        </>
      ) : shape === 'square' ? (
        <>
          <rect x={cx - bPx / 2} y={cy - bPx / 2} width={bPx} height={bPx} fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" rx="2" />
          <rect x={cx - bPx / 2} y={cy - bPx / 2} width={bPx} height={bPx} fill="url(#planHatch)" rx="2" />
          <rect x={cx - bPx / 2} y={cy - bPx / 2} width={bPx} height={bPx} fill="url(#planHatch2)" rx="2" />
        </>
      ) : (
        /* Strip: long in one direction */
        <>
          <rect x={cx - stripL / 2} y={cy - bPx / 2} width={stripL} height={bPx} fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" rx="2" />
          <rect x={cx - stripL / 2} y={cy - bPx / 2} width={stripL} height={bPx} fill="url(#planHatch)" rx="2" />
          <rect x={cx - stripL / 2} y={cy - bPx / 2} width={stripL} height={bPx} fill="url(#planHatch2)" rx="2" />
        </>
      )}

      {/* Column (dark square in center) */}
      <rect x={cx - colPx / 2} y={cy - colPx / 2} width={colPx} height={colPx} fill="#404040" stroke="#262626" strokeWidth="1" rx="1" />

      {/* Center lines */}
      {shape === 'strip' ? (
        <>
          <line x1={cx - stripL / 2 - 6} y1={cy} x2={cx + stripL / 2 + 6} y2={cy} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3 2" />
          <line x1={cx} y1={cy - bPx / 2 - 6} x2={cx} y2={cy + bPx / 2 + 6} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3 2" />
        </>
      ) : (
        <>
          <line x1={cx - bPx / 2 - 8} y1={cy} x2={cx + bPx / 2 + 8} y2={cy} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3 2" />
          <line x1={cx} y1={cy - bPx / 2 - 8} x2={cx} y2={cy + bPx / 2 + 8} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3 2" />
        </>
      )}

      {/* Dimension: horizontal B */}
      {(() => {
        const left = shape === 'strip' ? cx - stripL / 2 : cx - bPx / 2;
        const right = shape === 'strip' ? cx + stripL / 2 : cx + bPx / 2;
        const dimLabel = shape === 'strip' ? 'L' : 'B';
        const dimVal = shape === 'strip' ? `${(B * 2.5).toFixed(1)}` : `${B}`;
        const dy = cy + (shape === 'circular' ? bPx / 2 : bPx / 2) + 16;
        return (
          <>
            <line x1={left} y1={dy - 8} x2={left} y2={dy + 3} stroke="#2563eb" strokeWidth="0.6" />
            <line x1={right} y1={dy - 8} x2={right} y2={dy + 3} stroke="#2563eb" strokeWidth="0.6" />
            <line x1={left} y1={dy} x2={right} y2={dy} stroke="#2563eb" strokeWidth="0.8" />
            <polygon points={`${left},${dy} ${left + 4},${dy - 2} ${left + 4},${dy + 2}`} fill="#2563eb" />
            <polygon points={`${right},${dy} ${right - 4},${dy - 2} ${right - 4},${dy + 2}`} fill="#2563eb" />
            <rect x={(left + right) / 2 - 16} y={dy - 6} width="32" height="11" rx="2" fill="white" stroke="#2563eb" strokeWidth="0.6" />
            <text x={(left + right) / 2} y={dy + 2.5} textAnchor="middle" fontSize="8" fontWeight="700" fill="#2563eb" fontFamily="monospace">{dimLabel}={dimVal}m</text>
          </>
        );
      })()}

      {/* Dimension: vertical B (for square and circular) */}
      {shape !== 'strip' && (() => {
        const top = cy - bPx / 2;
        const bot = cy + bPx / 2;
        const dx = cx + bPx / 2 + 16;
        return (
          <>
            <line x1={dx - 3} y1={top} x2={dx + 3} y2={top} stroke="#2563eb" strokeWidth="0.6" />
            <line x1={dx - 3} y1={bot} x2={dx + 3} y2={bot} stroke="#2563eb" strokeWidth="0.6" />
            <line x1={dx} y1={top} x2={dx} y2={bot} stroke="#2563eb" strokeWidth="0.8" />
            <polygon points={`${dx},${top} ${dx - 2},${top + 4} ${dx + 2},${top + 4}`} fill="#2563eb" />
            <polygon points={`${dx},${bot} ${dx - 2},${bot - 4} ${dx + 2},${bot - 4}`} fill="#2563eb" />
            <rect x={dx - 14} y={(top + bot) / 2 - 5.5} width="28" height="11" rx="2" fill="white" stroke="#2563eb" strokeWidth="0.6" />
            <text x={dx} y={(top + bot) / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#2563eb" fontFamily="monospace">B={B}m</text>
          </>
        );
      })()}

      {/* For strip: vertical B dimension */}
      {shape === 'strip' && (() => {
        const top = cy - bPx / 2;
        const bot = cy + bPx / 2;
        const dx = cx + stripL / 2 + 16;
        return (
          <>
            <line x1={dx - 3} y1={top} x2={dx + 3} y2={top} stroke="#525252" strokeWidth="0.6" />
            <line x1={dx - 3} y1={bot} x2={dx + 3} y2={bot} stroke="#525252" strokeWidth="0.6" />
            <line x1={dx} y1={top} x2={dx} y2={bot} stroke="#525252" strokeWidth="0.8" />
            <polygon points={`${dx},${top} ${dx - 2},${top + 4} ${dx + 2},${top + 4}`} fill="#525252" />
            <polygon points={`${dx},${bot} ${dx - 2},${bot - 4} ${dx + 2},${bot - 4}`} fill="#525252" />
            <rect x={dx - 14} y={(top + bot) / 2 - 5.5} width="28" height="11" rx="2" fill="white" stroke="#525252" strokeWidth="0.6" />
            <text x={dx} y={(top + bot) / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#525252" fontFamily="monospace">B={B}m</text>
          </>
        );
      })()}

      {/* Shape label */}
      <rect x="8" y="8" width="70" height="16" rx="4" fill="#2563eb" />
      <text x="43" y="19" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">{shapeLabel}</text>

      {/* Area info */}
      {(() => {
        const area = shape === 'circular' ? (Math.PI * (B / 2) ** 2) : shape === 'square' ? B * B : B * B * 2.5;
        return (
          <text x={S - 8} y={S - 8} textAnchor="end" fontSize="7" fill="#a3a3a3" fontFamily="monospace">
            A = {area.toFixed(2)} m²
          </text>
        );
      })()}
    </svg>
  );
}

export default function FootingDiagram({ B, Df, shape, waterTableDepth, gamma }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Seccion transversal</p>
          <CrossSection B={B} Df={Df} shape={shape} waterTableDepth={waterTableDepth} gamma={gamma} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Vista de planta</p>
          <PlanView B={B} shape={shape} />
        </div>
      </div>
    </div>
  );
}
