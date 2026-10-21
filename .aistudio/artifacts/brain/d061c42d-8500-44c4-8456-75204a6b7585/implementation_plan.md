# Achados & Reviews – Plataforma Autônoma de Reviews e Afiliados Monetizável

Sistema completo de reviews, comparativos e recomendação de produtos com foco em monetização por afiliados, otimização extrema para SEO (OpenGraph, Schema.org JSON-LD para Google Rich Snippets) e um Painel Administrativo moderno protegido por senha para gestão autônoma de reviews, categorias, banners e links de afiliados sem necessidade de tocar no código.

> [!IMPORTANT]
> **Decisões Confirmadas no Questionário de Alinhamento:**
> - **Persistência de Dados & Backend:** Firebase Firestore com autenticação na nuvem para o painel administrativo e artigos persistentes, acompanhado de sincronização resiliente e dados semente de alta qualidade para inicialização imediata.
> - **Nicho Inicial do Catálogo:** Variedade geral com múltiplos nichos de alto volume (Tecnologia & Gadgets, Setup & Gamer, Casa Inteligente & Utensílios, Áudio & Produtividade).
> - **Formato de Chamadas de Afiliados:** Botão CTA de conversão com destaque de preço, cupom de desconto com cópia em 1 clique e botões de lojas parceiras (Amazon, Mercado Livre, Shopee, etc.) sempre com atributos `rel="sponsored nofollow"` nativos.

---

## 1. Visão Geral & Conceito Central

- **O que faz:** Oferece um portal editorial e de compras inteligentes onde visitantes encontram análises aprofundadas, prós e contras visuais, especificações técnicas, comparativos e links com cupons verificados. O administrador tem acesso a um dashboard completo para criar novos artigos, editar preços, gerenciar anúncios e acompanhar métricas de visualizações e cliques de afiliados.
- **Público-alvo:** Consumidores que buscam decisões de compra assertivas antes de comprar produtos online, e o gestor do site (criador de conteúdo/afiliado) que precisa de autonomia total de publicação.
- **Valor Chave:** Velocidade de carregamento, SEO impecável (Rich Snippets para estrelas e preços no Google) e fluxo de monetização direto, escalável e 100% gerenciável pela interface gráfica.

---

## 2. Experiência do Usuário & Identidade Visual

### A. Fluxos de Navegação Principais
1. **Página Inicial (Home / Vitrine):**
   - Topo com barra de navegação limpa (marca com tipografia marcante, links de categorias e acesso ao Admin).
   - Banner de destaque editorial hero com o review mais recente ou melhor custo-benefício da semana.
   - Grade de categorias com filtros instantâneos (Sem recarregar a página).
   - Campo de busca instantânea inteligente com busca em tempo real por nome, categoria ou loja.
   - Vitrine de reviews em cards elegantes com imagem do produto, nota em estrelas, faixa de preço, selo de veredito e link rápido.
   - Barra lateral / áreas reservadas para banners de anunciantes ou campanhas de afiliados.

2. **Página de Review Detalhado (Artigo / Vendas):**
   - Cabeçalho otimizado com breadcrumbs, título SEO, data de atualização, nota do produto (ex: 4.8 / 5.0) e badge de veredito.
   - Card de Oferta Principal contendo: imagem em alta resolução, preço atualizado, cupom de desconto exclusivo com botão de cópia instantânea, e CTA principal estilizado para compra na loja oficial com `rel="sponsored nofollow"`.
   - Caixa visual comparativa de **Prós e Contras** (lado a lado, com ícones funcionais).
   - Tabela de especificações técnicas formatada.
   - Corpo do artigo com conteúdo rico (análise de design, desempenho, bateria, usabilidade).
   - Veredito final resumido com nota detalhada por critério (Custo-Benefício, Construção, Desempenho).
   - Seção de Perguntas Frequentes (FAQ) interativa com accordion, injetando Schema JSON-LD `FAQPage` e `Product` para o Google.
   - Seção de produtos similares / alternativas recomendadas.

3. **Painel Administrativo Restrito (`/admin`):**
   - Tela de Login segura com autenticação Firebase / senha mestra de segurança.
   - Dashboard com cards de métricas (Total de reviews, cliques registrados em links afiliados, produtos por categoria, visualizações).
   - **Gerenciador de Reviews (CRUD):** Criar novo review com editor rico/markdown, upload/URL de imagens, nota, preço, prós, contras, link de afiliado, cupom, tabela de especificações e FAQ dinâmico.
   - **Gerenciador de Banners:** Inserir e alterar banners de topo, lateral e fim de artigo (URL da imagem, link de destino, tag de rastreamento).
   - **Configurações Gerais:** Editar nome do site, logotipo, texto de disclaimer de afiliados legal, scripts de rastreamento (Google Analytics / Pixel) e redes sociais.

