import { useCalculationContext } from '../context/CalculationContext';

export const useCalculation = () => {
    return useCalculationContext();
};
