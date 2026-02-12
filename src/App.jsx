import { useState } from 'react';
import {
  HAMMER_TYPES, calculateN60, calculateEffectiveStress, calculateCN, calculateN160,
  estimateFrictionAngle, estimateUnitWeight, classifySoil, calculateBearingCapacity,
  calculateAdmissibleCapacity, meyerhofDirectMethod, getBoreholeCorrectionFactor,
  getSamplerCorrectionFactor, getRodLengthCorrectionFactor,
} from './utils/sptCalculations';
import {
  Input, Select, Card, Stat, Pill, Toggle, FormulaBox, FormulaResult,
} from './components/UI';

/* ── Step Layout: left = inputs, right = calculation ── */
function StepRow({ number, title, subtitle, children, calculation }) {
  return (
    <div className="relative">
      {/* Step number badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{number}</div>
        <div>
          <h2 className="text-lg font-bold text-neutral-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-400">{subtitle}</p>}
        </div>
      </div>
      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ml-0 lg:ml-12">
        <Card>{children}</Card>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 space-y-3">
          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-2">Calculo en vivo</p>
          {calculation}
        </div>
      </div>
    </div>
  );
}

function App() {
  // SPT test data
  const [nField, setNField] = useState(15);
  const [testDepth, setTestDepth] = useState(3);
  const [hammerType, setHammerType] = useState('safety');
  const [boreholeDiameter, setBoreholeDiameter] = useState(65);
  const [withLiner, setWithLiner] = useState(true);
  const [rodLength, setRodLength] = useState(6);
  // Soil data
  const [waterTableDepth, setWaterTableDepth] = useState(10);
  const [soilType, setSoilType] = useState('granular');
  const [cohesion, setCohesion] = useState(0);
  const [useManualGamma, setUseManualGamma] = useState(false);
  const [manualGamma, setManualGamma] = useState(18);
  const [useManualPhi, setUseManualPhi] = useState(false);
  const [manualPhi, setManualPhi] = useState(30);
  // Foundation data
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
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">

      {/* Hero */}
      <header className="relative bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.1),_transparent_60%)]"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">Herramienta Geotecnica</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Capacidad Portante <span className="text-blue-400">SPT</span>
          </h1>
          <p className="mt-3 text-neutral-400 text-sm md:text-base max-w-xl leading-relaxed">
            Basado en <span className="text-white font-medium">Braja M. Das</span> — Principios de Ingenieria de Cimentaciones.
            Sigue cada paso: ingresa tus datos a la izquierda y observa el calculo en la derecha.
          </p>
          <div className="flex gap-2 mt-5">
            <Pill active>Paso a paso</Pill>
            <Pill>Terzaghi</Pill>
            <Pill>Meyerhof</Pill>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">

        {/* ═══════ PASO 1: Ensayo SPT → N60 ═══════ */}
        <StepRow
          number="1"
          title="Datos del Ensayo SPT"
          subtitle="Ingresa los datos del ensayo de campo para corregir el N al 60% de eficiencia"
          calculation={
            <>
              <p className="text-sm text-neutral-600 mb-2">
                El N de campo se corrige al 60% de eficiencia considerando el equipo usado (Skempton, 1986):
              </p>
              <FormulaBox>
                <p className="text-neutral-500 text-xs mb-2">Formula general:</p>
                <p>N<sub>60</sub> = N<sub>campo</sub> &times; (&eta;<sub>H</sub> &times; &eta;<sub>B</sub> &times; &eta;<sub>S</sub> &times; &eta;<sub>R</sub>) / 60</p>
              </FormulaBox>
              <div className="mt-3 rounded-xl bg-white border border-neutral-200 p-4 space-y-1.5">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Sustitucion con tus datos</p>
                <p className="text-sm font-mono text-neutral-700">&eta;<sub>H</sub> = {etaH}% &nbsp; &eta;<sub>B</sub> = {etaB} &nbsp; &eta;<sub>S</sub> = {etaS} &nbsp; &eta;<sub>R</sub> = {etaR}</p>
                <p className="text-sm font-mono text-neutral-700">Producto = {etaH} &times; {etaB} &times; {etaS} &times; {etaR} = {(etaH * etaB * etaS * etaR).toFixed(2)}</p>
                <p className="text-sm font-mono text-neutral-700">N<sub>60</sub> = {nField} &times; {(etaH * etaB * etaS * etaR).toFixed(2)} / 60</p>
                <div className="mt-2 pt-2 border-t border-neutral-100">
                  <FormulaResult>N<sub>60</sub> = {n60.toFixed(2)}</FormulaResult>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {[
                  [`ηH = ${etaH}%`, `Martillo: ${HAMMER_TYPES[hammerType].label}`],
                  [`ηB = ${etaB}`, `Diametro: ${boreholeDiameter} mm`],
                  [`ηS = ${etaS}`, withLiner ? 'Con camisa' : 'Sin camisa'],
                  [`ηR = ${etaR}`, `Varillas: ${rodLength} m`],
                ].map(([val, desc]) => (
                  <div key={val} className="bg-white rounded-lg border border-neutral-100 px-3 py-2">
                    <span className="font-mono font-bold text-neutral-800">{val}</span>
                    <span className="text-neutral-400 ml-1.5">{desc}</span>
                  </div>
                ))}
              </div>
            </>
          }
        >
          <Input label="N de campo (golpes/30cm)" value={nField} onChange={setNField} min={0} max={100} tooltip="Numero de golpes del ensayo SPT" />
          <Input label="Profundidad del ensayo" unit="m" value={testDepth} onChange={setTestDepth} min={0.5} max={50} step={0.5} />
          <Select label="Tipo de martillo" value={hammerType} onChange={setHammerType}
            options={Object.entries(HAMMER_TYPES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.efficiency}%)` }))} />
          <Select label="Diametro de perforacion" value={boreholeDiameter} onChange={(v) => setBoreholeDiameter(Number(v))}
            options={[{ value: 65, label: '65-115 mm' }, { value: 150, label: '150 mm' }, { value: 200, label: '200 mm' }]} />
          <Input label="Longitud de varillas" unit="m" value={rodLength} onChange={setRodLength} min={1} max={30} step={0.5} />
          <Toggle label="Muestreador con camisa (liner)" checked={withLiner} onChange={setWithLiner} id="liner" />
        </StepRow>

        {/* Divider */}
        <div className="flex items-center gap-4 ml-12"><div className="h-8 w-px bg-blue-200"></div><svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg><div className="h-8 w-px bg-blue-200"></div></div>

        {/* ═══════ PASO 2: Sobrecarga → (N1)60 ═══════ */}
        <StepRow
          number="2"
          title="Correccion por Sobrecarga"
          subtitle="Se normaliza el N60 a una presion de referencia de 100 kPa"
          calculation={
            <>
              <p className="text-sm text-neutral-600 mb-2">
                El N<sub>60</sub> se normaliza a una presion efectiva de 100 kPa usando el factor C<sub>N</sub> de Liao & Whitman (1986):
              </p>
              <FormulaBox>
                <p className="text-neutral-500 text-xs mb-2">Formulas:</p>
                <p>&sigma;'<sub>v</sub> = &gamma; &times; z {waterTableDepth < testDepth ? '(con correccion por NF)' : ''}</p>
                <p>C<sub>N</sub> = &radic;(100 / &sigma;'<sub>v</sub>) &le; 2.0</p>
                <p>(N<sub>1</sub>)<sub>60</sub> = C<sub>N</sub> &times; N<sub>60</sub></p>
              </FormulaBox>
              <div className="mt-3 rounded-xl bg-white border border-neutral-200 p-4 space-y-1.5">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Sustitucion</p>
                {waterTableDepth >= testDepth ? (
                  <p className="text-sm font-mono text-neutral-700">&sigma;'<sub>v</sub> = {gamma} &times; {testDepth} = <strong>{sigmaV.toFixed(2)} kPa</strong></p>
                ) : (
                  <>
                    <p className="text-sm font-mono text-neutral-700">&sigma;'<sub>v</sub> = {gamma}&times;{waterTableDepth} + ({gamma}&minus;9.81)&times;({testDepth}&minus;{waterTableDepth})</p>
                    <p className="text-sm font-mono text-neutral-700">&sigma;'<sub>v</sub> = <strong>{sigmaV.toFixed(2)} kPa</strong></p>
                  </>
                )}
                <p className="text-sm font-mono text-neutral-700 mt-1">C<sub>N</sub> = &radic;(100 / {sigmaV.toFixed(2)}) = {(Math.sqrt(100 / sigmaV)).toFixed(4)}{cn >= 2 ? ' → limitado a 2.00' : ''}</p>
                <p className="text-sm font-mono text-neutral-700">C<sub>N</sub> = <strong>{cn.toFixed(4)}</strong></p>
                <p className="text-sm font-mono text-neutral-700 mt-1">(N<sub>1</sub>)<sub>60</sub> = {cn.toFixed(2)} &times; {n60.toFixed(2)}</p>
                <div className="mt-2 pt-2 border-t border-neutral-100">
                  <FormulaResult>(N<sub>1</sub>)<sub>60</sub> = {n160.toFixed(2)}</FormulaResult>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-white border border-neutral-100 px-3 py-2 text-xs text-neutral-500">
                <strong className="text-neutral-700">Nota:</strong> Si &sigma;'<sub>v</sub> es muy bajo, C<sub>N</sub> se limita a 2.0 para evitar sobreestimacion.
              </div>
            </>
          }
        >
          <Input label="Nivel freatico (profundidad)" unit="m" value={waterTableDepth} onChange={setWaterTableDepth} min={0} max={50} step={0.5} />
          <Toggle label="Peso unitario manual" checked={useManualGamma} onChange={setUseManualGamma} id="manualGamma" />
          {useManualGamma ? (
            <Input label="Peso unitario (γ)" unit="kN/m³" value={manualGamma} onChange={setManualGamma} min={10} max={25} step={0.5} />
          ) : (
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
              <span className="text-neutral-400">γ estimado por N60:</span> <strong className="font-mono">{gammaEstimated.toFixed(1)} kN/m³</strong>
            </div>
          )}
        </StepRow>

        <div className="flex items-center gap-4 ml-12"><div className="h-8 w-px bg-blue-200"></div><svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg><div className="h-8 w-px bg-blue-200"></div></div>

        {/* ═══════ PASO 3: Parametros del suelo ═══════ */}
        <StepRow
          number="3"
          title="Parametros del Suelo"
          subtitle="Define el angulo de friccion (estimado por SPT o manual) y propiedades del suelo"
          calculation={
            <>
              <p className="text-sm text-neutral-600 mb-2">
                {useManualPhi
                  ? 'Estas usando un angulo de friccion definido manualmente.'
                  : 'El angulo de friccion se estima con la correlacion de Peck, Hanson & Thornburn (1974):'}
              </p>
              {!useManualPhi && soilType === 'granular' && (
                <FormulaBox>
                  <p className="text-neutral-500 text-xs mb-2">Formula:</p>
                  <p>&phi; = 27.1 + 0.3&middot;(N<sub>1</sub>)<sub>60</sub> &minus; 0.00054&middot;[(N<sub>1</sub>)<sub>60</sub>]&sup2;</p>
                </FormulaBox>
              )}
              <div className="mt-3 rounded-xl bg-white border border-neutral-200 p-4 space-y-1.5">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  {useManualPhi ? 'Valor definido por el usuario' : 'Sustitucion'}
                </p>
                {useManualPhi ? (
                  <>
                    <p className="text-sm font-mono text-neutral-700">&phi; = {manualPhi}&deg; <span className="text-neutral-400">(manual)</span></p>
                    {soilType === 'granular' && (
                      <p className="text-xs text-neutral-400 mt-1">Estimado por SPT seria: {phiEstimated.toFixed(2)}&deg;</p>
                    )}
                  </>
                ) : soilType === 'granular' ? (
                  <>
                    <p className="text-sm font-mono text-neutral-700">&phi; = 27.1 + 0.3&times;{n160.toFixed(2)} &minus; 0.00054&times;{n160.toFixed(2)}&sup2;</p>
                    <p className="text-sm font-mono text-neutral-700">&phi; = 27.1 + {(0.3 * n160).toFixed(2)} &minus; {(0.00054 * n160 * n160).toFixed(4)}</p>
                  </>
                ) : (
                  <p className="text-sm text-neutral-600">Suelo cohesivo: &phi; = 0&deg;, se usa cohesion c = {cohesion} kPa</p>
                )}
                <div className="mt-2 pt-2 border-t border-neutral-100">
                  <FormulaResult>&phi; = {phi.toFixed(2)}&deg;</FormulaResult>
                </div>
                {failureType === 'local' && (
                  <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <strong>Falla local</strong> (N60 &le; 10): &phi;' = arctan(2/3 &times; tan {phi.toFixed(2)}&deg;) = <strong>{bearingResult.phiUsed.toFixed(2)}&deg;</strong>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill active>{soilClass.density}</Pill>
                <Pill>Falla {failureType === 'general' ? 'General' : 'Local'}</Pill>
                <Pill>&gamma; = {gamma} kN/m&sup3;</Pill>
              </div>
              {soilType === 'granular' && !useManualPhi && (
                <div className="mt-3 rounded-lg overflow-hidden border border-neutral-200">
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
            </>
          }
        >
          <Select label="Tipo de suelo" value={soilType} onChange={setSoilType}
            options={[{ value: 'granular', label: 'Granular (arena, grava)' }, { value: 'cohesive', label: 'Cohesivo (arcilla, limo)' }]} />
          {soilType === 'cohesive' && <Input label="Cohesion (c)" unit="kPa" value={cohesion} onChange={setCohesion} min={0} max={500} />}

          {soilType === 'granular' && (
            <>
              <Toggle label="Definir φ manualmente" checked={useManualPhi} onChange={setUseManualPhi} id="manualPhi" />
              {useManualPhi ? (
                <Input label="Angulo de friccion (φ)" unit="°" value={manualPhi} onChange={setManualPhi} min={0} max={50} step={0.5} />
              ) : (
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
                  <span className="text-blue-500">φ estimado por (N1)60:</span> <strong className="font-mono">{phiEstimated.toFixed(2)}&deg;</strong>
                </div>
              )}
            </>
          )}
        </StepRow>

        <div className="flex items-center gap-4 ml-12"><div className="h-8 w-px bg-blue-200"></div><svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg><div className="h-8 w-px bg-blue-200"></div></div>

        {/* ═══════ PASO 4: Cimentacion → Terzaghi ═══════ */}
        <StepRow
          number="4"
          title="Cimentacion y Capacidad Portante"
          subtitle="Define la geometria de la zapata. Se calcula qu por Terzaghi (1943)"
          calculation={
            <>
              <p className="text-sm text-neutral-600 mb-2">
                Ecuacion de Terzaghi para zapata <strong>{shapeLabels[shape].toLowerCase()}</strong>:
              </p>
              <FormulaBox>
                <p className="text-neutral-500 text-xs mb-2">Formula ({shapeLabels[shape]}):</p>
                <p>q<sub>u</sub> = {bearingResult.sc}&middot;c&middot;N<sub>c</sub> + q&middot;N<sub>q</sub> + {bearingResult.sg}&middot;&gamma;&middot;B&middot;N<sub>&gamma;</sub></p>
              </FormulaBox>

              {/* Factors */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[['Nc', bearingResult.factors.Nc], ['Nq', bearingResult.factors.Nq], ['Nγ', bearingResult.factors.Ng]].map(([name, val]) => (
                  <div key={name} className="rounded-xl bg-white border border-neutral-100 p-3 text-center">
                    <p className="text-[11px] text-neutral-400 uppercase">{name}</p>
                    <p className="text-lg font-bold font-mono text-neutral-900">{val.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Factores para &phi; = {bearingResult.phiUsed.toFixed(2)}&deg; (Tabla de Terzaghi)</p>

              {/* Substitution */}
              <div className="mt-3 rounded-xl bg-white border border-neutral-200 p-4 space-y-1.5">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Sustitucion</p>
                <p className="text-sm font-mono text-neutral-700">q = &gamma; &times; D<sub>f</sub> = {gamma} &times; {Df} = <strong>{bearingResult.q.toFixed(2)} kPa</strong></p>
                <p className="text-sm font-mono text-neutral-700">&gamma;<sub>ef</sub> = {bearingResult.gammaEff.toFixed(2)} kN/m&sup3;{bearingResult.gammaEff !== gamma ? ' (por NF)' : ''}</p>
                <p className="text-sm font-mono text-neutral-700 mt-1">
                  q<sub>u</sub> = {bearingResult.sc}&times;{bearingResult.cUsed.toFixed(1)}&times;{bearingResult.factors.Nc.toFixed(2)} + {bearingResult.q.toFixed(2)}&times;{bearingResult.factors.Nq.toFixed(2)} + {bearingResult.sg}&times;{bearingResult.gammaEff.toFixed(2)}&times;{B}&times;{bearingResult.factors.Ng.toFixed(2)}
                </p>
                <p className="text-sm font-mono text-neutral-700">
                  q<sub>u</sub> = {(bearingResult.sc * bearingResult.cUsed * bearingResult.factors.Nc).toFixed(2)} + {(bearingResult.q * bearingResult.factors.Nq).toFixed(2)} + {(bearingResult.sg * bearingResult.gammaEff * B * bearingResult.factors.Ng).toFixed(2)}
                </p>
                <div className="mt-2 pt-2 border-t border-neutral-100">
                  <FormulaResult>q<sub>u</sub> = {bearingResult.qu.toFixed(2)} kPa</FormulaResult>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-100">
                  <p className="text-sm font-mono text-neutral-700">q<sub>adm</sub> = {bearingResult.qu.toFixed(2)} / {fs}</p>
                  <FormulaResult>q<sub>adm</sub> = {qAdm.toFixed(2)} kPa &nbsp;=&nbsp; {(qAdm / 9.81).toFixed(2)} ton/m&sup2;</FormulaResult>
                </div>
              </div>
            </>
          }
        >
          <Select label="Forma de zapata" value={shape} onChange={setShape}
            options={[{ value: 'square', label: 'Cuadrada' }, { value: 'circular', label: 'Circular' }, { value: 'strip', label: 'Corrida' }]} />
          <Input label={shape === 'circular' ? 'Diametro (B)' : 'Ancho de zapata (B)'} unit="m" value={B} onChange={setB} min={0.3} max={10} step={0.1} />
          <Input label="Profundidad de desplante (Df)" unit="m" value={Df} onChange={setDf} min={0.3} max={10} step={0.1} />
          <Input label="Factor de seguridad (FS)" value={fs} onChange={setFs} min={1.5} max={5} step={0.5} />
        </StepRow>

        {/* ═══════ PASO 5: Resultados finales ═══════ */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-bold shrink-0">5</div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Resultados Finales</h2>
              <p className="text-sm text-neutral-400">Resumen de la capacidad portante admisible</p>
            </div>
          </div>

          <div className="ml-0 lg:ml-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Terzaghi result */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Terzaghi — Capacidad Admisible</p>
              <p className="text-4xl font-black font-mono mt-2">{qAdm.toFixed(1)} <span className="text-xl font-normal text-blue-200">kPa</span></p>
              <p className="text-blue-200 text-sm mt-1">{(qAdm / 9.81).toFixed(2)} ton/m&sup2; &nbsp;|&nbsp; FS = {fs}</p>
              <div className="mt-4 pt-3 border-t border-blue-500/30 text-xs text-blue-200 space-y-0.5">
                <p>Zapata {shapeLabels[shape]} &nbsp;|&nbsp; B = {B}m &nbsp;|&nbsp; Df = {Df}m</p>
                <p>&phi; = {phi.toFixed(1)}&deg; {useManualPhi ? '(manual)' : '(SPT)'} &nbsp;|&nbsp; &gamma; = {gamma} kN/m&sup3;</p>
              </div>
            </div>

            {/* Meyerhof result */}
            {soilType === 'granular' ? (
              <div className="rounded-2xl bg-neutral-900 p-6 text-white">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Meyerhof — Verificacion</p>
                <p className="text-4xl font-black font-mono mt-2">{meyerhof.qAdm.toFixed(1)} <span className="text-xl font-normal text-neutral-500">kPa</span></p>
                <p className="text-neutral-500 text-sm mt-1">{(meyerhof.qAdm / 9.81).toFixed(2)} ton/m&sup2; &nbsp;|&nbsp; Asentamiento max 25mm</p>
                <div className="mt-4 pt-3 border-t border-neutral-700 text-xs text-neutral-500 space-y-0.5">
                  <p>K<sub>d</sub> = {meyerhof.Kd.toFixed(2)} &nbsp;|&nbsp; N<sub>60</sub> = {n60.toFixed(2)}</p>
                  <p>Metodo directo para suelos granulares</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-neutral-900 p-6 text-white">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Equivalente</p>
                <p className="text-4xl font-black font-mono mt-2">{(qAdm / 9.81).toFixed(2)} <span className="text-xl font-normal text-neutral-500">ton/m&sup2;</span></p>
                <p className="text-neutral-500 text-sm mt-1">{qAdm.toFixed(1)} kPa</p>
              </div>
            )}
          </div>

          {/* Summary table */}
          <div className="ml-0 lg:ml-12 mt-4 rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Resumen de parametros</p>
            </div>
            <div className="divide-y divide-neutral-50">
              {[
                ['N campo', `${nField} golpes`],
                ['N60', n60.toFixed(2)],
                ['(N1)60', n160.toFixed(2)],
                ['σ\'v', `${sigmaV.toFixed(2)} kPa`],
                ['CN', cn.toFixed(4)],
                ['φ utilizado', `${phi.toFixed(2)}° ${useManualPhi ? '(manual)' : '(SPT)'}`],
                ['γ utilizado', `${gamma} kN/m³ ${useManualGamma ? '(manual)' : '(estimado)'}`],
                ['Clasificacion', soilClass.density],
                ['Tipo de falla', failureType === 'general' ? 'General' : 'Local'],
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

        {/* Footer */}
        <footer className="text-center text-xs text-neutral-400 pb-8 pt-6 border-t border-neutral-200">
          <p>Ref: Braja M. Das — Principios de Ingenieria de Cimentaciones (8va Ed.)</p>
          <p className="mt-1">Correlacion &phi;: Peck, Hanson & Thornburn (1974) | C<sub>N</sub>: Liao & Whitman (1986)</p>
          <p className="mt-1">Herramienta educativa. Siempre valide con un profesional.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
