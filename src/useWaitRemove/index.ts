import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * Intercept return to make the return controllable
 * @public
 */
export default function useWaitRemove(fn: (exit: Function) => void): void {
  const navigation = useNavigation();

  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      // Prevent default behavior of leaving the screen
      e.preventDefault();
      const exit = () => navigation.dispatch(e.data.action);
      fn(exit);
    });
  }, [navigation]);
}
