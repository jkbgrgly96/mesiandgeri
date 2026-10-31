/**
 * Emese & Gergő – esküvői visszajelzések backendje (Google Apps Script)
 *
 * A Google Sheethez kötött script (Bővítmények → Apps Script).
 * - doGet  : névtelen statisztika (finomságlista, szabad jurtaágyak) + saját válasz lekérése tokennel
 * - doPost : visszajelzés mentése / módosítása, visszaigazoló e-mail szerkesztő linkkel
 *
 * Telepítés: lásd apps-script/README.md
 */

const CONFIG = {
  SITE_URL: 'https://jkbgrgly96.github.io/mesiandgeri/',
  BEDS_TOTAL: 48,          // összes kiadható jurtaágy a vendégeknek
  BED_PRICE: 7500,         // Ft / fő / éj
  SHEET_NAME: 'Válaszok',
  COUPLE: 'Emese & Gergő',
  REPLY_TO: '',            // erre a címre mennek a vendégek válasz e-mailjei (üresen: a script tulajdonosa)
  // Ők kapnak rövid értesítést minden új / módosított visszajelzésről. Több cím is lehet, pl.:
  // NOTIFY_EMAILS: ['emese@example.com', 'gergo@example.com'],
  NOTIFY_EMAILS: [],
};

const COLS = ['id', 'token', 'created', 'updated', 'name', 'email', 'coming', 'companions',
  'adults', 'children', 'diet', 'night', 'beds', 'cost', 'sweet', 'salty', 'treat', 'message'];
const HEADERS = ['#', 'Token (ne módosítsd)', 'Létrehozva', 'Módosítva', 'Név', 'E-mail', 'Jön?', 'Kísérők',
  'Felnőtt', 'Gyerek', 'Étkezési igény', 'Éjszaka', 'Jurtaágy (fő)', 'Fizetendő (Ft)', 'Édes', 'Sós', 'Mit hoz', 'Üzenet'];

/** Egyszer futtasd le kézzel: létrehozza a fejlécet és elkéri a jogosultságokat. */
function setup() {
  getSheet_();
  MailApp.getRemainingDailyQuota();
  Logger.log('Kész. Napi e-mail keret: ' + MailApp.getRemainingDailyQuota());
}

/* ---------------- HTTP végpontok ---------------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    const rows = readAll_(getSheet_());
    if (p.action === 'get') {
      const rec = findByToken_(rows, p.token);
      if (!rec) return json_({ status: 'notfound' });
      return json_({ status: 'ok', response: publicRecord_(rec), stats: stats_(rows, rec.token) });
    }
    return json_({ status: 'ok', stats: stats_(rows) });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return json_({ status: 'created' });           // honeypot: botok

    const v = clean_(d);
    if (v.error) return json_({ status: 'invalid', message: v.error });

    const sh = getSheet_();
    const rows = readAll_(sh);
    let rec = null;

    if (d.token) {
      rec = findByToken_(rows, d.token);
      if (!rec) return json_({ status: 'notfound' });
      const other = rows.find(r => r !== rec && String(r.email).toLowerCase() === v.email);
      if (other) return json_({ status: 'invalid', message: 'Ezzel az e-mail címmel már van egy másik visszajelzés.' });
    } else {
      const existing = rows.find(r => String(r.email).toLowerCase() === v.email);
      if (existing) {                                              // ne lehessen más válaszát felülírni:
        sendLink_(existing);                                       // a szerkesztő linket a tulajdonos kapja meg
        return json_({ status: 'exists' });
      }
    }

    const st = stats_(rows, rec ? rec.token : null);
    if (v.night === 'jurta' && v.beds > st.bedsLeft) {
      return json_({ status: 'full', bedsLeft: st.bedsLeft });
    }

    const now = new Date();
    const token = rec ? rec.token : Utilities.getUuid();
    const row = [
      rec ? rec.id : nextId_(rows), token, rec ? rec.created : now, now,
      v.name, v.email, v.coming, v.companionsText, v.adults, v.children, v.diet,
      v.night, v.beds, v.cost, v.sweet ? 'igen' : '', v.salty ? 'igen' : '', v.treat, v.message,
    ];
    if (rec) sh.getRange(rec._row, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    sendConfirmation_(v, token, !!rec);
    notifyCouple_(v, !!rec);

    return json_({ status: rec ? 'updated' : 'created', token: token, stats: stats_(readAll_(sh)) });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- adatkezelés ---------------- */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#dfe8d9');
  }
  return sh;
}

