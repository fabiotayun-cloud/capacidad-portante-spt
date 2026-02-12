import { useState } from 'react';
import {
  HAMMER_TYPES, calculateN60, calculateEffectiveStress, calculateCN, calculateN160,
  estimateFrictionAngle, estimateUnitWeight, classifySoil, calculateBearingCapacity,
  calculateAdmissibleCapacity, meyerhofDirectMethod, getBoreholeCorrectionFactor,
  getSamplerCorrectionFactor, getRodLengthCorrectionFactor,
} from './utils/sptCalculations';
import {
  Input, Select, Card, Stat, HighlightStat, Pill, Toggle,
  Accordion, StepBlock, FormulaBox, FormulaResult,
} from './components/UI';

function App() {
  const [nField, setNField] = useState(15);
  const [testDepth, setTestDepth] = useState(3);
  const [hammerType, setHammerType] = useState('safety');
  const [boreholeDiameter, setBoreholeDiameter] = useState(65);
  const [withLiner, setWithLiner] = useState(true);
  const [rodLength, setRodLength] = useState(6);
  const [waterTableDepth, setWaterTableDepth] = useState(10);
  const [soilType, setSoilType] = useState('granular');
  const [cohesion, setCohesion] = useState(0);
  const [useManualGamma, setUseManualGamma] = useState(false);
  const [manualGamma, setManualGamma] = useState(18);
  const [B, setB] = useState(1.5);
  const [Df, setDf] = useState(1.5);
  const [shape, setShape] = useState('square');
  const [fs, setFs] = useState(3.0);
  const [showEquations, setShowEquations] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const hammerEfficiency = HAMMER_TYPES[hammerType].efficiency;
  const n60 = calculateN60(nField, hammerEfficiency, boreholeDiameter, withLiner, rodLength);
  const gammaEstimated = estimateUnitWeight(n60);
  const gamma = useManualGamma ? manualGamma : gammaEstimated;
  const sigmaV = calculateEffectiveStress(testDepth, gamma, waterTableDepth);
  const cn = calculateCN(sigmaV);
  const n160 = calculateN160(n60, cn);
  const phi = estimateFrictionAngle(n160);
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

      {/* Hero Header */}
      <header className="relative bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.1),_transparent_60%)]"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">Herramienta Geotecnica</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Capacidad<br />Portante <span className="text-blue-400">SPT</span>
          </h1>
          <p className="mt-4 text-neutral-400 text-base max-w-xl leading-relaxed">
            Calculadora basada en la metodologia de <span className="text-white font-medium">Braja M. Das</span> — Principios de Ingenieria de Cimentaciones. Resultados en tiempo real.
          </p>
          <div className="flex gap-2 mt-6">
            <Pill active>Terzaghi</Pill>
            <Pill>Meyerhof</Pill>
            <Pill>NSR-10</Pill>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <Card title="Ensayo SPT" tag="Entrada">
              <Input label="N de campo (golpes/30cm)" value={nField} onChange={setNField} min={0} max={100} tooltip="Numero de golpes del ensayo SPT" />
              <Input label="Profundidad del ensayo" unit="m" value={testDepth} onChange={setTestDepth} min={0.5} max={50} step={0.5} />
              <Select label="Tipo de martillo" value={hammerType} onChange={setHammerType}
                options={Object.entries(HAMMER_TYPES).map(([k, v]) => ({ value: k, label: `${v.label} (${v.efficiency}%)` }))} />
              <Select label="Diametro de perforacion" value={boreholeDiameter} onChange={(v) => setBoreholeDiameter(Number(v))}
                options={[{ value: 65, label: '65-115 mm' }, { value: 150, label: '150 mm' }, { value: 200, label: '200 mm' }]} />
              <Input label="Longitud de varillas" unit="m" value={rodLength} onChange={setRodLength} min={1} max={30} step={0.5} />
              <Toggle label="Muestreador con camisa (liner)" checked={withLiner} onChange={setWithLiner} id="liner" />
            </Card>

            <Card title="Suelo" tag="Propiedades">
              <Select label="Tipo de suelo" value={soilType} onChange={setSoilType}
                options={[{ value: 'granular', label: 'Granular (arena, grava)' }, { value: 'cohesive', label: 'Cohesivo (arcilla, limo)' }]} />
              {soilType === 'cohesive' && <Input label="Cohesion (c)" unit="kPa" value={cohesion} onChange={setCohesion} min={0} max={500} />}
              <Input label="Nivel freatico" unit="m" value={waterTableDepth} onChange={setWaterTableDepth} min={0} max={50} step={0.5} />
              <Toggle label="Peso unitario manual" checked={useManualGamma} onChange={setUseManualGamma} id="manualGamma" />
              {useManualGamma && <Input label="Peso unitario" unit="kN/m3" value={manualGamma} onChange={setManualGamma} min={10} max={25} step={0.5} />}
            </Card>

            <Card title="Cimentacion" tag="Geometria">
              <Select label="Forma de zapata" value={shape} onChange={setShape}
                options={[{ value: 'square', label: 'Cuadrada' }, { value: 'circular', label: 'Circular' }, { value: 'strip', label: 'Corrida' }]} />
              <Input label={shape === 'circular' ? 'Diametro (B)' : 'Ancho (B)'} unit="m" value={B} onChange={setB} min={0.3} max={10} step={0.1} />
              <Input label="Profundidad de desplante (Df)" unit="m" value={Df} onChange={setDf} min={0.3} max={10} step={0.1} />
              <Input label="Factor de seguridad (FS)" value={fs} onChange={setFs} min={1.5} max={5} step={0.5} />
            </Card>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HighlightStat label="Capacidad Admisible — Terzaghi" value={qAdm} unit="kPa"
                sub={`${(qAdm / 9.81).toFixed(2)} ton/m2  |  FS = ${fs}`} />
              {soilType === 'granular' ? (
                <div className="rounded-xl bg-neutral-900 p-5 text-white">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Verificacion — Meyerhof</p>
                  <p className="text-3xl font-bold font-mono mt-1">{meyerhof.qAdm.toFixed(1)} <span className="text-lg font-normal text-neutral-500">kPa</span></p>
                  <p className="text-sm text-neutral-500 mt-1">{(meyerhof.qAdm / 9.81).toFixed(2)} ton/m2</p>
                </div>
              ) : (
                <div className="rounded-xl bg-neutral-900 p-5 text-white">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Equivalente</p>
                  <p className="text-3xl font-bold font-mono mt-1">{(qAdm / 9.81).toFixed(2)} <span className="text-lg font-normal text-neutral-500">ton/m2</span></p>
                </div>
              )}
            </div>

            <Card title="Correcciones del SPT">
              <Stat label="N de campo" value={nField} unit="golpes" />
              <Stat label="N60 (corregido al 60%)" value={n60} />
              <Stat label="Esfuerzo efectivo (o'v)" value={sigmaV} unit="kPa" />
              <Stat label="CN (factor sobrecarga)" value={cn} />
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-blue-900">(N1)60</span>
                <span className="text-xl font-bold font-mono text-blue-700">{n160.toFixed(2)}</span>
              </div>
            </Card>

            <Card title="Parametros Estimados del Suelo">
              <div className="flex flex-wrap gap-2 mb-3">
                <Pill active>{soilClass.density}</Pill>
                <Pill>Falla {failureType === 'general' ? 'General' : 'Local'}</Pill>
              </div>
              <Stat label="Angulo de friccion (phi)" value={phi} unit="deg" />
              <Stat label="Peso unitario" value={gamma} unit="kN/m3" />
              {failureType === 'local' && <Stat label="phi' (falla local)" value={bearingResult.phiUsed} unit="deg" />}
            </Card>

            <Card title="Capacidad Portante — Terzaghi">
              <div className="grid grid-cols-3 gap-3">
                {[['Nc', bearingResult.factors.Nc], ['Nq', bearingResult.factors.Nq], ['Ny', bearingResult.factors.Ng]].map(([name, val]) => (
                  <div key={name} className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 text-center">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">{name}</p>
                    <p className="text-lg font-bold font-mono text-neutral-900 mt-1">{val.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <Stat label="Sobrecarga (q)" value={bearingResult.q} unit="kPa" />
              <Stat label="Gamma efectivo" value={bearingResult.gammaEff} unit="kN/m3" />
              <Stat label="qu (ultima)" value={bearingResult.qu} unit="kPa" large />
              <div className="rounded-xl bg-neutral-900 text-white px-5 py-3 text-sm font-mono">
                q<sub>u</sub> = {bearingResult.sc}&middot;c&middot;N<sub>c</sub> + q&middot;N<sub>q</sub> + {bearingResult.sg}&middot;&gamma;&middot;B&middot;N<sub>&gamma;</sub>
              </div>
            </Card>

            {soilType === 'granular' && (
              <Card title="Verificacion — Meyerhof Directo">
                <Stat label="Kd (factor profundidad)" value={meyerhof.Kd} />
                <Stat label="q adm (Meyerhof)" value={meyerhof.qAdm} unit="kPa" large />
              </Card>
            )}
          </div>
        </div>

        {/* Equations Accordion */}
        <Accordion title="Marco Teorico — Ecuaciones Utilizadas" open={showEquations} onToggle={() => setShowEquations(!showEquations)}>
          <div className="space-y-8">
            <StepBlock number="1" title="Correccion del N del SPT a N60">
              <p className="text-sm text-neutral-600 mb-3">Correccion a eficiencia estandar del 60% (Skempton, 1986):</p>
              <FormulaBox><p>N<sub>60</sub> = N<sub>campo</sub> &times; (&eta;<sub>H</sub> &times; &eta;<sub>B</sub> &times; &eta;<sub>S</sub> &times; &eta;<sub>R</sub>) / 60</p></FormulaBox>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {[['ηH — Martillo', 'Seguridad: 60% | Dona: 45% | Auto: 80%'],
                  ['ηB — Diametro', '65-115mm: 1.0 | 150mm: 1.05 | 200mm: 1.15'],
                  ['ηS — Muestreador', 'Con camisa: 1.0 | Sin camisa: 1.2'],
                  ['ηR — Varillas', '>10m: 1.0 | 6-10m: 0.95 | 4-6m: 0.85 | <4m: 0.75'],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-lg bg-neutral-50 p-3">
                    <p className="text-xs font-bold text-neutral-700">{t}</p>
                    <p className="text-xs text-neutral-500 mt-1">{d}</p>
                  </div>
                ))}
              </div>
            </StepBlock>
            <StepBlock number="2" title="Correccion por Sobrecarga — (N1)60">
              <p className="text-sm text-neutral-600 mb-3">Normalizacion a 100 kPa (Liao & Whitman, 1986):</p>
              <FormulaBox>
                <p>(N<sub>1</sub>)<sub>60</sub> = C<sub>N</sub> &times; N<sub>60</sub></p>
                <p>C<sub>N</sub> = &radic;(P<sub>a</sub> / &sigma;'<sub>v</sub>) &le; 2.0 &nbsp; donde P<sub>a</sub> = 100 kPa</p>
              </FormulaBox>
            </StepBlock>
            <StepBlock number="3" title="Correlacion SPT → Angulo de Friccion (&phi;)">
              <p className="text-sm text-neutral-600 mb-3">Peck, Hanson & Thornburn (1974):</p>
              <FormulaBox><p>&phi; = 27.1 + 0.3&middot;(N<sub>1</sub>)<sub>60</sub> &minus; 0.00054&middot;[(N<sub>1</sub>)<sub>60</sub>]&sup2;</p></FormulaBox>
              <div className="mt-3 rounded-lg overflow-hidden border border-neutral-200">
                <table className="w-full text-xs">
                  <thead><tr className="bg-neutral-100 text-neutral-600"><th className="px-3 py-2 text-left">N60</th><th className="px-3 py-2 text-left">Densidad</th><th className="px-3 py-2 text-left">&phi; aprox.</th></tr></thead>
                  <tbody className="divide-y divide-neutral-100">
                    {[['0-4','Muy suelto','<28°'],['4-10','Suelto','28-30°'],['10-30','Medio','30-36°'],['30-50','Denso','36-41°'],['>50','Muy denso','>41°']].map(([n,d,p])=>(
                      <tr key={n} className="text-neutral-700"><td className="px-3 py-1.5 font-mono">{n}</td><td className="px-3 py-1.5">{d}</td><td className="px-3 py-1.5 font-mono">{p}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StepBlock>
            <StepBlock number="4" title="Capacidad Portante de Terzaghi (1943)">
              <div className="space-y-2">
                {[['Corrida','qu = c·Nc + q·Nq + 0.5·γ·B·Nγ'],['Cuadrada','qu = 1.3·c·Nc + q·Nq + 0.4·γ·B·Nγ'],['Circular','qu = 1.3·c·Nc + q·Nq + 0.3·γ·B·Nγ']].map(([s,f])=>(
                  <div key={s} className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase">{s}</span>
                    <p className="font-mono text-sm text-neutral-800 mt-1">{f}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-neutral-900 text-white px-4 py-3 text-xs">
                <strong>Falla local</strong> (N60 &le; 10): usar c' = 2/3·c y &phi;' = arctan(2/3·tan &phi;)
              </div>
            </StepBlock>
            <StepBlock number="5" title="Capacidad Portante Admisible">
              <FormulaBox><p>q<sub>adm</sub> = q<sub>u</sub> / FS</p></FormulaBox>
              <p className="text-sm text-neutral-500 mt-2">En Colombia se usa tipicamente FS = 3.0 segun la NSR-10 (Titulo H).</p>
            </StepBlock>
            <StepBlock number="6" title="Metodo Directo de Meyerhof (1956) — Verificacion">
              <FormulaBox>
                <p>B &le; 1.22m: q<sub>adm</sub> = N<sub>60</sub> &middot; K<sub>d</sub> / 0.05 (kPa)</p>
                <p>B &gt; 1.22m: q<sub>adm</sub> = N<sub>60</sub> &middot; K<sub>d</sub> &middot; [(B+0.305)/B]&sup2; / 0.08 (kPa)</p>
                <p className="mt-2 text-neutral-500">K<sub>d</sub> = 1 + 0.33&middot;(D<sub>f</sub>/B) &le; 1.33</p>
              </FormulaBox>
            </StepBlock>
          </div>
        </Accordion>

        {/* Worked Example Accordion */}
        <Accordion title="Muestra de Calculo — Paso a Paso" open={showExample} onToggle={() => setShowExample(!showExample)}>
          <div className="space-y-1">
            <div className="rounded-xl bg-neutral-900 text-white p-5 mb-6">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Datos de Entrada Actuales</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm font-mono">
                <p>N = {nField}</p><p>z = {testDepth} m</p><p>&eta;H = {etaH}%</p><p>&eta;B = {etaB}</p>
                <p>&eta;S = {etaS}</p><p>&eta;R = {etaR}</p><p>NF = {waterTableDepth} m</p><p>&gamma; = {gamma} kN/m&sup3;</p>
                <p>B = {B} m</p><p>Df = {Df} m</p><p>FS = {fs}</p><p>Zapata: {shapeLabels[shape]}</p>
              </div>
            </div>

            <StepBlock number="1" title="Correccion N60">
              <FormulaBox>
                <p>N<sub>60</sub> = {nField} &times; ({etaH} &times; {etaB} &times; {etaS} &times; {etaR}) / 60</p>
                <p>N<sub>60</sub> = {nField} &times; {(etaH * etaB * etaS * etaR).toFixed(2)} / 60</p>
                <FormulaResult>N<sub>60</sub> = {n60.toFixed(2)}</FormulaResult>
              </FormulaBox>
            </StepBlock>

            <StepBlock number="2" title="Esfuerzo Efectivo y Correccion por Sobrecarga">
              <FormulaBox>
                {waterTableDepth >= testDepth ? (
                  <><p>&sigma;'<sub>v</sub> = &gamma; &times; z = {gamma} &times; {testDepth}</p><FormulaResult>&sigma;'<sub>v</sub> = {sigmaV.toFixed(2)} kPa</FormulaResult></>
                ) : (
                  <><p>&sigma;'<sub>v</sub> = {gamma}&times;{waterTableDepth} + ({gamma}&minus;9.81)&times;({testDepth}&minus;{waterTableDepth})</p><FormulaResult>&sigma;'<sub>v</sub> = {sigmaV.toFixed(2)} kPa</FormulaResult></>
                )}
                <p className="mt-3">C<sub>N</sub> = &radic;(100 / {sigmaV.toFixed(2)}) = {cn.toFixed(4)}{cn >= 2 ? ' → limitado a 2.00' : ''}</p>
                <p>(N<sub>1</sub>)<sub>60</sub> = {cn.toFixed(2)} &times; {n60.toFixed(2)}</p>
                <FormulaResult>(N<sub>1</sub>)<sub>60</sub> = {n160.toFixed(2)}</FormulaResult>
              </FormulaBox>
            </StepBlock>

            {soilType === 'granular' && (
              <StepBlock number="3" title="Estimacion de &phi;">
                <FormulaBox>
                  <p>&phi; = 27.1 + 0.3&times;{n160.toFixed(2)} &minus; 0.00054&times;{n160.toFixed(2)}&sup2;</p>
                  <p>&phi; = 27.1 + {(0.3 * n160).toFixed(2)} &minus; {(0.00054 * n160 * n160).toFixed(4)}</p>
                  <FormulaResult>&phi; = {phi.toFixed(2)}&deg;</FormulaResult>
                  {failureType === 'local' && (<><p className="mt-2 text-neutral-500">Falla local: &phi;' = arctan(2/3 &times; tan {phi.toFixed(2)}&deg;)</p><FormulaResult>&phi;' = {bearingResult.phiUsed.toFixed(2)}&deg;</FormulaResult></>)}
                </FormulaBox>
              </StepBlock>
            )}

            <StepBlock number="4" title={`Factores de Terzaghi (φ = ${bearingResult.phiUsed.toFixed(2)}°)`}>
              <div className="grid grid-cols-3 gap-3">
                {[['Nc', bearingResult.factors.Nc], ['Nq', bearingResult.factors.Nq], ['Nγ', bearingResult.factors.Ng]].map(([n, v]) => (
                  <div key={n} className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-center">
                    <p className="text-xs text-neutral-400">{n}</p>
                    <p className="text-lg font-bold font-mono">{v.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-2">Interpolados de la tabla de Terzaghi (Braja Das, Tabla 3.4)</p>
            </StepBlock>

            <StepBlock number="5" title="Capacidad Portante Ultima">
              <FormulaBox>
                <p>q = &gamma; &times; D<sub>f</sub> = {gamma} &times; {Df} = {bearingResult.q.toFixed(2)} kPa</p>
                <p>&gamma;<sub>ef</sub> = {bearingResult.gammaEff.toFixed(2)} kN/m&sup3;{bearingResult.gammaEff !== gamma ? ' (corregido por NF)' : ''}</p>
                <p className="mt-2">Zapata {shapeLabels[shape]}:</p>
                <p>q<sub>u</sub> = {bearingResult.sc}&times;{bearingResult.cUsed.toFixed(1)}&times;{bearingResult.factors.Nc.toFixed(2)} + {bearingResult.q.toFixed(2)}&times;{bearingResult.factors.Nq.toFixed(2)} + {bearingResult.sg}&times;{bearingResult.gammaEff.toFixed(2)}&times;{B}&times;{bearingResult.factors.Ng.toFixed(2)}</p>
                <p>q<sub>u</sub> = {(bearingResult.sc * bearingResult.cUsed * bearingResult.factors.Nc).toFixed(2)} + {(bearingResult.q * bearingResult.factors.Nq).toFixed(2)} + {(bearingResult.sg * bearingResult.gammaEff * B * bearingResult.factors.Ng).toFixed(2)}</p>
                <FormulaResult>q<sub>u</sub> = {bearingResult.qu.toFixed(2)} kPa</FormulaResult>
              </FormulaBox>
            </StepBlock>

            <StepBlock number="6" title="Capacidad Portante Admisible">
              <FormulaBox>
                <p>q<sub>adm</sub> = q<sub>u</sub> / FS = {bearingResult.qu.toFixed(2)} / {fs}</p>
                <FormulaResult>q<sub>adm</sub> = {qAdm.toFixed(2)} kPa = {(qAdm / 9.81).toFixed(2)} ton/m&sup2;</FormulaResult>
              </FormulaBox>
            </StepBlock>

            {soilType === 'granular' && (
              <StepBlock number="7" title="Verificacion: Meyerhof Directo" color="dark">
                <FormulaBox>
                  <p>K<sub>d</sub> = 1 + 0.33&times;({Df}/{B}) = {(1 + 0.33 * (Df / B)).toFixed(2)}{(1 + 0.33 * (Df / B)) > 1.33 ? ' → limitado a 1.33' : ''}</p>
                  {B <= 1.22 ? (
                    <><p className="mt-2">q<sub>adm</sub> = {n60.toFixed(2)} &times; {meyerhof.Kd.toFixed(2)} / 0.05</p></>
                  ) : (
                    <><p className="mt-2">q<sub>adm</sub> = {n60.toFixed(2)} &times; {meyerhof.Kd.toFixed(2)} &times; {(((B + 0.305) / B) ** 2).toFixed(4)} / 0.08</p></>
                  )}
                  <FormulaResult>q<sub>adm</sub> (Meyerhof) = {meyerhof.qAdm.toFixed(2)} kPa</FormulaResult>
                </FormulaBox>
              </StepBlock>
            )}
          </div>
        </Accordion>

        {/* Footer */}
        <footer className="text-center text-xs text-neutral-400 pb-8 pt-4 border-t border-neutral-200">
          <p>Ref: Braja M. Das — Principios de Ingenieria de Cimentaciones (8va Ed.)</p>
          <p className="mt-1">Correlacion &phi;: Peck, Hanson & Thornburn (1974) | C<sub>N</sub>: Liao & Whitman (1986)</p>
          <p className="mt-1">Herramienta educativa. Siempre valide con un profesional.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
