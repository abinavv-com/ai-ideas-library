import fs from 'fs';
import path from 'path';

// On Vercel the markdown files are already in public/ideas (committed to repo).
// Locally they may live in ../HMC/AI Ideas and get copied on first predev run.
const PUBLIC_IDEAS_DIR = path.resolve('./public/ideas');
const INDEX_FILE = path.resolve('./public/ideas_index.json');

if (!fs.existsSync(PUBLIC_IDEAS_DIR)) {
  fs.mkdirSync(PUBLIC_IDEAS_DIR, { recursive: true });
}

// Try the local source dir first; fall back to public/ideas (e.g. on Vercel)
const LOCAL_SRC = path.resolve('../HMC/AI Ideas');
const IDEAS_DIR = fs.existsSync(LOCAL_SRC) ? LOCAL_SRC : PUBLIC_IDEAS_DIR;

const files = fs.readdirSync(IDEAS_DIR).filter(f => f.endsWith('.md'));
const index = [];

files.forEach(file => {
  const filePath = path.join(IDEAS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract Title (Line 1 usually starts with #)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');

  // Extract Metadata from the blockquote
  const sectionMatch = content.match(/\*\*Section\*\*:\s*([^|]+)/);
  const complexityMatch = content.match(/\*\*Complexity\*\*:\s*([^|]+)/);
  const impactMatch = content.match(/\*\*Impact\*\*:\s*([^|\n]+)/);

  const section = sectionMatch ? sectionMatch[1].trim() : 'Uncategorized';
  const complexity = complexityMatch ? complexityMatch[1].trim() : 'Unknown';
  const impact = impactMatch ? impactMatch[1].trim() : 'Unknown';

  index.push({
    file,
    title,
    section,
    complexity,
    impact
  });

  // Copy to public folder only when reading from the local source dir
  if (IDEAS_DIR !== PUBLIC_IDEAS_DIR) {
    fs.copyFileSync(filePath, path.join(PUBLIC_IDEAS_DIR, file));
  }
});

fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
console.log(`Successfully indexed ${index.length} ideas.`);
