import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
const useEffectOnce = (effect) => {
    useEffect(effect, []);
};
const useEffectUpdate = (effect, deps) => {
    const isLoaded = useRef(false);
    useEffect(() => {
        if (isLoaded.current) {
            effect();
        }
        else {
            isLoaded.current = true;
        }
    }, [...(deps !== null && deps !== void 0 ? deps : [])]);
};
const useEffectShow = (effect, deps) => {
    const navigation = useNavigation();
    useEffect(() => {
        navigation.addListener('focus', effect);
    }, [navigation, ...(deps !== null && deps !== void 0 ? deps : [])]);
};
export { useEffectOnce, useEffectUpdate, useEffectShow };
