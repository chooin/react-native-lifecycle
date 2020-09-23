import { EffectCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面从前台变为后台时执行
 */
export default (effect: EffectCallback): void => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', effect);

    return unsubscribe;
  }, [navigation]);
};
