# Self-Education

Workspace pessoal de escrita e estudo com estética noir/dark academia, inspirado na flexibilidade de Notion e Google Docs.

## Rodar localmente

Na pasta do projeto:

```powershell
npm run dev
```

Abra:

```text
http://localhost:4173
```

O servidor utiliza apenas módulos nativos do Node.js, então não é necessário executar `npm install` nesta versão.

## Fluxo de trabalho

As alterações feitas pelo ChatGPT serão commitadas diretamente neste repositório. Para atualizar sua pasta local:

```powershell
git pull origin main
```

Caso existam mudanças locais ainda não commitadas, salve-as antes com commit ou `git stash` para evitar conflitos.

## Estado atual

- Dashboard responsivo com projetos e páginas.
- Editor rich text local.
- Capas, descrições, favoritos e busca.
- Salvamento em `localStorage`.
- Exportação e importação de backup.
- Servidor local em Node.js.
