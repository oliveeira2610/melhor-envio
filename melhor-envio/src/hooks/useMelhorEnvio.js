import { useMutation, useQuery } from '@tanstack/react-query';
import { calcularFrete, criarEtiqueta, baixarEtiqueta } from '../services/melhorEnvio';

export const useCalcularFrete = () => {
  return useMutation({
    mutationFn: (dados) => calcularFrete(dados), // Esta é a correção principal
    onError: (error) => {
      console.error('Erro no cálculo do frete:', error);
    }
  });
};

export const useCriarEtiqueta = () => {
  return useMutation({
    mutationFn: (dados) => criarEtiqueta(dados),
    onError: (error) => {
      console.error('Erro ao criar etiqueta:', error);
    }
  });
};

export const useBaixarEtiqueta = () => {
  return useMutation(baixarEtiqueta);
};