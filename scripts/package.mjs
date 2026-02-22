import { readFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, join, relative } from 'path';
import { readdirSync, statSync, createWriteStream } from 'fs';
import { createDeflateRaw } from 'zlib';
import archiver from 'archiver';

const distDir = resolve('dist');
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const zipName = `jira-pms-dashboard-v${pkg.version}.zip`;
const zipPath = resolve(zipName);

// archiver가 없으면 간단한 tar.gz 대안 또는 수동 안내
async function packageWithArchiver() {
  if (existsSync(zipPath)) {
    unlinkSync(zipPath);
  }

  const { default: archiver } = await import('archiver');
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolvePromise, reject) => {
    output.on('close', () => {
      console.log(`\n✅ 패키징 완료: ${zipName} (${(archive.pointer() / 1024).toFixed(0)} KB)`);
      console.log(`\n배포 방법:`);
      console.log(`  1. ${zipName} 파일을 사용자에게 전달`);
      console.log(`  2. 사용자가 압축 해제 후 chrome://extensions 에서 "압축해제된 확장 프로그램을 로드합니다" 클릭`);
      resolvePromise();
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(distDir, false);
    archive.finalize();
  });
}

try {
  await packageWithArchiver();
} catch {
  // archiver가 없으면 안내 메시지
  console.log('\n📦 archiver 패키지가 필요합니다. 설치 후 재실행하세요:');
  console.log('   npm install --save-dev archiver @types/archiver');
  console.log('\n또는 수동으로 dist/ 폴더를 zip으로 압축하여 배포할 수 있습니다.');
  process.exit(1);
}
