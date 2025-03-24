// Initialize dark mode from localStorage or system preference
function initializeDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true' || 
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', darkModeEnabled ? 'dark' : 'light');
    return darkModeEnabled;
}

// Transaction management
class TransactionManager {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.chart = null;
        this.initializeEventListeners();
        this.updateUI();
    }

    initializeEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        let isDarkMode = initializeDarkMode();
        darkModeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
            localStorage.setItem('darkMode', isDarkMode);
        });

        // Transaction form
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Category filter
        document.getElementById('filterCategory').addEventListener('change', () => {
            this.updateUI();
        });

        // Set default date to today
        document.getElementById('date').valueAsDate = new Date();
    }

    addTransaction() {
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        const transaction = {
            id: Date.now(),
            type,
            amount,
            category,
            date
        };

        this.transactions.push(transaction);
        this.saveToLocalStorage();
        this.updateUI();
        document.getElementById('transactionForm').reset();
        document.getElementById('date').valueAsDate = new Date();
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveToLocalStorage();
        this.updateUI();
    }

    saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    updateSummary() {
        const totals = this.transactions.reduce((acc, transaction) => {
            if (transaction.type === 'income') {
                acc.income += transaction.amount;
            } else {
                acc.expenses += transaction.amount;
            }
            return acc;
        }, { income: 0, expenses: 0 });

        const balance = totals.income - totals.expenses;

        document.getElementById('totalIncome').textContent = this.formatCurrency(totals.income);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(totals.expenses);
        document.getElementById('netBalance').textContent = this.formatCurrency(balance);
        document.getElementById('netBalance').className = balance >= 0 ? 'text-success' : 'text-danger';
    }

    updateTransactionsList() {
        const tbody = document.getElementById('transactionsList');
        const filterCategory = document.getElementById('filterCategory').value;
        const filteredTransactions = filterCategory === 'all' 
            ? this.transactions 
            : this.transactions.filter(t => t.category === filterCategory);

        tbody.innerHTML = '';
        filteredTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                    <td>${transaction.type}</td>
                    <td>${transaction.category}</td>
                    <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${this.formatCurrency(transaction.amount)}
                    </td>
                    <td>
                        <button class="btn btn-danger btn-sm btn-action" onclick="transactionManager.deleteTransaction(${transaction.id})">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
    }

    updateChart() {
        const ctx = document.getElementById('spendingChart').getContext('2d');
        
        // Group expenses by category
        const expensesByCategory = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});

        const data = {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        };

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-color')
                        }
                    }
                }
            }
        });
    }

    updateUI() {
        this.updateSummary();
        this.updateTransactionsList();
        this.updateChart();
    }
}

// Initialize the application
const transactionManager = new TransactionManager();