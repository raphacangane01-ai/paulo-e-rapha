// config.js
// Configuração central do app. Nada de credenciais reais aqui: apenas
// placeholders. Quando o Supabase estiver pronto, preencha SUPABASE_URL e
// SUPABASE_ANON_KEY (ou defina window.MEU_CASAMENTO_ENV antes deste script
// para injetar via ambiente de build/hospedagem).

const MEU_CASAMENTO_CONFIG = {
  appName: 'meu-casamento',
  version: '1.0.0',

  // Data e local do casamento (podem ser editados na tela de Configurações)
  weddingDate: '2028-07-08T17:00:00-03:00',
  weddingLocation: 'Januária, MG',
  coupleNames: 'Raphaella e Paulo',

  // Orçamento máximo padrão (editável na tela de Orçamento)
  defaultBudgetCap: 25000,

  // --- Supabase (opcional, ainda não configurado) ---
  // Deixe null para operar 100% offline (localStorage). Quando tiver um
  // projeto Supabase novo, preencha os dois campos abaixo.
  supabase: {
    url: (window.MEU_CASAMENTO_ENV && window.MEU_CASAMENTO_ENV.SUPABASE_URL) || null,
    anonKey: (window.MEU_CASAMENTO_ENV && window.MEU_CASAMENTO_ENV.SUPABASE_ANON_KEY) || null,
  },
};

window.MEU_CASAMENTO_CONFIG = MEU_CASAMENTO_CONFIG;
