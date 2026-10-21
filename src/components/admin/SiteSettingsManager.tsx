import React, { useState, useRef } from 'react';
import { SiteSettings } from '../../types';
import { Save, ShieldCheck, Code, Globe, Search, Cloud, Download, Upload, RefreshCw, CheckCircle2 } from 'lucide-react';
import { StoreService } from '../../services/store';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncToFirestore = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await StoreService.syncAllToFirestore();
      setSyncFeedback(`Sincronizado com sucesso! ${res.reviewsCount} avaliações e ${res.categoriesCount} categorias salvas na nuvem.`);
    } catch {
      setSyncFeedback('Erro ao sincronizar. Verifique a conexão com a nuvem.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = StoreService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_achados_reviews_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = await StoreService.importBackup(content);
        if (ok) {
          setSyncFeedback('Backup importado e sincronizado com a nuvem com sucesso! Recarregando...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setSyncFeedback('Arquivo de backup inválido.');
          setTimeout(() => setSyncFeedback(null), 4000);
        }
      }
    };
    reader.readAsText(file);
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4500);
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setSaving(false);
    }
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

        {/* SINCRONIZAÇÃO EM NUVEM E BACKUP (Garante que dados não sejam perdidos no Netlify) */}
        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold flex items-center gap-2 text-cyan-400">
                <Cloud className="w-4 h-4" />
                <span>Sincronização com a Nuvem &amp; Backup Completo</span>
              </h4>
              <p className="text-3xs text-slate-400">
                Garanta que todos os produtos inseridos fiquem salvos no Google Cloud Firestore para aparecerem no Netlify e em qualquer dispositivo.
              </p>
            </div>

            <button
              type="button"
              disabled={syncing}
              onClick={handleSyncToFirestore}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar com a Nuvem Agora'}</span>
            </button>
          </div>

          {syncFeedback && (
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-2xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-2xs text-slate-400">
            <span>Você também pode baixar uma cópia de segurança em arquivo JSON:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors flex items-center gap-1 border border-slate-700"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Baixar Backup (.json)</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportBackup}
                accept=".json"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors flex items-center gap-1 border border-slate-700"
              >
                <Upload className="w-3 h-3 text-[#FF6B00]" />
                <span>Restaurar Backup (.json)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {savedSuccess ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Configurações salvas e aplicadas com sucesso no Firestore!</span>
            </div>
          ) : (
            <div className="text-3xs text-slate-400">
              As alterações salvas entram em vigor imediatamente no site e na nuvem.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] disabled:bg-orange-300 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações Globais</span>
              </>
            )}
          </button>
        </div>

      </div>
    </form>
  );
};
