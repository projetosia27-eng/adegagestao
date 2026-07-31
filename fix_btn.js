const fs = require('fs');
let code = fs.readFileSync('src/modules/vendor/components/FormAdegaModal.tsx', 'utf8');

code = code.replace(/onClick=\{handleGetLocation\}/g, 'onClick={handleGetLocationFromAddress}');
code = code.replace(/<Navigation className="w-3\.5 h-3\.5 mr-1\.5" \/>\s*\}\)\}\s*Puxar Minha Localização Atual/g, '<MapPin className="w-3.5 h-3.5 mr-1.5" />\n                      )}\n                      Buscar Coordenadas pelo Endereço');

fs.writeFileSync('src/modules/vendor/components/FormAdegaModal.tsx', code);
