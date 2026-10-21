import React, { useState } from 'react';
import { Banner } from '../../types';
import { Save, Plus, ExternalLink, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

interface BannerManagerProps {
  banners: Banner[];
  onSaveBanner: (banner: Banner) => void;
}

export const BannerManager: React.FC<BannerManagerProps> = ({
  banners,
  onSaveBanner
}) => {
  const [editingBanner, setEditingBanner] = useState<Banner | null>(banners[0] || null);

  const handleToggleActive = (b: Banner) => {
    const updated = { ...b, active: !b.active };
    onSaveBanner(updated);
    if (editingBanner?.id === b.id) {
      setEditingBanner(updated);
    }
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      onSaveBanner(editingBanner);
      alert('Banner atualizado com sucesso!');
    }
  };

  const PRESET_BANNERS = [
    { label: 'Ofertas em Lojas Parceiras', url: '/src/assets/images/hero_tech_showcase_1792355762010.jpg' },
    { label: 'Vitrine de Dispositivos', url: '/src/assets/images/hero_tech_showcase_1792355762010.jpg' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Gerenciador de Banners e Espaços Publicitários
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Controle os slots de anúncios monetizáveis (Topo, Barra Lateral e Dentro dos Artigos).
        </p>

        {/* List of current slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {banners.map((b) => {
            const isSelected = editingBanner?.id === b.id;
            return (
              <div
                key={b.id}
                onClick={() => setEditingBanner(b)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/30 ring-1 ring-cyan-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-bold uppercase tracking-wider text-cyan-600 bg-cyan-100/60 px-2 py-0.5 rounded">
                    Posição: {b.position}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(b);
                    }}
                    className={`text-2xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      b.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {b.active ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                    <span>{b.active ? 'Ativo' : 'Pausado'}</span>
                  </button>
                </div>

                <h4 className="text-xs font-bold text-slate-900 truncate mb-2">{b.title}</h4>

                <div className="aspect-16/9 rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
                  <img
                    src={b.imageUrl}
                    alt={b.altText}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Selected Banner Form */}
        {editingBanner && (
          <form onSubmit={handleSaveCurrent} className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Editar Banner: {editingBanner.title} ({editingBanner.position})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Banner</label>
                <input
                  type="text"
                  required
                  value={editingBanner.title}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Texto Alternativo (Alt Text)</label>
                <input
                  type="text"
                  value={editingBanner.altText}
                  onChange={(e) => setEditingBanner({ ...editingBanner, altText: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link de Destino / Afiliado (URL) *
              </label>
              <input
                type="url"
                required
                value={editingBanner.targetUrl}
                onChange={(e) => setEditingBanner({ ...editingBanner, targetUrl: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                placeholder="https://www.amazon.com.br/...?tag=sua-tag-20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL da Imagem do Banner
              </label>
              <input
                type="text"
                required
                value={editingBanner.imageUrl}
                onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white mb-2"
              />

              <div className="flex items-center gap-2">
                <span className="text-3xs text-slate-400 uppercase">Presets rápidos:</span>
                {PRESET_BANNERS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEditingBanner({ ...editingBanner, imageUrl: p.url })}
                    className="text-xs text-cyan-600 hover:text-cyan-800 underline underline-offset-2"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingBanner.active}
                  onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-xs font-semibold text-slate-700">Banner Ativo no Site</span>
              </label>

              <button
                type="submit"
                className="px-5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Alterações do Banner</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
