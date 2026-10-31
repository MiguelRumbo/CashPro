import { fontFamilyFor, normalizeWeight } from './typography';

describe('typography', () => {
  it('normaliza pesos', () => {
    expect(normalizeWeight(undefined)).toBe(400);
    expect(normalizeWeight('bold')).toBe(700);
    expect(normalizeWeight('600')).toBe(600);
    expect(normalizeWeight(900)).toBe(800);
    expect(normalizeWeight('300')).toBe(400);
  });

  it('usa Manrope en texto normal y Sora en textos grandes', () => {
    expect(fontFamilyFor('600', 14)).toBe('Manrope-SemiBold');
    expect(fontFamilyFor(undefined, undefined)).toBe('Manrope-Regular');
    expect(fontFamilyFor('700', 28)).toBe('Sora-Bold');
    expect(fontFamilyFor('500', 24)).toBe('Sora-SemiBold');
  });
});
