// Run: node hikes-preview/build.mjs
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const sources=JSON.parse(await readFile(new URL('./build-sources.json',import.meta.url),'utf8'));
const scriptParts=await Promise.all(sources.scripts.map(async p=>'\n;/* source: '+p+' */\n'+await readFile(root+p,'utf8')));
const js=scriptParts.join('\n')+'\n;window.V47Cloud?.load?.();render();\n';
new Function(js);
const imports=[];
const cssParts=await Promise.all(sources.styles.map(async p=>'\n/* source: '+p+' */\n'+(await readFile(root+p,'utf8')).replace(/@import\s+url\([^)]*\)\s*;/g,x=>{imports.push(x);return ''})));
const css=[...new Set(imports)].join('\n')+'\n'+cssParts.join('\n');
await writeFile(new URL('./app.bundle.js',import.meta.url),js);
await writeFile(new URL('./app.bundle.css',import.meta.url),css);
console.log('Built one script and one stylesheet for the Hikes workspace.');
