import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory Database for Weighbridge System
let recordCounter = 101;
let kpccRecordCounter = 501;

const drivers = {
  'DRV-01': { id_sopir: '101', sopir: 'Supardi' },
  'DRV-02': { id_sopir: '102', sopir: 'Bambang' },
  'DRV-03': { id_sopir: '103', sopir: 'Agus Subagyo' },
  '101': { id_sopir: '101', sopir: 'Supardi' },
  '102': { id_sopir: '102', sopir: 'Bambang' }
};

const cars = {
  'TANK-01': { id_car: '201', kode_tank: 'TANK-01', nomor_polisi: 'B 9123 KR', status_tank: 'Ready' },
  'TANK-02': { id_car: '202', kode_tank: 'TANK-02', nomor_polisi: 'B 9555 KRN', status_tank: 'Ready' },
  'TANK-03': { id_car: '203', kode_tank: 'TANK-03', nomor_polisi: 'B 9777 TMB', status_tank: 'Ready' },
  '201': { id_car: '201', kode_tank: 'TANK-01', nomor_polisi: 'B 9123 KR', status_tank: 'Ready' }
};

let timbangList = [
  { id: 1, no_record: 'REC-2026-0100', id_mobil: '201', kode_tank: 'TANK-01', nomor_polisi: 'B 9123 KR', status_tank: 'Ready', id_driver: '101', nama_dtl: 'Supardi', sopir: 'Supardi', tgl_masuk: '2026-08-09 08:30:15', tara: '12450', bruto: '', netto: '' }
];

let kpccList = [
  { id: 1, no_record: 'KPCC-2026-0500', nama_vendor: 'PT.SMI', nomor_polisi: 'B 8899 KR', nama_sopir: 'Bambang', sopir: 'Bambang', tgl_masuk: '2026-08-09 09:15:20', tara: '11200', bruto: '', netto: '' }
];

const setupApiRoutes = (prefix) => {
  app.get(`${prefix}/timbangan/record`, (req, res) => {
    res.json({ id_timbang: `REC-2026-0${recordCounter}` });
  });

  app.get(`${prefix}/timbangan/timbang`, (req, res) => {
    res.json(timbangList);
  });

  app.get(`${prefix}/timbangan/lama/record/`, (req, res) => {
    const recordCode = req.query.record;
    const found = timbangList.find(item => item.no_record === recordCode || item.id == recordCode);
    if (found) res.json(found);
    else res.status(404).json({ message: 'Record tidak ditemukan' });
  });

  app.post(`${prefix}/timbangan/hasil`, (req, res) => {
    const { kode, id_mobil, id_driver, tgl_masuk, tara, bruto, netto } = req.body;
    const carObj = cars[id_mobil] || { kode_tank: 'TANK-XX', nomor_polisi: 'B ' + (req.body.no_polisi || '9999 XX') };
    const driverObj = drivers[id_driver] || { sopir: req.body.sopir || 'Driver General' };
    const newItem = {
      id: timbangList.length + 1,
      no_record: kode || `REC-2026-0${recordCounter++}`,
      id_mobil: id_mobil || '201',
      kode_tank: carObj.kode_tank,
      nomor_polisi: carObj.nomor_polisi,
      status_tank: 'Ready',
      id_driver: id_driver || '101',
      nama_dtl: driverObj.sopir,
      sopir: driverObj.sopir,
      tgl_masuk: tgl_masuk || new Date().toISOString().slice(0, 19).replace('T', ' '),
      tara: tara || '0',
      bruto: bruto || '',
      netto: netto || ''
    };
    timbangList.unshift(newItem);
    recordCounter++;
    res.json({ kode: newItem.no_record, message: 'Data Timbang Kosong Berhasil Disimpan' });
  });

  app.post(`${prefix}/timbangan/netto`, (req, res) => {
    const { id, bruto, netto, kode } = req.body;
    const found = timbangList.find(item => item.id == id || item.no_record === kode);
    if (found) {
      found.bruto = bruto;
      found.netto = netto;
      res.json({ kode: found.no_record, message: 'Data Timbang Isi Berhasil Disimpan' });
    } else {
      res.json({ kode: kode || id, message: 'Data Netto Berhasil Disimpan' });
    }
  });

  app.get(`${prefix}/timbangan/driver/`, (req, res) => {
    const nomor = req.query.nomor;
    const driver = drivers[nomor] || { id_sopir: '101', sopir: nomor || 'Supardi' };
    res.json(driver);
  });

  app.get(`${prefix}/timbangan/car/`, (req, res) => {
    const nomor = req.query.nomor;
    const car = cars[nomor] || { id_car: '201', kode_tank: nomor || 'TANK-01', nomor_polisi: 'B 9123 KR', status_tank: 'Ready' };
    res.json(car);
  });

  app.get(`${prefix}/data/users`, (req, res) => {
    const id = req.query.id;
    res.json({ name: drivers[id]?.sopir || id || 'Operator' });
  });

  app.get(`${prefix}/kpcc/record`, (req, res) => {
    res.json({ no_record: `KPCC-2026-0${kpccRecordCounter}` });
  });

  app.get(`${prefix}/kpcc/timbang`, (req, res) => {
    res.json(kpccList);
  });

  app.post(`${prefix}/kpcc/hasil`, (req, res) => {
    const { vendor, nopol, driver, tara } = req.body;
    const newItem = {
      id: kpccList.length + 1,
      no_record: `KPCC-2026-0${kpccRecordCounter++}`,
      nama_vendor: vendor || 'PT.SMI',
      nomor_polisi: (nopol || 'B 8899 KR').toUpperCase(),
      nama_sopir: (driver || 'Driver KPCC').toUpperCase(),
      sopir: (driver || 'Driver KPCC').toUpperCase(),
      tgl_masuk: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tara: tara || '0',
      bruto: '',
      netto: ''
    };
    kpccList.unshift(newItem);
    res.json({ kode: newItem.no_record, message: 'Data Timbang Kosong KPCC Berhasil Disimpan' });
  });

  app.get(`${prefix}/kpcc/lama/record/`, (req, res) => {
    const recordCode = req.query.record;
    const found = kpccList.find(item => item.no_record === recordCode || item.id == recordCode);
    if (found) res.json(found);
    else res.status(404).json({ message: 'Record KPCC tidak ditemukan' });
  });

  app.post(`${prefix}/kpcc/netto`, (req, res) => {
    const { kode, bruto, netto } = req.body;
    const found = kpccList.find(item => item.no_record === kode);
    if (found) {
      found.bruto = bruto;
      found.netto = netto;
    }
    res.json({ kode: kode, message: 'Data Timbang Isi KPCC Berhasil Disimpan' });
  });
};

setupApiRoutes('/api');
setupApiRoutes('/API/api');

const publicDir = path.join(__dirname, 'Weighing-Scale2-main');
app.use(express.static(publicDir));
app.use('/assets', express.static(path.join(publicDir, 'assets')));
app.use('/images', express.static(path.join(publicDir, 'images')));

// Inject the real GST-9700 Web Serial bridge into the legacy weighing page.
// This intentionally happens server-side so the integration is always loaded.
app.get('/', (req, res) => {
  const htmlPath = path.join(publicDir, 'window.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const scriptTag = '<script src="/gst9700-webserial.js"></script>';
  if (!html.includes('/gst9700-webserial.js')) {
    html = html.replace('</head>', `${scriptTag}\n</head>`);
  }
  res.type('html').send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AI Studio] Weighing Scale App running on http://0.0.0.0:${PORT}`);
});
