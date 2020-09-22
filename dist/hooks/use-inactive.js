import { useEffect } from 'react';
import { AppState } from 'react-native';
/**
 * App 从前台变后台运行
 */
export default (effect) => {
    // ? App 从前台切换到后台触发事件
    const onChange = (state) => {
        if (state !== 'active') {
            effect();
        }
    };
    useEffect(() => {
        AppState.addEventListener('change', onChange);
        return () => AppState.removeEventListener('change', onChange);
    }, []);
};
