const { execFile } = require('child_process');

execFile('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--enable-logging=stderr',
  '--v=1',
  'http://localhost:8080/index.html'
], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
  console.log('STDERR:', stderr);
  console.log('STDOUT:', stdout);
});
