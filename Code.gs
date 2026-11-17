const PGB = {
  spreadsheetId: '11R0ArL5Mdet_wI37yG8NFsts1FxILoT_vSvCrtGc1mI',
  timezone: 'Asia/Kuala_Lumpur',
  classes: ['PGB_KELAS', ['kelas', 'tahun'], 1109624177],
  players: ['PGB_PEMAIN', ['id', 'tahun', 'kategori', 'kelas', 'nama', 'nomborJersi', 'dikemasKiniOleh', 'dikemasKiniPada'], 996137308],
  matches: ['PGB_PERLAWANAN', ['id', 'tahun', 'kategori', 'pasukanA', 'pasukanB', 'tarikh', 'masa', 'gelanggang', 'skorA', 'skorB'], 422470037]
};

// Jalankan sekali dari editor Apps Script.
function setupPialaGuruBesar() {
  const book = spreadsheet_();
  [PGB.classes, PGB.players, PGB.matches].forEach(definition => {
    const [name, headers] = definition;
    const sheet = configuredTab_(book, definition);
    if (!sheet) fail_('Tab ' + name + ' tidak ditemui. Semak ID lembaran dan nama tab.');
    if (!sheet.getLastRow()) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      if (definition === PGB.players) sheet.getRange('F:F').setNumberFormat('@');
      if (definition === PGB.matches) sheet.getRange('F:G').setNumberFormat('@');
    }
    verifyHeaders_(sheet, headers);
  });
  return 'Konfigurasi tiga tab Piala Guru Besar telah disemak.';
}

function doGet(event) {
  if (event?.parameter?.action === 'health') return json_({ ok: true, data: { version: 3 } });
  try {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Piala Guru Besar SK Sungai Tiram')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    return HtmlService.createHtmlOutput('Apps Script Piala Guru Besar tersedia. Tambah fail Index.html untuk membuka sistem.');
  }
}

// GitHub Pages menghantar JSON sebagai text/plain untuk permintaan POST ringkas.
function doPost(event) {
  const body = event?.postData?.contents || '';
  if (!body || body.length > 20000) return json_({ ok: false, error: 'Permintaan tidak sah.' });
  let request;
  try {
    request = JSON.parse(body);
  } catch (_) {
    return json_({ ok: false, error: 'Format permintaan tidak sah.' });
  }
  return json_(pialaApi(request));
}

function json_(result) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Index.html memanggil google.script.run.pialaApi({ action, token, ...medan }).
function pialaApi(request) {
  try {
    if (!request || typeof request !== 'object') fail_('Permintaan tidak sah.');
    return { ok: true, data: dispatch_(request) };
  } catch (error) {
    if (!error.userMessage) console.error(error);
    return { ok: false, error: error.userMessage || 'Ralat pelayan. Semak log Apps Script.' };
  }
}

function dispatch_(request) {
  if (request.action === 'publicDashboard') {
    return { user: null, classes: [], players: [], matches: publicMatches_() };
  }
  const cache = CacheService.getScriptCache();
  if (request.action === 'login') return login_(request, cache);
  if (request.action === 'logout') {
    if (validToken_(request.token)) cache.remove('session_' + request.token);
    return null;
  }
  const session = validToken_(request.token) && cache.get('session_' + request.token);
  if (!session) fail_('Sila log masuk semula.');
  const user = JSON.parse(session);

  if (request.action === 'dashboard') {
    const classes = rows_(PGB.classes).filter(row => user.admin || row.kelas === user.kelas);
    const players = rows_(PGB.players).filter(row => user.admin || row.kelas === user.kelas);
    return { user, classes, players, matches: rows_(PGB.matches) };
  }
  const rosterAction = ['savePlayer', 'deletePlayer'].includes(request.action);
  const matchAction = ['generateMatches', 'updateMatch'].includes(request.action);
  if (!rosterAction && !matchAction) fail_('Tindakan tidak dikenali.');
  if (matchAction && !user.admin) fail_('Tindakan ini untuk admin.');

  return locked_(() => {
    if (rosterAction) return roster_(request, user);
    if (request.action === 'generateMatches') return generateMatches_(request);
    return updateMatch_(request);
  });
}

