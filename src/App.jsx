import { useState } from 'react';
import {
  HAMMER_TYPES, calculateN60, calculateEffectiveStress, calculateCN, calculateN160,
  estimateFrictionAngle, estimateUnitWeight, classifySoil, calculateBearingCapacity,
  calculateAdmissibleCapacity, meyerhofDirectMethod, getBoreholeCorrectionFactor,
  getSamplerCorrectionFactor, getRodLengthCorrectionFactor,
} from './utils/sptCalculations';
import { Input, Select, Card, Pill, Toggle, FormulaBox, FormulaResult } from './components/UI';

/* ── Stepper bar ── */
const STEPS = [
  { num: 1, label: 'Ensayo SPT' },
  { num: 2, label: 'Sobrecarga' },
  { num: 3, label: 'Suelo' },
  { num: 4, label: 'Cimentacion' },
  { num: 5, label: 'Resultados' },
];

function Stepper({ current }) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                s.num < current ? 'bg-blue-600 text-white' :
                s.num === current ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' :
                'bg-neutral-200 text-neutral-400'
              }`}>
                {s.num < current ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : s.num}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap ${s.num === current ? 'text-neutral-900' : s.num < current ? 'text-blue-600' : 'text-neutral-400'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-4">
                <div className="h-0.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-blue-600 transition-all duration-500 ${s.num < current ? 'w-full' : 'w-0'}`}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-neutral-900">Paso {current} de {STEPS.length}</span>
          <span className="text-sm text-neutral-500">{STEPS[current - 1].label}</span>
        </div>
        <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${(current / STEPS.length) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
}