### B. Paleta de Cores & Design System
Seguindo as diretrizes de visual moderno e tecnológico solicitadas pelo usuário:
- **Azul Escuro Profundo / Background Dark & Hero:** `#0B132B` e `#1C2541` para estrutura contrastante e sofisticação técnica.
- **Azul Cyan Neon (Destaque & Tecnologia):** `#00E5FF` para detalhes de iluminação, badges ativos, bordas sutis e foco.
- **Laranja Cobre / Ouro Queimado (Ação de Compra & Conversão):** `#FF6B00` para botões principais de CTA, cupons e destaque de preços (máxima taxa de clique).
- **Superfície & Cards:** `#FFFFFF` em modo claro e fundos de leitura de alto contraste com cinzas neutros (`#F8FAFC`, `#F1F5F9`) para corpo de texto legível de artigos longos sem fadiga visual.
- **Tipografia:** `Plus Jakarta Sans` para títulos e cabeçalhos modernos e expressivos; corpo de texto limpo em `Inter` / sistema sans; números de preços e notas em fonte mono tabular (`tabular-nums`).

---

## 3. Principais Decisões de Produto & Arquitetura

- **Persistência Híbrida & Segura (Firebase Firestore):**
  - Utilização do Firebase Firestore para armazenamento dos artigos, categorias, configurações e cliques de monetização.
  - Sincronização em tempo real e fallback local transparente para garantir que o site nunca fique quebrado ou vazio durante a inicialização ou caso a conexão caia.
- **SEO Dinâmico & Conformidade Google:**
  - O cabeçalho HTML e os componentes injetam dinamicamente `<title>`, `<meta name="description">`, `og:image`, `og:type` e dados estruturados Schema.org (`Product`, `Review`, `AggregateRating` e `FAQPage`).
  - Atributos `rel="sponsored nofollow"` automáticos em todos os botões de saída de afiliados para evitar qualquer penalização do algoritmo do Google.
- **Editor Rico e Autónomo:**
  - O painel administrativo possui formulários completos com visualização ao vivo, permitindo inclusão de blocos de FAQ, listas de prós/contras com adição dinâmica de itens e especificações técnicas sem tocar em linhas de código.

---

## 4. Arquitetura Técnica & Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Achados & Reviews UI                            │
├──────────────────────────────────┬─────────────────────────────────────┤
│        Página Pública (SEO)      │       Painel Administrativo         │
│  ┌─────────────────────────────┐ │  ┌────────────────────────────────┐ │
│  │ Navbar (Logo, Busca, Links) │ │  │ Auth Guard / Login Firebase    │ │
│  ├─────────────────────────────┤ │  ├────────────────────────────────┤ │
│  │ Hero & Destaque da Semana   │ │  │ Dashboard (Métricas & Cliques) │ │
│  ├─────────────────────────────┤ │  ├────────────────────────────────┤ │
│  │ Filtro de Categorias & Grid │ │  │ CRUD Reviews (Editor Rico,     │ │
│  ├─────────────────────────────┤ │  │  Prós/Contras, Specs, FAQ)     │ │
│  │ Página Review Detalhado     │ │  ├────────────────────────────────┤ │
│  │ (CTA Afiliado, Cupom, Specs,│ │  │ Gestor de Banners & Anúncios   │ │
│  │  FAQ Accordion, Schema.org) │ │  ├────────────────────────────────┤ │
│  │ Slots Banners (Header/Side) │ │  │ Configurações Gerais do Site   │ │
│  └─────────────────────────────┘ │  └────────────────────────────────┘ │
└─────────────────┬────────────────┴──────────────────┬──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Camada de Dados & Serviços                       │
│  • Firebase Firestore (reviews, categories, banners, siteSettings)     │
│  • Firebase Auth (login do administrador)                              │
│  • Gerenciador de Rastreamento de Cliques de Afiliados                 │
│  • Injetor de Schema.org JSON-LD & Meta Tags Otimizadas                │
└────────────────────────────────────────────────────────────────────────┘
```

### Entidades do Banco de Dados:
- **`reviews`**: `id`, `slug`, `title`, `subtitle`, `category`, `coverImage`, `rating` (1-5), `priceCurrent`, `priceOriginal`, `affiliateUrl`, `partnerStore`, `couponCode`, `pros` (array), `cons` (array), `specifications` (array chave-valor), `content` (artigo detalhado), `faqs` (array de pergunta/resposta), `verdict`, `featured` (boolean), `createdAt`, `viewsCount`, `clicksCount`.
- **`categories`**: `id`, `name`, `slug`, `icon`, `description`.
- **`banners`**: `id`, `position` ('header' | 'sidebar' | 'in_article'), `imageUrl`, `targetUrl`, `altText`, `active`.
- **`siteSettings`**: `siteName`, `tagline`, `logoUrl`, `affiliateDisclosure`, `socialLinks`, `headerTrackingCode`.

---

## Próximos Passos de Execução
Após a aprovação deste plano:
1. Provisionar o Firebase conforme o skill oficial via `show_aistudio_ui` e configurar as coleções e regras de segurança.
2. Construir os tipos TypeScript, o repositório de dados com coleções e dados semente ricos.
3. Desenvolver o layout público com a identidade visual (Cores Neon Cyan `#00E5FF`, Laranja `#FF6B00`, Azul Profundo `#0B132B`).
4. Desenvolver o leitor de reviews, botões de afiliados com cópia de cupom, especificações, prós/contras e FAQ com JSON-LD.
5. Construir o Painel Administrativo completo (Dashboard, CRUD de Reviews, Gestor de Banners e Configurações).
6. Testar compilação, responsividade e verificar ausência de erros.
