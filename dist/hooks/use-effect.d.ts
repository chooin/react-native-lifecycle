import { EffectCallback, DependencyList } from 'react';
declare const useEffectOnce: (effect: EffectCallback) => void;
declare const useEffectUpdate: (effect: EffectCallback, deps?: DependencyList | undefined) => void;
declare const useEffectShow: (effect: EffectCallback, deps?: DependencyList | undefined) => void;
export { useEffectOnce, useEffectUpdate, useEffectShow };
