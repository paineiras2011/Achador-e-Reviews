import React from 'react';
import { ArrowLeft, ShieldCheck, Award, Scale, Lock, CheckCircle2, Layers } from 'lucide-react';

export type InfoPageType = 'sobre' | 'metodologia' | 'privacidade' | 'termos';

interface InfoPageProps {
  page: InfoPageType;
  siteName?: string;
  affiliateDisclosure?: string;
  onGoHome: () => void;
  onGoGuides: () => void;
  onSelectInfoPage: (page: InfoPageType) => void;
}

export const InfoPage: React.FC<InfoPageProps> = ({
  page,
  siteName = 'Achados & Reviews',
  affiliateDisclosure,
  onGoHome,
  onGoGuides,
  onSelectInfoPage
}) => {
  const handleLinkClick = (e: React.MouseEvent, action: () => void) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      action();
    }
  };

  const titles: Record<InfoPageType, string> = {
    sobre: `Sobre o ${siteName}`,
    metodologia: 'Metodologia de Análise e Critérios Editoriais',
    privacidade: 'Política de Privacidade e LGPD',
    termos: 'Termos de Uso e Transparência de Afiliados'
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, onGoHome)}
            className="hover:text-cyan-600 font-semibold transition-colors"
          >
            Início
          </a>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{titles[page]}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, onGoHome)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-cyan-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Análises</span>
          </a>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(['sobre', 'metodologia', 'privacidade', 'termos'] as InfoPageType[]).map((p) => (
              <a
                key={p}
                href={`/${p}`}
                onClick={(e) => handleLinkClick(e, () => onSelectInfoPage(p))}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  page === p
                    ? 'bg-[#0B132B] text-white border-[#0B132B] font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {p === 'sobre' ? 'Sobre Nós' : p === 'metodologia' ? 'Metodologia' : p === 'privacidade' ? 'Privacidade' : 'Termos'}
              </a>
            ))}
          </div>
        </div>

        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
          {page === 'sobre' && (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
                <ShieldCheck className="w-4 h-4" />
                <span>Transparência Editorial</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sobre o {siteName}: Curadoria Imparcial para Compras Inteligentes
              </h1>
              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                <p>
                  O <strong>{siteName}</strong> nasceu com um objetivo claro: ajudar consumidores brasileiros a tomar decisões de compra mais seguras, econômicas e bem informadas antes de investir em tecnologia, mobilidade urbana, informática e casa inteligente.
                </p>
                <p>
                  Em vez de reproduzir descrições promocionais genéricas de lojas, nossa equipe analisa fichas técnicas oficiais, compara gerações de produtos, levanta prós e contras reais e responde às principais dúvidas práticas que surgem antes do fechamento do pedido.
                </p>
                <h2 className="text-lg font-bold text-slate-900 pt-2">Como nos mantemos independentes?</h2>
                <p>
                  {affiliateDisclosure || 'Participamos de programas oficiais de afiliados (como Amazon Associados, Mercado Livre e Shopee). Quando você clica em um link recomendado e realiza uma compra, podemos receber uma pequena comissão sem qualquer custo adicional no valor pago por você.'}
                </p>
                <p>
                  Nossa linha editorial não aceita pagamentos para alterar notas ou esconder pontos negativos de nenhum produto avaliado.
                </p>
              </div>
            </>
          )}

          {page === 'metodologia' && (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                <Award className="w-4 h-4" />
                <span>Critérios Técnicos</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Nossa Metodologia de Avaliação e Notas
              </h1>
              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                <p>
                  Cada produto analisado no <strong>{siteName}</strong> recebe pontuação de 1,0 a 5,0 dividida em quatro pilares objetivos que impactam diretamente o uso no dia a dia:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                  {[
                    { title: 'Custo-Benefício', desc: 'Comparamos o preço médio praticado no Brasil frente aos recursos entregues por concorrentes diretos.' },
                    { title: 'Desempenho Real', desc: 'Avaliamos potência, processador, autonomia de bateria, velocidade de resposta e eficiência energética.' },
                    { title: 'Construção e Durabilidade', desc: 'Verificamos materiais, certificações de proteção (como IP68 ou 5 ATM), acabamento e garantia nacional.' },
                    { title: 'Usabilidade e Suporte', desc: 'Analisamos facilidade de configuração, qualidade de aplicativos, compatibilidade no Brasil e assistência.' }
                  ].map((item) => (
                    <div key={item.title} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <h2 className="text-lg font-bold text-slate-900 pt-2">Verificação de Lojas Parceiras</h2>
                <p>
                  Priorizamos sempre redirecionar para anúncios de lojas oficiais, distribuidores autorizados ou vendedores com alta reputação na Amazon Brasil, Mercado Livre e Shopee Oficial, garantindo emissão de nota fiscal e direito de arrependimento.
                </p>
              </div>
            </>
          )}

          {page === 'privacidade' && (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
                <Lock className="w-4 h-4" />
                <span>LGPD &amp; Dados</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Política de Privacidade
              </h1>
              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                <p>
                  O <strong>{siteName}</strong> respeita a sua privacidade e segue as diretrizes da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>
                <h2 className="text-lg font-bold text-slate-900 pt-2">1. Dados Coletados</h2>
                <p>
                  Não exigimos cadastro, login, CPF ou dados pessoais para ler nossas análises e acessar ofertas. Podemos registrar métricas anônimas e agregadas de visualizações de páginas e cliques de saída para lojas parceiras visando melhorar a relevância do conteúdo.
                </p>
                <h2 className="text-lg font-bold text-slate-900 pt-2">2. Cookies e Links de Afiliados</h2>
                <p>
                  Ao clicar em um botão de oferta para Amazon, Mercado Livre, Shopee ou Magazine Luiza, a loja parceira de destino poderá utilizar cookies próprios para identificar a origem da recomendação e processar com segurança seu pedido dentro da plataforma deles.
                </p>
                <h2 className="text-lg font-bold text-slate-900 pt-2">3. Armazenamento Local</h2>
                <p>
                  Utilizamos o armazenamento local do navegador apenas para agilizar o carregamento do catálogo e lembrar preferências de exibição sem armazenar informações pessoais sensíveis.
                </p>
              </div>
            </>
          )}

          {page === 'termos' && (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                <Scale className="w-4 h-4" />
                <span>Termos &amp; Condições</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Termos de Uso e Isenção de Responsabilidade
              </h1>
              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                <p>
                  Ao acessar o <strong>{siteName}</strong>, você concorda com os termos descritos nesta página.
                </p>
                <h2 className="text-lg font-bold text-slate-900 pt-2">1. Caráter Editorial e Preços Dinâmicos</h2>
                <p>
                  O {siteName} é um portal informativo de análises técnicas e curadoria de ofertas. Não somos uma loja virtual, não processamos pagamentos e não realizamos entregas. Todos os preços, estoques, prazos de entrega e condições de parcelamento são definidos exclusivamente pelas lojas parceiras de destino e podem sofrer alterações sem aviso prévio.
                </p>
                <h2 className="text-lg font-bold text-slate-900 pt-2">2. Programa de Afiliados</h2>
                <p>
                  {affiliateDisclosure || 'Como associado de plataformas parceiras, podemos receber comissão por compras qualificadas efetuadas através de nossos links de indicação, sem custo extra ao consumidor.'}
                </p>
              </div>
            </>
          )}

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <a
              href="/#guias-comparativos"
              onClick={(e) => handleLinkClick(e, onGoGuides)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Explorar Guias Comparativos</span>
            </a>
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, onGoHome)}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-800 underline"
            >
              Ver todas as avaliações de produtos
            </a>
          </div>
        </article>
      </div>
    </div>
  );
};
