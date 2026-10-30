import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, 'PROJETO_CONSOLIDADO_IA.md');

// Extensões de interesse para código e documentação
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.html', '.md'
]);

// Pastas a ignorar
const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.gemini',
  '.system_generated',
  '.vscode'
]);

// Arquivos a ignorar especificamente
const IGNORE_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'PROJETO_CONSOLIDADO_IA.md'
]);

function getLanguage(ext) {
  switch (ext) {
    case '.jsx': return 'jsx';
    case '.js': return 'javascript';
    case '.tsx': return 'tsx';
    case '.ts': return 'typescript';
    case '.css': return 'css';
    case '.json': return 'json';
    case '.html': return 'html';
    case '.md': return 'markdown';
    default: return '';
  }
}

function scanDirectory(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        scanDirectory(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTENSIONS.has(ext) && !IGNORE_FILES.has(entry.name)) {
        fileList.push({ fullPath, relPath, ext });
      }
    }
  }

  return fileList;
}

function generateMarkdown() {
  console.log('🔍 Mapeando arquivos do projeto...');
  const files = scanDirectory(ROOT_DIR);

  // Ordenar: primeiro raiz, depois src/
  files.sort((a, b) => a.relPath.localeCompare(b.relPath));

  let output = `# Contexto do Projeto: ${path.basename(ROOT_DIR)}\n\n`;
  output += `> Arquivo consolidado gerado automaticamente para consumo por Modelos de Linguagem (LLMs/IAs).\n`;
  output += `> Data de geração: ${new Date().toLocaleString('pt-BR')}\n`;
  output += `> Total de arquivos incluídos: ${files.length}\n\n`;

  output += `## 📁 Estrutura de Arquivos\n\n\`\`\`text\n`;
  for (const f of files) {
    output += `${f.relPath}\n`;
  }
  output += `\`\`\`\n\n`;

  output += `## 📄 Conteúdo dos Arquivos\n\n`;

  let totalLines = 0;

  for (const f of files) {
    try {
      const content = fs.readFileSync(f.fullPath, 'utf8');
      const lines = content.split('\n').length;
      totalLines += lines;
      const lang = getLanguage(f.ext);

      output += `---\n\n`;
      output += `### Arquivo: \`${f.relPath}\` (${lines} linhas)\n\n`;
      output += `\`\`\`${lang}\n`;
      output += content.trimEnd() + '\n';
      output += `\`\`\`\n\n`;
    } catch (err) {
      console.warn(`⚠️ Não foi possível ler ${f.relPath}: ${err.message}`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  const sizeMb = (fs.statSync(OUTPUT_FILE).size / (1024 * 1024)).toFixed(2);

  console.log(`\n✅ Sucesso! Arquivo gerado em:\n👉 ${OUTPUT_FILE}`);
  console.log(`📊 Estatísticas: ${files.length} arquivos, ${totalLines} linhas (~${sizeMb} MB).`);
}

generateMarkdown();

