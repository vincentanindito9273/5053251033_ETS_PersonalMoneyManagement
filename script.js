const STORAGE_KEY = 'moneytalks_transactions';

const transactionForm = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const dateInput = document.getElementById('date');
const formMessage = document.getElementById('formMessage');
const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');
const transactionCount = document.getElementById('transactionCount');

let transactions = loadTransactions();

// Menggunakan tanggal lokal agar tanggal awal formulir sesuai hari di perangkat.
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

dateInput.value = getLocalDateString();

function loadTransactions() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const parsedData = savedData ? JSON.parse(savedData) : [];
    return Array.isArray(parsedData) ? parsedData.filter(isValidStoredTransaction) : [];
  } catch (error) {
    console.error('Data transaksi tidak dapat dibaca:', error);
    return [];
  }
}

function isValidStoredTransaction(item) {
  return item && typeof item.id === 'string' &&
    typeof item.description === 'string' && item.description.trim() !== '' &&
    Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 &&
    (item.type === 'income' || item.type === 'expense') &&
    typeof item.date === 'string';
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error('Data transaksi tidak dapat disimpan:', error);
    showMessage('Data gagal disimpan di browser. Periksa ruang penyimpanan browser.', true);
    return false;
  }
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString) {
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateString;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(date);
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle('error', isError);
}

function clearErrors() {
  document.getElementById('descriptionError').textContent = '';
  document.getElementById('amountError').textContent = '';
  descriptionInput.removeAttribute('aria-invalid');
  amountInput.removeAttribute('aria-invalid');
}

function validateForm() {
  clearErrors();
  let isValid = true;
  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);

  if (!description) {
    document.getElementById('descriptionError').textContent = 'Nama transaksi wajib diisi.';
    descriptionInput.setAttribute('aria-invalid', 'true');
    isValid = false;
  }

  if (!amountInput.value || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    document.getElementById('amountError').textContent = 'Nominal harus berupa angka bulat lebih dari 0.';
    amountInput.setAttribute('aria-invalid', 'true');
    isValid = false;
  }

  if (!dateInput.value) {
    showMessage('Tanggal transaksi wajib diisi.', true);
    isValid = false;
  } else if (dateInput.value > getLocalDateString()) {
    showMessage('Tanggal transaksi tidak boleh melewati hari ini.', true);
    isValid = false;
  }

  if (!isValid && !formMessage.textContent) {
    showMessage('Periksa kembali data transaksi.', true);
  }
  return isValid;
}

function renderSummary() {
  const totalIncome = transactions
    .filter(item => item.type === 'income')
    .reduce((total, item) => total + Number(item.amount), 0);
  const totalExpense = transactions
    .filter(item => item.type === 'expense')
    .reduce((total, item) => total + Number(item.amount), 0);
  document.getElementById('totalIncome').textContent = formatRupiah(totalIncome);
  document.getElementById('totalExpense').textContent = formatRupiah(totalExpense);
}

function renderTransactions() {
  transactionList.replaceChildren();
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateDifference = b.date.localeCompare(a.date);
    if (dateDifference !== 0) return dateDifference;
    return Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });

  emptyState.hidden = sortedTransactions.length > 0;
  transactionCount.textContent = `${transactions.length} transaksi`;

  sortedTransactions.forEach(item => {
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
    name.textContent = item.description;
    const date = document.createElement('p');
    date.className = 'transaction-date';
    date.textContent = `${item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} · ${formatDate(item.date)}`;
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
    deleteButton.setAttribute('aria-label', `Hapus transaksi ${item.description}`);
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
  const selectedTransaction = transactions.find(item => item.id === id);
  if (!selectedTransaction) return;

  const confirmed = window.confirm(`Hapus transaksi "${selectedTransaction.description}"?`);
  if (!confirmed) return;

  const previousTransactions = transactions;
  transactions = transactions.filter(item => item.id !== id);
  if (!saveTransactions()) {
    transactions = previousTransactions;
    return;
  }
  renderApp();
  showMessage('Transaksi berhasil dihapus.');
}

transactionForm.addEventListener('submit', event => {
  event.preventDefault();
  showMessage('');

  if (!validateForm()) return;

  const newTransaction = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: descriptionInput.value.trim(),
    amount: Number(amountInput.value),
    type: typeInput.value,
    date: dateInput.value,
    createdAt: Date.now()
  };

  const previousTransactions = transactions;
  transactions = [...transactions, newTransaction];
  if (!saveTransactions()) {
    transactions = previousTransactions;
    return;
  }

  renderApp();
  transactionForm.reset();
  dateInput.value = getLocalDateString();
  typeInput.value = 'expense';
  clearErrors();
  showMessage('Transaksi berhasil disimpan.');
});

[descriptionInput, amountInput, dateInput].forEach(input => {
  input.addEventListener('input', () => {
    showMessage('');
    const errorId = input.id === 'description' ? 'descriptionError' :
      input.id === 'amount' ? 'amountError' : null;
    if (errorId) document.getElementById(errorId).textContent = '';
    input.removeAttribute('aria-invalid');
  });
});

renderApp();
