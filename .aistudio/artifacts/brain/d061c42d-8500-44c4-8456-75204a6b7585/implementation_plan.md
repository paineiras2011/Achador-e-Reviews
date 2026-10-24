# Plano de Correção e Otimização: Identificação de Afiliados Shopee e Mercado Livre

## Problemas Identificados
1. **Shopee**:
   - Encurtadores de afiliados (`https://s.shopee.com.br/1BNLrDDEyE`) retornam uma Single Page Application (SPA) vazia quando acessados com o User-Agent padrão de navegadores desktop, deixando a página sem títulos ou metatags OpenGraph.
   - O extrator de slugs (`extractSlugWords`) e o modal de cadastro tratavam o hash alfanumérico do encurtador (`1BNLrDDEyE`) como se fosse o nome/slug do produto.
   - Produtos de mobilidade urbana e bicicletas elétricas não tinham gerador de nicho especializado nem categoria própria ("Mobilidade & Esportes").
2. **Mercado Livre**:
   - Plataforma redireciona requisições de servidores em nuvem para páginas de verificação (`/gz/account-verification?go=...`).
   - O título genérico da página de verificação ("Mercado Libre") acabava substituindo o título real do produto que estava presente no slug da URL.
   - A requisição ficava lenta devido a timeouts excessivos (7s scrape + 25s Gemini).
   - Expressão regular de detecção da Amazon (`a.co`) continha falso positivo interceptando links da Magazine Luiza (`magazineluiza.com`).

## Soluções Implementadas
1. **Shopee**:
   - Implementado User-Agent específico (`WhatsApp/2.21.12.21 A`) para domínios Shopee (`shopee.com.br`, `s.shopee.com.br`), permitindo que a CDN da Shopee entregue a renderização completa com metatags OpenGraph (`og:title`, `og:image`, `og:description` com especificações técnicas completas).
   - Bloqueio de tokens de encurtadores (`s.shopee`, `amzn.to`, `meli.la`, etc.) na extração de slugs, garantindo que hashes nunca sejam usados como nome do produto.
   - Criada categoria e gerador especializado de **Mobilidade & Esportes** (`buildMobilityData`) para bicicletas elétricas, patinetes e scooters, extraindo potência (400W), voltagem (48V), bateria de lítio, autonomia e freios a disco reais.
2. **Mercado Livre**:
   - Implementado decodificador do parâmetro `?go=` nas URLs de verificação do Mercado Livre para restaurar a URL real do produto e extrair o título limpo do slug (removendo prefixos `MLB-` e sufixos `_JM`).
   - Rejeição estrita de títulos de verificação/bloqueio ("Mercado Libre", "Mercado Livre", "Acesse sua conta", etc.).
3. **Desempenho e Robustez Geral**:
   - Otimizado timeout do scraper para 4 segundos e do Gemini para 7 segundos com limite de tokens (`maxOutputTokens: 1800`), eliminando travamentos e garantindo resposta ágil.
   - Corrigido regex de lojas para evitar falsos positivos entre Amazon e Magazine Luiza.
   - Validados testes para Shopee, Mercado Livre, Amazon e Magazine Luiza.