function readAll_(sh) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, COLS.length).getValues().map((r, i) => {
    const o = { _row: i + 2 };
    COLS.forEach((c, j) => { o[c] = r[j]; });
    return o;
  }).filter(o => o.token);
}

function findByToken_(rows, token) {
  token = String(token || '');
  return token ? rows.find(r => String(r.token) === token) || null : null;
}

function nextId_(rows) {
  return rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
}

function stats_(rows, excludeToken) {
  let used = 0;
  const sweet = [], salty = [];
  rows.forEach(r => {
    if (r.coming !== 'igen') return;
    if (r.night === 'jurta' && String(r.token) !== String(excludeToken)) used += Number(r.beds) || 0;
    const t = String(r.treat || '').replace(/^'/, '').trim();
    if (!t) return;
    if (r.sweet === 'igen') sweet.push(t);
    if (r.salty === 'igen') salty.push(t);
    if (r.sweet !== 'igen' && r.salty !== 'igen') sweet.push(t);
  });
  return {
    bedsTotal: CONFIG.BEDS_TOTAL,
    bedsLeft: Math.max(0, CONFIG.BEDS_TOTAL - used),
    bedPrice: CONFIG.BED_PRICE,
    sweet: sweet, salty: salty,
  };
}

function publicRecord_(r) {
  const un = x => String(x == null ? '' : x).replace(/^'/, '');
  return {
    name: un(r.name), email: un(r.email), coming: r.coming,
    companions: parseCompanions_(un(r.companions)),
    diet: un(r.diet), night: r.night, beds: Number(r.beds) || 0,
    sweet: r.sweet === 'igen', salty: r.salty === 'igen',
    treat: un(r.treat), message: un(r.message),
  };
}

function parseCompanions_(text) {
  if (!text) return [];
  return text.split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.*)\s\((felnőtt|gyerek)\)$/);
    return m ? { name: m[1], age: m[2] } : { name: s, age: 'felnőtt' };
  });
}

