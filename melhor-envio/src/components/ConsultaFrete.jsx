import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { calcularFrete, criarEtiqueta, baixarEtiqueta } from '../services/melhorEnvio';

export const ConsultaFrete = () => {
  // Estado para os dados do formulário
  const [dados, setDados] = useState({
    from: { postal_code: '01001000' }, // CEP origem padrão (SP)
    to: { postal_code: '20040000' },   // CEP destino padrão (RJ)
    package: {
      height: 10,
      width: 10,
      length: 10,
      weight: 0.5
    }
  });

  // Estados do componente
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [etiquetaGerada, setEtiquetaGerada] = useState(null);
  const [mensagem, setMensagem] = useState('');

  // Mutação para cálculo de frete
  const { mutate: calcular, isLoading: calculando, data: opcoesFrete, reset: resetCalculo } = useMutation({
    mutationFn: calcularFrete,
    onSuccess: () => {
        setEtiquetaGerada(null); // Limpa etiqueta anterior ao recalcular
        setFreteSelecionado(null); // Limpa frete selecionado ao recalcular
    },
    onError: (error) => {
      setMensagem(`Erro ao calcular frete: ${error.message}`);
    }
  });

  // Mutação para criação de etiqueta
  const { mutate: gerarEtiqueta, isLoading: gerandoEtiqueta } = useMutation({
    mutationFn: criarEtiqueta,
    onSuccess: (data) => {
      setEtiquetaGerada(data);
      setMensagem('Etiqueta gerada e paga com sucesso! Pronta para impressão.');
    },
    onError: (error) => {
      setMensagem(`Erro ao gerar etiqueta: ${error.message}`);
    }
  });

  // Mutação para download de etiqueta
  const { mutate: baixarEtiquetaPdf, isLoading: baixandoEtiqueta } = useMutation({
    mutationFn: baixarEtiqueta,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiqueta-${etiquetaGerada.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setMensagem('Etiqueta baixada com sucesso!');
    },
    onError: (error) => {
      setMensagem(`Erro ao baixar etiqueta: ${error.message}`);
    }
  });

  // Handler para cálculo de frete
  const handleSubmit = (e) => {
    e.preventDefault();
    setMensagem('');
    resetCalculo(); // Limpa dados da consulta anterior
    calcular(dados);
  };

  // Handler para gerar etiqueta
  const handleGerarEtiqueta = () => {
    if (!freteSelecionado) {
      setMensagem('Selecione uma opção de frete antes de gerar a etiqueta.');
      return;
    }

    setMensagem('Criando pedido...');
    
    // Objeto com todos os dados necessários para a etiqueta
    const dadosCompletos = {
      service: freteSelecionado.id,
      from: {
        postal_code: dados.from.postal_code,
        name: "Sua Loja LTDA",
        phone: "11999999999",
        email: "vendas@suajoja.com.br",
        // Usando um CNPJ de teste válido
        company_document: "99999999000191"
      },
      to: {
        postal_code: dados.to.postal_code,
        name: "Cliente Exemplo",
        phone: "11988888888",
        email: "cliente@exemplo.com",
        // CORREÇÃO: Usando um novo CPF de teste válido
        document: "56717193808"
      },
      products: [
        {
          name: "Produto Vendido",
          unitary_value: 99.90,
          quantity: 1
        }
      ],
      package: {
        height: dados.package.height,
        width: dados.package.width,
        length: dados.package.length,
        weight: dados.package.weight
      }
    };

    gerarEtiqueta(dadosCompletos);
  };

  // Handler para baixar etiqueta
  const handleBaixarEtiqueta = () => {
    if (!etiquetaGerada?.id) {
      setMensagem('Gere a etiqueta primeiro.');
      return;
    }
    baixarEtiquetaPdf(etiquetaGerada.id);
  };

  return (
    <div className="consulta-frete">
      <h2>Consulta de Frete</h2>
      
      {mensagem && (
        <div className={`mensagem ${mensagem.includes('Erro') ? 'erro' : 'sucesso'}`}>
          {mensagem}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            CEP Origem:
            <input
              type="text"
              value={dados.from.postal_code}
              onChange={(e) => setDados({...dados, from: { postal_code: e.target.value }})}
              required
              pattern="\d{8}"
              title="Digite um CEP válido com 8 dígitos"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            CEP Destino:
            <input
              type="text"
              value={dados.to.postal_code}
              onChange={(e) => setDados({...dados, to: { postal_code: e.target.value }})}
              required
              pattern="\d{8}"
              title="Digite um CEP válido com 8 dígitos"
            />
          </label>
        </div>

        <div className="dimensoes">
          <div className="form-group">
            <label>
              Altura (cm):
              <input
                type="number"
                value={dados.package.height}
                onChange={(e) => setDados({...dados, package: {...dados.package, height: Number(e.target.value)}})}
                min="1"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Largura (cm):
              <input
                type="number"
                value={dados.package.width}
                onChange={(e) => setDados({...dados, package: {...dados.package, width: Number(e.target.value)}})}
                min="1"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Comprimento (cm):
              <input
                type="number"
                value={dados.package.length}
                onChange={(e) => setDados({...dados, package: {...dados.package, length: Number(e.target.value)}})}
                min="1"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Peso (kg):
              <input
                type="number"
                step="0.1"
                value={dados.package.weight}
                onChange={(e) => setDados({...dados, package: {...dados.package, weight: Number(e.target.value)}})}
                min="0.1"
                required
              />
            </label>
          </div>
        </div>

        <button type="submit" disabled={calculando}>
          {calculando ? 'Calculando...' : 'Calcular Frete'}
        </button>
      </form>
      
      {opcoesFrete && (
        <div className="opcoes-frete">
          <h3>Opções de Frete:</h3>
          <ul>
            {opcoesFrete.map((opcao) => (
              <li 
                key={opcao.id} 
                className={freteSelecionado?.id === opcao.id ? 'selected' : ''}
                onClick={() => {
                  setFreteSelecionado(opcao);
                  setMensagem('');
                  setEtiquetaGerada(null);
                }}
              >
                <strong>{opcao.name}</strong>
                <div>Preço: R$ {opcao.price}</div>
                <div>Prazo: {opcao.delivery_time} dias</div>
              </li>
            ))}
          </ul>

          {freteSelecionado && (
            <div className="acoes-etiqueta">
              <button 
                onClick={handleGerarEtiqueta}
                disabled={gerandoEtiqueta || !!etiquetaGerada}
                className="gerar-etiqueta-btn"
              >
                {gerandoEtiqueta ? 'Gerando...' : 'Gerar Etiqueta'}
              </button>

              {etiquetaGerada && (
                <button 
                  onClick={handleBaixarEtiqueta}
                  disabled={baixandoEtiqueta}
                  className="baixar-etiqueta-btn"
                >
                  {baixandoEtiqueta ? 'Baixando...' : 'Baixar Etiqueta'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
