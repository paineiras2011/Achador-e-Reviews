import React, { useState, useEffect } from 'react';
import {
  ComparisonGuide,
  ComparisonProductItem,
  Category,
  Review,
  PostKit
} from '../../types';
import {
  X,
  Plus,
  Trash2,
  Save,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Wand2,
  Share2,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { buildClientPostKit, sanitizePostKit } from '../../utils/postKitHelpers';

interface GuideEditorModalProps {
  guide: ComparisonGuide | null;
  categories: Category[];
  existingReviews: Review[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (guide: ComparisonGuide) => Promise<void>;
}

const createEmptyProduct = (index = 0): ComparisonProductItem => ({
  id: `prod-${Date.now()}-${index + 1}`,
  title: '',
  badge: index === 0 ? 'Melhor Escolha' : 'Custo-Benefício',
  rating: 4.8,
  price: '',
  originalPrice: '',
  partnerStore: 'Mercado Livre',
  affiliateUrl: '',
  imageUrl: '',
  summary: '',
  pros: [''],
  cons: [''],
  keySpecs: [{ label: '', value: '' }]
});

const createEmptyGuide = (categories: Category[]): ComparisonGuide => ({
  id: `guide-${Date.now()}`,
  slug: '',
  title: '',
  subtitle: '',
  category: categories[0]?.name || 'Tecnologia & Dispositivos',
  coverImage: '',
  introContent: '',
  buyingTipsContent: '',
  products: [createEmptyProduct(0)],
  faqs: [{ question: '', answer: '' }],
  postKit: undefined,
  published: true,
  featured: false,
  viewsCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const GuideEditorModal: React.FC<GuideEditorModalProps> = ({
  guide,
  categories,
  existingReviews,
  isOpen,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'tips' | 'faqs' | 'postkit'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto Generator State
  const [genTopic, setGenTopic] = useState('');
  const [genCategory, setGenCategory] = useState(categories[0]?.name || 'Tecnologia & Dispositivos');
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [extraInputsText, setExtraInputsText] = useState('');
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [genFeedback, setGenFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showGeneratorPanel, setShowGeneratorPanel] = useState(true);

  // PostKit State
  const [isGeneratingPostKit, setIsGeneratingPostKit] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<ComparisonGuide>(() => createEmptyGuide(categories));

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    setGenFeedback(null);
    setActiveTab('info');
    setCopiedField(null);

    if (guide) {
      const cloned: ComparisonGuide = JSON.parse(JSON.stringify(guide));
      setFormData({
        ...cloned,
        products: cloned.products && cloned.products.length > 0 ? cloned.products : [createEmptyProduct(0)],
        faqs: cloned.faqs && cloned.faqs.length > 0 ? cloned.faqs : [{ question: '', answer: '' }],
        postKit: sanitizePostKit(cloned.postKit)
      });
      setGenTopic(cloned.title || '');
      setGenCategory(cloned.category || categories[0]?.name || 'Tecnologia & Dispositivos');
      setSelectedReviewIds(
        (cloned.products || [])
          .map(p => existingReviews.find(r => r.slug === p.reviewSlug)?.id || '')
          .filter(Boolean)
      );
      setExtraInputsText('');
      setShowGeneratorPanel(false);
    } else {
      setFormData(createEmptyGuide(categories));
      setGenTopic('');
      setGenCategory(categories[0]?.name || 'Tecnologia & Dispositivos');
      setSelectedReviewIds([]);
      setExtraInputsText('');
      setShowGeneratorPanel(true);
    }
  }, [guide, isOpen, categories, existingReviews]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData(prev => ({
      ...prev,
      title: val,
      slug: prev.slug === '' || prev.slug === guide?.slug ? slug : prev.slug
    }));
  };

  const toggleReviewSelection = (reviewId: string) => {
    setSelectedReviewIds(prev =>
      prev.includes(reviewId) ? prev.filter(id => id !== reviewId) : [...prev, reviewId]
    );
  };

  // Automatic Non-Generic Comparison Generator
  const handleGenerateGuideWithAI = async () => {
    const selectedRevs = existingReviews.filter(r => selectedReviewIds.includes(r.id));
    const extraInputs = extraInputsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 2)
      .slice(0, 5);

    if (!genTopic.trim() && selectedRevs.length === 0 && extraInputs.length === 0) {
      setGenFeedback({
        type: 'error',
        message: 'Informe um tema, selecione produtos já cadastrados ou cole links/nomes para gerar o comparativo.'
      });
      return;
    }

    setIsGeneratingGuide(true);
    setGenFeedback(null);
    setErrorMsg('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 65000);
      const res = await fetch('/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic.trim(),
          category: genCategory,
          categories: categories.map(c => c.name),
          selectedReviews: selectedRevs,
          extraInputs
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || 'Falha ao gerar comparativo automático');
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error('Resposta inválida ao gerar comparativo');
      }

      const generated = json.data;
      const mappedProducts: ComparisonProductItem[] = Array.isArray(generated.products) && generated.products.length > 0
        ? generated.products.map((p: any, idx: number) => ({
            id: p.id || `prod-${Date.now()}-${idx + 1}`,
            title: String(p.title || ''),
            badge: String(p.badge || (idx === 0 ? 'Melhor Escolha' : 'Destaque')),
            rating: Number(p.rating) || 4.8,
            price: String(p.price || ''),
            originalPrice: p.originalPrice ? String(p.originalPrice) : '',
            partnerStore: String(p.partnerStore || 'Loja Oficial'),
            affiliateUrl: String(p.affiliateUrl || ''),
            imageUrl: String(p.imageUrl || ''),
            summary: String(p.summary || ''),
            pros: Array.isArray(p.pros) && p.pros.length > 0 ? p.pros : [''],
            cons: Array.isArray(p.cons) && p.cons.length > 0 ? p.cons : [''],
            keySpecs: Array.isArray(p.keySpecs) && p.keySpecs.length > 0 ? p.keySpecs : [{ label: '', value: '' }],
            ...(p.reviewSlug ? { reviewSlug: String(p.reviewSlug) } : {})
          }))
        : formData.products;

      setFormData(prev => ({
        ...prev,
        title: generated.title || prev.title,
        slug: generated.slug || prev.slug,
        subtitle: generated.subtitle || prev.subtitle,
        category: generated.category || genCategory || prev.category,
        coverImage: generated.coverImage || mappedProducts[0]?.imageUrl || prev.coverImage,
        introContent: generated.introContent || prev.introContent,
        buyingTipsContent: generated.buyingTipsContent || prev.buyingTipsContent,
        products: mappedProducts,
        faqs: Array.isArray(generated.faqs) && generated.faqs.length > 0 ? generated.faqs : prev.faqs,
        postKit: sanitizePostKit(generated.postKit) || buildClientPostKit({
          title: generated.title || genTopic,
          slug: generated.slug,
          category: generated.category || genCategory,
          pros: mappedProducts.flatMap(p => p.pros || []).slice(0, 3),
          verdict: generated.subtitle || '',
          type: 'guide'
        })
      }));

      setGenFeedback({
        type: 'success',
        message: `Comparativo "${generated.title}" gerado com ${mappedProducts.length} produtos ranqueados, especificações padronizadas, FAQs e Kit para Postagem!`
      });
    } catch (err: any) {
      setGenFeedback({
        type: 'error',
        message: err?.name === 'AbortError'
          ? 'O tempo limite da análise foi atingido. Tente com menos links extras por vez.'
          : (err?.message || 'Erro ao gerar guia comparativo.')
      });
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // Product manipulation helpers
  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, createEmptyProduct(prev.products.length)]
    }));
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateProduct = (index: number, updates: Partial<ComparisonProductItem>) => {
    setFormData(prev => {
      const copy = [...prev.products];
      copy[index] = { ...copy[index], ...updates };
      return { ...prev, products: copy };
    });
  };

  // Helper when selecting an existing review to pre-fill or link
  const handleLinkExistingReview = (index: number, reviewSlug: string) => {
    const selectedRev = existingReviews.find(r => r.slug === reviewSlug || r.id === reviewSlug);
    if (!selectedRev) {
      handleUpdateProduct(index, { reviewSlug: undefined });
      return;
    }

    const current = formData.products[index];
    handleUpdateProduct(index, {
      reviewSlug: selectedRev.slug,
      title: current.title || selectedRev.title,
      price: current.price && current.price !== 'R$ ' ? current.price : selectedRev.priceCurrent,
      originalPrice: current.originalPrice || selectedRev.priceOriginal || '',
      partnerStore: current.partnerStore || selectedRev.partnerStore || 'Mercado Livre',
      affiliateUrl: current.affiliateUrl || selectedRev.affiliateUrl,
      imageUrl: current.imageUrl || selectedRev.coverImage,
      summary: current.summary || selectedRev.verdict || selectedRev.subtitle,
      pros: current.pros && current.pros.length > 0 && current.pros[0] ? current.pros : (selectedRev.pros || ['']),
      cons: current.cons && current.cons.length > 0 && current.cons[0] ? current.cons : (selectedRev.cons || ['']),
      keySpecs: current.keySpecs && current.keySpecs.length > 0 && current.keySpecs[0]?.label ? current.keySpecs : (selectedRev.specifications || [{ label: '', value: '' }])
    });
  };

  const handleGenerateGuidePostKit = async () => {
    if (!formData.title.trim()) {
      setErrorMsg('Informe o Título Principal do Comparativo antes de gerar o Kit para Postagem.');
      setActiveTab('info');
      return;
    }

    setIsGeneratingPostKit(true);
    let generatedKit: PostKit | undefined;
    const combinedPros = formData.products.flatMap(p => p.pros || []).filter(Boolean).slice(0, 3);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);
      const res = await fetch('/api/generate-post-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          category: formData.category,
          pros: combinedPros,
          verdict: formData.subtitle || formData.introContent.slice(0, 180),
          type: 'guide'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          generatedKit = sanitizePostKit(json.data);
        }
      }
    } catch {
      // Usa fallback determinístico abaixo
    }

    if (!generatedKit) {
      generatedKit = buildClientPostKit({
        title: formData.title,
        slug: formData.slug,
        category: formData.category,
        pros: combinedPros,
        verdict: formData.subtitle,
        type: 'guide'
      });
    }

    setFormData(prev => ({ ...prev, postKit: generatedKit }));
    setIsGeneratingPostKit(false);
  };

  const handleCopyPostKitField = async (field: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(prev => (prev === field ? null : prev)), 2000);
    } catch {
      // Ignora falha de clipboard
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('O título do comparativo é obrigatório.');
      setActiveTab('info');
      return;
    }
    if (!formData.slug.trim()) {
      setErrorMsg('O slug da URL é obrigatório.');
      setActiveTab('info');
      return;
    }
    if (formData.products.length === 0) {
      setErrorMsg('Adicione pelo menos um produto para o comparativo.');
      setActiveTab('products');
      return;
    }

    for (let i = 0; i < formData.products.length; i++) {
      const p = formData.products[i];
      if (!p.title.trim()) {
        setErrorMsg(`Preencha o título do produto #${i + 1}.`);
        setActiveTab('products');
        return;
      }
      if (!p.affiliateUrl.trim()) {
        setErrorMsg(`Informe o link de afiliado do produto #${i + 1}.`);
        setActiveTab('products');
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const cleanProducts: ComparisonProductItem[] = formData.products.map((p) => {
        const cleanItem: ComparisonProductItem = {
          id: p.id,
          title: p.title.trim(),
          badge: p.badge?.trim() || undefined,
          rating: Number(p.rating) || 4.8,
          price: p.price.trim(),
          originalPrice: p.originalPrice?.trim() || undefined,
          partnerStore: p.partnerStore.trim(),
          affiliateUrl: p.affiliateUrl.trim(),
          imageUrl: p.imageUrl.trim() || '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
          summary: p.summary.trim(),
          pros: (p.pros || []).map(x => x.trim()).filter(Boolean),
          cons: (p.cons || []).map(x => x.trim()).filter(Boolean),
          keySpecs: (p.keySpecs || []).filter(k => k.label.trim() && k.value.trim()),
          ...(p.reviewSlug ? { reviewSlug: p.reviewSlug } : {})
        };
        return cleanItem;
      });

      const cleanFaqs = (formData.faqs || []).filter(f => f.question.trim() && f.answer.trim());

      let finalPostKit = sanitizePostKit(formData.postKit);
      if (!finalPostKit) {
        const combinedPros = cleanProducts.flatMap(p => p.pros || []).slice(0, 3);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);
          const kitRes = await fetch('/api/generate-post-kit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: formData.title.trim(),
              slug: formData.slug.trim(),
              category: formData.category,
              pros: combinedPros,
              verdict: formData.subtitle.trim(),
              type: 'guide'
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (kitRes.ok) {
            const kitJson = await kitRes.json();
            if (kitJson.success && kitJson.data) {
              finalPostKit = sanitizePostKit(kitJson.data);
            }
          }
        } catch {
          // Usa fallback completo abaixo
        }
        if (!finalPostKit) {
          finalPostKit = buildClientPostKit({
            title: formData.title.trim(),
            slug: formData.slug.trim(),
            category: formData.category,
            pros: combinedPros,
            verdict: formData.subtitle.trim(),
            type: 'guide'
          });
        }
      }

      await onSave({
        ...formData,
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        subtitle: formData.subtitle.trim(),
        coverImage: formData.coverImage || cleanProducts[0]?.imageUrl || '',
        products: cleanProducts,
        faqs: cleanFaqs,
        postKit: finalPostKit,
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      setErrorMsg('Falha ao salvar o comparativo. Tente novamente.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[93vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold">
                {guide ? 'Editar Guia Comparativo' : 'Criar Novo Guia Comparativo'}
              </h2>
              <p className="text-xs text-slate-300">
                Artigo comparativo com tabela lado a lado, pódio automático e kit para postagem
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGeneratorPanel(v => !v)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{showGeneratorPanel ? 'Ocultar Gerador IA' : 'Gerar Comparativo com IA'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Comparison Generator Panel */}
        {showGeneratorPanel && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0B132B] to-emerald-950 text-white border-b border-slate-800 space-y-3 overflow-y-auto max-h-72">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Gerador Automático de Guia Comparativo (Sem Conteúdo Genérico)
                </h3>
              </div>
              <span className="text-[11px] text-slate-300 hidden sm:inline">
                Cruza ficha técnica, prós, contras e cria o Kit de Postagem
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="Tema do guia (Ex: Melhores Notebooks Custo-Benefício 2026)"
                className="sm:col-span-2 px-3 py-2 text-xs bg-slate-800/90 text-white placeholder:text-slate-400 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-400"
              />
              <select
                value={genCategory}
                onChange={(e) => setGenCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-800/90 text-white border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-400"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Selecionar Produtos Já Cadastrados ({selectedReviewIds.length} selecionados):
                </label>
                <div className="max-h-24 overflow-y-auto bg-slate-800/70 border border-slate-700 rounded-lg p-2 space-y-1">
                  {existingReviews.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-1">Nenhum produto cadastrado ainda.</div>
                  ) : (
                    existingReviews.map((rev) => (
                      <label key={rev.id} className="flex items-center gap-2 text-[11px] text-slate-200 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedReviewIds.includes(rev.id)}
                          onChange={() => toggleReviewSelection(rev.id)}
                          className="rounded text-emerald-500"
                        />
                        <span className="truncate flex-1">{rev.title}</span>
                        <span className="text-[10px] text-emerald-300 font-mono shrink-0">{rev.priceCurrent}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ou cole Links / Nomes Extras (1 por linha, máx. 5):
                </label>
                <textarea
                  rows={3}
                  value={extraInputsText}
                  onChange={(e) => setExtraInputsText(e.target.value)}
                  placeholder="https://s.shopee.com.br/...&#10;Notebook Acer Aspire 5 Ryzen 7 16GB&#10;Lenovo IdeaPad 1 Ryzen 5"
                  className="w-full px-3 py-1.5 text-xs bg-slate-800/90 text-white placeholder:text-slate-400 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button
                type="button"
                disabled={isGeneratingGuide}
                onClick={handleGenerateGuideWithAI}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isGeneratingGuide ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Pesquisando produtos &amp; montando comparativo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar Comparativo Completo + Kit de Postagem</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-400">
                Cada produto novo colado acima tem ficha técnica, prós e contras extraídos antes de ranquear.
              </span>
            </div>

            {genFeedback && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                genFeedback.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/40'
                  : 'bg-rose-950/90 text-rose-200 border border-rose-500/40'
              }`}>
                {genFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{genFeedback.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Informações Básicas &amp; Capa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Produtos do Comparativo ({formData.products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'tips'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Dicas de Compra &amp; Guia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'faqs'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Perguntas Frequentes (FAQ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('postkit')}
            className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'postkit'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>5. Kit para Postagem</span>
            {formData.postKit && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Título Principal do Comparativo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: Os Melhores Notebooks para Trabalho e Estudo em 2026: Guia Completo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Slug da URL (ex: melhores-notebooks-2026) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Categoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Subtítulo / Resumo Rápido
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Ex: Comparamos tela, processador, autonomia de bateria e custo-benefício real."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  URL da Imagem de Capa do Artigo
                </label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://... (Se deixar em branco, usará a foto do 1º produto)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Texto de Introdução do Artigo
                </label>
                <textarea
                  rows={5}
                  value={formData.introContent}
                  onChange={(e) => setFormData({ ...formData, introContent: e.target.value })}
                  placeholder="Apresente aos leitores os desafios da escolha dessa categoria e o que foi considerado nos comparativos..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Artigo Publicado no Site</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.featured || false}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Destacar na Página Inicial</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900">
                    Modelos Analisados e Ranking do Pódio
                  </h3>
                  <p className="text-xs text-slate-500">
                    Adicione os produtos reais que farão parte da tabela comparativa e das análises individuais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Produto</span>
                </button>
              </div>

              {formData.products.map((prod, pIdx) => (
                <div
                  key={prod.id || pIdx}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        #{pIdx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {prod.title || `Produto #${pIdx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {formData.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(pIdx)}
                          className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded cursor-pointer"
                          title="Remover produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vinculação opcional com Review Individual existente */}
                  <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3">
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      🔗 Vincular a uma Análise Completa Individual Existente (Opcional):
                    </label>
                    <select
                      value={prod.reviewSlug || ''}
                      onChange={(e) => handleLinkExistingReview(pIdx, e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-emerald-300 text-xs font-medium text-slate-800 outline-none"
                    >
                      <option value="">Nenhum (Somente comparativo neste artigo)</option>
                      {existingReviews.map((rev) => (
                        <option key={rev.id} value={rev.slug}>
                          {rev.title} ({rev.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Título Exato do Produto *
                      </label>
                      <input
                        type="text"
                        value={prod.title}
                        onChange={(e) => handleUpdateProduct(pIdx, { title: e.target.value })}
                        placeholder="Ex: Notebook Dell Dc15-i51334u-a50 15.6 Full HD i5 8GB 512GB"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                        required
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Badge de Destaque
                      </label>
                      <input
                        type="text"
                        value={prod.badge || ''}
                        onChange={(e) => handleUpdateProduct(pIdx, { badge: e.target.value })}
                        placeholder="Ex: Melhor Escolha, Custo-Benefício"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Preço Atual *</label>
                      <input
                        type="text"
                        value={prod.price}
                        onChange={(e) => handleUpdateProduct(pIdx, { price: e.target.value })}
                        placeholder="R$ 3.599,00"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Preço Original</label>
                      <input
                        type="text"
                        value={prod.originalPrice || ''}
                        onChange={(e) => handleUpdateProduct(pIdx, { originalPrice: e.target.value })}
                        placeholder="R$ 4.999,00"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Loja Parceira *</label>
                      <input
                        type="text"
                        value={prod.partnerStore}
                        onChange={(e) => handleUpdateProduct(pIdx, { partnerStore: e.target.value })}
                        placeholder="Mercado Livre, Amazon..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nota (1 a 5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={prod.rating}
                        onChange={(e) => handleUpdateProduct(pIdx, { rating: parseFloat(e.target.value) || 4.5 })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Link de Afiliado para Compra *
                      </label>
                      <input
                        type="url"
                        value={prod.affiliateUrl}
                        onChange={(e) => handleUpdateProduct(pIdx, { affiliateUrl: e.target.value })}
                        placeholder="https://meli.la/... ou https://amzn.to/..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL da Imagem Real do Produto *
                      </label>
                      <input
                        type="url"
                        value={prod.imageUrl}
                        onChange={(e) => handleUpdateProduct(pIdx, { imageUrl: e.target.value })}
                        placeholder="https://... (Foto original do produto)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Resumo da Avaliação / Veredito deste Modelo
                    </label>
                    <textarea
                      rows={2}
                      value={prod.summary}
                      onChange={(e) => handleUpdateProduct(pIdx, { summary: e.target.value })}
                      placeholder="Por que este modelo está no ranking e para quem ele é mais indicado..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>

                  {/* Specs Comparativas */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Especificações da Tabela Comparativa ({prod.keySpecs?.length || 0})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateProduct(pIdx, {
                            keySpecs: [...(prod.keySpecs || []), { label: '', value: '' }]
                          })
                        }
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        + Adicionar Spec
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(prod.keySpecs || []).map((spec, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={spec.label}
                            onChange={(e) => {
                              const next = [...(prod.keySpecs || [])];
                              next[sIdx] = { ...next[sIdx], label: e.target.value };
                              handleUpdateProduct(pIdx, { keySpecs: next });
                            }}
                            placeholder="Atributo"
                            className="w-2/5 px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded bg-slate-50"
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => {
                              const next = [...(prod.keySpecs || [])];
                              next[sIdx] = { ...next[sIdx], value: e.target.value };
                              handleUpdateProduct(pIdx, { keySpecs: next });
                            }}
                            placeholder="Valor"
                            className="w-3/5 px-2 py-1 text-[11px] border border-slate-200 rounded"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateProduct(pIdx, {
                                keySpecs: (prod.keySpecs || []).filter((_, idx) => idx !== sIdx)
                              })
                            }
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-emerald-800 mb-1">
                        Pontos Fortes (um por linha)
                      </label>
                      <textarea
                        rows={3}
                        value={prod.pros?.join('\n') || ''}
                        onChange={(e) => handleUpdateProduct(pIdx, { pros: e.target.value.split('\n') })}
                        placeholder="Tela de 120Hz fluida&#10;Processador veloz&#10;Boa autonomia"
                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 text-xs bg-emerald-50/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-rose-800 mb-1">
                        Pontos Fracos / Atenção (um por linha)
                      </label>
                      <textarea
                        rows={3}
                        value={prod.cons?.join('\n') || ''}
                        onChange={(e) => handleUpdateProduct(pIdx, { cons: e.target.value.split('\n') })}
                        placeholder="Teclado não retroiluminado&#10;Carregador vendido separadamente"
                        className="w-full px-3 py-2 rounded-lg border border-rose-200 text-xs bg-rose-50/30"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: BUYING TIPS */}
          {activeTab === 'tips' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Guia Prático: O Que Analisar Antes de Comprar
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Dicas e critérios de escolha que ajudam os leitores a tomarem uma decisão consciente.
                </p>
                <textarea
                  rows={10}
                  value={formData.buyingTipsContent || ''}
                  onChange={(e) => setFormData({ ...formData, buyingTipsContent: e.target.value })}
                  placeholder="### O Que Você Deve Observar Antes de Comprar:&#10;&#10;1. Processador e Memória: ...&#10;2. Autonomia de Bateria: ...&#10;3. Garantia e Suporte: ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 4: FAQS */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-800">
                  Perguntas Frequentes (FAQ Schema.org)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      faqs: [...(formData.faqs || []), { question: '', answer: '' }]
                    })
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  + Adicionar Pergunta
                </button>
              </div>

              {(formData.faqs || []).map((faq, fIdx) => (
                <div key={fIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Pergunta #{fIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          faqs: formData.faqs?.filter((_, i) => i !== fIdx)
                        })
                      }
                      className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const copy = [...(formData.faqs || [])];
                      copy[fIdx].question = e.target.value;
                      setFormData({ ...formData, faqs: copy });
                    }}
                    placeholder="Pergunta..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const copy = [...(formData.faqs || [])];
                      copy[fIdx].answer = e.target.value;
                      setFormData({ ...formData, faqs: copy });
                    }}
                    placeholder="Resposta completa e objetiva..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: POST KIT */}
          {activeTab === 'postkit' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Kit Automático de Divulgação &amp; SEO do Comparativo
                    </h4>
                    <p className="text-3xs text-slate-600 mt-0.5">
                      Pronto para Google, WhatsApp/Telegram, Instagram e Shorts/Reels. Ao salvar o comparativo, o kit é gravado junto.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateGuidePostKit}
                  disabled={isGeneratingPostKit}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer shrink-0 transition-colors"
                >
                  {isGeneratingPostKit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando Kit...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{formData.postKit ? 'Atualizar Kit com IA' : 'Gerar Kit Agora'}</span>
                    </>
                  )}
                </button>
              </div>

              {(() => {
                const currentKit: PostKit = formData.postKit || buildClientPostKit({
                  title: formData.title || 'Guia Comparativo',
                  slug: formData.slug,
                  category: formData.category,
                  pros: formData.products.flatMap(p => p.pros || []).filter(Boolean).slice(0, 3),
                  verdict: formData.subtitle,
                  type: 'guide'
                });
                const updateKitField = (field: keyof PostKit, value: string) => {
                  setFormData(prev => ({
                    ...prev,
                    postKit: { ...currentKit, [field]: value }
                  }));
                };

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            Título SEO (Google — {currentKit.seoTitle.length}/60)
                          </label>
                          <button
                            type="button"
                            onClick={() => handleCopyPostKitField('seoTitle', currentKit.seoTitle)}
                            className="inline-flex items-center gap-1 text-3xs font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                          >
                            {copiedField === 'seoTitle' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'seoTitle' ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={currentKit.seoTitle}
                          onChange={(e) => updateKitField('seoTitle', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            Selo de Destaque
                          </label>
                          <button
                            type="button"
                            onClick={() => handleCopyPostKitField('highlightsBadge', currentKit.highlightsBadge)}
                            className="inline-flex items-center gap-1 text-3xs font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                          >
                            {copiedField === 'highlightsBadge' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'highlightsBadge' ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={currentKit.highlightsBadge}
                          onChange={(e) => updateKitField('highlightsBadge', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Meta Description SEO ({currentKit.metaDescription.length}/160)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCopyPostKitField('metaDescription', currentKit.metaDescription)}
                          className="inline-flex items-center gap-1 text-3xs font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                        >
                          {copiedField === 'metaDescription' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'metaDescription' ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={currentKit.metaDescription}
                        onChange={(e) => updateKitField('metaDescription', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-emerald-800">
                          Copy para WhatsApp / Telegram
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCopyPostKitField('whatsappCopy', currentKit.whatsappCopy)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md text-3xs font-bold cursor-pointer"
                        >
                          {copiedField === 'whatsappCopy' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'whatsappCopy' ? 'Copiado!' : 'Copiar Mensagem'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        value={currentKit.whatsappCopy}
                        onChange={(e) => updateKitField('whatsappCopy', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg bg-emerald-50/30 font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-fuchsia-800">
                          Legenda para Instagram / Facebook / Pinterest
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCopyPostKitField('instagramCaption', currentKit.instagramCaption)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 rounded-md text-3xs font-bold cursor-pointer"
                        >
                          {copiedField === 'instagramCaption' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'instagramCaption' ? 'Copiado!' : 'Copiar Legenda'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        value={currentKit.instagramCaption}
                        onChange={(e) => updateKitField('instagramCaption', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-fuchsia-200 rounded-lg bg-fuchsia-50/20"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">
                          Roteiro de Vídeo Curto (Reels / TikTok / Shorts)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCopyPostKitField('shortVideoScript', currentKit.shortVideoScript)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-3xs font-bold cursor-pointer"
                        >
                          {copiedField === 'shortVideoScript' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'shortVideoScript' ? 'Copiado!' : 'Copiar Roteiro'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={currentKit.shortVideoScript}
                        onChange={(e) => updateKitField('shortVideoScript', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Comparativo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
