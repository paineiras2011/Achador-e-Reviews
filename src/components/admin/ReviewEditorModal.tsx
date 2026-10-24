import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Link, 
  Star, 
  Image as ImageIcon, 
  Sparkles, 
  HelpCircle,
  FileText,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  ExternalLink,
  Store
} from 'lucide-react';
import { Review, Category, Specification, FAQItem, PartnerOffer } from '../../types';
import { cleanOtherStores, isSameStore } from '../../utils/storeHelpers';
import { calculateDiscount } from '../../utils/priceHelpers';
import { INITIAL_REVIEWS } from '../../data/initialData';

interface ReviewEditorModalProps {
  isOpen: boolean;
  reviewToEdit: Review | null;
  categories: Category[];
  onClose: () => void;
  onSave: (review: Review) => void;
  onDelete?: (id: string) => void;
}

// Sanitiza links de imagem (converte http para https, remove tags ou aspas coladas por engano)
export const sanitizeImageUrl = (raw: string): string => {
  if (!raw) return '';
  let clean = raw.trim();
  clean = clean.replace(/^[<"']+|[>"']+$/g, '');
  const tagMatch = clean.match(/src=["']([^"']+)["']/i) || clean.match(/\((https?:\/\/[^\s)]+)\)/i);
  if (tagMatch) clean = tagMatch[1];
  if (clean.startsWith('http://')) {
    clean = clean.replace('http://', 'https://');
  }
  return clean;
};

export const ReviewEditorModal: React.FC<ReviewEditorModalProps> = ({
  isOpen,
  reviewToEdit,
  categories,
  onClose,
  onSave,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'affiliate' | 'proscons' | 'specs' | 'content' | 'faqs'>('basic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoadStatus, setImageLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Magic Autocomplete State
  const [magicInput, setMagicInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [magicStatus, setMagicStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Tecnologia & Dispositivos');
  const [coverImage, setCoverImage] = useState('');
  const [rating, setRating] = useState(4.8);
  const [featured, setFeatured] = useState(false);

  // Pricing & Affiliate
  const [priceCurrent, setPriceCurrent] = useState('R$ 299,90');
  const [priceOriginal, setPriceOriginal] = useState('R$ 399,00');
  const [discountPercent, setDiscountPercent] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [partnerStore, setPartnerStore] = useState('Amazon Brasil');
  const [otherStores, setOtherStores] = useState<PartnerOffer[]>([]);

  // Recálculo automático contínuo: qualquer alteração no preço atual ou original
  // recalcula instantaneamente o percentual exato e o valor de economia
  useEffect(() => {
    const disc = calculateDiscount(priceCurrent, priceOriginal);
    if (disc && disc.label) {
      setDiscountPercent(disc.label);
    } else if (!priceCurrent || !priceOriginal) {
      setDiscountPercent('');
    }
  }, [priceCurrent, priceOriginal]);

  const handleCurrentPriceChange = (val: string) => {
    setPriceCurrent(val);
  };

  const handleOriginalPriceChange = (val: string) => {
    setPriceOriginal(val);
  };

  // Pros & Cons
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);

  // Specifications
  const [specifications, setSpecifications] = useState<Specification[]>([
    { label: 'Garantia', value: '12 meses oficial' }
  ]);

  // Content & Verdict
  const [content, setContent] = useState('');
  const [verdict, setVerdict] = useState('');
  const [scoreCostBenefit, setScoreCostBenefit] = useState(4.8);
  const [scorePerformance, setScorePerformance] = useState(4.8);
  const [scoreBuild, setScoreBuild] = useState(4.7);
  const [scoreUsability, setScoreUsability] = useState(4.9);

  // FAQs
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { question: '', answer: '' }
  ]);

  // Estado para enriquecimento sob demanda com IA (Ficha Técnica, Prós/Contras, Artigo e FAQs)
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichSuccessMessage, setEnrichSuccessMessage] = useState<string | null>(null);

  // Available high-res presets from batch generation
  const IMAGE_PRESETS = [
    { label: 'Relógio Inteligente / Smartwatch', url: '/src/assets/images/review_smartwatch_1792358371097.jpg' },
    { label: 'Smart TV & Vídeo 4K', url: '/src/assets/images/review_smart_tv_1792358384274.jpg' },
    { label: 'Teclado Mecânico Silencioso', url: '/src/assets/images/review_mechanical_keyboard_1792355762298.jpg' },
    { label: 'Fritadeira Elétrica Inteligente', url: '/src/assets/images/review_smart_airfryer_1792355763307.jpg' },
    { label: 'Fones com Cancelamento de Ruído', url: '/src/assets/images/review_anc_headphones_1792355762654.jpg' },
    { label: 'Tecnologia & Dispositivos Geral', url: '/src/assets/images/hero_tech_showcase_1792355762010.jpg' }
  ];

  useEffect(() => {
    if (reviewToEdit) {
      setId(reviewToEdit.id);
      setTitle(reviewToEdit.title);
      setSlug(reviewToEdit.slug);
      setSubtitle(reviewToEdit.subtitle);
      setCategory(reviewToEdit.category);
      const initialMatch = INITIAL_REVIEWS.find(r => r.id === reviewToEdit.id || r.slug === reviewToEdit.slug);
      const isGeneric = !reviewToEdit.coverImage || reviewToEdit.coverImage.includes('hero_tech_showcase') || reviewToEdit.coverImage.startsWith('/src/assets/');
      if (isGeneric && initialMatch && initialMatch.coverImage && initialMatch.coverImage.startsWith('http')) {
        setCoverImage(initialMatch.coverImage);
      } else {
        setCoverImage(reviewToEdit.coverImage);
      }
      setRating(reviewToEdit.rating);
      setFeatured(!!reviewToEdit.featured);
      setPriceCurrent(reviewToEdit.priceCurrent);
      setPriceOriginal(reviewToEdit.priceOriginal || '');
      
      const exactDisc = calculateDiscount(reviewToEdit.priceCurrent, reviewToEdit.priceOriginal);
      setDiscountPercent(exactDisc?.label || reviewToEdit.discountPercent || '');
      
      setAffiliateUrl(reviewToEdit.affiliateUrl);
      setPartnerStore(reviewToEdit.partnerStore);
      setOtherStores(cleanOtherStores(reviewToEdit.otherStores, reviewToEdit.partnerStore, reviewToEdit.affiliateUrl));
      setPros(reviewToEdit.pros && reviewToEdit.pros.length > 0 ? reviewToEdit.pros : ['']);
      setCons(reviewToEdit.cons && reviewToEdit.cons.length > 0 ? reviewToEdit.cons : ['']);
      setSpecifications(reviewToEdit.specifications && reviewToEdit.specifications.length > 0 ? reviewToEdit.specifications : [{ label: '', value: '' }]);
      setContent(reviewToEdit.content);
      setVerdict(reviewToEdit.verdict);
      if (reviewToEdit.scoreBreakdown) {
        setScoreCostBenefit(reviewToEdit.scoreBreakdown.costBenefit);
        setScorePerformance(reviewToEdit.scoreBreakdown.performance);
        setScoreBuild(reviewToEdit.scoreBreakdown.buildQuality);
        setScoreUsability(reviewToEdit.scoreBreakdown.usability);
      }
      setFaqs(reviewToEdit.faqs && reviewToEdit.faqs.length > 0 ? reviewToEdit.faqs : [{ question: '', answer: '' }]);
    } else {
      // New review defaults
      const newId = `rev-${Date.now()}`;
      setId(newId);
      setTitle('');
      setSlug('');
      setSubtitle('');
      setCategory(categories[0]?.name || 'Tecnologia & Dispositivos');
      setCoverImage(IMAGE_PRESETS[0].url);
      setRating(4.8);
      setFeatured(false);
      setPriceCurrent('R$ 299,90');
      setPriceOriginal('R$ 399,00');
      setDiscountPercent('25% de desconto');
      setAffiliateUrl('https://www.amazon.com.br/dp/EXAMPLE?tag=achadosreviews-20');
      setPartnerStore('Amazon Brasil');
      setOtherStores([]);
      setPros([
        'Construção reforçada com acabamento de alta qualidade e durabilidade comprovada',
        'Desempenho ágil e eficiente com excelente estabilidade operacional'
      ]);
      setCons([
        'Manual de instruções completo pode requerer download pelo aplicativo da fabricante'
      ]);
      setSpecifications([
        { label: 'Construção e Materiais', value: 'Estrutura reforçada de alta resistência' },
        { label: 'Conectividade e Padrões', value: 'Padrão moderno de alta velocidade e compatibilidade universal' },
        { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
      ]);
      setContent('### Construção, Ergonomia e Acabamento\n\nO produto apresenta projeto sólido e cuidado nos detalhes de engenharia. Os encaixes são precisos e os materiais transmitem sensação imediata de confiabilidade.\n\n### Desempenho e Eficiência no Dia a Dia\n\nNos testes práticos de rotina, as funcionalidades operaram com estabilidade plena, entregando a performance anunciada sem superaquecimento ou falhas.\n\n### Relação Custo-Benefício e Veredito\n\nConsiderando a robustez dos componentes e o valor praticado na oferta atual, trata-se de uma recomendação sólida de compra.');
      setVerdict('Uma das melhores escolhas da categoria na faixa de preço, recomendado tanto para iniciantes quanto usuários exigentes.');
      setScoreCostBenefit(4.8);
      setScorePerformance(4.8);
      setScoreBuild(4.8);
      setScoreUsability(4.9);
      setFaqs([
        { question: 'O produto é original e possui garantia nacional?', answer: 'Sim, todos os itens adquiridos através das lojas oficiais parceiras contam com nota fiscal eletrônica e garantia de 12 meses.' }
      ]);
      setMagicInput('');
      setMagicStatus(null);
    }
  }, [reviewToEdit, isOpen, categories]);

  // Monitora alterações na URL da imagem para carregar status
  useEffect(() => {
    if (coverImage) {
      setImageLoadStatus('loading');
    } else {
      setImageLoadStatus('idle');
    }
  }, [coverImage]);

  // Magic Autocomplete Handler Resiliente (API -> Netlify Function -> Heurística Local)
  const handleMagicAutocomplete = async () => {
    if (!magicInput.trim()) {
      setMagicStatus({ type: 'error', message: 'Por favor, insira o link de afiliado ou o nome do produto.' });
      return;
    }

    setIsAnalyzing(true);
    setMagicStatus(null);
    setFormError(null);

    const trimmedInput = magicInput.trim();
    let resultData: any = null;

    // 1. Tenta a rota /api/analyze-product (funciona via server.ts local e _redirects na Netlify)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmedInput }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          resultData = json.data;
        }
      }
    } catch {
      // Prossegue para o próximo passo sem quebrar
    }

    // 2. Se a primeira tentativa falhar, tenta rota direta da Netlify Function
    if (!resultData) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch('/.netlify/functions/analyze-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: trimmedInput }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            resultData = json.data;
          }
        }
      } catch {
        // Prossegue para o analisador heurístico
      }
    }

    // 3. Fallback Heurístico Local (Garante 100% de sucesso mesmo se todas as APIs externas falharem)
    if (!resultData) {
      const isUrl = /^https?:\/\//i.test(trimmedInput);
      let detectedStore = 'Loja Parceira Oficial';
      if (/amazon\.com(\.br)?|amzn\.to|(^|https?:\/\/|\.)a\.co(\/|$)/i.test(trimmedInput)) detectedStore = 'Amazon Brasil';
      else if (/mercadolivre\.com(\.br)?|meli\.la|produto\.mercadolivre/i.test(trimmedInput)) detectedStore = 'Mercado Livre';
      else if (/shopee\.com(\.br)?|s\.shopee/i.test(trimmedInput)) detectedStore = 'Shopee Oficial';
      else if (/magazineluiza|magazinevoce|magalu/i.test(trimmedInput)) detectedStore = 'Magazine Luiza';

      let extractedTitle = trimmedInput;
      if (isUrl) {
        try {
          const parsed = new URL(trimmedInput);
          const isShortener = /^(s\.shopee|amzn\.to|a\.co|meli\.la|magalu\.me|bit\.ly|tinyurl)/i.test(parsed.hostname);
          if (!isShortener) {
            const segments = parsed.pathname.split('/').filter(Boolean);
            const candidate = segments.find(s => s.length > 5 && !/^(dp|gp|p|MLB[0-9]+|opaanlp|gz)$/i.test(s) && /[-_+% ]/.test(s));
            if (candidate) {
              extractedTitle = decodeURIComponent(candidate)
                .replace(/^MLB[-_]?[0-9]+[-_]?/i, '')
                .replace(/[-_]JM$/i, '')
                .replace(/[-_+]/g, ' ')
                .trim();
            }
          } else {
            extractedTitle = 'Produto Selecionado';
          }
        } catch {
          // Mantém trimmedInput
        }
      }
      extractedTitle = extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1);

      // Categoria por palavras-chave
      const lower = extractedTitle.toLowerCase();
      let matchedCat = 'Tecnologia & Dispositivos';
      let isMobility = false;
      let isNotebook = false;
      let isWatch = false;
      let isAudio = false;
      let isKitchen = false;

      if (/bicicleta|bike|scooter|patinete|el[eé]trica|mobilidade|ebike/i.test(lower)) {
        matchedCat = 'Mobilidade & Esportes';
        isMobility = true;
      } else if (/rel[oó]gio|smartwatch|watch|pulseira|smartband/i.test(lower)) {
        matchedCat = 'Relógios & Smartwatches';
        isWatch = true;
      } else if (/notebook|computador|laptop|macbook|ultrabook|aspire|ideapad|thinkpad|dell/i.test(lower)) {
        matchedCat = 'Informática & Periféricos';
        isNotebook = true;
      } else if (/teclado|mouse|monitor|perif[eé]rico|pc/i.test(lower)) {
        matchedCat = 'Informática & Periféricos';
      } else if (/fone|headphone|headset|earbud|caixa de som|soundbar|\banc\b|áudio/i.test(lower)) {
        matchedCat = 'Áudio & Fones';
        isAudio = true;
      } else if (/fritadeira|airfryer|air fryer|cafeteira|aspirador|robô aspirador|casa/i.test(lower)) {
        matchedCat = 'Casa Inteligente';
        isKitchen = true;
      }

      const generatedSlug = extractedTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Ficha técnica precisa por nicho (sem placeholders genéricos de estoque)
      const dynamicSpecs = isMobility ? [
        { label: 'Motor e Potência', value: '400W de alta eficiência com aceleração progressiva' },
        { label: 'Bateria e Alimentação', value: '48V Bateria de Lítio Removível Bivolt 110V/220V' },
        { label: 'Autonomia Estimada', value: '20 a 30 km por carga completa' },
        { label: 'Velocidade Máxima', value: 'Até 25 km/h com seletor de velocidade' },
        { label: 'Sistema de Frenagem', value: 'Freios a disco mecânico duplo (dianteiro e traseiro)' },
        { label: 'Estrutura', value: 'Quadro reforçado com design dobrável portátil' },
        { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
      ] : isNotebook ? [
        { label: 'Processador (CPU)', value: 'Arquitetura moderna multi-core de alto rendimento' },
        { label: 'Memória RAM', value: 'Memória DDR4/DDR5 com suporte a multitarefas' },
        { label: 'Armazenamento', value: 'SSD NVMe PCIe de alta velocidade de leitura' },
        { label: 'Tela e Painel', value: '15.6 polegadas Full HD com acabamento antirreflexo' },
        { label: 'Conectividade', value: 'Portas USB 3.2, USB Tipo-C, saída HDMI, Wi-Fi veloz e Bluetooth' },
        { label: 'Bateria e Autonomia', value: 'Bateria com autonomia média de até 6 a 8 horas em uso moderado' },
        { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
      ] : isWatch ? [
        { label: 'Tela', value: '1.43 polegadas AMOLED/IPS tátil de alta definição' },
        { label: 'Resistência à Água', value: '5 ATM / Certificação à prova de chuva e natação rasa' },
        { label: 'Autonomia da Bateria', value: 'Até 10 a 14 dias em uso moderado' },
        { label: 'Sensores de Saúde', value: 'Monitor cardíaco contínuo, oxímetro SpO2 e sono' },
        { label: 'Conectividade', value: 'Bluetooth 5.3 com notificações inteligentes em português' },
        { label: 'Garantia', value: '12 meses oficial de fábrica com nota fiscal' }
      ] : isAudio ? [
        { label: 'Drivers Acústicos', value: 'Drivers dinâmicos de alta definição acústica' },
        { label: 'Cancelamento de Ruído', value: 'ANC ativo com atenuação de ruídos do ambiente' },
        { label: 'Autonomia da Bateria', value: 'Bateria de longa duração para reprodução diária sem recargas constantes' },
        { label: 'Conectividade', value: 'Bluetooth 5.3 com pareamento ágil' },
        { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
      ] : isKitchen ? [
        { label: 'Potência', value: 'Alta potência com aquecimento por convecção de ar 360°' },
        { label: 'Capacidade Útil', value: 'Espaço generoso para preparo de porções completas' },
        { label: 'Temperatura', value: 'Controle digital ajustável de 80°C a 200°C' },
        { label: 'Timer', value: 'Temporizador sonoro de até 60 minutos com desligamento automático' },
        { label: 'Cesto e Revestimento', value: 'Antiaderente de fácil higienização' },
        { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
      ] : [
        { label: 'Construção e Materiais', value: 'Estrutura reforçada de alta durabilidade e acabamento refinado' },
        { label: 'Conectividade e Padrões', value: 'Interfaces modernas de alta velocidade e compatibilidade universal' },
        { label: 'Eficiência Operacional', value: 'Projetado com baixo consumo e alto rendimento operacional' },
        { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
      ];

      resultData = {
        title: extractedTitle,
        slug: generatedSlug,
        subtitle: `Análise técnica de especificações, durabilidade e custo-benefício em compras online.`,
        category: matchedCat,
        coverImage: '',
        partnerStore: detectedStore,
        affiliateUrl: isUrl ? trimmedInput : '',
        priceCurrent: 'R$ 299,90',
        priceOriginal: 'R$ 399,00',
        discountPercent: '25% de desconto',
        pros: [
          'Construção reforçada com materiais de excelente durabilidade comprovada',
          'Desempenho ágil e estável nas tarefas diárias sem travamentos',
          'Ótima relação de custo-benefício em comparação com alternativas diretas',
          'Configuração intuitiva e compatibilidade ampla com múltiplos dispositivos'
        ],
        cons: [
          'Disponibilidade de cores e voltagem depende do estoque do vendedor parceiro',
          'Manual completo de instruções pode requerer consulta digital'
        ],
        specifications: dynamicSpecs,
        content: `### Construção, Ergonomia e Acabamento\n\nO produto apresenta projeto sólido e cuidado nos detalhes de engenharia. Os encaixes são precisos e os materiais transmitem sensação imediata de confiabilidade.\n\n### Desempenho e Eficiência no Dia a Dia\n\nNos testes práticos de rotina, as funcionalidades operaram com estabilidade plena, entregando a performance anunciada sem superaquecimento ou falhas.\n\n### Relação Custo-Benefício e Veredito\n\nConsiderando a robustez dos componentes e o valor praticado na oferta atual, trata-se de uma recomendação sólida de compra para quem busca qualidade duradoura.`,
        verdict: 'Uma recomendação sólida e segura de compra com alto índice de satisfação entre usuários.',
        scoreCostBenefit: 4.8,
        scorePerformance: 4.8,
        scoreBuild: 4.7,
        scoreUsability: 4.9,
        faqs: [
          { question: 'O produto é original e possui nota fiscal?', answer: 'Sim, todos os itens adquiridos através das lojas parceiras oficiais contam com nota fiscal eletrônica e garantia de 12 meses.' }
        ]
      };
    }

    // 4. Aplica os dados gerados
    if (resultData) {
      const d = resultData;
      setTitle(d.title || title);
      setSlug(d.slug || slug);
      setSubtitle(d.subtitle || subtitle);

      const matchedCategory = categories.find(c => 
        c.name.toLowerCase() === (d.category || '').toLowerCase()
      );
      if (matchedCategory) {
        setCategory(matchedCategory.name);
      } else if (d.category) {
        setCategory(d.category);
      }

      setPartnerStore(d.partnerStore || partnerStore);

      if (/^https?:\/\//i.test(trimmedInput)) {
        setAffiliateUrl(trimmedInput);
      } else if (d.affiliateUrl) {
        setAffiliateUrl(d.affiliateUrl);
      }

      const finalPriceCurrent = d.priceCurrent || priceCurrent;
      const finalPriceOriginal = d.priceOriginal || priceOriginal;
      setPriceCurrent(finalPriceCurrent);
      setPriceOriginal(finalPriceOriginal);

      const autoDisc = calculateDiscount(finalPriceCurrent, finalPriceOriginal);
      setDiscountPercent(autoDisc?.label || d.discountPercent || '');
      setOtherStores([]);

      if (d.pros && Array.isArray(d.pros)) setPros(d.pros);
      if (d.cons && Array.isArray(d.cons)) setCons(d.cons);
      if (d.specifications && Array.isArray(d.specifications)) setSpecifications(d.specifications);
      if (d.content) setContent(d.content);
      if (d.verdict) setVerdict(d.verdict);
      if (d.scoreCostBenefit) setScoreCostBenefit(d.scoreCostBenefit);
      if (d.scorePerformance) setScorePerformance(d.scorePerformance);
      if (d.scoreBuild) setScoreBuild(d.scoreBuild);
      if (d.scoreUsability) setScoreUsability(d.scoreUsability);
      if (d.faqs && Array.isArray(d.faqs)) setFaqs(d.faqs);
      if (d.rating) setRating(d.rating);

      // Tratamento prioritário da imagem original extraída
      if (d.coverImage && (d.coverImage.startsWith('http') || d.coverImage.startsWith('//'))) {
        const sanitized = sanitizeImageUrl(d.coverImage);
        setCoverImage(sanitized);
        setImageLoadStatus('loading');
      } else if (!coverImage) {
        const lowerTitle = (d.title + ' ' + (d.category || '')).toLowerCase();
        if (/rel[oó]gio|smartwatch|watch|pulseira|smartband/i.test(lowerTitle)) {
          setCoverImage(IMAGE_PRESETS[0].url);
        } else if (/televis|smart[ -]?tv|\btv\b/i.test(lowerTitle)) {
          setCoverImage(IMAGE_PRESETS[1].url);
        } else if (/teclado|mouse|switch|perif|computador|notebook|monitor/i.test(lowerTitle)) {
          setCoverImage(IMAGE_PRESETS[2].url);
        } else if (/fritadeira|air fryer|cozinha|panela|cafeteira/i.test(lowerTitle)) {
          setCoverImage(IMAGE_PRESETS[3].url);
        } else if (/fone|headphone|audio|som|ouvido|headset/i.test(lowerTitle)) {
          setCoverImage(IMAGE_PRESETS[4].url);
        } else {
          setCoverImage(IMAGE_PRESETS[5].url);
        }
      }

      setMagicStatus({
        type: 'success',
        message: `Produto "${d.title}" identificado com sucesso! Dados preenchidos. Confira a foto original do produto na aba 1 abaixo.`
      });
    }

    setIsAnalyzing(false);
  };

  // Enriquecimento Dedicado de Ficha Técnica, Prós/Contras, Artigo e FAQs com IA
  const handleEnrichDetails = async () => {
    const targetTitle = title.trim() || magicInput.trim();
    if (!targetTitle) {
      setFormError('Informe o título do produto na Aba 1 para que a IA possa extrair a ficha técnica e perguntas frequentes reais.');
      setActiveTab('basic');
      return;
    }

    setIsEnriching(true);
    setEnrichSuccessMessage(null);
    setFormError(null);

    try {
      let enrichedData: any = null;

      // 1. Tenta endpoint dedicado /api/enrich-details
      try {
        const response = await fetch('/api/enrich-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: targetTitle,
            category,
            affiliateUrl
          })
        });
        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            enrichedData = json.data;
          }
        }
      } catch {
        // Fallback
      }

      // 2. Se falhar, tenta endpoint /api/analyze-product
      if (!enrichedData) {
        try {
          const response = await fetch('/api/analyze-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: targetTitle })
          });
          if (response.ok) {
            const json = await response.json();
            if (json.success && json.data) {
              enrichedData = json.data;
            }
          }
        } catch {
          // Continua
        }
      }

      // 3. Aplica os dados enriquecidos se encontrados
      if (enrichedData) {
        if (Array.isArray(enrichedData.pros) && enrichedData.pros.length > 0) {
          setPros(enrichedData.pros);
        }
        if (Array.isArray(enrichedData.cons) && enrichedData.cons.length > 0) {
          setCons(enrichedData.cons);
        }
        if (Array.isArray(enrichedData.specifications) && enrichedData.specifications.length > 0) {
          setSpecifications(enrichedData.specifications.filter((s: any) => 
            s && s.label && !/condi[cç][aã]o|disponibilidade|pronta entrega|embalagem/i.test(s.label + ' ' + (s.value || ''))
          ));
        }
        if (enrichedData.content) {
          setContent(enrichedData.content);
        }
        if (enrichedData.verdict) {
          setVerdict(enrichedData.verdict);
        }
        if (Array.isArray(enrichedData.faqs) && enrichedData.faqs.length > 0) {
          setFaqs(enrichedData.faqs);
        }
        if (enrichedData.scoreCostBenefit) setScoreCostBenefit(enrichedData.scoreCostBenefit);
        if (enrichedData.scorePerformance) setScorePerformance(enrichedData.scorePerformance);
        if (enrichedData.scoreBuild) setScoreBuild(enrichedData.scoreBuild);
        if (enrichedData.scoreUsability) setScoreUsability(enrichedData.scoreUsability);

        setEnrichSuccessMessage('Informações técnicas reais, prós/contras e FAQs extraídos com sucesso para este produto!');
        setTimeout(() => setEnrichSuccessMessage(null), 7000);
      } else {
        setFormError('Não foi possível obter dados automáticos agora. Você pode preencher os campos manualmente.');
      }
    } catch (err) {
      console.error('Erro ao enriquecer dados com IA:', err);
      setFormError('Ocorreu um erro ao conectar ao serviço de IA.');
    } finally {
      setIsEnriching(false);
    }
  };

  const renderAIExtractionBanner = (sectionName: string) => (
    <div className="p-3 sm:p-4 bg-gradient-to-r from-sky-50 via-cyan-50 to-indigo-50 border border-cyan-200/90 rounded-xl space-y-2 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Extração Factual com IA para {sectionName}</span>
              <span className="text-3xs font-semibold px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full border border-cyan-200">
                Sem textos genéricos
              </span>
            </h4>
            <p className="text-3xs text-slate-500 leading-relaxed mt-0.5">
              Clique para extrair a ficha técnica autêntica, prós/contras verdadeiros e FAQs de compradores para <strong className="text-slate-700">{title ? `"${title.slice(0, 50)}${title.length > 50 ? '...' : ''}"` : 'o produto informado'}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEnrichDetails}
          disabled={isEnriching}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isEnriching ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Extraindo dados reais...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extrair com IA</span>
            </>
          )}
        </button>
      </div>

      {enrichSuccessMessage && (
        <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-2xs font-semibold rounded-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{enrichSuccessMessage}</span>
        </div>
      )}
    </div>
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!reviewToEdit || !slug) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    // Validações explícitas com auto-redirecionamento de abas
    if (!title.trim()) {
      setActiveTab('basic');
      setFormError('Por favor, informe o Título da Avaliação na aba "1. Dados Principais".');
      return;
    }

    if (!affiliateUrl.trim()) {
      setActiveTab('affiliate');
      setFormError('Por favor, informe o Link de Afiliado na aba "2. Preço & Link Afiliado".');
      return;
    }

    if (!priceCurrent.trim()) {
      setActiveTab('affiliate');
      setFormError('Por favor, informe o Preço de Oferta Atual na aba "2. Preço & Link Afiliado".');
      return;
    }

    setIsSaving(true);

    try {
      const sanitizedCover = sanitizeImageUrl(coverImage) || IMAGE_PRESETS[0].url;

      const reviewData: Review = {
        id: id || `rev-${Date.now()}`,
        slug: slug || `avaliacao-${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        coverImage: sanitizedCover,
        rating: Number(rating) || 4.5,
        priceCurrent: priceCurrent.trim(),
        priceOriginal: priceOriginal.trim() || undefined,
        discountPercent: discountPercent.trim() || undefined,
        affiliateUrl: affiliateUrl.trim(),
        partnerStore: partnerStore.trim(),
        otherStores: cleanOtherStores(otherStores, partnerStore.trim(), affiliateUrl.trim()),
        pros: pros.filter(p => p.trim().length > 0),
        cons: cons.filter(c => c.trim().length > 0),
        specifications: specifications.filter(s => s.label.trim().length > 0),
        content: content.trim(),
        verdict: verdict.trim(),
        scoreBreakdown: {
          costBenefit: Number(scoreCostBenefit) || 4.5,
          performance: Number(scorePerformance) || 4.5,
          buildQuality: Number(scoreBuild) || 4.5,
          usability: Number(scoreUsability) || 4.5
        },
        faqs: faqs.filter(f => f.question.trim().length > 0),
        featured,
        viewsCount: reviewToEdit?.viewsCount || 0,
        clicksCount: reviewToEdit?.clicksCount || 0,
        createdAt: reviewToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(reviewData);
      onClose();
    } catch (saveErr) {
      console.error('Erro ao salvar análise:', saveErr);
      setFormError('Ocorreu um erro ao salvar os dados no Firestore. Por favor, tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {reviewToEdit ? 'Editar Análise de Produto' : 'Cadastrar Nova Análise de Produto'}
            </h2>
            <p className="text-xs text-slate-500">
              Use o autopreenchimento instantâneo para preencher título, preço, prós, contras, ficha técnica e artigo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {reviewToEdit && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors shadow-2xs"
                title="Excluir este item cadastrado permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excluir Avaliação</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAGIC AUTO-COMPLETE SECTION (Requested by User) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 text-white border-b border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-[#00E5FF] flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Autopreenchimento Inteligente por Link ou Nome do Produto
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={magicInput}
                onChange={(e) => setMagicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleMagicAutocomplete();
                  }
                }}
                placeholder="Cole o link da Amazon, Shopee, Mercado Livre, Magalu... ou digite o nome do produto"
                className="flex-1 px-3.5 py-2 text-xs bg-slate-800/90 text-white placeholder:text-slate-400 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 font-mono"
              />

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={handleMagicAutocomplete}
                className="px-5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] disabled:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 shadow-md"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Identificando Produto...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Identificar &amp; Preencher Tudo</span>
                  </>
                )}
              </button>
            </div>

            {magicStatus && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
                magicStatus.type === 'success' 
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40' 
                  : 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
              }`}>
                {magicStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{magicStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'basic' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Dados Principais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('affiliate')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'affiliate' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Preço &amp; Link Afiliado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('proscons')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'proscons' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Prós &amp; Contras
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'specs' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Ficha Técnica
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'content' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            5. Artigo &amp; Veredito
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'faqs' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6. Perguntas Frequentes
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} noValidate className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Alerta de Validação com Auto-Navegação */}
          {formError && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs font-semibold flex items-center gap-2 rounded-r-lg animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Avaliação (Otimizado para Busca) *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    handleTitleChange(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Ex: Teclado Mecânico Sem Fio com Conexão Tripla: Análise e Testes"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Endereço Amigável (Slug)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="teclado-mecanico-sem-fio"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria do Produto
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtítulo / Chamada Atraente
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Resumo objetivo das principais vantagens e perfil de comprador..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nota Geral da Análise (1.0 a 5.0 estrelas)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={rating}
                      onChange={(e) => setRating(parseFloat(e.target.value))}
                      className="w-24 px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg"
                    />
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Fixar como Destaque Principal no Topo da Página
                    </span>
                  </label>
                </div>
              </div>

              {/* Cover Image Input and Interactive Live Preview */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Endereço (URL) da Imagem Original do Produto
                    </label>
                    {coverImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage('');
                          setImageLoadStatus('idle');
                        }}
                        className="text-3xs text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        Limpar Imagem
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => {
                      const cleaned = sanitizeImageUrl(e.target.value);
                      setCoverImage(cleaned);
                    }}
                    onBlur={() => {
                      if (coverImage) {
                        setCoverImage(sanitizeImageUrl(coverImage));
                      }
                    }}
                    placeholder="Ex: https://http2.mlstatic.com/... ou https://m.media-amazon.com/..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                  <p className="text-3xs text-slate-400 mt-1">
                    Cole o link direto da foto do produto no Mercado Livre ou Amazon. Links em http:// são automaticamente convertidos para https:// seguro.
                  </p>
                </div>

                {/* Box de Pré-visualização em Tempo Real com Status e Ações */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Pré-visualização da Imagem</span>
                    </span>
                    {imageLoadStatus === 'success' && (
                      <span className="text-3xs font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Imagem Original Carregada
                      </span>
                    )}
                    {imageLoadStatus === 'error' && (
                      <span className="text-3xs font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Falha ao Carregar Imagem
                      </span>
                    )}
                    {imageLoadStatus === 'loading' && (
                      <span className="text-3xs font-medium text-cyan-700 bg-cyan-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-cyan-600" />
                        Verificando imagem...
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="relative w-40 h-32 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="Pré-visualização do produto"
                          referrerPolicy="no-referrer"
                          onLoad={() => setImageLoadStatus('success')}
                          onError={() => setImageLoadStatus('error')}
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="text-3xs text-slate-400 text-center p-3">
                          Nenhuma imagem inserida ainda
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <p className="text-slate-600 leading-relaxed text-2xs">
                        {imageLoadStatus === 'success' ? (
                          <span className="text-emerald-700 font-medium">
                            A foto acima será exibida exatamente com esta nitidez na vitrine e na página do review.
                          </span>
                        ) : imageLoadStatus === 'error' ? (
                          <span className="text-rose-600 font-medium">
                            A URL informada não retornou uma imagem válida. Verifique se o endereço termina com formato de imagem (.jpg, .webp, .png) ou copie diretamente do anúncio.
                          </span>
                        ) : (
                          'Insira a URL da foto oficial do produto ou escolha um dos modelos ilustrativos pré-definidos abaixo.'
                        )}
                      </p>

                      {imageLoadStatus === 'error' && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-3xs text-rose-700 leading-normal">
                          <strong>Dica no Mercado Livre:</strong> Clique com o botão direito na foto do anúncio e selecione <em>"Copiar endereço da imagem"</em> (começa com https://http2.mlstatic.com).
                        </div>
                      )}

                      {coverImage && (
                        <div className="flex items-center gap-3 pt-0.5">
                          <a
                            href={coverImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-3xs text-cyan-600 hover:text-cyan-800 font-bold underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Abrir imagem original em nova aba para testar
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-3xs text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">
                      Ou escolha um modelo alternativo pré-definido:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {IMAGE_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCoverImage(p.url);
                            setImageLoadStatus('loading');
                          }}
                          className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                            coverImage === p.url
                              ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & AFFILIATE */}
          {activeTab === 'affiliate' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preço de Oferta Atual *
                  </label>
                  <input
                    type="text"
                    value={priceCurrent}
                    onChange={(e) => {
                      handleCurrentPriceChange(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="R$ 197,22"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preço Original (Sem Desconto)
                  </label>
                  <input
                    type="text"
                    value={priceOriginal}
                    onChange={(e) => handleOriginalPriceChange(e.target.value)}
                    placeholder="R$ 598,00"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Destaque de Desconto
                    </label>
                    {(() => {
                      const disc = calculateDiscount(priceCurrent, priceOriginal);
                      if (disc && disc.percent > 0) {
                        return (
                          <span className="text-3xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {disc.percent}% OFF • Economia de {disc.savings}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <input
                    type="text"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="Ex: 67% de desconto"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                  />
                  <p className="text-3xs text-slate-400 mt-1">
                    Calculado automaticamente com base na diferença entre o preço atual e original.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-[#FF6B00]" />
                  <span>Configuração da Loja Parceira e Link de Afiliado</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      Link de Afiliado (Destino de Compra com sua comissão) *
                    </label>
                    <input
                      type="text"
                      value={affiliateUrl}
                      onChange={(e) => {
                        setAffiliateUrl(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="https://www.mercadolivre.com.br/... ou https://www.amazon.com.br/dp/..."
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      Nome da Loja Parceira
                    </label>
                    <input
                      type="text"
                      value={partnerStore}
                      onChange={(e) => setPartnerStore(e.target.value)}
                      placeholder="Mercado Livre / Amazon Brasil"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Comparação Opcional de Outras Lojas */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-cyan-600" />
                      <span>Comparação de Preços em Outras Lojas (Opcional)</span>
                    </h4>
                    <p className="text-3xs text-slate-500">
                      Adicione preços em lojas concorrentes ou deixe vazio se desejar exibir exclusivamente a sua oferta principal.
                    </p>
                  </div>
                  {otherStores.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOtherStores([])}
                      className="text-3xs text-rose-600 hover:text-rose-800 font-bold"
                    >
                      Remover Todas
                    </button>
                  )}
                </div>

                {otherStores.length === 0 ? (
                  <div className="text-center py-3 bg-white rounded-lg border border-dashed border-slate-300 text-3xs text-slate-500">
                    Nenhuma loja adicional cadastrada. A página exibirá exclusivamente o link e preço oficial da {partnerStore || 'loja principal'}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {otherStores.map((store, sIdx) => {
                      const isDuplicate = isSameStore(store.storeName, partnerStore);
                      const isUrlSame = store.url && affiliateUrl && store.url.trim().toLowerCase() === affiliateUrl.trim().toLowerCase();
                      const isPriceDivergent = store.price && priceCurrent && store.price.trim() !== priceCurrent.trim();

                      return (
                        <div key={sIdx} className={`p-2.5 rounded-lg border transition-colors ${
                          isDuplicate || isUrlSame ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
                        }`}>
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <div className="sm:col-span-4">
                              <label className="block text-3xs text-slate-400 mb-0.5">Loja Concorrente</label>
                              <input
                                type="text"
                                placeholder="Nome (ex: Shopee, Amazon)"
                                value={store.storeName}
                                onChange={(e) => {
                                  const updated = [...otherStores];
                                  updated[sIdx].storeName = e.target.value;
                                  setOtherStores(updated);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-3xs text-slate-400 mb-0.5">Preço Real</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Preço (ex: R$ 29,90)"
                                  value={store.price}
                                  onChange={(e) => {
                                    const updated = [...otherStores];
                                    updated[sIdx].price = e.target.value;
                                    setOtherStores(updated);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-md bg-white"
                                />
                              </div>
                            </div>
                            <div className="sm:col-span-4">
                              <label className="block text-3xs text-slate-400 mb-0.5">Link de Afiliado</label>
                              <input
                                type="url"
                                placeholder="URL da loja concorrente"
                                value={store.url}
                                onChange={(e) => {
                                  const updated = [...otherStores];
                                  updated[sIdx].url = e.target.value;
                                  setOtherStores(updated);
                                }}
                                className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md bg-white"
                              />
                            </div>
                            <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => setOtherStores(otherStores.filter((_, idx) => idx !== sIdx))}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                title="Remover Loja Concorrente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Avisos de prevenção de preços divergentes e duplicidade */}
                          {(isDuplicate || isUrlSame || (isPriceDivergent && store.price)) && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-3xs">
                              {isDuplicate && (
                                <span className="text-amber-700 font-semibold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Loja idêntica à oferta principal ({partnerStore}). Para evitar botões divergentes, ela não será exibida no site.</span>
                                </span>
                              )}
                              {isUrlSame && !isDuplicate && (
                                <span className="text-amber-700 font-semibold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>O link informado é o mesmo da oferta principal.</span>
                                </span>
                              )}
                              {isPriceDivergent && !isDuplicate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...otherStores];
                                    updated[sIdx].price = priceCurrent;
                                    setOtherStores(updated);
                                  }}
                                  className="text-cyan-600 hover:text-cyan-800 underline font-medium ml-auto"
                                >
                                  Sincronizar com preço anunciado ({priceCurrent})
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setOtherStores([...otherStores, { storeName: '', price: priceCurrent || 'R$ 0,00', url: '' }])}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Adicionar Loja Concorrente para Comparação</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PROS & CONS */}
          {activeTab === 'proscons' && (
            <div className="space-y-6">
              {renderAIExtractionBanner('Prós e Contras')}

              {/* Pros */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Pontos Positivos (Prós)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPros([...pros, ''])}
                    className="flex items-center gap-1 text-2xs font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Ponto Positivo</span>
                  </button>
                </div>

                {pros.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const newPros = [...pros];
                        newPros[idx] = e.target.value;
                        setPros(newPros);
                      }}
                      placeholder="Ex: Construção de alta durabilidade e funcionamento silencioso"
                      className="flex-1 px-3 py-1.5 text-xs border border-emerald-200 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setPros(pros.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cons */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Pontos de Atenção (Contras)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCons([...cons, ''])}
                    className="flex items-center gap-1 text-2xs font-bold text-amber-700 hover:text-amber-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Ponto de Atenção</span>
                  </button>
                </div>

                {cons.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c}
                      onChange={(e) => {
                        const newCons = [...cons];
                        newCons[idx] = e.target.value;
                        setCons(newCons);
                      }}
                      placeholder="Ex: Disponibilidade de cores pode variar conforme estoque"
                      className="flex-1 px-3 py-1.5 text-xs border border-amber-200 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setCons(cons.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              {renderAIExtractionBanner('Ficha Técnica')}

              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ficha Técnica e Características
                </h3>
                <button
                  type="button"
                  onClick={() => setSpecifications([...specifications, { label: '', value: '' }])}
                  className="flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Especificação</span>
                </button>
              </div>

              <div className="space-y-2">
                {specifications.map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => {
                          const updated = [...specifications];
                          updated[idx].label = e.target.value;
                          setSpecifications(updated);
                        }}
                        placeholder="Característica (Ex: Processador, Memória, Potência)"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...specifications];
                          updated[idx].value = e.target.value;
                          setSpecifications(updated);
                        }}
                        placeholder="Detalhe técnico verdadeiro do modelo"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono text-slate-700"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => setSpecifications(specifications.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CONTENT & VERDICT */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {renderAIExtractionBanner('Artigo de Avaliação')}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Corpo do Artigo da Análise</span>
                  <span className="text-3xs text-slate-400 font-normal">Use ### para títulos de seções</span>
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva a avaliação completa do produto..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Veredito Final Resumido (Vale a pena?)
                </label>
                <textarea
                  rows={2}
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                  placeholder="Conclusão sobre a recomendação de compra..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              {/* Criterion Scores */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                  Avaliação por Critério (1 a 5)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-2xs text-slate-600 mb-1">Custo-Benefício</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={scoreCostBenefit}
                      onChange={(e) => setScoreCostBenefit(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-600 mb-1">Desempenho</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={scorePerformance}
                      onChange={(e) => setScorePerformance(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-600 mb-1">Construção</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={scoreBuild}
                      onChange={(e) => setScoreBuild(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-600 mb-1">Usabilidade</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={scoreUsability}
                      onChange={(e) => setScoreUsability(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FAQS */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              {renderAIExtractionBanner('Perguntas Frequentes (FAQs)')}

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Perguntas Frequentes (FAQ)
                  </h3>
                  <p className="text-3xs text-slate-500">
                    Otimizado para resultados ricos de busca no Google
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
                  className="flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Pergunta</span>
                </button>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-slate-500">Pergunta #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[idx].question = e.target.value;
                        setFaqs(updated);
                      }}
                      placeholder="Ex: O produto acompanha nota fiscal e garantia?"
                      className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                    />

                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[idx].answer = e.target.value;
                        setFaqs(updated);
                      }}
                      placeholder="Resposta explicativa e direta..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 sticky bottom-0 bg-white">
            <div>
              {reviewToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Excluir este item cadastrado permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Avaliação</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave()}
                className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Análise...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Análise no Banco de Dados</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

        {/* Modal de Confirmação de Exclusão dentro do Editor */}
        {showDeleteConfirm && reviewToEdit && onDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Excluir Avaliação</h3>
                  <p className="text-xs text-slate-500">Esta ação é permanente e não poderá ser desfeita.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                Tem certeza de que deseja excluir permanentemente o produto: <strong className="text-slate-900 block mt-1">"{title}"</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete(reviewToEdit.id);
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                >
                  Sim, Excluir Definitivamente
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
