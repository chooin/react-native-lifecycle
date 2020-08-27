import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
export const useAppState = () => {
    const currentState = AppState.currentState;
    const [appState, setAppState] = useState(currentState);
    const onChange = (newState) => {
        setAppState(newState);
    };
    useEffect(() => {
        AppState.addEventListener('change', onChange);
        return () => AppState.removeEventListener('change', onChange);
    }, []);
    return appState;
};
