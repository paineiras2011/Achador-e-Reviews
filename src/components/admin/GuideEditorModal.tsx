import React, { useState } from 'react';
import { ComparisonGuide, ComparisonProductItem, Category, Review, FAQItem } from '../../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Layers, 
  Sparkles, 
  ShoppingCart, 
  HelpCircle, 
  Check, 
  ListOrdered,
  FileText,
  AlertCircle
} from 'lucide-react';

interface GuideEditorModalProps {
  guide: ComparisonGuide | null;
  categories: Category[];
  existingReviews: Review[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (guide: ComparisonGuide) => Promise<void>;
}

export const GuideEditorModal: React.FC<GuideEditorModalProps> = ({
  guide,
  categories,
  existingReviews,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'tips' | 'faqs'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState<ComparisonGuide>(() => {
    if (guide) return JSON.parse(JSON.stringify(guide));
    return {
      id: `guide-${Date.now()}`,
      slug: '',
      title: '',
      subtitle: '',
      category: categories[0]?.name || 'Tecnologia & Dispositivos',
      coverImage: '',
      introContent: '',
      buyingTipsContent: '',
      products: [
        {
          id: `prod-${Date.now()}-1`,
          title: '',
          badge: 'Melhor Escolha',
          rating: 4.8,
          price: 'R$ ',
          originalPrice: '',
          partnerStore: 'Mercado Livre',
          affiliateUrl: '',
          imageUrl: '',
          summary: '',
          pros: [''],
          cons: [''],
          keySpecs: [{ label: '', value: '' }]
        }
      ],
      faqs: [{ question: '', answer: '' }],
      published: true,
      featured: false,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

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

  // Product manipulation helpers
  const handleAddProduct = () => {
    const newProd: ComparisonProductItem = {
      id: `prod-${Date.now()}-${formData.products.length + 1}`,
      title: '',
      badge: formData.products.length === 0 ? 'Melhor Escolha' : 'Custo-Benefício',
      rating: 4.8,
      price: 'R$ ',
      originalPrice: '',
      partnerStore: 'Mercado Livre',
      affiliateUrl: '',
      imageUrl: '',
      summary: '',
      pros: [''],
      cons: [''],
      keySpecs: [{ label: '', value: '' }]
    };
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProd]
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

    // Auto-fill product fields if empty or confirm linking
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('O título do comparativo é obrigatório.');
      return;
    }
    if (!formData.slug.trim()) {
      setErrorMsg('O slug da URL é obrigatório.');
      return;
    }
    if (formData.products.length === 0) {
      setErrorMsg('Adicione pelo menos um produto para o comparativo.');
      return;
    }

    for (let i = 0; i < formData.products.length; i++) {
      const p = formData.products[i];
      if (!p.title.trim()) {
        setErrorMsg(`Preencha o título do produto #${i + 1}.`);
        return;
      }
      if (!p.affiliateUrl.trim()) {
        setErrorMsg(`Informe o link de afiliado do produto #${i + 1}.`);
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await onSave({
        ...formData,
        coverImage: formData.coverImage || formData.products[0]?.imageUrl || '',
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
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold">
                {guide ? 'Editar Guia Comparativo' : 'Criar Novo Guia Comparativo'}
              </h2>
              <p className="text-xs text-slate-300">
                Artigo com tabela comparativa, badges de pódio e links de afiliados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            1. Informações Básicas & Capa
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
            3. Dicas de Compra & Guia
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
                  placeholder="Apresente aos leitores os desafios da escolha dessa categoria e o que foi considerado nos testes..."
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
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Ao selecionar uma análise, os botões permitirão ao visitante navegar bidirecionalmente entre o comparativo e o artigo detalhado.
                    </p>
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Loja Parceira *</label>
                      <input
                        type="text"
                        value={prod.partnerStore}
                        onChange={(e) => handleUpdateProduct(pIdx, { partnerStore: e.target.value })}
                        placeholder="Mercado Livre, Amazon..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        required
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
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
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
                        onChange={(e) => handleUpdateProduct(pIdx, { pros: e.target.value.split('\n').filter(Boolean) })}
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
                        onChange={(e) => handleUpdateProduct(pIdx, { cons: e.target.value.split('\n').filter(Boolean) })}
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
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
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
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              ))}
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
