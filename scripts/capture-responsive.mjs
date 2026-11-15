import { exec } from 'node:child_process';
import fs from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture(width, height, mobile, outPath) {
  const chromeProc = exec(`"${chromePath}" --headless=new --remote-debugging-port=9222 --disable-gpu http://localhost:4173/#/`);
  await new Promise(r => setTimeout(r, 2000));

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
        // dismiss banner for clean inspection
        send('Runtime.evaluate', {
          expression: `
            const b = document.querySelector('.sound-banner');
            if (b) b.style.display = 'none';
          `
        });
        await new Promise(r => setTimeout(r, 1200));
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

async function run() {
  await capture(1024, 640, false, 'public/home-1024x640.png');
  await capture(1440, 900, false, 'public/home-1440x900.png');
  await capture(1920, 1080, false, 'public/home-1920x1080.png');
  await capture(390, 844, true, 'public/home-390x844.png');
  console.log('All responsive views captured!');
}

run();