function publicMatches_() {
  return rows_(PGB.matches).map(({
    tahun, kategori, pasukanA, pasukanB, tarikh, masa, gelanggang, skorA, skorB
  }) => ({ tahun, kategori, pasukanA, pasukanB, tarikh, masa, gelanggang, skorA, skorB }));
}

function login_(request, cache) {
  const username = String(request.username || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{1,60}$/.test(username)) fail_('Nama pengguna atau kata laluan tidak sah.');
  const properties = PropertiesService.getScriptProperties();
  const admin = username === 'admin';
  const rawAccount = properties.getProperty(admin ? 'ADMIN_PASSWORD' : 'GURU_' + username);
  if (!rawAccount) fail_('Nama pengguna atau kata laluan tidak sah.');
  const account = admin ? { password: rawAccount, kelas: '' } : JSON.parse(rawAccount);

  return locked_(() => {
    const key = 'attempt_' + username;
    const count = Number(cache.get(key) || 0);
    if (count >= 8) fail_('Terlalu banyak percubaan. Cuba semula dalam 10 minit.');
    if (typeof account.password !== 'string' || !account.password ||
        request.password !== account.password) {
      cache.put(key, String(count + 1), 600);
      fail_('Nama pengguna atau kata laluan tidak sah.');
    }
    const kelas = admin ? '' : class_(account.kelas).kelas;
    const user = { username, admin, kelas };
    const token = Utilities.getUuid() + Utilities.getUuid();
    cache.remove(key);
    cache.put('session_' + token, JSON.stringify(user), 7200);
    return { token, user };
  });
}

