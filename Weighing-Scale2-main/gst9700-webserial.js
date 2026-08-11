/* GST-9700 Web Serial bridge
 * Reads ASCII/serial weight data directly from a Chromium browser.
 * Designed to coexist with the legacy weighing UI without changing its API.
 */
(function () {
  'use strict';

  const WEIGHT_FIELDS = ['#hasilkg', '#hasilkgLama', '#hasilkgkpcc', '#hasilkgLamakpcc'];
  let port = null;
  let reader = null;
  let keepReading = false;
  let buffer = '';
  let lastWeight = null;
  let lastUpdate = 0;

  const baudRates = [1200, 2400, 4800, 9600, 19200, 38400];

  function $(selector) { return document.querySelector(selector); }

  function setStatus(text, ok) {
    const button = $('#connect_button');
    if (button) {
      button.value = ok ? 'Disconnect GST-9700' : 'Connect GST-9700';
      button.dataset.connected = ok ? '1' : '0';
    }
    let status = $('#gst9700_status');
    if (!status) {
      status = document.createElement('span');
      status.id = 'gst9700_status';
      status.style.cssText = 'display:inline-block;margin-left:10px;padding:6px 10px;border-radius:5px;font-weight:600;background:#eee;color:#555;';
      const line = $('#connect_line');
      if (line) line.appendChild(status);
    }
    status.textContent = text;
    status.style.background = ok ? '#d9f7e5' : '#f2f2f2';
    status.style.color = ok ? '#087a3b' : '#555';
  }

  function setWeight(weight) {
    const numeric = Number(weight);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1000000) return;
    const normalized = String(Math.round(numeric * 10) / 10);
    WEIGHT_FIELDS.forEach((id) => {
      const el = $(id);
      if (el) el.value = normalized;
    });
    const indicator = $('#hasilkg');
    if (indicator) indicator.title = 'GST-9700 realtime: ' + normalized + ' Kg';
    lastWeight = numeric;
    lastUpdate = Date.now();
  }

  // Handles common indicator output such as +0012500 kg, 12500kg, WT:+12500, ST, etc.
  // The final numeric token in a frame is used, avoiding dates/counters where possible.
  function parseWeight(text) {
    const clean = text.replace(/\0/g, '').replace(/\u0002|\u0003/g, ' ').trim();
    if (!clean) return null;

    const candidates = clean.match(/[+-]?\d{1,7}(?:[.,]\d{1,3})?/g);
    if (!candidates || !candidates.length) return null;

    // Prefer a number near a weight marker/unit.
    const marked = clean.match(/(?:WT|W|NET|GROSS|BRUTO|BERAT|KG|KGS)\s*[:=]?\s*([+-]?\d{1,7}(?:[.,]\d{1,3})?)/i);
    const raw = marked ? marked[1] : candidates[candidates.length - 1];
    const value = Number(raw.replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }

  function consume(text) {
    buffer += text;
    // Process complete CR/LF frames first.
    const frames = buffer.split(/\r\n|\n|\r/);
    buffer = frames.pop() || '';
    frames.forEach((frame) => {
      const weight = parseWeight(frame);
      if (weight !== null) setWeight(weight);
    });

    // Some GST indicators stream without line endings. Parse the latest complete-looking chunk.
    if (buffer.length > 80) {
      const weight = parseWeight(buffer);
      if (weight !== null) setWeight(weight);
      buffer = buffer.slice(-40);
    }
  }

  async function readLoop() {
    if (!port || !port.readable) return;
    keepReading = true;
    const decoder = new TextDecoder();
    while (keepReading && port.readable) {
      reader = port.readable.getReader();
      try {
        while (keepReading) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) consume(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        if (keepReading) setStatus('Error baca serial: ' + (err.message || err), false);
      } finally {
        try { reader.releaseLock(); } catch (_) {}
        reader = null;
      }
    }
  }

  async function disconnect() {
    keepReading = false;
    try { if (reader) await reader.cancel(); } catch (_) {}
    reader = null;
    if (port) {
      try { await port.close(); } catch (_) {}
    }
    port = null;
    buffer = '';
    setStatus('Terputus', false);
  }

  async function connect() {
    if (!('serial' in navigator)) {
      setStatus('Browser tidak mendukung Web Serial. Gunakan Chrome/Edge desktop HTTPS.', false);
      alert('Web Serial tidak tersedia. Gunakan Google Chrome atau Microsoft Edge desktop melalui HTTPS.');
      return;
    }

    if (port) {
      await disconnect();
      return;
    }

    const baudEl = $('#baud_rates_combobox');
    const baudRate = parseInt(baudEl && baudEl.value ? baudEl.value : '9600', 10);
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
      setStatus('Terhubung • menunggu data GST-9700', true);
      buffer = '';
      readLoop();
    } catch (err) {
      port = null;
      if (err && err.name === 'NotFoundError') setStatus('Pemilihan port dibatalkan', false);
      else setStatus('Gagal koneksi: ' + (err.message || err), false);
    }
  }

  function install() {
    const baud = $('#baud_rates_combobox');
    if (baud) {
      baud.innerHTML = '';
      baudRates.forEach((rate) => {
        const option = document.createElement('option');
        option.value = String(rate);
        option.textContent = rate + ' baud';
        if (rate === 9600) option.selected = true;
        baud.appendChild(option);
      });
    }

    // Replace the legacy Connect button so its simulated chrome.serial fallback cannot run.
    const oldButton = $('#connect_button');
    if (oldButton) {
      const newButton = oldButton.cloneNode(true);
      oldButton.parentNode.replaceChild(newButton, oldButton);
      newButton.addEventListener('click', function (event) {
        event.preventDefault();
        connect();
      });
    }

    setStatus('Belum terhubung', false);

    if ('serial' in navigator && navigator.serial.addEventListener) {
      navigator.serial.addEventListener('disconnect', async (event) => {
        if (port && event.target === port) await disconnect();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }

  window.GST9700 = {
    connect,
    disconnect,
    getLastWeight: () => lastWeight,
    getLastUpdate: () => lastUpdate,
    isConnected: () => !!port
  };
})();
