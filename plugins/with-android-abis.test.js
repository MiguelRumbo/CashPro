const { applyAbis } = require('./with-android-abis');

const props = [
  { type: 'comment', value: 'Use this property to specify which architecture you want to build.' },
  { type: 'property', key: 'reactNativeArchitectures', value: 'armeabi-v7a,arm64-v8a,x86,x86_64' },
  { type: 'property', key: 'newArchEnabled', value: 'true' },
];

describe('with-android-abis', () => {
  it('reemplaza las arquitecturas', () => {
    const out = applyAbis(props, ['arm64-v8a']);
    expect(out.filter((p) => p.key === 'reactNativeArchitectures')).toEqual([
      { type: 'property', key: 'reactNativeArchitectures', value: 'arm64-v8a' },
    ]);
    expect(out).toContainEqual({ type: 'property', key: 'newArchEnabled', value: 'true' });
  });

  it('rechaza listas vacías y ABIs desconocidas', () => {
    expect(() => applyAbis(props, [])).toThrow(/no vacía/);
    expect(() => applyAbis(props, ['mips'])).toThrow(/desconocida/);
  });
});