function roster_(request, user) {
  const players = rows_(PGB.players);
  const existing = request.id ? players.find(row => row.id === request.id) : null;
  if ((request.id || request.action === 'deletePlayer') && !existing) fail_('Rekod pemain tidak ditemui.');
  if (existing && !user.admin && existing.kelas !== user.kelas) fail_('Akses kelas ditolak.');
  const sheet = sheet_(PGB.players);
  if (request.action === 'deletePlayer') {
    sheet.deleteRow(existing.rowNumber);
    return { id: existing.id };
  }

  const team = class_(user.admin ? request.kelas : user.kelas);
  const kategori = category_(request.kategori);
  const nama = String(request.nama || '').trim().replace(/\s+/g, ' ');
  const jersi = String(request.nomborJersi ?? '').trim();
  if (!nama || nama.length > 150 || /^[=+@'-]/.test(nama)) fail_('Nama pemain tidak sah.');
  if (jersi && !/^\d{1,2}$/.test(jersi)) fail_('Nombor jersi mestilah antara 0 hingga 99.');
  if (players.some(row => row.id !== request.id && row.kelas === team.kelas &&
      row.kategori === kategori && row.nama.toUpperCase() === nama.toUpperCase())) {
    fail_('Nama ini sudah didaftarkan untuk kelas dan kategori tersebut.');
  }
  const id = existing ? existing.id : Utilities.getUuid();
  const row = [id, team.tahun, kategori, team.kelas, nama, jersi,
    user.username, new Date().toISOString()];
  writeRows_(sheet, existing ? existing.rowNumber : sheet.getLastRow() + 1, [row], 1);
  return { id };
}

function generateMatches_(request) {
  const tahun = year_(request.tahun);
  const kategori = category_(request.kategori);
  const teamNames = [...new Set(rows_(PGB.players)
    .filter(row => Number(row.tahun) === tahun && row.kategori === kategori)
    .map(row => row.kelas))].sort();
  if (teamNames.length < 2) fail_('Daftarkan pemain untuk sekurang-kurangnya dua kelas.');
  if (rows_(PGB.matches).some(row => Number(row.tahun) === tahun && row.kategori === kategori)) {
    fail_('Jadual bagi kategori ini sudah dijana.');
  }
  const matches = [];
  for (let first = 0; first < teamNames.length; first++) {
    for (let second = first + 1; second < teamNames.length; second++) {
      matches.push([Utilities.getUuid(), tahun, kategori, teamNames[first],
        teamNames[second], '', '', '', '', '']);
    }
  }
  const sheet = sheet_(PGB.matches);
  writeRows_(sheet, sheet.getLastRow() + 1, matches, 2);
  return { jumlah: matches.length };
}

function updateMatch_(request) {
  const match = rows_(PGB.matches).find(row => row.id === request.id);
  if (!match) fail_('Perlawanan tidak ditemui.');
  const tarikh = String(request.tarikh ?? match.tarikh).trim();
  const masa = String(request.masa ?? match.masa).trim();
  const gelanggang = String(request.gelanggang ?? match.gelanggang).trim();
  const skorA = score_(request.skorA ?? match.skorA);
  const skorB = score_(request.skorB ?? match.skorB);
  if ((skorA === '') !== (skorB === '')) fail_('Masukkan kedua-dua skor.');
  if (tarikh && (!/^\d{4}-\d{2}-\d{2}$/.test(tarikh) ||
      !Number.isFinite(Date.parse(tarikh)) ||
      new Date(tarikh).toISOString().slice(0, 10) !== tarikh)) fail_('Tarikh tidak sah.');
  if (masa && !/^([01]\d|2[0-3]):[0-5]\d$/.test(masa)) fail_('Masa tidak sah.');
  if (gelanggang.length > 100 || /^[=+@'-]/.test(gelanggang)) fail_('Nama gelanggang tidak sah.');

  const sheet = sheet_(PGB.matches);
  sheet.getRange(match.rowNumber, 6, 1, 2).setNumberFormat('@');
  sheet.getRange(match.rowNumber, 6, 1, 5).setValues([[tarikh, masa, gelanggang, skorA, skorB]]);
  return { id: match.id };
}

function score_(value) {
  if (value === '') return '';
  if (!/^\d{1,3}$/.test(String(value))) fail_('Skor mestilah nombor bulat antara 0 hingga 999.');
  return Number(value);
}

function class_(name) {
  const normalized = String(name || '').trim().replace(/\s+/g, ' ').toUpperCase();
  const classes = rows_(PGB.classes).filter(row => row.kelas.toUpperCase() === normalized);
  if (classes.length !== 1 || /^[=+@'-]/.test(normalized)) fail_('Semak tetapan kelas di PGB_KELAS.');
  return { kelas: classes[0].kelas, tahun: year_(classes[0].tahun) };
}

function year_(value) {
  if (!/^[1-6]$/.test(String(value))) fail_('Pilih Tahun 1 hingga Tahun 6.');
  return Number(value);
}

function category_(value) {
  if (!['BOLA_SEPAK_LELAKI', 'BOLA_BALING_PEREMPUAN'].includes(value)) fail_('Kategori tidak sah.');
  return value;
}

function verifyHeaders_(sheet, headers) {
  const actual = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (headers.some((header, index) => actual[index] !== header)) {
    fail_('Semak tajuk lajur tab ' + sheet.getName() + '.');
  }
}

function spreadsheet_() {
  return SpreadsheetApp.openById(PGB.spreadsheetId);
}

function configuredTab_(spreadsheet, [name, , gid]) {
  return spreadsheet.getSheetById(gid) || spreadsheet.getSheetByName(name);
}

function sheet_(definition) {
  const sheet = configuredTab_(spreadsheet_(), definition);
  if (!sheet) fail_('Tab ' + definition[0] + ' tidak ditemui.');
  verifyHeaders_(sheet, definition[1]);
  return sheet;
}

function rows_(definition) {
  const sheet = sheet_(definition);
  const headers = definition[1];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
    .map((values, index) => {
      const row = { rowNumber: index + 2 };
      headers.forEach((key, column) => {
        const value = values[column];
        row[key] = value instanceof Date ?
          Utilities.formatDate(value, PGB.timezone, key === 'masa' ? 'HH:mm' : 'yyyy-MM-dd') :
          typeof value === 'string' ? value.trim() : value;
      });
      return row;
    })
    .filter(row => row[headers[0]] !== '');
}

function writeRows_(sheet, start, rows, textColumns) {
  const requiredRows = start + rows.length - 1;
  if (requiredRows > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), requiredRows - sheet.getMaxRows());
  }
  sheet.getRange(start, 6, rows.length, textColumns).setNumberFormat('@');
  sheet.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
}

function locked_(work) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) fail_('Sistem sedang sibuk. Cuba semula.');
  try {
    const result = work();
    SpreadsheetApp.flush();
    return result;
  } finally {
    lock.releaseLock();
  }
}

function validToken_(token) {
  return typeof token === 'string' && /^[a-f0-9-]{72}$/i.test(token);
}

function fail_(message) {
  const error = new Error(message);
  error.userMessage = message;
  throw error;
}
