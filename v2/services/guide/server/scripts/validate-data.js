import fs from 'node:fs';
import { validateData } from '../src/domain.js';
const file = process.argv[2] || new URL('../data/content.json', import.meta.url);
const errors = validateData(JSON.parse(fs.readFileSync(file, 'utf8')));
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('数据结构和发布边界检查通过；此结果不是史实核验或素材授权。');
