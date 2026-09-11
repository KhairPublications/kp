const { execSync } = require('child_process');

try {
  const output = execSync('"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --no-sandbox --disable-gpu --dump-dom http://localhost:8080/index.html', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  console.log('Contains swiper-initialized:', output.includes('swiper-initialized'));
  console.log('Contains swiper-slide-active:', output.includes('swiper-slide-active'));
} catch (e) {
  console.error(e);
}
