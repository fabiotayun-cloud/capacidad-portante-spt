// ============================================================
// Cálculo de Capacidad Portante basado en SPT
// Referencia: Braja M. Das - Principios de Ingeniería de Cimentaciones
// ============================================================

// --- Factores de corrección del N del SPT ---

// Corrección por eficiencia del martillo (η_H) en %
export const HAMMER_TYPES = {
  safety: { label: 'Martillo de seguridad (Safety)', efficiency: 60 },
  donut: { label: 'Martillo tipo dona (Donut)', efficiency: 45 },
  automatic: { label: 'Martillo automático', efficiency: 80 },
};

// Corrección por diámetro de perforación (η_B)
export function getBoreholeCorrectionFactor(diameter) {
  if (diameter <= 115) return 1.0;
  if (diameter <= 150) return 1.05;
  return 1.15; // 200mm
}

// Corrección por tipo de muestreador (η_S)
export function getSamplerCorrectionFactor(withLiner) {
  return withLiner ? 1.0 : 1.2;
}

// Corrección por longitud de varillas (η_R)
export function getRodLengthCorrectionFactor(rodLength) {
  if (rodLength > 10) return 1.0;
  if (rodLength >= 6) return 0.95;
  if (rodLength >= 4) return 0.85;
  return 0.75;
}

// N corregido al 60% de eficiencia
// N60 = N_campo * (η_H * η_B * η_S * η_R) / 60
export function calculateN60(nField, hammerEfficiency, boreholeDiameter, withLiner, rodLength) {
  const etaH = hammerEfficiency;
  const etaB = getBoreholeCorrectionFactor(boreholeDiameter);
  const etaS = getSamplerCorrectionFactor(withLiner);
  const etaR = getRodLengthCorrectionFactor(rodLength);

  return (nField * etaH * etaB * etaS * etaR) / 60;
}

// Presión efectiva de sobrecarga (σ'v) en kPa
export function calculateEffectiveStress(depth, gamma, waterTableDepth) {
  const gammaW = 9.81; // kN/m³
  if (waterTableDepth >= depth) {
    // Nivel freático debajo de la profundidad de ensayo
    return gamma * depth;
  } else {
    // Nivel freático por encima de la profundidad de ensayo
    const dryPart = gamma * waterTableDepth;
    const submergedPart = (gamma - gammaW) * (depth - waterTableDepth);
    return dryPart + submergedPart;
  }
}

// Factor de corrección por sobrecarga - Liao & Whitman (1986)
// CN = sqrt(Pa / σ'v) donde Pa = 100 kPa
export function calculateCN(effectiveStress) {
  if (effectiveStress <= 0) return 2.0;
  const cn = Math.sqrt(100 / effectiveStress);
  return Math.min(cn, 2.0); // CN no debe exceder 2.0
}

// (N1)60 = CN * N60
export function calculateN160(n60, cn) {
  return cn * n60;
}

// --- Correlaciones SPT → Parámetros del suelo ---

// Ángulo de fricción interna (φ) a partir de (N1)60
// Peck, Hanson & Thornburn (1974) - Muy usada en Colombia
export function estimateFrictionAngle(n160) {
  const n = Math.max(0, Math.min(n160, 60));
  return 27.1 + 0.3 * n - 0.00054 * n * n;
}

// Peso unitario estimado a partir de N60 (kN/m³)
export function estimateUnitWeight(n60) {
  if (n60 <= 4) return 14.0;
  if (n60 <= 10) return 16.0;
  if (n60 <= 30) return 18.0;
  if (n60 <= 50) return 20.0;
  return 21.0;
}

// Clasificación del suelo según N60
export function classifySoil(n60) {
  if (n60 <= 4) return { density: 'Muy suelto', consistency: 'Muy blanda' };
  if (n60 <= 10) return { density: 'Suelto', consistency: 'Blanda' };
  if (n60 <= 30) return { density: 'Medio', consistency: 'Media' };
  if (n60 <= 50) return { density: 'Denso', consistency: 'Firme' };
  return { density: 'Muy denso', consistency: 'Muy firme' };
}

// --- Factores de capacidad portante de Terzaghi ---

// Tabla de factores de Terzaghi (φ en grados → Nc, Nq, Nγ)
const TERZAGHI_FACTORS = [
  { phi: 0,  Nc: 5.7,   Nq: 1.0,   Ng: 0.0 },
  { phi: 5,  Nc: 7.3,   Nq: 1.6,   Ng: 0.5 },
  { phi: 10, Nc: 9.6,   Nq: 2.7,   Ng: 1.2 },
  { phi: 15, Nc: 12.9,  Nq: 4.4,   Ng: 2.5 },
  { phi: 20, Nc: 17.7,  Nq: 7.4,   Ng: 5.0 },
  { phi: 25, Nc: 25.1,  Nq: 12.7,  Ng: 9.7 },
  { phi: 26, Nc: 27.1,  Nq: 14.2,  Ng: 11.7 },
  { phi: 28, Nc: 31.6,  Nq: 17.8,  Ng: 15.7 },
  { phi: 30, Nc: 37.2,  Nq: 22.5,  Ng: 19.7 },
  { phi: 32, Nc: 44.0,  Nq: 28.5,  Ng: 27.9 },
  { phi: 34, Nc: 52.6,  Nq: 36.5,  Ng: 36.0 },
  { phi: 36, Nc: 63.5,  Nq: 47.2,  Ng: 52.0 },
  { phi: 38, Nc: 77.5,  Nq: 61.5,  Ng: 80.0 },
  { phi: 40, Nc: 95.7,  Nq: 81.3,  Ng: 100.4 },
  { phi: 42, Nc: 119.7, Nq: 108.8, Ng: 180.0 },
  { phi: 44, Nc: 151.9, Nq: 147.7, Ng: 257.0 },
  { phi: 45, Nc: 172.3, Nq: 173.3, Ng: 297.5 },
  { phi: 46, Nc: 196.2, Nq: 204.2, Ng: 420.0 },
  { phi: 48, Nc: 258.3, Nq: 287.8, Ng: 780.1 },
  { phi: 50, Nc: 347.5, Nq: 415.1, Ng: 1153.2 },
];

