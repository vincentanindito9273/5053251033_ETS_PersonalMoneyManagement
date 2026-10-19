const STORAGE_KEY = 'moneytalks_transactions';
const ALLOWANCE_KEY = 'moneytalks_monthly_allowance';

const transactionForm = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const dateInput = document.getElementById('date');
const categoryInput = document.getElementById('category');
const formMessage = document.getElementById('formMessage');
const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');
const transactionCount = document.getElementById('transactionCount');
const allowanceForm = document.getElementById('formBulanan');
const allowanceInput = document.getElementById('inputBulanan');
const allowanceError = document.getElementById('errorBulanan');
const filterInput = document.getElementById('filterTransaksi');

let transactions = loadTransactions();
let monthlyAllowance = loadAllowance();

function getLocalDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
dateInput.value = getLocalDateString();
if (monthlyAllowance !== null) allowanceInput.value = monthlyAllowance;

function loadTransactions() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data.filter(item => item && typeof item.id === 'string' && typeof item.date === 'string' && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && (item.type === 'income' || item.type === 'expense')) : [];
  } catch (error) {
    console.error('Data transaksi tidak dapat dibaca:', error);
    return [];
  }
}

function loadAllowance() {
  try {
    const saved = localStorage.getItem(ALLOWANCE_KEY);
    if (saved === null) return null;
    const value = Number(saved);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch (error) {
    console.error('Uang bulanan tidak dapat dibaca:', error);
    return null;
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    showMessage('Data gagal disimpan. Periksa ruang penyimpanan browser.', true);
    return false;
  }
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day));
}

function isCurrentMonth(dateString) {
  return dateString.slice(0, 7) === getLocalDateString().slice(0, 7);
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle('error', isError);
}

