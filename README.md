# Self-Education

Workspace pessoal de escrita e estudo com estética noir/dark academia, inspirado na flexibilidade de Notion e Google Docs.

## Primeira instalação no Windows

Para poder usar `git pull`, a pasta precisa ser criada com `git clone`. O botão **Download ZIP** do GitHub não inclui a pasta oculta `.git` e, por isso, uma pasta extraída do ZIP nunca aceita `git pull`.

No PowerShell:

```powershell
cd C:\Users\zgabr\Downloads
git clone https://github.com/MachadONLY/slf.git self-education-app
cd self-education-app
npm run dev
```

Abra:

```text
http://localhost:4173
```

O servidor utiliza apenas módulos nativos do Node.js, então não é necessário executar `npm install` nesta versão.

## Fluxo diário com dois terminais

### Terminal 1 — manter o app aberto

```powershell
cd C:\Users\zgabr\Downloads\self-education-app
npm run dev
```

### Terminal 2 — receber as alterações

```powershell
cd C:\Users\zgabr\Downloads\self-education-app
npm run sync
```

`npm run sync` executa internamente:

```powershell
git pull --ff-only origin main
```

Depois do pull, basta atualizar o navegador. Em localhost, o service worker é desativado e os caches antigos são removidos para as mudanças aparecerem corretamente.

## Estado atual

- Dashboard responsivo com projetos e páginas.
- Home editorial com páginas recentes em rotação.
- Editor rich text local.
- Capas, descrições, favoritos e busca.
- Salvamento em `localStorage`.
- Exportação e importação de backup.
- Servidor local em Node.js.
