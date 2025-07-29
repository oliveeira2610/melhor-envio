import axios from 'axios';

const API_KEY = import.meta.env.VITE_MELHOR_ENVIO_API_KEY;
const BASE_URL = import.meta.env.VITE_MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br';

const api = axios.create({
  baseURL: '/api-melhor-envio',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Interceptor para tratamento global de erros
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      console.error('Erro de conexão:', error);
      throw new Error('Não foi possível conectar ao servidor. Verifique sua internet.');
    }
    return Promise.reject(error);
  }
);

// Teste de conexão
export const testarConexao = async () => {
  try {
    const response = await api.get('/me');
    return response.data;
  } catch (error) {
    console.error('Erro na conexão:', error);
    throw new Error('Falha ao conectar com a API. Verifique o token e a conexão.');
  }
};

// Cálculo de frete
export const calcularFrete = async (dados) => {
  try {
    const response = await api.post('/me/shipment/calculate', dados);
    return response.data.filter(op => !op.error); // Filtra opções com erro
  } catch (error) {
    console.error('Erro ao calcular frete:', {
      request: error.config?.data,
      response: error.response?.data
    });
    throw error;
  }
};

/**
 * Calcula o dígito verificador de uma chave de NFe (Módulo 11).
 * @param {string} chave43 - Os 43 primeiros dígitos da chave da NFe.
 * @returns {string} O dígito verificador.
 */
const calcularDigitoVerificador = (chave43) => {
  let soma = 0;
  let peso = 2;
  for (let i = 42; i >= 0; i--) {
    soma += parseInt(chave43.charAt(i)) * peso;
    peso++;
    if (peso > 9) {
      peso = 2;
    }
  }
  const resto = soma % 11;
  let dv = 11 - resto;
  if (dv === 10 || dv === 11 || dv === 0) {
    dv = 0;
  }
  return dv.toString();
};


/**
 * Gera uma chave de NFe modelo 55 válida com 44 dígitos.
 * @param {string} cnpj - O CNPJ do emitente para embutir na chave.
 * @returns {string} A chave da NFe completa.
 */
const gerarChaveNFeValida = (cnpj) => {
    const uf = '35'; // Código do estado (ex: 35 para SP)
    const now = new Date();
    const aamm = now.getFullYear().toString().slice(-2) + (now.getMonth() + 1).toString().padStart(2, '0'); // Formato YYMM
    const cnpjLimpo = cnpj.replace(/\D/g, ''); // Garante que o CNPJ não tem formatação
    const modelo = '55'; // Modelo da NFe
    const serie = '1'.padStart(3, '0'); // Série da NFe
    const numero = String(Math.floor(Math.random() * 999999999) + 1).padStart(9, '0'); // Número da NFe
    const tipoEmissao = '1'; // Tipo de emissão (1 = Normal)
    const codigoNumerico = String(Math.floor(Math.random() * 99999999) + 1).padStart(8, '0'); // Código numérico (cNF)

    const chaveSemDV = `${uf}${aamm}${cnpjLimpo}${modelo}${serie}${numero}${tipoEmissao}${codigoNumerico}`;

    if (chaveSemDV.length !== 43) {
      throw new Error(`A chave gerada sem DV tem tamanho incorreto: ${chaveSemDV.length}`);
    }

    const dv = calcularDigitoVerificador(chaveSemDV);
    return `${chaveSemDV}${dv}`;
};


