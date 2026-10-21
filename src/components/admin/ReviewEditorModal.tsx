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
  Store
} from 'lucide-react';
import { Review, Category, Specification, FAQItem, PartnerOffer } from '../../types';
import { cleanOtherStores, isSameStore } from '../../utils/storeHelpers';
import { calculateDiscount } from '../../utils/priceHelpers';

interface ReviewEditorModalProps {
  isOpen: boolean;
  reviewToEdit: Review | null;
  categories: Category[];
  onClose: () => void;
  onSave: (review: Review) => void;
  onDelete?: (id: string) => void;
}

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
      setCoverImage(reviewToEdit.coverImage);
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
      setPros(['Excelente acabamento e durabilidade comprovada', 'Ótima relação custo-benefício']);
      setCons(['Manual de instruções poderia ser mais detalhado']);
      setSpecifications([
        { label: 'Garantia', value: '12 meses' },
        { label: 'Material', value: 'Alumínio e polímero reforçado' }
      ]);
      setContent('### Primeiras Impressões\n\nO produto se destaca pelo acabamento cuidadoso e facilidade de configuração.\n\n### Desempenho no Dia a Dia\n\nNos testes práticos, atendeu perfeitamente às expectativas com alta estabilidade.');
      setVerdict('Uma das melhores escolhas da categoria na faixa de preço, recomendado tanto para iniciantes quanto usuários exigentes.');
      setScoreCostBenefit(4.8);
      setScorePerformance(4.7);
      setScoreBuild(4.9);
      setScoreUsability(4.8);
      setFaqs([
        { question: 'O produto possui garantia nacional?', answer: 'Sim, garantia total de 12 meses pelo distribuidor oficial.' }
      ]);
      setMagicInput('');
      setMagicStatus(null);
    }
  }, [reviewToEdit, isOpen, categories]);

  // Magic Autocomplete Handler
  const handleMagicAutocomplete = async () => {
    if (!magicInput.trim()) {
      setMagicStatus({ type: 'error', message: 'Por favor, insira o link de afiliado ou o nome do produto.' });
      return;
    }

    setIsAnalyzing(true);
    setMagicStatus(null);

    try {
      const response = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: magicInput.trim() })
      });

      const result = await response.json();

      if (result.success && result.data) {
        const d = result.data;
        setTitle(d.title || title);
        setSlug(d.slug || slug);
        setSubtitle(d.subtitle || subtitle);
        
        // Match category from categories list or keep generated
        const matchedCategory = categories.find(c => 
          c.name.toLowerCase() === (d.category || '').toLowerCase()
        );
        if (matchedCategory) {
          setCategory(matchedCategory.name);
        } else if (d.category) {
          setCategory(d.category);
        }

        setPartnerStore(d.partnerStore || partnerStore);
        
        // If the user pasted an actual URL in magicInput, use it as affiliateUrl
        if (/^https?:\/\//i.test(magicInput.trim())) {
          setAffiliateUrl(magicInput.trim());
        } else if (d.affiliateUrl) {
          setAffiliateUrl(d.affiliateUrl);
        }

        const finalPriceCurrent = d.priceCurrent || priceCurrent;
        const finalPriceOriginal = d.priceOriginal || priceOriginal;
        setPriceCurrent(finalPriceCurrent);
        setPriceOriginal(finalPriceOriginal);

        // Calcula o percentual de desconto real exato automaticamente
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
        else if (d.scoreCostBenefit) setRating(d.scoreCostBenefit);

        // Intelligent Image Preset Selection
        const lowerTitle = (d.title + ' ' + (d.category || '')).toLowerCase();
        if (d.coverImage && (d.coverImage.startsWith('http') || d.coverImage.startsWith('/src/assets/'))) {
          setCoverImage(d.coverImage);
        } else if (/rel[oó]gio|smartwatch|watch|pulseira|smartband|wearable|cron[oó]grafo|casio|technos|amazfit|galaxy watch|apple watch/i.test(lowerTitle)) {
          setCoverImage(IMAGE_PRESETS[0].url);
        } else if (/televis|smart[ -]?tv|\btv\b|oled|qled|roku|ambilight/i.test(lowerTitle)) {
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

        setMagicStatus({
          type: 'success',
          message: `Produto "${d.title}" identificado com sucesso! Todos os campos, especificações, prós, contras e veredito foram preenchidos automaticamente.`
        });
      } else {
        setMagicStatus({
          type: 'error',
          message: 'Não foi possível extrair dados automaticamente. Por favor, tente novamente ou preencha manualmente.'
        });
      }
    } catch (err) {
      console.error('Erro no autopreenchimento:', err);
      setMagicStatus({
        type: 'error',
        message: 'Falha na conexão com o assistente inteligente de cadastro.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !affiliateUrl.trim()) {
      alert('Por favor, preencha o Título e o Link de Afiliado.');
      return;
    }

    const reviewData: Review = {
      id: id || `rev-${Date.now()}`,
      slug: slug || `avaliacao-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      category,
      coverImage: coverImage.trim() || IMAGE_PRESETS[0].url,
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

    onSave(reviewData);
    onClose();
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Avaliação (Otimizado para Busca) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
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
                    required
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

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL da Imagem Ilustrativa
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Cole a URL da imagem ou escolha um modelo abaixo"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono mb-2"
                />

                <span className="text-3xs text-slate-400 uppercase tracking-wider block mb-1.5">
                  Modelos de Imagens em Alta Resolução Disponíveis:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {IMAGE_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverImage(p.url)}
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
                    required
                    value={priceCurrent}
                    onChange={(e) => handleCurrentPriceChange(e.target.value)}
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
                      type="url"
                      required
                      value={affiliateUrl}
                      onChange={(e) => setAffiliateUrl(e.target.value)}
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
                        placeholder="Característica (Ex: Conectividade)"
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
                        placeholder="Detalhe (Ex: Sem Fio e Cabo USB)"
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
                type="submit"
                className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Análise no Banco de Dados</span>
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
