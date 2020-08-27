import { EffectCallback, DependencyList, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

const useEffectOnce = (effect: EffectCallback) => {
  useEffect(effect, []);
};

const useEffectUpdate = (
  effect: EffectCallback,
  deps?: DependencyList,
): void => {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) {
      effect();
    } else {
      isLoaded.current = true;
    }
  }, [...(deps ?? [])]);
};

const useEffectShow = (effect: EffectCallback, deps?: DependencyList): void => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', effect);

    return unsubscribe;
  }, [navigation, ...(deps ?? [])]);
};

export { useEffectOnce, useEffectUpdate, useEffectShow };
