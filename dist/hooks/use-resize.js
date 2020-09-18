import { useEffect } from 'react';
import { Dimensions } from 'react-native';
/**
 * 页面尺寸变化时执行
 */
export default (effect) => {
    const onChange = () => {
        effect();
    };
    useEffect(() => {
        Dimensions.addEventListener('change', onChange);
        return () => Dimensions.removeEventListener('change', onChange);
    }, []);
};
