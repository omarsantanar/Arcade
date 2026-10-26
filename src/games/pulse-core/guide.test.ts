import { describe, expect, it } from 'vitest';
import { PULSE_GUIDE_STEPS, PULSE_GUIDE_KEY } from './guide';

describe('Pulse Core onboarding', () => {
  it('explica controles, ambas descargas y condición de pérdida', () => {
    expect(PULSE_GUIDE_STEPS).toHaveLength(3);
    expect(PULSE_GUIDE_STEPS[0].detail).toMatch(/celular/i);
    expect(PULSE_GUIDE_STEPS[1].lead).toMatch(/anillo/i);
    expect(PULSE_GUIDE_STEPS[1].lead).toMatch(/arco/i);
    expect(PULSE_GUIDE_STEPS[2].detail).toMatch(/tres bloqueos/i);
  });
  it('tiene identificador versionado para que el nuevo jugador vea la guía', () => {
    expect(PULSE_GUIDE_KEY).toMatch(/^arcade:pulse-core:guide-v\d+$/);
  });
});
