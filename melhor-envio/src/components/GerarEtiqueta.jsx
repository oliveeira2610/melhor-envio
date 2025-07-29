import { useState } from 'react';
import { useCriarEtiqueta, useBaixarEtiqueta } from '../hooks/useMelhorEnvio';

export const GerarEtiqueta = () => {
  const [pedidoId, setPedidoId] = useState('');
  const [etiquetaId, setEtiquetaId] = useState(null);
  
  const { mutate: criar, isLoading: criando } = useCriarEtiqueta();
  const { mutate: baixar, isLoading: baixando } = useBaixarEtiqueta();

  const handleCriarEtiqueta = () => {
    criar(pedidoId, {
      onSuccess: (data) => {
        setEtiquetaId(data.id);
      }
    });
  };

  const handleBaixarEtiqueta = () => {
    if (etiquetaId) {
      baixar(etiquetaId, {
        onSuccess: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `etiqueta-${pedidoId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    }
  };

  return (
    <div>
      <h2>Gerar Etiqueta</h2>
      <input
        type="text"
        value={pedidoId}
        onChange={(e) => setPedidoId(e.target.value)}
        placeholder="ID do Pedido"
      />
      <button onClick={handleCriarEtiqueta} disabled={criando}>
        {criando ? 'Gerando...' : 'Gerar Etiqueta'}
      </button>
      
      {etiquetaId && (
        <button onClick={handleBaixarEtiqueta} disabled={baixando}>
          {baixando ? 'Baixando...' : 'Baixar Etiqueta'}
        </button>
      )}
    </div>
  );
};