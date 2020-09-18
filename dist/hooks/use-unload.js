import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
/**
 * 页面销毁时执行
 */
export default (effect) => {
    const navigation = useNavigation();
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', effect);
        return unsubscribe;
    }, [navigation]);
};
