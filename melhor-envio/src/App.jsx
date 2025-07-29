import { useState } from 'react';
import { useEffect } from 'react';
import { testarConexao } from './services/melhorEnvio';
import { ConsultaFrete } from './components/ConsultaFrete';
import { GerarEtiqueta } from './components/GerarEtiqueta';
import './App.css';

function App() {

  useEffect(() => {
    testarConexao().then(success => {
      if (!success) {
        alert("Falha na conexão com a API. Verifique o console (F12)");
      }
    });
  }, []);

  const [activeTab, setActiveTab] = useState('frete');

  return (
    <div className="app-container">
      <div className='Titulo'>
      <h1>Integração Melhor Envio</h1>
      </div>
      <div className="tab-content">
        {activeTab === 'frete' ? <ConsultaFrete /> : <GerarEtiqueta />}
      </div>
    </div>
  );
}

export default App;