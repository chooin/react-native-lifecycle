import { EffectCallback, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面销毁前执行
 */
export default (effect: EffectCallback): void => {
  const navigation = useNavigation();
  const isBeforeRemove = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      isBeforeRemove.current = true;
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isBeforeRemove.current) {
        effect();
      }
    });

    return unsubscribe;
  }, [navigation]);
};