export const criarEtiqueta = async (dadosEtiqueta) => {
  try {
    // Validação dos campos obrigatórios
    if (!dadosEtiqueta.service || !dadosEtiqueta.from?.postal_code || !dadosEtiqueta.to?.postal_code) {
      throw new Error('Campos obrigatórios faltando: serviço, CEP origem ou CEP destino');
    }
    if (!dadosEtiqueta.from?.company_document) {
        throw new Error('O CNPJ do remetente é obrigatório.');
    }

    const chaveNFe = gerarChaveNFeValida(dadosEtiqueta.from.company_document);

    // Construção do payload completo
    const payload = {
      service: Number(dadosEtiqueta.service),
      agency: null, 
      from: {
        name: dadosEtiqueta.from.name || "Sua Loja LTDA",
        phone: dadosEtiqueta.from.phone || "11999999999",
        email: dadosEtiqueta.from.email || "vendas@suajoja.com.br",
        company_document: dadosEtiqueta.from.company_document.replace(/\D/g, ''),
        postal_code: dadosEtiqueta.from.postal_code.replace(/\D/g, ''),
        address: "Avenida Paulista",
        number: "1000",
        complement: "Sala 1",
        district: "Bela Vista",
        city: "São Paulo",
        state_abbr: "SP",
        country_id: "BR"
      },
      to: {
        name: dadosEtiqueta.to.name || "Cliente Exemplo",
        phone: dadosEtiqueta.to.phone || "11988888888",
        email: dadosEtiqueta.to.email || "cliente@exemplo.com",
        document: dadosEtiqueta.to.document?.replace(/\D/g, ''),
        postal_code: dadosEtiqueta.to.postal_code.replace(/\D/g, ''),
        address: "Avenida Rio Branco",
        number: "200",
        complement: "Apartamento 2",
        district: "Centro",
        city: "Rio de Janeiro",
        state_abbr: "RJ",
        country_id: "BR"
      },
      products: [
        {
          name: dadosEtiqueta.products?.[0]?.name || "Produto Vendido",
          quantity: dadosEtiqueta.products?.[0]?.quantity || 1,
          unitary_value: Number(dadosEtiqueta.products?.[0]?.unitary_value || 99.90),
        }
      ],
      volumes: [
        {
          height: Number(dadosEtiqueta.package?.height || 10),
          width: Number(dadosEtiqueta.package?.width || 10),
          length: Number(dadosEtiqueta.package?.length || 10),
          weight: Number(dadosEtiqueta.package?.weight || 0.5)
        }
      ],
      options: {
        insurance_value: Number(dadosEtiqueta.products?.[0]?.unitary_value || 99.90),
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: true,
        invoice: {
          key: chaveNFe,
        }
      }
    };

    console.log('Payload enviado para /me/cart:', JSON.stringify(payload, null, 2));

    // 1. Adiciona o pedido ao carrinho
    const { data: pedido } = await api.post('/me/cart', payload);
    
    const orderId = pedido?.id;
    if (!orderId) {
      throw new Error('Não foi possível obter o ID do pedido ao adicionar ao carrinho.');
    }

    console.log('Pedido adicionado ao carrinho com sucesso:', orderId);

    // 2. Realiza o "pagamento" do frete no carrinho
    await api.post('/me/shipment/checkout', { orders: [orderId] });
    console.log('Checkout realizado com sucesso para o pedido:', orderId);

    // 3. Solicita a geração da etiqueta
    await api.post('/me/shipment/generate', { orders: [orderId] });
    console.log('Geração da etiqueta solicitada com sucesso para o pedido:', orderId);

    return pedido;

  } catch (error) {
    console.error('Erro detalhado no processo de criação da etiqueta:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    const erros = error.response?.data?.errors || error.response?.data?.error;
    let mensagemErro = error.message;
    if (typeof erros === 'string') {
        mensagemErro = erros;
    } else if (typeof erros === 'object' && erros !== null) {
        mensagemErro = Object.values(erros).flat().join(' ');
    }
    
    throw new Error(mensagemErro);
  }
};


// Download da etiqueta
export const baixarEtiqueta = async (etiquetaId) => {
  try {
    const response = await api.post('/me/shipment/print', {
      mode: 'private',
      orders: [etiquetaId]
    }, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao baixar etiqueta:', error);
    const mensagemErro = error.response?.data?.message || 'Falha no download da etiqueta.';
    throw new Error(mensagemErro);
  }
}
