import { Review, Category, Banner, SiteSettings } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'relogios-smartwatches',
    name: 'Relógios & Smartwatches',
    slug: 'relogios',
    iconName: 'Watch',
    description: 'Relógios inteligentes, smartbands e relógios de pulso modernos'
  },
  {
    id: 'tech-dispositivos',
    name: 'Tecnologia & Dispositivos',
    slug: 'tecnologia',
    iconName: 'Cpu',
    description: 'Celulares, aparelhos conectados e eletrônicos'
  },
  {
    id: 'informatica-perifericos',
    name: 'Informática & Periféricos',
    slug: 'perifericos',
    iconName: 'Keyboard',
    description: 'Teclados mecânicos, mouses ergonômicos e monitores'
  },
  {
    id: 'casa-inteligente',
    name: 'Casa Inteligente',
    slug: 'casa-inteligente',
    iconName: 'Home',
    description: 'Fritadeiras elétricas, robôs aspiradores e iluminação'
  },
  {
    id: 'audio-fones',
    name: 'Áudio & Fones',
    slug: 'audio',
    iconName: 'Headphones',
    description: 'Fones com cancelamento de ruído e caixas de som de alta definição'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1792627068945',
    slug: 'celular-samsung-galaxy-s26-fe-128gb-8gb-ram-tela-6-7-azul-cobalto',
    title: 'Celular Samsung Galaxy S26 FE 128GB, 8GB RAM Tela 6,7" - Azul cobalto',
    subtitle: 'Análise completa de desempenho, câmera com IA, acabamento premium em metal e tela Dynamic AMOLED.',
    category: 'Tecnologia & Dispositivos',
    coverImage: 'https://http2.mlstatic.com/D_NQ_NP_895608-MLA117138199441_092026-O.webp',
    rating: 5.0,
    priceCurrent: 'R$ 3.599,10',
    priceOriginal: 'R$ 5.499,00',
    discountPercent: '35% de desconto',
    affiliateUrl: 'https://meli.la/165Svx2',
    partnerStore: 'Mercado Livre',
    featured: true,
    otherStores: [],
    pros: [
      'Design elegante com acabamento premium em metal e vidro reforçado',
      'Câmera de flagship com gravação nivelada e recursos avançados de IA para fotos',
      'Processador de última geração para jogos pesados com tela Dynamic AMOLED super fluida',
      'Bateria de longa duração com carregamento rápido de alta eficiência'
    ],
    cons: [
      'Manual de instruções poderia ser mais detalhado para usuários iniciantes',
      'Carregador ultrarrápido vendido separadamente por padrão de sustentabilidade'
    ],
    specifications: [
      { label: 'Tela', value: '6.7 polegadas Dynamic AMOLED 2X 120Hz' },
      { label: 'Memória e Armazenamento', value: '128 GB de armazenamento interno e 8 GB de RAM' },
      { label: 'Câmeras', value: 'Sensor principal de 50 MP com estabilização óptica e zoom avançado' },
      { label: 'Conectividade', value: '5G, Wi-Fi 6E, Bluetooth 5.3 e NFC para pagamentos' },
      { label: 'Garantia', value: '12 meses oficial com nota fiscal nacional' }
    ],
    content: `### Design e Construção Premium\n\nO Galaxy S26 FE une o design consagrado da linha S a um acabamento sofisticado em metal e vidro fosco. A pegada é firme e o tom Azul Cobalto se destaca pela elegância discreta.\n\n### Câmera de Alto Nível com IA\n\nO conjunto de câmeras entrega fotos com excelente nitidez e cores fiéis mesmo em cenários noturnos. O enquadramento automático e a estabilização horizontal garantem gravações sem tremidos.\n\n### Desempenho e Autonomia\n\nEquipado com chip veloz e 8GB de RAM, o aparelho responde instantaneamente a qualquer comando sem engasgos, oferecendo bateria para um dia inteiro de uso intenso.`,
    verdict: 'Uma das melhores opções do mercado para quem busca desempenho de topo de linha com excelente relação custo-benefício.',
    scoreBreakdown: {
      costBenefit: 4.8,
      performance: 4.9,
      buildQuality: 4.9,
      usability: 4.8
    },
    faqs: [
      {
        question: 'O aparelho possui garantia nacional no Brasil?',
        answer: 'Sim, homologado pela Anatel e com garantia total de 12 meses direto pelo fabricante.'
      }
    ],
    viewsCount: 420,
    clicksCount: 38,
    createdAt: '2026-10-22T00:01:53.139Z',
    updatedAt: '2026-10-22T00:03:56.730Z'
  },
  {
    id: 'rev-1792626480972',
    slug: 'notebook-dell-dc15-i51334u-a50-15-6-fhd-i5-8gb-512gb-win-11',
    title: 'Notebook Dell Dc15-i51334u-a50 15.6 Fhd I5 8gb 512gb Win 11',
    subtitle: 'Processador Intel Core i5 de 13ª geração, tela Full HD de 120 Hz e SSD veloz de 512 GB para produtividade.',
    category: 'Informática & Periféricos',
    coverImage: 'https://http2.mlstatic.com/D_NQ_NP_602930-MLA111944189869_052026-O.webp',
    rating: 4.9,
    priceCurrent: 'R$ 4.052,97',
    priceOriginal: 'R$ 5.524,00',
    discountPercent: '27% de desconto',
    affiliateUrl: 'https://meli.la/2v3pZSW',
    partnerStore: 'Mercado Livre',
    featured: false,
    otherStores: [],
    pros: [
      'Processador Intel Core i5 de 13ª geração com velocidade de até 4.6 GHz e 8 GB DDR5',
      'Tela de 15.6 polegadas Full HD com taxa de atualização de 120 Hz para máxima fluidez',
      'Armazenamento SSD NVMe de 512 GB com inicialização instantânea do Windows 11',
      'Chassi leve de apenas 1.63 kg fácil de transportar no dia a dia com portas USB-C e HDMI'
    ],
    cons: [
      'Duração de bateria varia de acordo com o nível de brilho da tela e uso gráfico intenso',
      'Teclado padrão ABNT2 não possui retroiluminação neste modelo específico'
    ],
    specifications: [
      { label: 'Processador', value: 'Intel Core i5-1334U (até 4.6 GHz, 12 MB Cache)' },
      { label: 'Memória RAM', value: '8 GB DDR5 (expansível)' },
      { label: 'Armazenamento', value: 'SSD M.2 NVMe de 512 GB' },
      { label: 'Tela', value: '15.6 polegadas Full HD (1920x1080) 120Hz antirreflexo' },
      { label: 'Sistema Operacional', value: 'Windows 11 Home 64 bits em português' },
      { label: 'Peso', value: '1.63 kg' },
      { label: 'Garantia', value: '12 meses oficial Dell no Brasil' }
    ],
    content: `### Produtividade e Agilidade para Trabalho e Estudos\n\nO Dell Inspiron 15 traz uma combinação potente de processador de 13ª geração e memória DDR5, entregando rapidez no carregamento de planilhas pesadas, navegação com dezenas de abas e programas de edição.\n\n### Tela Fluida de 120Hz\n\nA tela Full HD antirreflexo com taxa de 120Hz é um diferencial notável nessa faixa de preço, reduzindo o cansaço visual e tornando qualquer rolagem muito suave.\n\n### Construção Confiável e Conectividade Completa\n\nO notebook inclui portas USB-C, USB-A tradicionais, HDMI para monitores externos e leitor de cartão SD, pronto para qualquer rotina de escritório.`,
    verdict: 'Excelente notebook para trabalho, estudo e multitarefa diária com a confiabilidade da assistência técnica Dell.',
    scoreBreakdown: {
      costBenefit: 4.8,
      performance: 4.7,
      buildQuality: 4.9,
      usability: 4.8
    },
    faqs: [
      {
        question: 'O notebook já vem com o Windows instalado?',
        answer: 'Sim! Acompanha o Windows 11 Home original já configurado de fábrica em português.'
      }
    ],
    viewsCount: 310,
    clicksCount: 24,
    createdAt: '2026-10-21T23:56:32.057Z',
    updatedAt: '2026-10-21T23:56:32.057Z'
  },
  {
    id: 'rev-01',
    slug: 'teclado-mecanico-sem-fio-ergonomico',
    title: 'Teclado Mecânico Sem Fio com Conexão Tripla: O Melhor para Produtividade e Digitação',
    subtitle: 'Análise aprofundada de construção, teclas com amortecimento acústico especial e bateria de longa duração.',
    category: 'Informática & Periféricos',
    coverImage: '/src/assets/images/review_mechanical_keyboard_1792355762298.jpg',
    rating: 4.9,
    priceCurrent: 'R$ 449,90',
    priceOriginal: 'R$ 599,00',
    discountPercent: '25% de desconto',
    affiliateUrl: 'https://www.amazon.com.br/dp/B0EXAMPLE?tag=achadosreviews-20',
    partnerStore: 'Amazon Brasil',
    couponCode: 'ACHADOS10',
    couponDiscount: 'R$ 30 de desconto no carrinho',
    otherStores: [
      {
        storeName: 'Mercado Livre',
        price: 'R$ 465,00',
        url: 'https://www.mercadolivre.com.br/p/MLBEXAMPLE?tag=achadosreviews-20',
        badge: 'Envio Rápido Grátis'
      },
      {
        storeName: 'Shopee Oficial',
        price: 'R$ 439,00',
        url: 'https://shopee.com.br/product/EXAMPLE?tag=achadosreviews-20',
        badge: 'Cupom de Frete'
      }
    ],
    pros: [
      'Construção em alumínio escovado com sistema de amortecimento acústico interno',
      'Conexão tripla versátil (Bluetooth, receptor sem fio sem atrasos e cabo Tipo-C)',
      'Teclas reforçadas de dupla injeção que não desgastam nem perdem a textura fosca',
      'Bateria recarregável com autonomia real de até 3 semanas de uso diário'
    ],
    cons: [
      'Programa para personalização avançada de atalhos requer instalação no computador',
      'Formato compacto exige curto período de costume para quem usava teclado numérico'
    ],
    specifications: [
      { label: 'Formato', value: 'Compacto 75% (82 teclas + botão giratório de volume em metal)' },
      { label: 'Teclas e Acionadores', value: 'Mecânicos lineares silenciosos e removíveis' },
      { label: 'Conexões', value: 'Sem Fio 2.4 GHz, Bluetooth multiconexão e Cabo USB Tipo-C' },
      { label: 'Bateria', value: '4.000 mAh recarregável de alta durabilidade' },
      { label: 'Isolamento de Ruído', value: 'Camadas de absorção sonora em silicone e espuma de alta densidade' },
      { label: 'Compatibilidade', value: 'Windows, Mac, Linux, celulares e tablets' }
    ],
    content: `
### Por que este teclado se tornou uma das melhores escolhas do mercado?

Nos últimos anos, os teclados para digitação e trabalho evoluíram muito. Os modelos de plástico oco e barulhento deram lugar a projetos com camadas internas de absorção de som, que proporcionam um toque firme e macio.

Neste modelo, a digitação é extremamente confortável desde o primeiro contato. O som de cada clique é suave e uniforme, evitando aquele barulho estridente que cansa os ouvidos e atrapalha colegas ao redor após horas de expediente.

### Experiência de Uso e Conexão Sem Fio

A alternância entre diferentes computadores ou tablets é feita num simples toque de botão na lateral. O pareamento é estável e não apresenta engasgos nem atrasos perceptíveis durante a digitação rápida.

### Autonomia de Bateria na Prática

Com a iluminação suave ativada, a bateria suportou duas semanas completas com 8 horas diárias de trabalho contínuo. Desativando a luz interna, a autonomia superou um mês inteiro longe da tomada.
    `,
    verdict: 'O melhor investimento na faixa de até R$ 500 para quem passa muitas horas digitando e deseja um equipamento durável, silencioso e muito bonito.',
    scoreBreakdown: {
      costBenefit: 4.9,
      performance: 4.8,
      buildQuality: 5.0,
      usability: 4.9
    },
    faqs: [
      {
        question: 'Funciona perfeitamente em computadores Apple e Windows?',
        answer: 'Sim, possui chave física para alternar entre os sistemas e acompanha teclas extras de comando na caixa.'
      },
      {
        question: 'É possível substituir os acionadores no futuro?',
        answer: 'Sim, a placa eletrônica possui soquetes de engate rápido que permitem retirar e colocar novos acionadores sem necessidade de solda.'
      },
      {
        question: 'A compra através do link indicado tem garantia?',
        answer: 'Sim, a loja parceira oficial indicada oferece garantia nacional de 12 meses e direito de devolução garantido.'
      }
    ],
    featured: true,
    viewsCount: 3420,
    clicksCount: 512,
    createdAt: '2026-10-10T14:00:00Z',
    updatedAt: '2026-10-18T10:30:00Z'
  },
  {
    id: 'rev-02',
    slug: 'fritadeira-eletrica-inteligente-visor-duplo',
    title: 'Fritadeira Elétrica Inteligente com Visor Duplo: Praticidade e Tecnologia na Cozinha',
    subtitle: 'Testamos a capacidade ampla de 6 litros, controle à distância e cesto iluminado transparente.',
    category: 'Casa Inteligente',
    coverImage: '/src/assets/images/review_smart_airfryer_1792355763307.jpg',
    rating: 4.8,
    priceCurrent: 'R$ 389,90',
    priceOriginal: 'R$ 529,00',
    discountPercent: '26% de desconto',
    affiliateUrl: 'https://www.amazon.com.br/dp/B0AIRFRYER?tag=achadosreviews-20',
    partnerStore: 'Amazon Brasil',
    couponCode: 'CASA20',
    couponDiscount: 'R$ 20 de desconto para primeira compra',
    otherStores: [
      {
        storeName: 'Magazine Luiza',
        price: 'R$ 399,00',
        url: 'https://www.magazineluiza.com.br/p/EXAMPLE?tag=achadosreviews-20',
        badge: 'Retire na Loja Sem Custo'
      }
    ],
    pros: [
      'Visor duplo de vidro com luz interna que permite acompanhar o cozimento sem abrir o cesto',
      'Conexão com aplicativo que envia lembrete no celular na hora de virar os alimentos',
      'Cesto com revestimento cerâmico antiaderente de limpeza rápida',
      'Funcionamento silencioso e fluxo de ar potente que cozinha de maneira homogênea'
    ],
    cons: [
      'Ocupa espaço considerável na bancada devido à capacidade espaçosa de 6 litros',
      'Cabo de energia poderia ser ligeiramente maior'
    ],
    specifications: [
      { label: 'Capacidade', value: '6 Litros de espaço útil' },
      { label: 'Potência', value: '1800 Watts com aquecimento acelerado' },
      { label: 'Temperatura', value: 'De 40°C a 200°C (com função desidratação)' },
      { label: 'Visor', value: 'Vidro duplo temperado com iluminação por toque' },
      { label: 'Conexão Sem Fio', value: 'Wi-Fi integrado com aplicativo em português' },
      { label: 'Cesto', value: 'Removível, cerâmico e próprio para lava-louças' }
    ],
    content: `
### Chega de queimar receitas abrindo o cesto o tempo todo

O grande diferencial deste modelo é o painel de vidro temperado frontal aliado à lâmpada interna. É possível enxergar o douramento de pães de queijo, carnes e legumes sem perder a temperatura do ar quente.

Durante os nossos testes diários, as receitas ficaram uniformes e crocantes por fora, preservando a maciez e a suculência interna.

### Controle Fácil pelo Celular e no Painel

O aplicativo de controle é intuitivo e inteiramente traduzido para o português. É possível programar o tempo, escolher modos de cozimento e receber uma notificação sonora na hora de agitar os alimentos.

Quem prefere simplicidade pode usar diretamente o painel frontal digital por toque, com botões bem sinalizados e atalhos rápidos de temperatura.
    `,
    verdict: 'Uma das aquisições mais práticas para quem quer economizar tempo e comer de maneira mais saudável e rápida no dia a dia.',
    scoreBreakdown: {
      costBenefit: 4.8,
      performance: 4.9,
      buildQuality: 4.7,
      usability: 5.0
    },
    faqs: [
      {
        question: 'O cesto pode ser higienizado em máquina de lavar louças?',
        answer: 'Sim, tanto a grelha interna quanto a cuba de apoio são compatíveis com lava-louças convencionais.'
      },
      {
        question: 'A fritadeira funciona normalmente se a internet cair?',
        answer: 'Perfeitamente. O painel tátil frontal é completo e funciona 100% de forma independente do celular ou da internet.'
      }
    ],
    featured: true,
    viewsCount: 2890,
    clicksCount: 420,
    createdAt: '2026-10-12T11:20:00Z',
    updatedAt: '2026-10-17T18:00:00Z'
  },
  {
    id: 'rev-03',
    slug: 'fone-sem-fio-cancelamento-ativo-ruido',
    title: 'Fone de Ouvido Sem Fio com Cancelamento de Ruído: Silêncio e Alta Definição',
    subtitle: 'Isolamento acústico com bloqueio de barulhos externos, almofadas macias e até 60 horas de reprodução contínua.',
    category: 'Áudio & Fones',
    coverImage: '/src/assets/images/review_anc_headphones_1792355762654.jpg',
    rating: 4.9,
    priceCurrent: 'R$ 529,90',
    priceOriginal: 'R$ 699,00',
    discountPercent: '24% de desconto',
    affiliateUrl: 'https://www.amazon.com.br/dp/B0HEADPHONE?tag=achadosreviews-20',
    partnerStore: 'Amazon Brasil',
    couponCode: 'AUDIO15',
    couponDiscount: '5% de desconto no pagamento à vista',
    otherStores: [],
    pros: [
      'Cancelamento ativo de ruído de alta precisão que reduz barulho de motores e conversas',
      'Bateria que alcança 60 horas de uso contínuo longe do carregador',
      'Almofadas com espuma viscoelástica que envolvem a orelha sem causar pressão',
      'Som cristalino com graves encorpados e aplicativo com equalizador em português'
    ],
    cons: [
      'O microfone em chamadas na rua perde um pouco de clareza sob vento forte',
      'O estojo de transporte rígido ocupa espaço na mochila'
    ],
    specifications: [
      { label: 'Alto-falantes', value: '40 mm com diafragma de alta fidelidade' },
      { label: 'Isolamento Sonoro', value: 'Cancelamento Ativo Híbrido com Modo Ambiente' },
      { label: 'Autonomia de Bateria', value: 'Até 60 horas com cancelamento desligado ou 45 horas ligado' },
      { label: 'Recarga Rápida', value: '10 minutos no cabo garantem até 5 horas de música' },
      { label: 'Peso', value: '248 gramas' },
      { label: 'Conexão Dupla', value: 'Conecta ao mesmo tempo no computador e no celular' }
    ],
    content: `
### Silêncio e concentração em qualquer lugar

Trabalhar em ambientes movimentados ou viajar no transporte público com frequência exige um fone confortável que bloqueie as distrações.

Este modelo traz microfones internos e externos calibrados para capturar o ruído ambiente e gerar a onda inversa em tempo real, diminuindo sensivelmente zumbidos contínuos de ar-condicionado, tráfego e salas cheias.

### Conforto para longas jornadas

Com hastes almofadadas e conchas que se adaptam ao formato da cabeça, é possível passar o dia inteiro estudando ou trabalhando sem sentir pressão incômoda. O cabo auxiliar de áudio incluso permite continuar ouvindo mesmo se a bateria acabar.
    `,
    verdict: 'Uma das melhores opções de fone circum-aural da atualidade em relação custo-benefício, entregando recursos que antes só existiam em fones muito caros.',
    scoreBreakdown: {
      costBenefit: 5.0,
      performance: 4.8,
      buildQuality: 4.9,
      usability: 4.8
    },
    faqs: [
      {
        question: 'O fone funciona com cabo se a bateria esgotar?',
        answer: 'Sim! Ele vem acompanhado de cabo de áudio padrão P2 de 3,5 mm para uso com fio em qualquer computador ou console.'
      },
      {
        question: 'Posso atender ligações do celular enquanto trabalho no notebook?',
        answer: 'Sim, a tecnologia de conexão dupla alterna automaticamente o som para a chamada quando o telefone toca.'
      }
    ],
    featured: true,
    viewsCount: 4120,
    clicksCount: 680,
    createdAt: '2026-10-14T09:15:00Z',
    updatedAt: '2026-10-18T12:00:00Z'
  },
  {
    id: 'rev-04',
    slug: 'relogio-inteligente-smartwatch-titanium-amoled',
    title: 'Relógio Inteligente Smartwatch com Tela AMOLED, Monitor Cardíaco e Bateria de Longa Duração',
    subtitle: 'Avaliamos a resistência à água de 5 ATM, precisão dos sensores de saúde e autonomia de até 14 dias no pulso.',
    category: 'Relógios & Smartwatches',
    coverImage: '/src/assets/images/review_smartwatch_1792358371097.jpg',
    rating: 4.9,
    priceCurrent: 'R$ 349,90',
    priceOriginal: 'R$ 499,00',
    discountPercent: '30% de desconto',
    affiliateUrl: 'https://www.amazon.com.br/dp/B0SMARTWATCH?tag=achadosreviews-20',
    partnerStore: 'Amazon Brasil',
    couponCode: 'PULSO10',
    couponDiscount: 'R$ 35 de desconto extra no pagamento via Pix',
    otherStores: [
      {
        storeName: 'Mercado Livre',
        price: 'R$ 359,00',
        url: 'https://www.mercadolivre.com.br/p/MLBSMART?tag=achadosreviews-20',
        badge: 'Frete Grátis Mais Rápido'
      },
      {
        storeName: 'Shopee Oficial',
        price: 'R$ 339,00',
        url: 'https://shopee.com.br/product/SMARTWATCH?tag=achadosreviews-20',
        badge: 'Garantia Estendida'
      }
    ],
    pros: [
      'Bateria com autonomia excepcional de até 14 dias longe do carregador magnético',
      'Tela AMOLED nítida com brilho automático e ótima legibilidade mesmo sob luz solar intensa',
      'Monitoramento contínuo de frequência cardíaca, oxigenação no sangue (SpO2) e sono profundo',
      'Resistência à água de 5 ATM permitindo natação e treinos sob chuva intensa sem preocupações'
    ],
    cons: [
      'Histórico completo de métricas corporais exige manter o aplicativo sincronizado diariamente',
      'Pulseira de engate rápido com encaixe de 22 mm requer pulseiras padrão compatíveis'
    ],
    specifications: [
      { label: 'Tela', value: '1.43 polegadas AMOLED tátil de alta definição (466x466 pixels)' },
      { label: 'Resistência à Água', value: '5 ATM / 50 metros (próprio para natação e chuva)' },
      { label: 'Autonomia da Bateria', value: 'Até 14 dias em uso típico ou 7 dias em uso intenso' },
      { label: 'Sensores de Saúde', value: 'Monitor cardíaco contínuo, oxímetro SpO2, acelerômetro e rastreamento de estresse' },
      { label: 'Conectividade', value: 'Bluetooth 5.3 com pareamento estável e notificações instantâneas' },
      { label: 'Material', value: 'Caixa em liga de titânio acetinado e pulseira de silicone confortável' },
      { label: 'Compatibilidade', value: 'Celulares Android e iPhone com aplicativo totalmente em português' },
      { label: 'Garantia', value: '12 meses oficial com nota fiscal nacional' }
    ],
    content: `
### Acabamento Refinado e Conforto no Pulso

Ao colocar este smartwatch no braço, a primeira sensação é de leveza e solidez. A caixa com aro em titânio fosco confere uma elegância discreta que combina tanto com trajes casuais de trabalho quanto com roupas esportivas de treino. A pulseira de silicone macio evita o acúmulo de suor e não causa irritações mesmo após semanas de uso ininterrupto, inclusive durante a noite para rastreamento de sono.

### Tela AMOLED de Alto Brilho e Notificações

O painel AMOLED entrega cores vibrantes e pretos verdadeiros, garantindo excelente leitura de mensagens do WhatsApp, identificação de chamadas e controle de músicas do celular. O sensor de luminosidade ajusta a intensidade da tela automaticamente, evitando ofuscamento à noite e mantendo a visibilidade cristalina sob sol forte.

### Sensores de Saúde e Bateria que Dura Semanas

Nos testes práticos de monitoramento diário, as leituras de batimentos cardíacos e saturação de oxigênio mantiveram precisão consistente frente a monitores dedicados. O maior trunfo, contudo, é a autonomia: com notificações ligadas e medições automáticas ativas, a bateria superou 10 dias de uso direto sem pedir recarga, livrando o usuário da obrigação diária de fios na mesa de cabeceira.
    `,
    verdict: 'Uma das melhores compras da categoria para quem deseja um relógio inteligente bonito, resistente à água e com bateria duradoura sem pagar o valor exorbitante de marcas de luxo.',
    scoreBreakdown: {
      costBenefit: 4.9,
      performance: 4.8,
      buildQuality: 4.9,
      usability: 4.9
    },
    faqs: [
      {
        question: 'O relógio é compatível com celulares Android e iPhone?',
        answer: 'Sim! Funciona perfeitamente em aparelhos Android e iOS através de aplicativo gratuito disponível na loja oficial em português.'
      },
      {
        question: 'Posso tomar banho e nadar usando o relógio?',
        answer: 'Sim, ele possui certificação 5 ATM / 50 metros de profundidade, sendo seguro para chuveiro, natação em piscina e esportes aquáticos.'
      },
      {
        question: 'Como funciona o carregamento da bateria?',
        answer: 'Acompanha cabo magnético de conexão rápida por indução na caixa. Uma carga de 90 minutos completa 100% da bateria.'
      }
    ],
    featured: true,
    viewsCount: 3870,
    clicksCount: 590,
    createdAt: '2026-10-16T15:40:00Z',
    updatedAt: '2026-10-18T14:00:00Z'
  }
];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'ban-header',
    position: 'header',
    title: 'Super Ofertas da Semana – Cupons Exclusivos Verificados',
    imageUrl: '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
    targetUrl: 'https://www.amazon.com.br/b?node=16215417011&tag=achadosreviews-20',
    altText: 'Super Ofertas com Cupons em Lojas Parceiras',
    active: true
  },
  {
    id: 'ban-sidebar',
    position: 'sidebar',
    title: 'Achados do Dia com Desconto nas Lojas Oficiais',
    imageUrl: '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
    targetUrl: 'https://www.amazon.com.br/gp/goldbox?tag=achadosreviews-20',
    altText: 'Ofertas com Descontos Especiais',
    active: true
  },
  {
    id: 'ban-article',
    position: 'in_article',
    title: 'Economize Hoje: Confira as Melhores Promoções em Aberto',
    imageUrl: '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
    targetUrl: 'https://www.amazon.com.br/prime?tag=achadosreviews-20',
    altText: 'Melhores Preços e Descontos Verificados',
    active: true
  }
];

export const INITIAL_SETTINGS: SiteSettings = {
  siteName: 'Achados & Reviews',
  tagline: 'Análises Imparciais, Melhores Preços e Achados Verificados',
  logoUrl: '',
  affiliateDisclosure: 'Aviso de Transparência: O Achados & Reviews participa de programas de afiliados (incluindo Amazon Associados, Shopee e Mercado Livre). Todas as análises são 100% independentes. Ao clicar nos links e realizar compras, podemos receber uma comissão sem qualquer custo adicional para você.',
  headerTrackingCode: '<!-- Códigos de Rastreamento Opcionais -->'
};
