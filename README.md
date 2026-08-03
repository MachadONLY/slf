# Self-Education — dark academic knowledge workspace

Protótipo funcional de um workspace pessoal inspirado em Notion/Google Docs, com identidade noir, editorial e dark academia.

## O que já funciona

- Dashboard responsivo com cards e capas de projetos.
- Projetos e páginas hierárquicas.
- Editor rich text local: títulos, negrito, itálico, sublinhado, listas, citações, código, links, imagens, embeds de YouTube, callouts, divisores e to-dos.
- Capa e ícone configuráveis por página.
- Busca global em projetos, páginas e conteúdo.
- Favoritos.
- Salvamento automático no navegador.
- Exportação/importação de backup em JSON.
- PWA básica e cache offline.
- Layout testado para desktop, tablet e mobile.

## Rodar

## Início rápido no Windows

Extraia a pasta e dê dois cliques em `start-localhost.bat`. O navegador abrirá em `http://localhost:4173`.

No terminal, você também pode executar:

```powershell
py -m http.server 4173
```


O app é estático e não exige instalação de dependências.

```bash
python -m http.server 4173
```

Abra `http://localhost:4173`.

Também é possível abrir `index.html` diretamente, mas o service worker e alguns recursos de PWA exigem servidor local.

## Arquitetura recomendada para produção

O protótipo usa HTML/CSS/JavaScript e `localStorage` para ser executável imediatamente. A evolução correta para produto multi-dispositivo é:

- **Frontend:** Next.js + TypeScript.
- **Editor:** Tiptap/ProseMirror ou Lexical.
- **Banco e autenticação:** Supabase/PostgreSQL + Row Level Security.
- **Imagens:** Supabase Storage.
- **Sincronização colaborativa:** Yjs + Hocuspocus/Liveblocks, somente quando colaboração for necessária.
- **Busca:** PostgreSQL full-text no início; Meilisearch apenas se a escala justificar.
- **Deploy:** Vercel/Cloudflare.

Não recomendo tentar copiar todas as funções do Notion na primeira versão. O núcleo deve ser projetos, páginas, escrita, mídia e busca.

## Limites deste protótipo

- Dados ficam somente neste navegador até exportar um backup.
- `document.execCommand` foi usado para manter o MVP sem dependências; em produção, substituir por Tiptap ou Lexical.
- Imagens em base64 podem consumir a cota local. A versão de produção deve usar Storage.
