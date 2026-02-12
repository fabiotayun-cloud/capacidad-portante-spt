/* ── Modern UI Components ── White / Black / Blue scheme */

export function Input({ label, unit, value, onChange, min, max, step = 1, tooltip }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-neutral-500 tracking-wide uppercase">
        {label}
        {tooltip && <span className="ml-1 text-neutral-400 normal-case lowercase" title={tooltip}>(?)</span>}
      </label>
      <div className="flex items-center gap-2">
        <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min} max={max} step={step}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-mono text-neutral-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
        {unit && <span className="text-xs font-medium text-neutral-400 whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-neutral-500 tracking-wide uppercase">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Card({ title, tag, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-neutral-200/80 bg-white shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900 tracking-tight">{title}</h3>
          {tag && <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">{tag}</span>}
        </div>
      )}
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export function Stat({ label, value, unit, large = false }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-neutral-50 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className={`font-mono font-semibold text-neutral-900 ${large ? 'text-xl' : 'text-sm'}`}>
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit && <span className="ml-1 text-xs font-normal text-neutral-400">{unit}</span>}
      </span>
    </div>
  );
}

export function HighlightStat({ label, value, unit, sub }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white">
      <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold font-mono mt-1">{typeof value === 'number' ? value.toFixed(1) : value} <span className="text-lg font-normal text-blue-200">{unit}</span></p>
      {sub && <p className="text-sm text-blue-200 mt-1">{sub}</p>}
    </div>
  );
}

export function Pill({ children, active = false }) {
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${active ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
      {children}
    </span>
  );
}

export function Toggle({ label, checked, onChange, id }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-10 h-5 bg-neutral-200 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform"></div>
      </div>
      <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">{label}</span>
    </label>
  );
}

export function Accordion({ title, children, open, onToggle }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-5 hover:bg-neutral-50 transition-colors">
        <span className="text-base font-bold text-neutral-900">{title}</span>
        <svg className={`w-5 h-5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && <div className="px-6 pb-6 border-t border-neutral-100 pt-5">{children}</div>}
    </div>
  );
}

export function StepBlock({ number, title, color = 'blue', children }) {
  const bg = color === 'dark' ? 'bg-neutral-900' : 'bg-blue-600';
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${bg} text-white flex items-center justify-center text-sm font-bold shrink-0`}>{number}</div>
        <div className="w-px flex-1 bg-neutral-200 mt-2"></div>
      </div>
      <div className="pb-8 flex-1">
        <h4 className="text-sm font-bold text-neutral-900 mb-3">{title}</h4>
        {children}
      </div>
    </div>
  );
}

export function FormulaBox({ children }) {
  return (
    <div className="rounded-xl bg-neutral-50 border border-neutral-200 px-5 py-4 font-mono text-sm text-neutral-800 space-y-1.5">
      {children}
    </div>
  );
}

export function FormulaResult({ children }) {
  return <p className="font-bold text-blue-700 text-base">{children}</p>;
}
