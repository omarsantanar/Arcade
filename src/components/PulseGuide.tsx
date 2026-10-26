import { useEffect, useRef, useState } from 'react';
import { PULSE_GUIDE_STEPS } from '../games/pulse-core/guide';

interface Props { onExit: () => void }

function Symbol({ kind }: { kind: 'circle' | 'diamond' | 'triangle' }) {
  return <span aria-hidden="true" className={`pulse-guide-node ${kind}`}>{kind === 'circle' ? '●' : kind === 'diamond' ? '◆' : '▲'}</span>;
}

/** Brief, accessible explanation over a paused game; no gameplay rules are changed here. */
export default function PulseGuide({ onExit }: Props) {
  const [step, setStep] = useState(0);
  const firstButton = useRef<HTMLButtonElement>(null);
  const item = PULSE_GUIDE_STEPS[step];
  useEffect(() => { firstButton.current?.focus(); }, [step]);

  return (
    <div className="pulse-guide-layer">
      <section className="pulse-guide-card" role="region" aria-label="Aprende a jugar Pulse Core">
        <div className="pulse-guide-heading">
          <span className="pulse-guide-label">GUÍA DE PULSE CORE</span>
          <span className="pulse-guide-count">PASO {step + 1} / {PULSE_GUIDE_STEPS.length}</span>
        </div>
        <div className="pulse-guide-dots" aria-label={`Paso ${step + 1} de tres`}>
          {PULSE_GUIDE_STEPS.map((part, i) => <span key={part.title} className={i === step ? 'active' : ''} />)}
        </div>
        <h2 id="pulse-guide-title">{item.title}</h2>
        <p className="pulse-guide-lead">{item.lead}</p>
        <div className="pulse-guide-demo" aria-hidden="true">
          {step === 0 && <div className="pulse-guide-ring-demo">
            <span className="pulse-guide-ring outer" /><span className="pulse-guide-ring middle" /><span className="pulse-guide-ring inner" />
            <span className="pulse-guide-ring-arrow left">←</span><span className="pulse-guide-ring-arrow right">→</span>
            <span className="pulse-guide-center">◆</span>
          </div>}
          {step === 1 && <div className="pulse-guide-match-examples">
            <div><strong>RADIAL</strong><div className="pulse-guide-symbol-row"><Symbol kind="circle"/><Symbol kind="circle"/><Symbol kind="circle"/></div><small>Un mismo sector en los 3 anillos</small></div>
            <div><strong>ARCO</strong><div className="pulse-guide-symbol-arc"><Symbol kind="diamond"/><Symbol kind="diamond"/><Symbol kind="diamond"/></div><small>3 vecinos sobre el mismo anillo</small></div>
          </div>}
          {step === 2 && <div className="pulse-guide-pulse-demo">
            <div className="pulse-guide-pulse-row"><span>ANILLO EXTERIOR</span><Symbol kind="triangle"/><Symbol kind="circle"/><Symbol kind="diamond"/></div>
            <div className="pulse-guide-pulse-down">↓ LA ENERGÍA AVANZA HACIA EL CENTRO ↓</div>
            <div className="pulse-guide-pulse-warning">SATURACIÓN <b>1 / 3</b> · NO DEJES QUE SUBA</div>
          </div>}
        </div>
        <p className="pulse-guide-detail">{item.detail}</p>
        <p className="pulse-guide-hint">{item.hint}</p>
        <div className="pulse-guide-actions">
          {step > 0 ? <button ref={firstButton} className="pulse-guide-secondary" onClick={() => setStep(n => n - 1)}>Anterior</button> : <button ref={firstButton} className="pulse-guide-secondary" onClick={onExit}>Saltar guía</button>}
          <button className="pulse-guide-primary" onClick={() => step === PULSE_GUIDE_STEPS.length - 1 ? onExit() : setStep(n => n + 1)}>{step === PULSE_GUIDE_STEPS.length - 1 ? 'Comenzar a jugar' : 'Siguiente →'}</button>
        </div>
      </section>
    </div>
  );
}
