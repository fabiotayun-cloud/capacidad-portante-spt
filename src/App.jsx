import { useState } from 'react';
import './App.css';
import {
  HAMMER_TYPES,
  calculateN60,
  calculateEffectiveStress,
  calculateCN,
  calculateN160,
  estimateFrictionAngle,
  estimateUnitWeight,
  classifySoil,
  calculateBearingCapacity,
  calculateAdmissibleCapacity,
  meyerhofDirectMethod,
  getBoreholeCorrectionFactor,
  getSamplerCorrectionFactor,
  getRodLengthCorrectionFactor,
} from './utils/sptCalculations';

function InputField({ label, unit, value, onChange, min, max, step = 1, tooltip }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="text-xs text-slate-400 cursor-help" title={tooltip}>ⓘ</span>
        )}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
        />
        {unit && <span className="text-xs text-slate-500 whitespace-nowrap min-w-[40px]">{unit}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionCard({ title, icon, children, color = 'blue' }) {
  const colorMap = {
    blue: 'border-blue-200 bg-blue-50/50',
    green: 'border-green-200 bg-green-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
  };
  const headerMap = {
    blue: 'text-blue-800 bg-blue-100',
    green: 'text-green-800 bg-green-100',
    amber: 'text-amber-800 bg-amber-100',
    purple: 'text-purple-800 bg-purple-100',
  };

  return (
    <div className={`rounded-xl border ${colorMap[color]} overflow-hidden`}>
      <div className={`px-4 py-3 ${headerMap[color]} font-semibold text-sm flex items-center gap-2`}>
        <span>{icon}</span> {title}
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function ResultRow({ label, value, unit, highlight = false }) {
  return (
    <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${highlight ? 'bg-green-100 font-bold text-green-900' : 'bg-white/70'}`}>
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`text-sm font-mono ${highlight ? 'text-lg' : ''}`}>
        {typeof value === 'number' ? value.toFixed(2) : value} {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </span>
    </div>
  );
}

function App() {
  // --- Estado: Datos del ensayo SPT ---
  const [nField, setNField] = useState(15);
  const [testDepth, setTestDepth] = useState(3);
  const [hammerType, setHammerType] = useState('safety');
  const [boreholeDiameter, setBoreholeDiameter] = useState(65);
  const [withLiner, setWithLiner] = useState(true);
  const [rodLength, setRodLength] = useState(6);

  // --- Estado: Datos del suelo ---
  const [waterTableDepth, setWaterTableDepth] = useState(10);
  const [soilType, setSoilType] = useState('granular');
  const [cohesion, setCohesion] = useState(0);
  const [useManualGamma, setUseManualGamma] = useState(false);
  const [manualGamma, setManualGamma] = useState(18);

  // --- Estado: Datos de la cimentación ---
  const [B, setB] = useState(1.5);
  const [Df, setDf] = useState(1.5);
  const [shape, setShape] = useState('square');
  const [fs, setFs] = useState(3.0);

  // --- Cálculos ---
  const hammerEfficiency = HAMMER_TYPES[hammerType].efficiency;
  const n60 = calculateN60(nField, hammerEfficiency, boreholeDiameter, withLiner, rodLength);

  const gammaEstimated = estimateUnitWeight(n60);
  const gamma = useManualGamma ? manualGamma : gammaEstimated;

  const sigmaV = calculateEffectiveStress(testDepth, gamma, waterTableDepth);
  const cn = calculateCN(sigmaV);
  const n160 = calculateN160(n60, cn);

  const phi = estimateFrictionAngle(n160);
  const soilClass = classifySoil(n60);

  // Determinar tipo de falla
  const failureType = n60 <= 10 ? 'local' : 'general';

  const bearingResult = calculateBearingCapacity({
    cohesion: soilType === 'cohesive' ? cohesion : 0,
    phi: soilType === 'granular' ? phi : 0,
    gamma,
    B,
    Df,
    shape,
    waterTableDepth,
    failureType,
  });

  const qAdm = calculateAdmissibleCapacity(bearingResult.qu, fs);

  // Método directo de Meyerhof
  const meyerhof = meyerhofDirectMethod(n60, B, Df);

  // Factores individuales de corrección (para muestra de cálculo)
  const etaH = hammerEfficiency;
  const etaB = getBoreholeCorrectionFactor(boreholeDiameter);
  const etaS = getSamplerCorrectionFactor(withLiner);
  const etaR = getRodLengthCorrectionFactor(rodLength);

  const shapeLabels = { strip: 'Corrida', square: 'Cuadrada', circular: 'Circular' };
  const [showEquations, setShowEquations] = useState(false);
  const [showExample, setShowExample] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">Capacidad Portante - SPT</h1>
          <p className="text-blue-200 text-sm mt-1">
            Basado en Braja M. Das - Principios de Ingeniería de Cimentaciones
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* --- COLUMNA IZQUIERDA: ENTRADAS --- */}
          <div className="space-y-6">
            {/* Datos del ensayo SPT */}
            <SectionCard title="Datos del Ensayo SPT" icon="🔨" color="blue">
              <InputField
                label="N de campo (golpes/30cm)"
                value={nField}
                onChange={setNField}
                min={0}
                max={100}
                tooltip="Número de golpes obtenidos en el ensayo SPT"
              />
              <InputField
                label="Profundidad del ensayo"
                unit="m"
                value={testDepth}
                onChange={setTestDepth}
                min={0.5}
                max={50}
                step={0.5}
              />
              <SelectField
                label="Tipo de martillo"
                value={hammerType}
                onChange={setHammerType}
                options={Object.entries(HAMMER_TYPES).map(([k, v]) => ({
                  value: k,
                  label: `${v.label} (η=${v.efficiency}%)`,
                }))}
              />
              <SelectField
                label="Diámetro de perforación"
                value={boreholeDiameter}
                onChange={(v) => setBoreholeDiameter(Number(v))}
                options={[
                  { value: 65, label: '65-115 mm (η=1.0)' },
                  { value: 150, label: '150 mm (η=1.05)' },
                  { value: 200, label: '200 mm (η=1.15)' },
                ]}
              />
              <InputField
                label="Longitud de varillas"
                unit="m"
                value={rodLength}
                onChange={setRodLength}
                min={1}
                max={30}
                step={0.5}
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="liner"
                  checked={withLiner}
                  onChange={(e) => setWithLiner(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="liner" className="text-sm text-slate-700">
                  Muestreador con camisa (liner)
                </label>
              </div>
            </SectionCard>

            {/* Datos del suelo */}
            <SectionCard title="Datos del Suelo" icon="🏔️" color="amber">
              <SelectField
                label="Tipo de suelo predominante"
                value={soilType}
                onChange={setSoilType}
                options={[
                  { value: 'granular', label: 'Granular (arena, grava)' },
                  { value: 'cohesive', label: 'Cohesivo (arcilla, limo)' },
                ]}
              />
              {soilType === 'cohesive' && (
                <InputField
                  label="Cohesión (c)"
                  unit="kPa"
                  value={cohesion}
                  onChange={setCohesion}
                  min={0}
                  max={500}
                  step={1}
                />
              )}
              <InputField
                label="Profundidad del nivel freático"
                unit="m"
                value={waterTableDepth}
                onChange={setWaterTableDepth}
                min={0}
                max={50}
                step={0.5}
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="manualGamma"
                  checked={useManualGamma}
                  onChange={(e) => setUseManualGamma(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                <label htmlFor="manualGamma" className="text-sm text-slate-700">
                  Ingresar peso unitario manualmente
                </label>
              </div>
              {useManualGamma && (
                <InputField
                  label="Peso unitario (γ)"
                  unit="kN/m³"
                  value={manualGamma}
                  onChange={setManualGamma}
                  min={10}
                  max={25}
                  step={0.5}
                />
              )}
            </SectionCard>

            {/* Datos de la cimentación */}
            <SectionCard title="Datos de la Cimentación" icon="🏗️" color="purple">
              <SelectField
                label="Forma de la zapata"
                value={shape}
                onChange={setShape}
                options={[
                  { value: 'square', label: 'Cuadrada' },
                  { value: 'circular', label: 'Circular' },
                  { value: 'strip', label: 'Corrida' },
                ]}
              />
              <InputField
                label={shape === 'circular' ? 'Diámetro (B)' : 'Ancho de zapata (B)'}
                unit="m"
                value={B}
                onChange={setB}
                min={0.3}
                max={10}
                step={0.1}
              />
              <InputField
                label="Profundidad de desplante (Df)"
                unit="m"
                value={Df}
                onChange={setDf}
                min={0.3}
                max={10}
                step={0.1}
              />
              <InputField
                label="Factor de seguridad (FS)"
                value={fs}
                onChange={setFs}
                min={1.5}
                max={5}
                step={0.5}
              />
            </SectionCard>
          </div>

          {/* --- COLUMNA DERECHA: RESULTADOS --- */}
          <div className="space-y-6">
            {/* Correcciones del SPT */}
            <SectionCard title="Correcciones del N (SPT)" icon="📐" color="blue">
              <ResultRow label="N de campo" value={nField} unit="golpes" />
              <ResultRow label="N₆₀ (corregido al 60%)" value={n60} />
              <ResultRow label="σ'ᵥ (esfuerzo efectivo)" value={sigmaV} unit="kPa" />
              <ResultRow label="Cₙ (factor sobrecarga)" value={cn} />
              <ResultRow label="(N₁)₆₀" value={n160} highlight />
            </SectionCard>

            {/* Parámetros estimados */}
            <SectionCard title="Parámetros del Suelo Estimados" icon="📊" color="amber">
              <ResultRow label="Clasificación" value={soilClass.density} />
              <ResultRow label="φ estimado" value={phi} unit="°" />
              <ResultRow label="γ utilizado" value={gamma} unit="kN/m³" />
              <ResultRow label="Tipo de falla" value={failureType === 'general' ? 'General' : 'Local'} />
              {failureType === 'local' && (
                <ResultRow label="φ' (falla local)" value={bearingResult.phiUsed} unit="°" />
              )}
            </SectionCard>

            {/* Resultados - Terzaghi */}
            <SectionCard title="Capacidad Portante - Terzaghi" icon="📏" color="green">
              <div className="bg-white/80 rounded-lg p-3 space-y-1">
                <p className="text-xs text-slate-500 font-medium mb-2">Factores de capacidad portante:</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-50 rounded p-2">
                    <div className="text-xs text-slate-500">Nc</div>
                    <div className="font-mono font-bold text-green-800">{bearingResult.factors.Nc.toFixed(2)}</div>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <div className="text-xs text-slate-500">Nq</div>
                    <div className="font-mono font-bold text-green-800">{bearingResult.factors.Nq.toFixed(2)}</div>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <div className="text-xs text-slate-500">Nγ</div>
                    <div className="font-mono font-bold text-green-800">{bearingResult.factors.Ng.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              <ResultRow label="q (sobrecarga)" value={bearingResult.q} unit="kPa" />
              <ResultRow label="γ efectivo" value={bearingResult.gammaEff} unit="kN/m³" />
              <ResultRow label="qu (cap. portante última)" value={bearingResult.qu} unit="kPa" />
              <ResultRow label={`q_adm (FS=${fs})`} value={qAdm} unit="kPa" highlight />
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                <strong>Ecuación:</strong> q<sub>u</sub> = {bearingResult.sc}·c·N<sub>c</sub> + q·N<sub>q</sub> + {bearingResult.sg}·γ·B·N<sub>γ</sub>
              </div>
            </SectionCard>

            {/* Verificación Meyerhof */}
            {soilType === 'granular' && (
              <SectionCard title="Verificación - Meyerhof Directo (SPT)" icon="✅" color="purple">
                <ResultRow label="Kd (factor de profundidad)" value={meyerhof.Kd} />
                <ResultRow label="q_adm (Meyerhof)" value={meyerhof.qAdm} unit="kPa" highlight />
                <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-800">
                  Método directo para suelos granulares. Considera asentamiento máximo de 25 mm.
                </div>
              </SectionCard>
            )}

            {/* Resumen final */}
            <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-4">Resumen de Resultados</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white/20 rounded-lg px-4 py-3">
                  <span>Capacidad portante admisible (Terzaghi)</span>
                  <span className="text-xl font-bold font-mono">{qAdm.toFixed(1)} kPa</span>
                </div>
                {soilType === 'granular' && (
                  <div className="flex justify-between items-center bg-white/20 rounded-lg px-4 py-3">
                    <span>Capacidad portante admisible (Meyerhof)</span>
                    <span className="text-xl font-bold font-mono">{meyerhof.qAdm.toFixed(1)} kPa</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-4 py-2 text-sm">
                  <span>Equivalente en ton/m²</span>
                  <span className="font-mono">{(qAdm / 9.81).toFixed(2)} ton/m²</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN: MARCO TEÓRICO - ECUACIONES --- */}
        <div className="mt-10">
          <button
            onClick={() => setShowEquations(!showEquations)}
            className="w-full bg-white border border-slate-300 rounded-xl px-6 py-4 text-left flex justify-between items-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
              📘 Marco Teórico - Ecuaciones Utilizadas
            </span>
            <span className="text-2xl text-slate-400">{showEquations ? '−' : '+'}</span>
          </button>

          {showEquations && (
            <div className="mt-4 space-y-6">
              {/* Paso 1: Corrección del N */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
                  Corrección del N del SPT → N₆₀
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  El valor N de campo debe corregirse a una eficiencia estándar del 60% considerando las condiciones del equipo utilizado (Skempton, 1986):
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center font-mono text-lg text-blue-900 mb-3">
                  N₆₀ = N<sub>campo</sub> × (η<sub>H</sub> × η<sub>B</sub> × η<sub>S</sub> × η<sub>R</sub>) / 60
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <strong>η<sub>H</sub></strong> = Eficiencia del martillo (%)
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      <li>Seguridad: 60%</li>
                      <li>Dona: 45%</li>
                      <li>Automático: 80%</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <strong>η<sub>B</sub></strong> = Corrección por diámetro
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      <li>65-115 mm: 1.00</li>
                      <li>150 mm: 1.05</li>
                      <li>200 mm: 1.15</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <strong>η<sub>S</sub></strong> = Corrección del muestreador
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      <li>Con camisa (liner): 1.0</li>
                      <li>Sin camisa: 1.2</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <strong>η<sub>R</sub></strong> = Corrección por longitud de varillas
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      <li>{'>'} 10 m: 1.00</li>
                      <li>6-10 m: 0.95</li>
                      <li>4-6 m: 0.85</li>
                      <li>{'<'} 4 m: 0.75</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Paso 2: Corrección por sobrecarga */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">2</span>
                  Corrección por Sobrecarga → (N₁)₆₀
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Se normaliza el N₆₀ a una presión de referencia de 100 kPa usando el factor C<sub>N</sub> de Liao & Whitman (1986):
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center space-y-2">
                  <div className="font-mono text-lg text-blue-900">
                    (N₁)₆₀ = C<sub>N</sub> × N₆₀
                  </div>
                  <div className="font-mono text-blue-900">
                    C<sub>N</sub> = √(P<sub>a</sub> / σ'<sub>v</sub>) ≤ 2.0
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  <p>Donde P<sub>a</sub> = 100 kPa (presión atmosférica) y σ'<sub>v</sub> es el esfuerzo vertical efectivo a la profundidad del ensayo:</p>
                  <div className="bg-slate-50 rounded-lg p-3 mt-2 font-mono text-sm">
                    σ'<sub>v</sub> = γ × z (si NF está debajo del ensayo)<br />
                    σ'<sub>v</sub> = γ × z<sub>w</sub> + (γ - γ<sub>w</sub>) × (z - z<sub>w</sub>) (si NF está encima)
                  </div>
                </div>
              </div>

              {/* Paso 3: Correlación SPT → φ */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">3</span>
                  Correlación SPT → Ángulo de Fricción (φ)
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Para suelos granulares, se estima φ usando la correlación de Peck, Hanson & Thornburn (1974):
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center font-mono text-lg text-amber-900">
                  φ = 27.1 + 0.3·(N₁)₆₀ − 0.00054·[(N₁)₆₀]²
                </div>
                <div className="mt-3 bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Clasificación por densidad relativa:</p>
                  <table className="w-full text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="py-1 text-left">N₆₀</th>
                        <th className="py-1 text-left">Densidad</th>
                        <th className="py-1 text-left">φ aprox.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200"><td>0-4</td><td>Muy suelto</td><td>{'<'} 28°</td></tr>
                      <tr className="border-b border-slate-200"><td>4-10</td><td>Suelto</td><td>28-30°</td></tr>
                      <tr className="border-b border-slate-200"><td>10-30</td><td>Medio</td><td>30-36°</td></tr>
                      <tr className="border-b border-slate-200"><td>30-50</td><td>Denso</td><td>36-41°</td></tr>
                      <tr><td>{'>'} 50</td><td>Muy denso</td><td>{'>'} 41°</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paso 4: Terzaghi */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-green-800 mb-3 flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">4</span>
                  Capacidad Portante de Terzaghi (1943)
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  La ecuación de Terzaghi para la capacidad portante última depende de la forma de la cimentación:
                </p>
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center font-mono text-green-900">
                    <span className="text-xs text-green-700 block mb-1">Zapata corrida:</span>
                    q<sub>u</sub> = c·N<sub>c</sub> + q·N<sub>q</sub> + 0.5·γ·B·N<sub>γ</sub>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center font-mono text-green-900">
                    <span className="text-xs text-green-700 block mb-1">Zapata cuadrada:</span>
                    q<sub>u</sub> = 1.3·c·N<sub>c</sub> + q·N<sub>q</sub> + 0.4·γ·B·N<sub>γ</sub>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center font-mono text-green-900">
                    <span className="text-xs text-green-700 block mb-1">Zapata circular:</span>
                    q<sub>u</sub> = 1.3·c·N<sub>c</sub> + q·N<sub>q</sub> + 0.3·γ·B·N<sub>γ</sub>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-600 space-y-1">
                  <p><strong>q</strong> = γ × D<sub>f</sub> (sobrecarga al nivel de desplante)</p>
                  <p><strong>N<sub>c</sub>, N<sub>q</sub>, N<sub>γ</sub></strong> = Factores de capacidad portante (función de φ, tabla de Terzaghi)</p>
                  <p><strong>c</strong> = Cohesión del suelo (0 para suelos granulares)</p>
                </div>
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                  <strong>Falla local</strong> (suelos sueltos, N₆₀ ≤ 10): se usa c' = ⅔·c y φ' = arctan(⅔·tan φ)
                </div>
              </div>

              {/* Paso 5: q admisible */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-green-800 mb-3 flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">5</span>
                  Capacidad Portante Admisible
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center font-mono text-lg text-green-900">
                  q<sub>adm</sub> = q<sub>u</sub> / FS
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  Donde FS es el factor de seguridad. En Colombia se usa típicamente FS = 3.0, según la práctica establecida y la NSR-10 (Título H).
                </p>
              </div>

              {/* Paso 6: Meyerhof */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">6</span>
                  Método Directo de Meyerhof (1956) - Verificación
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Fórmula empírica directa para suelos granulares, limitada a un asentamiento máximo de 25 mm:
                </p>
                <div className="space-y-2">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center font-mono text-purple-900">
                    <span className="text-xs text-purple-700 block mb-1">Para B ≤ 1.22 m:</span>
                    q<sub>adm</sub> = N₆₀ · K<sub>d</sub> / 0.05 (kPa)
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center font-mono text-purple-900">
                    <span className="text-xs text-purple-700 block mb-1">Para B {'>'} 1.22 m:</span>
                    q<sub>adm</sub> = N₆₀ · K<sub>d</sub> · [(B+0.305)/B]² / 0.08 (kPa)
                  </div>
                </div>
                <div className="mt-3 bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                  <p><strong>K<sub>d</sub></strong> = 1 + 0.33·(D<sub>f</sub>/B) ≤ 1.33</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- SECCIÓN: MUESTRA DE CÁLCULO --- */}
        <div className="mt-6">
          <button
            onClick={() => setShowExample(!showExample)}
            className="w-full bg-white border border-slate-300 rounded-xl px-6 py-4 text-left flex justify-between items-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
              📝 Muestra de Cálculo (Paso a Paso)
            </span>
            <span className="text-2xl text-slate-400">{showExample ? '−' : '+'}</span>
          </button>

          {showExample && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-bold text-slate-800 mb-2">Datos de Entrada</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-slate-600">
                  <p>N<sub>campo</sub> = {nField} golpes</p>
                  <p>Profundidad = {testDepth} m</p>
                  <p>η<sub>H</sub> = {etaH}%</p>
                  <p>η<sub>B</sub> = {etaB}</p>
                  <p>η<sub>S</sub> = {etaS}</p>
                  <p>η<sub>R</sub> = {etaR}</p>
                  <p>NF = {waterTableDepth} m</p>
                  <p>γ = {gamma} kN/m³</p>
                  <p>Zapata: {shapeLabels[shape]}</p>
                  <p>B = {B} m</p>
                  <p>D<sub>f</sub> = {Df} m</p>
                  <p>FS = {fs}</p>
                </div>
              </div>

              {/* Paso 1 */}
              <div className="border-l-4 border-blue-400 pl-4">
                <h4 className="font-bold text-blue-800 mb-1">Paso 1: Corrección N₆₀</h4>
                <div className="text-sm text-slate-700 space-y-1 font-mono bg-blue-50 rounded-lg p-3">
                  <p>N₆₀ = N × (η<sub>H</sub> × η<sub>B</sub> × η<sub>S</sub> × η<sub>R</sub>) / 60</p>
                  <p>N₆₀ = {nField} × ({etaH} × {etaB} × {etaS} × {etaR}) / 60</p>
                  <p>N₆₀ = {nField} × {(etaH * etaB * etaS * etaR).toFixed(2)} / 60</p>
                  <p className="font-bold text-blue-900">N₆₀ = {n60.toFixed(2)}</p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="border-l-4 border-blue-400 pl-4">
                <h4 className="font-bold text-blue-800 mb-1">Paso 2: Esfuerzo Efectivo y Corrección por Sobrecarga</h4>
                <div className="text-sm text-slate-700 space-y-1 font-mono bg-blue-50 rounded-lg p-3">
                  {waterTableDepth >= testDepth ? (
                    <>
                      <p>σ'<sub>v</sub> = γ × z = {gamma} × {testDepth}</p>
                      <p className="font-bold">σ'<sub>v</sub> = {sigmaV.toFixed(2)} kPa</p>
                    </>
                  ) : (
                    <>
                      <p>σ'<sub>v</sub> = γ×z<sub>w</sub> + (γ−γ<sub>w</sub>)×(z−z<sub>w</sub>)</p>
                      <p>σ'<sub>v</sub> = {gamma}×{waterTableDepth} + ({gamma}−9.81)×({testDepth}−{waterTableDepth})</p>
                      <p className="font-bold">σ'<sub>v</sub> = {sigmaV.toFixed(2)} kPa</p>
                    </>
                  )}
                  <p className="mt-2">C<sub>N</sub> = √(100 / {sigmaV.toFixed(2)}) = {cn.toFixed(4)}{cn >= 2 ? ' → se limita a 2.00' : ''}</p>
                  <p className="mt-2">(N₁)₆₀ = C<sub>N</sub> × N₆₀ = {cn.toFixed(2)} × {n60.toFixed(2)}</p>
                  <p className="font-bold text-blue-900">(N₁)₆₀ = {n160.toFixed(2)}</p>
                </div>
              </div>

              {/* Paso 3 */}
              {soilType === 'granular' && (
                <div className="border-l-4 border-amber-400 pl-4">
                  <h4 className="font-bold text-amber-800 mb-1">Paso 3: Estimación de φ</h4>
                  <div className="text-sm text-slate-700 space-y-1 font-mono bg-amber-50 rounded-lg p-3">
                    <p>φ = 27.1 + 0.3×(N₁)₆₀ − 0.00054×[(N₁)₆₀]²</p>
                    <p>φ = 27.1 + 0.3×{n160.toFixed(2)} − 0.00054×{n160.toFixed(2)}²</p>
                    <p>φ = 27.1 + {(0.3 * n160).toFixed(2)} − {(0.00054 * n160 * n160).toFixed(4)}</p>
                    <p className="font-bold text-amber-900">φ = {phi.toFixed(2)}°</p>
                    {failureType === 'local' && (
                      <>
                        <p className="mt-2 text-yellow-800">Falla local (N₆₀ ≤ 10):</p>
                        <p>φ' = arctan(⅔ × tan {phi.toFixed(2)}°)</p>
                        <p className="font-bold text-yellow-900">φ' = {bearingResult.phiUsed.toFixed(2)}°</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 4 */}
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-bold text-green-800 mb-1">Paso 4: Factores de Terzaghi (φ = {bearingResult.phiUsed.toFixed(2)}°)</h4>
                <div className="text-sm text-slate-700 font-mono bg-green-50 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500">N<sub>c</sub></p>
                      <p className="font-bold text-green-900 text-lg">{bearingResult.factors.Nc.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">N<sub>q</sub></p>
                      <p className="font-bold text-green-900 text-lg">{bearingResult.factors.Nq.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">N<sub>γ</sub></p>
                      <p className="font-bold text-green-900 text-lg">{bearingResult.factors.Ng.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">(Interpolados de la tabla de Terzaghi, Braja Das - Tabla 3.4)</p>
                </div>
              </div>

              {/* Paso 5 */}
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-bold text-green-800 mb-1">Paso 5: Capacidad Portante Última</h4>
                <div className="text-sm text-slate-700 space-y-1 font-mono bg-green-50 rounded-lg p-3">
                  <p>q = γ × D<sub>f</sub> = {gamma} × {Df} = {bearingResult.q.toFixed(2)} kPa</p>
                  <p>γ<sub>ef</sub> = {bearingResult.gammaEff.toFixed(2)} kN/m³
                    {bearingResult.gammaEff !== gamma && ' (corregido por NF)'}
                  </p>
                  <p className="mt-2">Zapata {shapeLabels[shape]}:</p>
                  <p>q<sub>u</sub> = {bearingResult.sc}·c·N<sub>c</sub> + q·N<sub>q</sub> + {bearingResult.sg}·γ<sub>ef</sub>·B·N<sub>γ</sub></p>
                  <p>q<sub>u</sub> = {bearingResult.sc}×{bearingResult.cUsed.toFixed(1)}×{bearingResult.factors.Nc.toFixed(2)} + {bearingResult.q.toFixed(2)}×{bearingResult.factors.Nq.toFixed(2)} + {bearingResult.sg}×{bearingResult.gammaEff.toFixed(2)}×{B}×{bearingResult.factors.Ng.toFixed(2)}</p>
                  <p>q<sub>u</sub> = {(bearingResult.sc * bearingResult.cUsed * bearingResult.factors.Nc).toFixed(2)} + {(bearingResult.q * bearingResult.factors.Nq).toFixed(2)} + {(bearingResult.sg * bearingResult.gammaEff * B * bearingResult.factors.Ng).toFixed(2)}</p>
                  <p className="font-bold text-green-900 text-base">q<sub>u</sub> = {bearingResult.qu.toFixed(2)} kPa</p>
                </div>
              </div>

              {/* Paso 6 */}
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-bold text-green-800 mb-1">Paso 6: Capacidad Portante Admisible</h4>
                <div className="text-sm text-slate-700 space-y-1 font-mono bg-green-50 rounded-lg p-3">
                  <p>q<sub>adm</sub> = q<sub>u</sub> / FS = {bearingResult.qu.toFixed(2)} / {fs}</p>
                  <p className="font-bold text-green-900 text-lg">q<sub>adm</sub> = {qAdm.toFixed(2)} kPa = {(qAdm / 9.81).toFixed(2)} ton/m²</p>
                </div>
              </div>

              {/* Paso 7: Meyerhof */}
              {soilType === 'granular' && (
                <div className="border-l-4 border-purple-400 pl-4">
                  <h4 className="font-bold text-purple-800 mb-1">Verificación: Meyerhof Directo</h4>
                  <div className="text-sm text-slate-700 space-y-1 font-mono bg-purple-50 rounded-lg p-3">
                    <p>K<sub>d</sub> = 1 + 0.33×(D<sub>f</sub>/B) = 1 + 0.33×({Df}/{B}) = {(1 + 0.33 * (Df / B)).toFixed(2)}{(1 + 0.33 * (Df / B)) > 1.33 ? ' → se limita a 1.33' : ''}</p>
                    <p>K<sub>d</sub> = {meyerhof.Kd.toFixed(2)}</p>
                    {B <= 1.22 ? (
                      <>
                        <p className="mt-2">B ≤ 1.22 m:</p>
                        <p>q<sub>adm</sub> = N₆₀ × K<sub>d</sub> / 0.05</p>
                        <p>q<sub>adm</sub> = {n60.toFixed(2)} × {meyerhof.Kd.toFixed(2)} / 0.05</p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2">B {'>'} 1.22 m:</p>
                        <p>q<sub>adm</sub> = N₆₀ × K<sub>d</sub> × [(B+0.305)/B]² / 0.08</p>
                        <p>q<sub>adm</sub> = {n60.toFixed(2)} × {meyerhof.Kd.toFixed(2)} × [({B}+0.305)/{B}]² / 0.08</p>
                        <p>q<sub>adm</sub> = {n60.toFixed(2)} × {meyerhof.Kd.toFixed(2)} × {(((B + 0.305) / B) ** 2).toFixed(4)} / 0.08</p>
                      </>
                    )}
                    <p className="font-bold text-purple-900 text-lg">q<sub>adm</sub> (Meyerhof) = {meyerhof.qAdm.toFixed(2)} kPa</p>
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg p-5 text-white">
                <h4 className="font-bold mb-3">Resumen de la Muestra de Cálculo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-slate-300 text-xs">Método de Terzaghi</p>
                    <p className="text-xl font-bold font-mono">{qAdm.toFixed(1)} kPa</p>
                    <p className="text-slate-300 text-xs">({(qAdm / 9.81).toFixed(2)} ton/m²)</p>
                  </div>
                  {soilType === 'granular' && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-slate-300 text-xs">Método de Meyerhof (verificación)</p>
                      <p className="text-xl font-bold font-mono">{meyerhof.qAdm.toFixed(1)} kPa</p>
                      <p className="text-slate-300 text-xs">({(meyerhof.qAdm / 9.81).toFixed(2)} ton/m²)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-400 pb-6">
          <p>Referencia: Braja M. Das - Principios de Ingeniería de Cimentaciones (8va Edición)</p>
          <p className="mt-1">Correlación φ: Peck, Hanson & Thornburn (1974) | Corrección C<sub>N</sub>: Liao & Whitman (1986)</p>
          <p className="mt-1">Esta herramienta es solo para fines educativos. Siempre valide con un profesional.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
