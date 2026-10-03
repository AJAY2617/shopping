import { access } from 'node:fs/promises';
for (const file of ['dist/index.html','dist/admin.html','dist/app.js','dist/admin.js','dist/catalog.json']) await access(file);
console.log('Leo Shopping static pages and server API are ready.');
