import archiver from 'archiver';
import { createWriteStream, existsSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const zipPath = resolve(projectRoot, '..', 'jira-manage-source.zip');

if (existsSync(zipPath)) unlinkSync(zipPath);

const output = createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`\nDone: jira-manage-source.zip (${(archive.pointer() / 1024).toFixed(0)} KB)`);
  console.log(`Location: ${zipPath}`);
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

archive.glob('**/*', {
  cwd: projectRoot,
  ignore: ['node_modules/**', 'dist/**', '*.zip', '*.crx', '*.pem', 'package-lock.json'],
  dot: true,
});

archive.finalize();
