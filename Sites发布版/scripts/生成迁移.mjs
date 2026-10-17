import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const result=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/drizzle-kit/bin.cjs',import.meta.url)),'generate'],{stdio:'inherit',cwd:fileURLToPath(new URL('..',import.meta.url))});
if(result.error)throw result.error;if(result.status)process.exit(result.status);
