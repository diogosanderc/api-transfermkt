// Mapeamento das posições do Transfermarkt para os códigos brasileiros
const POSITION_MAP = {
  // Goleiros
  'Goalkeeper': { code: 'GOL', label: 'Goleiro' },

  // Defensores
  'Centre-Back': { code: 'DEF', label: 'Zagueiro' },
  'Left-Back': { code: 'DEF', label: 'Lateral Esquerdo' },
  'Right-Back': { code: 'DEF', label: 'Lateral Direito' },
  'Left Wing-Back': { code: 'DEF', label: 'Ala Esquerdo' },
  'Right Wing-Back': { code: 'DEF', label: 'Ala Direito' },

  // Volantes
  'Defensive Midfield': { code: 'VOL', label: 'Volante' },

  // Meias
  'Central Midfield': { code: 'MEI', label: 'Meio-Campo' },
  'Attacking Midfield': { code: 'MEI', label: 'Meia Atacante' },
  'Left Midfield': { code: 'MEI', label: 'Meia Esquerdo' },
  'Right Midfield': { code: 'MEI', label: 'Meia Direito' },

  // Pontas
  'Left Winger': { code: 'PON', label: 'Ponta Esquerda' },
  'Right Winger': { code: 'PON', label: 'Ponta Direita' },

  // Centro-avantes
  'Centre-Forward': { code: 'CA', label: 'Centro Avante' },
  'Second Striker': { code: 'CA', label: 'Segundo Atacante' },
};

function mapPosition(tmPosition) {
  if (!tmPosition) return { code: 'N/A', label: tmPosition || 'Desconhecido' };
  return POSITION_MAP[tmPosition] || { code: 'N/A', label: tmPosition };
}

module.exports = { mapPosition };
