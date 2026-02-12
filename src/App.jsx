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

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-400 pb-6">
          <p>Referencia: Braja M. Das - Principios de Ingeniería de Cimentaciones</p>
          <p className="mt-1">Esta herramienta es solo para fines educativos. Siempre valide con un profesional.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