/** Bemenet ellenőrzése, tisztítása (táblázat-képlet injekció ellen is). */
function clean_(d) {
  const s = (x, n) => {
    x = String(x == null ? '' : x).replace(/[\r\n]+/g, ' ').trim().slice(0, n || 200);
    return /^[=+\-@]/.test(x) ? "'" + x : x;
  };
  const name = s(d.name, 100);
  const email = String(d.email || '').trim().toLowerCase().slice(0, 150);
  if (!name) return { error: 'Kérjük, add meg a neved.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Kérjük, adj meg egy érvényes e-mail címet.' };
  const coming = d.coming === 'igen' || d.coming === 'nem' ? d.coming : '';
  if (!coming) return { error: 'Kérjük, jelöld, hogy ott leszel-e.' };

  let comps = [];
  if (coming === 'igen' && Array.isArray(d.companions)) {
    comps = d.companions.slice(0, 10)
      .map(c => ({ name: s(c && c.name, 80).replace(/;/g, ','), age: c && c.age === 'gyerek' ? 'gyerek' : 'felnőtt' }))
      .filter(c => c.name);
  }
  const adults = coming === 'igen' ? 1 + comps.filter(c => c.age === 'felnőtt').length : 0;
  const children = comps.filter(c => c.age === 'gyerek').length;
  const night = coming === 'igen' && ['jurta', 'sator', 'nem'].indexOf(d.night) >= 0 ? d.night : '';
  const beds = night === 'jurta' ? Math.min(Math.max(parseInt(d.beds, 10) || 1, 1), adults + children) : 0;

  return {
    name: name, email: email, coming: coming,
    companions: comps,
    companionsText: comps.map(c => c.name + ' (' + c.age + ')').join('; '),
    adults: adults, children: children,
    diet: coming === 'igen' ? s(d.diet, 300) : '',
    night: night, beds: beds, cost: beds * CONFIG.BED_PRICE,
    sweet: coming === 'igen' && !!d.sweet, salty: coming === 'igen' && !!d.salty,
    treat: coming === 'igen' ? s(d.treat, 120) : '',
    message: s(d.message, 1000),
  };
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- e-mailek ---------------- */

function editLink_(token) {
  return CONFIG.SITE_URL + '?t=' + encodeURIComponent(token) + '#visszajelzes';
}

function esc_(x) {
  return String(x == null ? '' : x).replace(/^'/, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mail_(to, subject, inner) {
  const html =
    '<div style="background:#f7f1e3;padding:24px;font-family:Georgia,serif;color:#2c2b26">' +
    '<div style="max-width:560px;margin:0 auto;background:#fcf8ef;border-radius:14px;padding:28px;border:1px dashed #a9bfa3">' +
    '<div style="text-align:center;color:#0d7a57;font-size:26px;font-style:italic">' + esc_(CONFIG.COUPLE) + '</div>' +
    '<div style="text-align:center;color:#c8643b;font-size:14px;letter-spacing:2px;margin-bottom:18px">2027. SZEPTEMBER 25. · A CSŰR, NAGYKOVÁCSI</div>' +
    '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">' + inner + '</div>' +
    '</div></div>';
  const opts = { to: to, subject: subject, htmlBody: html, name: CONFIG.COUPLE };
  if (CONFIG.REPLY_TO) opts.replyTo = CONFIG.REPLY_TO;
  MailApp.sendEmail(opts);
}

function button_(token, label) {
  return '<p style="text-align:center;margin:24px 0"><a href="' + editLink_(token) + '" ' +
    'style="background:#c8643b;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold">' +
    label + '</a></p>';
}

function summary_(v) {
  const nightTxt = { jurta: 'jurtaágy – ' + v.beds + ' fő, ' + v.cost.toLocaleString('hu-HU') + ' Ft',
    sator: 'saját sátor', nem: 'nem maradtok éjszakára', '': '–' }[v.night];
  const rows = v.coming === 'igen' ? [
    ['Ott leszel', 'igen'],
    ['Kísérők', v.companionsText || '–'],
    ['Étkezési igény', v.diet || '–'],
    ['Éjszaka', nightTxt],
    ['Finomság', [v.sweet ? 'édes' : '', v.salty ? 'sós' : ''].filter(Boolean).join(' + ') + (v.treat ? ': ' + v.treat : '') || '–'],
  ] : [['Ott leszel', 'sajnos nem']];
  if (v.message) rows.push(['Üzenet', v.message]);
  return '<table style="width:100%;border-collapse:collapse">' + rows.map(r =>
    '<tr><td style="padding:6px 8px;color:#6b6a60;width:38%;vertical-align:top">' + r[0] + '</td>' +
    '<td style="padding:6px 8px">' + esc_(r[1]) + '</td></tr>').join('') + '</table>';
}

function sendConfirmation_(v, token, isUpdate) {
  const hello = '<p>Kedves ' + esc_(v.name) + '!</p>';
  const intro = v.coming === 'igen'
    ? '<p>' + (isUpdate ? 'Elmentettük a módosításaidat.' : 'Nagyon örülünk, hogy velünk ünnepelsz!') + ' Ezt rögzítettük:</p>'
    : '<p>' + (isUpdate ? 'Elmentettük a módosításaidat.' : 'Köszönjük, hogy jelezted – nagyon fogsz hiányozni!') + '</p>';
  const inner = hello + intro + summary_(v) +
    '<p>Ha bármi változik, ezzel a gombbal bármikor módosíthatod a válaszaidat:</p>' +
    button_(token, 'Válaszaim módosítása') +
    '<p style="color:#6b6a60;font-size:13px">Ezt a linket ne oszd meg mással – aki megkapja, módosíthatja a válaszodat.</p>' +
    '<p>Ölelés,<br>' + esc_(CONFIG.COUPLE) + '</p>';
  mail_(v.email, (isUpdate ? 'Módosított visszajelzés' : 'Visszajelzésed') + ' – ' + CONFIG.COUPLE + ' esküvője', inner);
}

function sendLink_(rec) {
  const inner = '<p>Kedves ' + esc_(rec.name) + '!</p>' +
    '<p>Ezzel az e-mail címmel már küldtél visszajelzést. Az alábbi gombbal megnézheted és módosíthatod:</p>' +
    button_(rec.token, 'Válaszaim megnyitása') +
    '<p style="color:#6b6a60;font-size:13px">Ha nem te kérted ezt a levelet, nyugodtan hagyd figyelmen kívül.</p>' +
    '<p>Ölelés,<br>' + esc_(CONFIG.COUPLE) + '</p>';
  mail_(String(rec.email), 'Szerkesztő link a visszajelzésedhez – ' + CONFIG.COUPLE, inner);
}

function notifyCouple_(v, isUpdate) {
  const to = (CONFIG.NOTIFY_EMAILS || []).map(x => String(x).trim()).filter(Boolean).join(',');
  if (!to) return;
  mail_(to, (isUpdate ? 'Módosítás: ' : 'Új visszajelzés: ') + v.name.replace(/^'/, ''),
    '<p><b>' + esc_(v.name) + '</b> (' + esc_(v.email) + ')</p>' + summary_(v));
}
