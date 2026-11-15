import { exec } from 'node:child_process';
import fs from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureOne(width, height, mobile, outPath, route = '#/') {
  const url = `http://localhost:4173/${route}`;
  const chromeProc = exec(`"${chromePath}" --headless=new --remote-debugging-port=9222 --disable-gpu "${url}"`);
  await new Promise(r => setTimeout(r, 2200));

  try {
    const list = await fetch('http://localhost:9222/json').then(r => r.json());
    const page = list.find(p => p.type === 'page');
    if (!page) throw new Error('No page found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let msgId = 0;
    const send = (method, params = {}) => {
      const id = ++msgId;
      ws.send(JSON.stringify({ id, method, params }));
      return id;
    };

    await new Promise((resolve, reject) => {
      ws.onopen = async () => {
        send('Emulation.setDeviceMetricsOverride', {
          width,
          height,
          deviceScaleFactor: mobile ? 2 : 1,
          mobile
        });
        send('Runtime.evaluate', {
          expression: `
            const b = document.querySelector('.sound-banner');
            if (b) b.style.display = 'none';
          `
        });
        await new Promise(r => setTimeout(r, 1500));
        send('Page.captureScreenshot', { format: 'png' });
      };

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === 3) {
          fs.writeFileSync(outPath, Buffer.from(data.result.data, 'base64'));
          console.log(`Saved ${outPath}`);
          ws.close();
          chromeProc.kill();
          resolve();
        }
      };

      ws.onerror = (err) => {
        chromeProc.kill();
        reject(err);
      };
    });
  } catch (err) {
    chromeProc.kill();
    throw err;
  }
}

const w = parseInt(process.argv[2] || '1440');
const h = parseInt(process.argv[3] || '900');
const m = process.argv[4] === 'true';
const out = process.argv[5] || 'public/out.png';
const route = process.argv[6] || '#/';

await captureOne(w, h, m, out, route);
process.exit(0);