/* ── Nav buttons ── */
function NavButtons({ current, setCurrent, total }) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-neutral-200">
      {current > 1 ? (
        <button onClick={() => setCurrent(current - 1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Anterior
        </button>
      ) : <div />}
      {current < total ? (
        <button onClick={() => setCurrent(current + 1)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">
          Siguiente
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      ) : (
        <button onClick={() => setCurrent(1)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors">
          Reiniciar
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      )}
    </div>
  );
}

/* ── Calculation panel (right side) ── */
function CalcPanel({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-6 h-full">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">Calculo en vivo</p>
      </div>
      {title && <h3 className="text-base font-bold text-neutral-900 mt-2">{title}</h3>}
      {description && <p className="text-sm text-neutral-500 mt-1 mb-4">{description}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SubResult({ label, value }) {
  return (
    <div className="flex justify-between items-center bg-white rounded-lg border border-neutral-100 px-4 py-2.5">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-mono font-bold text-neutral-900">{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*                   MAIN APP                    */
/* ══════════════════════════════════════════════ */

function App() {
  const [step, setStep] = useState(1);

  // SPT
  const [nField, setNField] = useState(15);
  const [testDepth, setTestDepth] = useState(3);
  const [hammerType, setHammerType] = useState('safety');
  const [boreholeDiameter, setBoreholeDiameter] = useState(65);
  const [withLiner, setWithLiner] = useState(true);
  const [rodLength, setRodLength] = useState(6);
  // Soil
  const [waterTableDepth, setWaterTableDepth] = useState(10);
  const [soilType, setSoilType] = useState('granular');
  const [cohesion, setCohesion] = useState(0);
  const [useManualGamma, setUseManualGamma] = useState(false);
  const [manualGamma, setManualGamma] = useState(18);
  const [useManualPhi, setUseManualPhi] = useState(false);
  const [manualPhi, setManualPhi] = useState(30);
  // Foundation
  const [B, setB] = useState(1.5);
  const [Df, setDf] = useState(1.5);
  const [shape, setShape] = useState('square');
  const [fs, setFs] = useState(3.0);

  // Calculations
  const hammerEfficiency = HAMMER_TYPES[hammerType].efficiency;
  const n60 = calculateN60(nField, hammerEfficiency, boreholeDiameter, withLiner, rodLength);
  const gammaEstimated = estimateUnitWeight(n60);
  const gamma = useManualGamma ? manualGamma : gammaEstimated;
  const sigmaV = calculateEffectiveStress(testDepth, gamma, waterTableDepth);
  const cn = calculateCN(sigmaV);
  const n160 = calculateN160(n60, cn);
  const phiEstimated = estimateFrictionAngle(n160);
  const phi = useManualPhi ? manualPhi : phiEstimated;
  const soilClass = classifySoil(n60);
  const failureType = n60 <= 10 ? 'local' : 'general';
  const bearingResult = calculateBearingCapacity({
    cohesion: soilType === 'cohesive' ? cohesion : 0,
    phi: soilType === 'granular' ? phi : 0,
    gamma, B, Df, shape, waterTableDepth, failureType,
  });
  const qAdm = calculateAdmissibleCapacity(bearingResult.qu, fs);
  const meyerhof = meyerhofDirectMethod(n60, B, Df);
  const etaH = hammerEfficiency;
  const etaB = getBoreholeCorrectionFactor(boreholeDiameter);
  const etaS = getSamplerCorrectionFactor(withLiner);
  const etaR = getRodLengthCorrectionFactor(rodLength);
  const shapeLabels = { strip: 'Corrida', square: 'Cuadrada', circular: 'Circular' };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased flex flex-col">

      {/* Header */}
      <header className="relative bg-neutral-950 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.1),_transparent_60%)]"></div>
        <div className="relative max-w-5xl mx-auto px-6 py-8 md:py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Capacidad Portante <span className="text-blue-400">SPT</span>
            </h1>
          </div>
          <p className="text-neutral-500 text-sm max-w-lg">
            Basado en <span className="text-neutral-300">Braja M. Das</span> — Completa cada paso para obtener la capacidad portante.
          </p>
        </div>
      </header>

      {/* Stepper */}
      <div className="bg-white border-b border-neutral-200 shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Stepper current={step} />
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">

        {/* ═══ STEP 1: Ensayo SPT ═══ */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-1">Datos del Ensayo SPT</h2>
              <p className="text-sm text-neutral-400 mb-5">Ingresa los datos de campo para corregir el valor N al 60% de eficiencia.</p>
              <Card>
                <Input label="N de campo (golpes/30cm)" value={nField} onChange={setNField} min={0} max={100} tooltip="Numero de golpes del ensayo SPT" />
                <Input label="Profundidad del ensayo" unit="m" value={testDepth} onChange={setTestDepth} min={0.5} max={50} step={0.5} />
                <Select label="Tipo de martillo" value={hammerType} onChange={setHammerType}
                  options={Object.entries(HAMMER_TYPES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.efficiency}%)` }))} />
                <Select label="Diametro de perforacion" value={boreholeDiameter} onChange={(v) => setBoreholeDiameter(Number(v))}
                  options={[{ value: 65, label: '65-115 mm' }, { value: 150, label: '150 mm' }, { value: 200, label: '200 mm' }]} />
                <Input label="Longitud de varillas" unit="m" value={rodLength} onChange={setRodLength} min={1} max={30} step={0.5} />
                <Toggle label="Muestreador con camisa (liner)" checked={withLiner} onChange={setWithLiner} id="liner" />
              </Card>
            </div>
            <CalcPanel
              title="Correccion N60"
              description="El N de campo se corrige al 60% de eficiencia considerando el equipo utilizado (Skempton, 1986)."
            >
              <FormulaBox>
                <p className="text-neutral-400 text-xs mb-1">Formula:</p>
                <p>N<sub>60</sub> = N<sub>campo</sub> &times; (&eta;<sub>H</sub> &times; &eta;<sub>B</sub> &times; &eta;<sub>S</sub> &times; &eta;<sub>R</sub>) / 60</p>
              </FormulaBox>
              <div className="grid grid-cols-2 gap-2">
                {[
                  [`ηH = ${etaH}%`, HAMMER_TYPES[hammerType].label],
                  [`ηB = ${etaB}`, `${boreholeDiameter} mm`],
                  [`ηS = ${etaS}`, withLiner ? 'Con camisa' : 'Sin camisa'],
                  [`ηR = ${etaR}`, `${rodLength} m varillas`],
                ].map(([v, d]) => (
                  <div key={v} className="bg-white rounded-lg border border-neutral-100 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-neutral-800">{v}</span>
                    <span className="text-neutral-400 text-xs ml-1">{d}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-white border border-neutral-200 p-4 space-y-1">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Sustitucion</p>
                <p className="text-sm font-mono text-neutral-700">Producto = {etaH} &times; {etaB} &times; {etaS} &times; {etaR} = {(etaH * etaB * etaS * etaR).toFixed(2)}</p>
                <p className="text-sm font-mono text-neutral-700">N<sub>60</sub> = {nField} &times; {(etaH * etaB * etaS * etaR).toFixed(2)} / 60</p>
                <div className="pt-2 mt-2 border-t border-neutral-100">
                  <FormulaResult>N<sub>60</sub> = {n60.toFixed(2)}</FormulaResult>
                </div>
              </div>
            </CalcPanel>
          </div>
        )}

        {/* ═══ STEP 2: Sobrecarga ═══ */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-1">Correccion por Sobrecarga</h2>
              <p className="text-sm text-neutral-400 mb-5">Se normaliza el N<sub>60</sub> a una presion de referencia de 100 kPa.</p>
              <Card>
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
                  <span className="text-neutral-400">N<sub>60</sub> del paso anterior:</span> <strong className="font-mono">{n60.toFixed(2)}</strong>
                </div>
                <Input label="Nivel freatico (profundidad)" unit="m" value={waterTableDepth} onChange={setWaterTableDepth} min={0} max={50} step={0.5} />
                <Toggle label="Peso unitario manual" checked={useManualGamma} onChange={setUseManualGamma} id="manualGamma" />
                {useManualGamma ? (
                  <Input label="Peso unitario (γ)" unit="kN/m³" value={manualGamma} onChange={setManualGamma} min={10} max={25} step={0.5} />
                ) : (
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
                    <span className="text-neutral-400">γ estimado por N<sub>60</sub>:</span> <strong className="font-mono">{gammaEstimated.toFixed(1)} kN/m³</strong>
                  </div>
                )}
              </Card>
            </div>
            <CalcPanel
              title="Esfuerzo Efectivo y Factor CN"
              description="Se calcula el esfuerzo vertical efectivo y el factor de correccion por sobrecarga (Liao & Whitman, 1986)."
            >
              <FormulaBox>
                <p className="text-neutral-400 text-xs mb-1">Formulas:</p>
                <p>&sigma;'<sub>v</sub> = &gamma; &times; z</p>
                <p>C<sub>N</sub> = &radic;(P<sub>a</sub> / &sigma;'<sub>v</sub>) &le; 2.0 &nbsp; (P<sub>a</sub> = 100 kPa)</p>
                <p>(N<sub>1</sub>)<sub>60</sub> = C<sub>N</sub> &times; N<sub>60</sub></p>
              </FormulaBox>
              <div className="rounded-xl bg-white border border-neutral-200 p-4 space-y-1.5">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Sustitucion</p>
                {waterTableDepth >= testDepth ? (
                  <p className="text-sm font-mono text-neutral-700">&sigma;'<sub>v</sub> = {gamma} &times; {testDepth} = <strong>{sigmaV.toFixed(2)} kPa</strong></p>
                ) : (
                  <>
                    <p className="text-sm font-mono text-neutral-700">&sigma;'<sub>v</sub> = {gamma}&times;{waterTableDepth} + ({gamma}&minus;9.81)&times;({testDepth}&minus;{waterTableDepth})</p>
                    <p className="text-sm font-mono text-neutral-700">&sigma;'<sub>v</sub> = <strong>{sigmaV.toFixed(2)} kPa</strong></p>
                  </>
                )}
                <p className="text-sm font-mono text-neutral-700 mt-1">C<sub>N</sub> = &radic;(100 / {sigmaV.toFixed(2)}) = {cn.toFixed(4)}{cn >= 2 ? ' → lim. 2.00' : ''}</p>
                <p className="text-sm font-mono text-neutral-700">(N<sub>1</sub>)<sub>60</sub> = {cn.toFixed(2)} &times; {n60.toFixed(2)}</p>
                <div className="pt-2 mt-2 border-t border-neutral-100">
                  <FormulaResult>(N<sub>1</sub>)<sub>60</sub> = {n160.toFixed(2)}</FormulaResult>
                </div>
              </div>
              <SubResult label="σ'v" value={`${sigmaV.toFixed(2)} kPa`} />
              <SubResult label="CN" value={cn.toFixed(4)} />
              <SubResult label="γ utilizado" value={`${gamma.toFixed(1)} kN/m³`} />
            </CalcPanel>
          </div>
        )}

        {/* ═══ STEP 3: Parametros del Suelo ═══ */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-1">Parametros del Suelo</h2>
              <p className="text-sm text-neutral-400 mb-5">Define el tipo de suelo y el angulo de friccion. Puedes usar el estimado por SPT o definirlo tu mismo.</p>
              <Card>
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
                  <span className="text-neutral-400">(N<sub>1</sub>)<sub>60</sub> del paso anterior:</span> <strong className="font-mono">{n160.toFixed(2)}</strong>
                </div>
                <Select label="Tipo de suelo" value={soilType} onChange={setSoilType}
                  options={[{ value: 'granular', label: 'Granular (arena, grava)' }, { value: 'cohesive', label: 'Cohesivo (arcilla, limo)' }]} />
                {soilType === 'cohesive' && <Input label="Cohesion (c)" unit="kPa" value={cohesion} onChange={setCohesion} min={0} max={500} />}
                {soilType === 'granular' && (
                  <>
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Angulo de friccion (φ)</p>
                      <Toggle label="Definir φ manualmente" checked={useManualPhi} onChange={setUseManualPhi} id="manualPhi" />
                      {useManualPhi ? (
                        <Input label="Angulo de friccion (φ)" unit="°" value={manualPhi} onChange={setManualPhi} min={0} max={50} step={0.5} />
                      ) : (
                        <div className="rounded-lg bg-white border border-blue-100 px-4 py-3 text-sm text-blue-800">
                          <span className="text-blue-500">φ estimado por (N<sub>1</sub>)<sub>60</sub>:</span> <strong className="font-mono">{phiEstimated.toFixed(2)}°</strong>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </div>
            <CalcPanel
              title={useManualPhi ? 'Angulo de Friccion (Manual)' : 'Estimacion de φ'}
              description={useManualPhi
                ? 'Estas usando un angulo de friccion definido manualmente.'
                : 'Se estima φ con la correlacion de Peck, Hanson & Thornburn (1974).'}
            >
              {!useManualPhi && soilType === 'granular' && (
                <FormulaBox>
                  <p className="text-neutral-400 text-xs mb-1">Formula:</p>
                  <p>&phi; = 27.1 + 0.3&middot;(N<sub>1</sub>)<sub>60</sub> &minus; 0.00054&middot;[(N<sub>1</sub>)<sub>60</sub>]&sup2;</p>
                </FormulaBox>
              )}
              <div className="rounded-xl bg-white border border-neutral-200 p-4 space-y-1.5">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  {useManualPhi ? 'Valor definido' : 'Sustitucion'}
                </p>
                {useManualPhi ? (
                  <>
                    <p className="text-sm font-mono text-neutral-700">&phi; = {manualPhi}° <span className="text-neutral-400">(manual)</span></p>
                    {soilType === 'granular' && (
                      <p className="text-xs text-neutral-400 mt-1">Referencia: el estimado por SPT seria {phiEstimated.toFixed(2)}°</p>
                    )}
                  </>
                ) : soilType === 'granular' ? (
                  <>
                    <p className="text-sm font-mono text-neutral-700">&phi; = 27.1 + 0.3&times;{n160.toFixed(2)} &minus; 0.00054&times;{n160.toFixed(2)}&sup2;</p>
                    <p className="text-sm font-mono text-neutral-700">&phi; = 27.1 + {(0.3 * n160).toFixed(2)} &minus; {(0.00054 * n160 * n160).toFixed(4)}</p>
                  </>
                ) : (
                  <p className="text-sm text-neutral-600">Suelo cohesivo: &phi; = 0°, c = {cohesion} kPa</p>
                )}
                <div className="pt-2 mt-2 border-t border-neutral-100">
                  <FormulaResult>&phi; = {phi.toFixed(2)}°</FormulaResult>
                </div>
                {failureType === 'local' && (
                  <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <strong>Falla local</strong> (N<sub>60</sub> &le; 10): &phi;' = arctan(2/3 &times; tan {phi.toFixed(2)}°) = <strong>{bearingResult.phiUsed.toFixed(2)}°</strong>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill active>{soilClass.density}</Pill>
                <Pill>Falla {failureType === 'general' ? 'General' : 'Local'}</Pill>
                <Pill>&gamma; = {gamma} kN/m³</Pill>
              </div>
              {soilType === 'granular' && !useManualPhi && (
                <div className="rounded-lg overflow-hidden border border-neutral-200 mt-1">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-neutral-100 text-neutral-500"><th className="px-3 py-1.5 text-left">N60</th><th className="px-3 py-1.5 text-left">Densidad</th><th className="px-3 py-1.5 text-left">&phi;</th></tr></thead>
                    <tbody className="divide-y divide-neutral-50">
                      {[['0-4','Muy suelto','<28°'],['4-10','Suelto','28-30°'],['10-30','Medio','30-36°'],['30-50','Denso','36-41°'],['>50','Muy denso','>41°']].map(([n,d,p])=>(
                        <tr key={n} className="text-neutral-600"><td className="px-3 py-1 font-mono">{n}</td><td className="px-3 py-1">{d}</td><td className="px-3 py-1 font-mono">{p}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CalcPanel>
          </div>
        )}

        {/* ═══ STEP 4: Cimentacion ═══ */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-1">Cimentacion</h2>
              <p className="text-sm text-neutral-400 mb-5">Define la geometria de la zapata y el factor de seguridad. Se calcula la capacidad portante por Terzaghi.</p>
              <Card>
                <Select label="Forma de zapata" value={shape} onChange={setShape}
                  options={[{ value: 'square', label: 'Cuadrada' }, { value: 'circular', label: 'Circular' }, { value: 'strip', label: 'Corrida' }]} />
                <Input label={shape === 'circular' ? 'Diametro (B)' : 'Ancho de zapata (B)'} unit="m" value={B} onChange={setB} min={0.3} max={10} step={0.1} />
                <Input label="Profundidad de desplante (Df)" unit="m" value={Df} onChange={setDf} min={0.3} max={10} step={0.1} />
                <Input label="Factor de seguridad (FS)" value={fs} onChange={setFs} min={1.5} max={5} step={0.5} />
              </Card>
              {/* Mini summary of previous steps */}
              <div className="mt-4 rounded-xl bg-neutral-900 text-white p-4">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Parametros de pasos anteriores</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-neutral-300">
                  <p>N<sub>60</sub> = {n60.toFixed(2)}</p>
                  <p>(N<sub>1</sub>)<sub>60</sub> = {n160.toFixed(2)}</p>
                  <p>&phi; = {phi.toFixed(2)}° {useManualPhi ? '(M)' : ''}</p>
                  <p>&gamma; = {gamma} kN/m³</p>
                </div>
              </div>
            </div>
            <CalcPanel
              title={`Terzaghi — Zapata ${shapeLabels[shape]}`}
              description="Ecuacion de capacidad portante de Terzaghi (1943)."
            >
              <FormulaBox>
                <p className="text-neutral-400 text-xs mb-1">Formula ({shapeLabels[shape]}):</p>
                <p>q<sub>u</sub> = {bearingResult.sc}&middot;c&middot;N<sub>c</sub> + q&middot;N<sub>q</sub> + {bearingResult.sg}&middot;&gamma;&middot;B&middot;N<sub>&gamma;</sub></p>
              </FormulaBox>
              <div className="grid grid-cols-3 gap-2">
                {[['Nc', bearingResult.factors.Nc], ['Nq', bearingResult.factors.Nq], ['Nγ', bearingResult.factors.Ng]].map(([name, val]) => (
                  <div key={name} className="rounded-xl bg-white border border-neutral-100 p-3 text-center">
                    <p className="text-[11px] text-neutral-400 uppercase">{name}</p>
                    <p className="text-lg font-bold font-mono text-neutral-900">{val.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-400">Factores para &phi; = {bearingResult.phiUsed.toFixed(2)}° (Tabla de Terzaghi)</p>
              <div className="rounded-xl bg-white border border-neutral-200 p-4 space-y-1.5">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Sustitucion</p>
                <p className="text-sm font-mono text-neutral-700">q = &gamma; &times; D<sub>f</sub> = {gamma} &times; {Df} = {bearingResult.q.toFixed(2)} kPa</p>
                <p className="text-sm font-mono text-neutral-700">&gamma;<sub>ef</sub> = {bearingResult.gammaEff.toFixed(2)} kN/m³{bearingResult.gammaEff !== gamma ? ' (NF)' : ''}</p>
                <p className="text-sm font-mono text-neutral-700 mt-1">
                  q<sub>u</sub> = {bearingResult.sc}&times;{bearingResult.cUsed.toFixed(1)}&times;{bearingResult.factors.Nc.toFixed(2)} + {bearingResult.q.toFixed(2)}&times;{bearingResult.factors.Nq.toFixed(2)} + {bearingResult.sg}&times;{bearingResult.gammaEff.toFixed(2)}&times;{B}&times;{bearingResult.factors.Ng.toFixed(2)}
                </p>
                <p className="text-sm font-mono text-neutral-700">
                  q<sub>u</sub> = {(bearingResult.sc * bearingResult.cUsed * bearingResult.factors.Nc).toFixed(2)} + {(bearingResult.q * bearingResult.factors.Nq).toFixed(2)} + {(bearingResult.sg * bearingResult.gammaEff * B * bearingResult.factors.Ng).toFixed(2)}
                </p>
                <div className="pt-2 mt-2 border-t border-neutral-100">
                  <FormulaResult>q<sub>u</sub> = {bearingResult.qu.toFixed(2)} kPa</FormulaResult>
                </div>
                <div className="pt-2 mt-1 border-t border-neutral-100">
                  <p className="text-sm font-mono text-neutral-700">q<sub>adm</sub> = {bearingResult.qu.toFixed(2)} / {fs}</p>
                  <FormulaResult>q<sub>adm</sub> = {qAdm.toFixed(2)} kPa</FormulaResult>
                </div>
              </div>
            </CalcPanel>
          </div>
        )}

        {/* ═══ STEP 5: Resultados ═══ */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Resultados Finales</h2>
            <p className="text-sm text-neutral-400 mb-6">Resumen completo de la capacidad portante admisible.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Terzaghi — Capacidad Admisible</p>
                <p className="text-4xl font-black font-mono mt-2">{qAdm.toFixed(1)} <span className="text-xl font-normal text-blue-200">kPa</span></p>
                <p className="text-blue-200 text-sm mt-1">{(qAdm / 9.81).toFixed(2)} ton/m² &nbsp;|&nbsp; FS = {fs}</p>
                <div className="mt-4 pt-3 border-t border-blue-500/30 text-xs text-blue-200 space-y-0.5">
                  <p>Zapata {shapeLabels[shape]} | B = {B}m | Df = {Df}m</p>
                  <p>&phi; = {phi.toFixed(1)}° {useManualPhi ? '(manual)' : '(SPT)'} | &gamma; = {gamma} kN/m³</p>
                </div>
              </div>
              {soilType === 'granular' ? (
                <div className="rounded-2xl bg-neutral-900 p-6 text-white">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Meyerhof — Verificacion</p>
                  <p className="text-4xl font-black font-mono mt-2">{meyerhof.qAdm.toFixed(1)} <span className="text-xl font-normal text-neutral-500">kPa</span></p>
                  <p className="text-neutral-500 text-sm mt-1">{(meyerhof.qAdm / 9.81).toFixed(2)} ton/m² | Asentamiento max 25mm</p>
                  <div className="mt-4 pt-3 border-t border-neutral-700 text-xs text-neutral-500 space-y-0.5">
                    <p>K<sub>d</sub> = {meyerhof.Kd.toFixed(2)} | N<sub>60</sub> = {n60.toFixed(2)}</p>
                    <p>Metodo directo para suelos granulares</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-neutral-900 p-6 text-white">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Equivalente</p>
                  <p className="text-4xl font-black font-mono mt-2">{(qAdm / 9.81).toFixed(2)} <span className="text-xl font-normal text-neutral-500">ton/m²</span></p>
                </div>
              )}
            </div>

            {/* Full summary table */}
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
              <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Resumen completo de parametros</p>
              </div>
              <div className="divide-y divide-neutral-50">
                {[
                  ['N campo', `${nField} golpes`],
                  ['N60', n60.toFixed(2)],
                  ['σ\'v', `${sigmaV.toFixed(2)} kPa`],
                  ['CN', cn.toFixed(4)],
                  ['(N1)60', n160.toFixed(2)],
                  ['φ utilizado', `${phi.toFixed(2)}° ${useManualPhi ? '(manual)' : '(estimado SPT)'}`],
                  ['γ utilizado', `${gamma.toFixed(1)} kN/m³ ${useManualGamma ? '(manual)' : '(estimado)'}`],
                  ['Clasificacion', soilClass.density],
                  ['Tipo de falla', failureType === 'general' ? 'General' : 'Local'],
                  ['Zapata', `${shapeLabels[shape]} — B=${B}m, Df=${Df}m`],
                  ['Nc / Nq / Nγ', `${bearingResult.factors.Nc.toFixed(2)} / ${bearingResult.factors.Nq.toFixed(2)} / ${bearingResult.factors.Ng.toFixed(2)}`],
                  ['qu (Terzaghi)', `${bearingResult.qu.toFixed(2)} kPa`],
                  ['qadm (Terzaghi)', `${qAdm.toFixed(2)} kPa = ${(qAdm / 9.81).toFixed(2)} ton/m²`],
                  ...(soilType === 'granular' ? [['qadm (Meyerhof)', `${meyerhof.qAdm.toFixed(2)} kPa = ${(meyerhof.qAdm / 9.81).toFixed(2)} ton/m²`]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center px-5 py-2.5">
                    <span className="text-sm text-neutral-500">{label}</span>
                    <span className="text-sm font-mono font-semibold text-neutral-900">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <NavButtons current={step} setCurrent={setStep} total={STEPS.length} />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-400 pb-6 pt-4 border-t border-neutral-200 mt-auto">
        <p>Ref: Braja M. Das — Principios de Ingenieria de Cimentaciones (8va Ed.)</p>
        <p className="mt-1">Herramienta educativa. Siempre valide con un profesional.</p>
      </footer>
    </div>
  );
}

export default App;
