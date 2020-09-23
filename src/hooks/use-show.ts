import { EffectCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面出现在前台时执行
 */
export default (effect: EffectCallback): void => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', effect);

    return unsubscribe;
  }, [navigation]);
};
