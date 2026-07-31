const fs = require('fs');
let code = fs.readFileSync('src/modules/vendor/pages/ConfiguracoesVendedorPage.tsx', 'utf8');

const target = `      const handleGetLocationFromAddress = async () => {
    setLoadingGeo(true);
    const addressParts = [
      config.address,
      config.number,
      config.neighborhood,
      config.city,
      config.state,
      config.zip_code
    ].filter(Boolean);
    
    const addressStr = addressParts.join(', ');
    
    if (addressParts.length < 3) {
      alert('Por favor, preencha mais detalhes do endereço (Logradouro, Bairro, Cidade) para buscar as coordenadas.');
      setLoadingGeo(false);
      return;
    }

    try {
      const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(addressStr)}\`, {
        headers: {
          'User-Agent': 'AdegaHub/1.0'
        }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setConfig(prev => ({
          ...prev,
          lat: parseFloat(lat).toFixed(6),
          lng: parseFloat(lon).toFixed(6)
        }));
        setSuccessMessage(\`Coordenadas obtidas com sucesso.\`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert('Não foi possível encontrar as coordenadas exatas. Tente adicionar o número ou preencher os campos manualmente.');
      }
    } catch (err) {
      console.warn('Erro ao buscar coordenadas:', err);
      alert('Erro de conexão ao buscar coordenadas.');
    } finally {
      setLoadingGeo(false);
    }
  };: 12000 }
    );
  };`;

const replacement = `  };

  const handleGetLocationFromAddress = async () => {
    setLoadingGeo(true);
    const addressParts = [
      config.address,
      config.number,
      config.neighborhood,
      config.city,
      config.state,
      config.zip_code
    ].filter(Boolean);
    
    const addressStr = addressParts.join(', ');
    
    if (addressParts.length < 3) {
      alert('Por favor, preencha mais detalhes do endereço (Logradouro, Bairro, Cidade) para buscar as coordenadas.');
      setLoadingGeo(false);
      return;
    }

    try {
      const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(addressStr)}\`, {
        headers: {
          'User-Agent': 'AdegaHub/1.0'
        }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setConfig(prev => ({
          ...prev,
          lat: parseFloat(lat).toFixed(6),
          lng: parseFloat(lon).toFixed(6)
        }));
        setSuccessMessage(\`Coordenadas obtidas com sucesso.\`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert('Não foi possível encontrar as coordenadas exatas. Tente adicionar o número ou preencher os campos manualmente.');
      }
    } catch (err) {
      console.warn('Erro ao buscar coordenadas:', err);
      alert('Erro de conexão ao buscar coordenadas.');
    } finally {
      setLoadingGeo(false);
    }
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/modules/vendor/pages/ConfiguracoesVendedorPage.tsx', code);