function renderSummary() {
  const monthTransactions = transactions.filter(item => isCurrentMonth(item.date));
  const totalIncome = monthTransactions.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = monthTransactions.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = Math.max(0, (monthlyAllowance || 0) + totalIncome - totalExpense);

  document.getElementById('totalIncome').textContent = formatRupiah(totalIncome);
  document.getElementById('totalExpense').textContent = formatRupiah(totalExpense);
  document.getElementById('sisaUang').textContent = formatRupiah(balance);

  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
  const dailyAllowance = Math.floor(balance / Math.max(daysLeft, 1));
  document.getElementById('jatahHarian').textContent = formatRupiah(dailyAllowance);
  document.getElementById('sisaHari').textContent = `${daysLeft} hari termasuk hari ini`;

  const todayExpense = transactions.filter(item => item.date === getLocalDateString() && item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const warning = document.getElementById('peringatan');
  if (monthlyAllowance === null) {
    warning.hidden = false;
    warning.textContent = 'Masukkan uang bulanan terlebih dahulu agar jatah harian dapat dihitung.';
  } else if (todayExpense > dailyAllowance) {
    warning.hidden = false;
    warning.textContent = `Perhatian: pengeluaran hari ini ${formatRupiah(todayExpense)} sudah melebihi jatah harian ${formatRupiah(dailyAllowance)}.`;
  } else {
    warning.hidden = true;
    warning.textContent = '';
  }
}

function renderTransactions() {
  transactionList.replaceChildren();
  const selectedFilter = filterInput.value;
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const shown = selectedFilter === 'semua' ? sorted : sorted.filter(item => item.type === selectedFilter);
  emptyState.hidden = shown.length > 0;
  if (shown.length === 0) {
    emptyState.querySelector('h3').textContent = transactions.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi yang cocok';
    emptyState.querySelector('p').textContent = transactions.length === 0 ? 'Transaksi yang kamu tambahkan akan muncul di sini.' : 'Coba pilih filter transaksi yang lain.';
  }
  transactionCount.textContent = `${shown.length} transaksi`;

  shown.forEach(item => {
    const row = document.createElement('article');
    row.className = 'transaction-item';
    const symbol = document.createElement('div');
    symbol.className = `transaction-symbol ${item.type}`;
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = item.type === 'income' ? '↗' : '↘';
    const info = document.createElement('div');
    info.className = 'transaction-info';
    const name = document.createElement('p');
    name.className = 'transaction-name';
    name.textContent = item.description || item.category || 'Transaksi';
    const date = document.createElement('p');
    date.className = 'transaction-date';
    date.textContent = `${item.category || 'Lainnya'} · ${item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} · ${formatDate(item.date)}`;
    info.append(name, date);
    const right = document.createElement('div');
    right.className = 'transaction-right';
    const amount = document.createElement('p');
    amount.className = `transaction-amount ${item.type}`;
    amount.textContent = `${item.type === 'income' ? '+' : '−'} ${formatRupiah(Number(item.amount))}`;
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Hapus';
    deleteButton.setAttribute('aria-label', `Hapus transaksi ${item.description || item.category || ''}`);
    deleteButton.addEventListener('click', () => deleteTransaction(item.id));
    right.append(amount, deleteButton);
    row.append(symbol, info, right);
    transactionList.appendChild(row);
  });
}

function renderApp() {
  renderSummary();
  renderTransactions();
}

function deleteTransaction(id) {
  const selected = transactions.find(item => item.id === id);
  if (!selected || !window.confirm(`Hapus transaksi "${selected.description || selected.category || 'ini'}"?`)) return;
  const previous = transactions;
  transactions = transactions.filter(item => item.id !== id);
  if (!saveTransactions()) { transactions = previous; return; }
  renderApp();
  showMessage('Transaksi berhasil dihapus.');
}

allowanceForm.addEventListener('submit', event => {
  event.preventDefault();
  const valueText = allowanceInput.value.trim();
  const value = Number(valueText);
  if (valueText === '' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    allowanceError.textContent = 'Masukkan nominal uang bulanan berupa angka bulat minimal Rp0.';
    return;
  }
  try {
    localStorage.setItem(ALLOWANCE_KEY, String(value));
    monthlyAllowance = value;
    allowanceError.textContent = '';
    renderApp();
  } catch (error) {
    allowanceError.textContent = 'Uang bulanan gagal disimpan di browser.';
  }
});

transactionForm.addEventListener('submit', event => {
  event.preventDefault();
  showMessage('');
  document.getElementById('amountError').textContent = '';
  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  if (!amountInput.value || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    document.getElementById('amountError').textContent = 'Nominal harus berupa angka bulat lebih dari Rp0.';
    amountInput.setAttribute('aria-invalid', 'true');
    return;
  }
  if (!dateInput.value || dateInput.value > getLocalDateString()) {
    showMessage('Tanggal wajib diisi dan tidak boleh melewati hari ini.', true);
    return;
  }
  const transaction = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description,
    category: categoryInput.value,
    amount,
    type: typeInput.value,
    date: dateInput.value,
    createdAt: Date.now()
  };
  const previous = transactions;
  transactions = [...transactions, transaction];
  if (!saveTransactions()) { transactions = previous; return; }
  renderApp();
  transactionForm.reset();
  dateInput.value = getLocalDateString();
  typeInput.value = 'expense';
  categoryInput.value = 'Makan';
  amountInput.removeAttribute('aria-invalid');
  showMessage('Transaksi berhasil disimpan.');
});

filterInput.addEventListener('change', renderTransactions);

document.getElementById('exportCsv').addEventListener('click', () => {
  if (transactions.length === 0) {
    showMessage('Belum ada transaksi untuk diunduh.', true);
    return;
  }
  const headers = ['Tanggal', 'Jenis', 'Kategori', 'Catatan', 'Nominal'];
  const rows = transactions.slice().sort((a, b) => a.date.localeCompare(b.date)).map(item => [item.date, item.type === 'income' ? 'Pemasukan' : 'Pengeluaran', item.category || 'Lainnya', item.description || '', Number(item.amount)]);
  const escapeCsv = value => `"${String(value).replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `moneytalks-riwayat-${getLocalDateString()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage('File CSV berhasil disiapkan.');
});

renderApp();