// Interpolación lineal para obtener los factores de Terzaghi
function interpolate(x, x0, x1, y0, y1) {
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

export function getTerzaghiFactors(phi) {
  const phiClamped = Math.max(0, Math.min(phi, 50));

  // Buscar el intervalo
  for (let i = 0; i < TERZAGHI_FACTORS.length - 1; i++) {
    const lower = TERZAGHI_FACTORS[i];
    const upper = TERZAGHI_FACTORS[i + 1];
    if (phiClamped >= lower.phi && phiClamped <= upper.phi) {
      return {
        Nc: interpolate(phiClamped, lower.phi, upper.phi, lower.Nc, upper.Nc),
        Nq: interpolate(phiClamped, lower.phi, upper.phi, lower.Nq, upper.Nq),
        Ng: interpolate(phiClamped, lower.phi, upper.phi, lower.Ng, upper.Ng),
      };
    }
  }

  // Si está en el exacto último valor
  const last = TERZAGHI_FACTORS[TERZAGHI_FACTORS.length - 1];
  return { Nc: last.Nc, Nq: last.Nq, Ng: last.Ng };
}

// --- Capacidad portante última de Terzaghi ---

// Falla general:
//   Corrida:   qu = c*Nc + q*Nq + 0.5*γ*B*Nγ
//   Cuadrada:  qu = 1.3*c*Nc + q*Nq + 0.4*γ*B*Nγ
//   Circular:  qu = 1.3*c*Nc + q*Nq + 0.3*γ*B*Nγ

// Falla local: usar c' = (2/3)c y φ' = atan((2/3)*tan(φ))

export function calculateBearingCapacity({
  cohesion = 0,     // c (kPa)
  phi,              // ángulo de fricción (grados)
  gamma,            // peso unitario del suelo (kN/m³)
  B,                // ancho de la zapata (m)
  Df,               // profundidad de desplante (m)
  shape = 'square', // 'strip', 'square', 'circular'
  waterTableDepth,  // profundidad del nivel freático (m)
  failureType = 'general', // 'general' o 'local'
}) {
  let c = cohesion;
  let phiUsed = phi;

  // Para falla local, modificar c y φ
  if (failureType === 'local') {
    c = (2 / 3) * cohesion;
    phiUsed = Math.atan((2 / 3) * Math.tan((phi * Math.PI) / 180)) * (180 / Math.PI);
  }

  const factors = getTerzaghiFactors(phiUsed);
  const { Nc, Nq, Ng } = factors;

  // Presión de sobrecarga a nivel de desplante: q = γ * Df
  const q = gamma * Df;

  // Peso unitario efectivo debajo de la zapata (considerar nivel freático)
  const gammaW = 9.81;
  let gammaEff = gamma;

  if (waterTableDepth !== undefined && waterTableDepth !== null) {
    if (waterTableDepth <= Df) {
      // Caso 1: NF encima o al nivel de desplante
      gammaEff = gamma - gammaW;
    } else if (waterTableDepth <= Df + B) {
      // Caso 2: NF entre Df y Df+B
      const factor = (waterTableDepth - Df) / B;
      gammaEff = gamma - gammaW * (1 - factor);
    }
    // Caso 3: NF debajo de Df+B → gammaEff = gamma (sin corrección)
  }

  // Factores de forma según Terzaghi
  let sc, sg;
  switch (shape) {
    case 'strip':
      sc = 1.0; sg = 0.5;
      break;
    case 'square':
      sc = 1.3; sg = 0.4;
      break;
    case 'circular':
      sc = 1.3; sg = 0.3;
      break;
    default:
      sc = 1.3; sg = 0.4;
  }

  // qu = sc*c*Nc + q*Nq + sg*γeff*B*Nγ
  const qu = sc * c * Nc + q * Nq + sg * gammaEff * B * Ng;

  return {
    qu,               // Capacidad portante última (kPa)
    factors: { Nc, Nq, Ng },
    q,                // Sobrecarga (kPa)
    gammaEff,         // Peso unitario efectivo (kN/m³)
    phiUsed,          // φ usado (puede ser modificado por falla local)
    cUsed: c,         // c usado
    sc, sg,
  };
}

// Capacidad portante admisible
export function calculateAdmissibleCapacity(qu, factorOfSafety = 3.0) {
  return qu / factorOfSafety;
}

// --- Método directo de Meyerhof (1956) basado en SPT ---
// Para suelos granulares, muy usado en Colombia como verificación rápida
// q_adm = (N60 * Kd) / F para B ≤ 1.22m
// q_adm = (N60 * Kd * [(B+0.305)/B]²) / F para B > 1.22m
// Kd = 1 + 0.33*(Df/B) ≤ 1.33
// Asentamiento máximo = 25mm

export function meyerhofDirectMethod(n60, B, Df) {
  const Kd = Math.min(1 + 0.33 * (Df / B), 1.33);

  let qAdm;
  if (B <= 1.22) {
    // q_adm (kPa) = N60 * Kd / 0.05
    qAdm = (n60 * Kd) / 0.05;
  } else {
    // q_adm (kPa) = N60 * Kd * [(B + 0.305) / B]² / 0.08
    const ratio = ((B + 0.305) / B) ** 2;
    qAdm = (n60 * Kd * ratio) / 0.08;
  }

  return { qAdm, Kd };
}
