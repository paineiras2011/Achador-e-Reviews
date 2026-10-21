import React, { useState } from 'react';
import { SiteSettings } from '../../types';
import { Save, ShieldCheck, Code, Globe, Search } from 'lucide-react';

interface SiteSettingsManagerProps {
  settings: SiteSettings;
  onSaveSettings: (settings: SiteSettings) => void;
}

export const SiteSettingsManager: React.FC<SiteSettingsManagerProps> = ({
  settings,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<SiteSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-500" />
            <span>Configurações Gerais &amp; Identidade do Site</span>
          </h3>
          <p className="text-xs text-slate-500">
            Personalize o nome da plataforma, aviso legal de afiliados e códigos de rastreamento.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Configurações salvas e aplicadas com sucesso no Firestore!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome do Site
            </label>
            <input
              type="text"
              required
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Slogan / Chamada Principal
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Aviso Legal de Afiliados */}
        <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-xl space-y-2">
          <label className="block text-xs font-bold text-orange-950 flex items-center justify-between">
            <span>Aviso Legal de Afiliados (Conformidade com Google e Lojas Parceiras)</span>
            <span className="text-3xs font-normal text-orange-800">Exibido no rodapé do site</span>
          </label>
          <textarea
            rows={3}
            value={formData.affiliateDisclosure}
            onChange={(e) => setFormData({ ...formData, affiliateDisclosure: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-orange-300 rounded-lg bg-white leading-relaxed"
          />
        </div>

        {/* Google Search Console & Indexação */}
        <div className="p-4 bg-cyan-50/60 border border-cyan-200 rounded-xl space-y-2">
          <label className="block text-xs font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-900">
              <Search className="w-4 h-4 text-cyan-600" />
              <span>Verificação do Google Search Console (Indexação no Google)</span>
            </span>
            <span className="text-3xs text-cyan-700 font-normal">Recomendado para indexação rápida</span>
          </label>
          <input
            type="text"
            value={formData.googleSiteVerification || ''}
            onChange={(e) => setFormData({ ...formData, googleSiteVerification: e.target.value })}
            placeholder="Exemplo: google-site-verification=abcdef123456789 ou o código de verificação"
            className="w-full px-3 py-2 text-xs font-mono border border-cyan-300 rounded-lg bg-white"
          />
          <p className="text-3xs text-slate-600 leading-relaxed">
            Para que o Google comece a mostrar seu site: acesse o <strong>Google Search Console</strong>, adicione a URL do seu site, escolha o método de verificação por <em>Tag HTML</em> e cole aqui apenas o valor do atributo <code>content</code> (ou a tag inteira). O sistema cuidará da injeção no cabeçalho automaticamente.
          </p>
        </div>

        {/* Códigos de Rastreamento Opcionais */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>Códigos de Rastreamento Adicionais (Google Analytics, Meta Pixel)</span>
          </label>
          <textarea
            rows={3}
            value={formData.headerTrackingCode || ''}
            onChange={(e) => setFormData({ ...formData, headerTrackingCode: e.target.value })}
            placeholder="<!-- Cole aqui scripts como Google Analytics ou tags de conversão -->"
            className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50"
          />
          <span className="text-3xs text-slate-400 mt-1 block">
            Os scripts adicionados aqui são carregados no cabeçalho das páginas públicas.
          </span>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações Globais</span>
          </button>
        </div>

      </div>
    </form>
  );
};
