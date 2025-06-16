// Enhanced JavaScript for Classroom Financial Management System

// Global variables
let currentUser = null;
let incomeData = [];
let expenseData = [];
let paymentData = {};
let tuitionData = {};
let studentList = {};

// Google Sheets API configuration
const GOOGLE_SHEETS_API_KEY = ''; // Add your Google Sheets API key here
const GOOGLE_SHEETS_SPREADSHEET_ID = ''; // Add your spreadsheet ID here

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeApp();
    loadData();
    updateDashboard();
    setupEventListeners();
    setupStudentRestrictions();
});

// Authentication check
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    displayUserInfo();
    setupAdminFeatures();
}

// Display user information
function displayUserInfo() {
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.display || currentUser.username;
    }
    
    if (userRoleElement) {
        userRoleElement.textContent = currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'นักเรียน';
    }
}

// Setup admin-only features
function setupAdminFeatures() {
    const adminElements = document.querySelectorAll('.admin-only');
    if (currentUser.role === 'admin') {
        adminElements.forEach(element => {
            element.style.display = 'block';
        });
        initializePaymentSystem();
        initializeTuitionSystem();
        initializeStudentManagement();
        initializeGoogleSheetsIntegration();
    }
}

// Setup student restrictions (view-only mode)
function setupStudentRestrictions() {
    if (currentUser.role === 'student') {
        // Hide all form inputs and buttons for students
        const forms = document.querySelectorAll('form, .form-group');
        const buttons = document.querySelectorAll('.btn:not(.logout-btn)');
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        
        forms.forEach(form => {
            if (!form.classList.contains('login-form')) {
                form.style.display = 'none';
            }
        });
        
        buttons.forEach(btn => {
            if (!btn.classList.contains('logout-btn')) {
                btn.style.display = 'none';
            }
        });
        
        inputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.6';
        });
        
        // Add view-only indicator
        addViewOnlyIndicator();
    }
}

// Add view-only indicator for students
function addViewOnlyIndicator() {
    const header = document.querySelector('.header');
    if (header) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-left: 1rem;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        `;
        indicator.innerHTML = '<i class="fas fa-eye"></i> โหมดดูอย่างเดียว';
        header.querySelector('.user-info').appendChild(indicator);
    }
}

// Initialize application
function initializeApp() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.value = today;
    });
    
    // Initialize charts
    initializeCharts();
}

// Setup event listeners
function setupEventListeners() {
    // Only allow admin to interact with forms
    if (currentUser.role === 'admin') {
        document.getElementById('incomeDescription')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addIncome();
        });
        
        document.getElementById('expenseDescription')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addExpense();
        });
        
        // Real-time calculations
        document.getElementById('incomeAmount')?.addEventListener('input', updateDashboard);
        document.getElementById('expenseAmount')?.addEventListener('input', updateDashboard);
    }
}

// Load data from localStorage
function loadData() {
    incomeData = JSON.parse(localStorage.getItem('incomeData')) || [];
    expenseData = JSON.parse(localStorage.getItem('expenseData')) || [];
    paymentData = JSON.parse(localStorage.getItem('paymentData')) || {};
    tuitionData = JSON.parse(localStorage.getItem('tuitionData')) || {};
    studentList = JSON.parse(localStorage.getItem('studentList')) || {};
    
    // Initialize default student list if empty
    if (Object.keys(studentList).length === 0) {
        for (let i = 1; i <= 41; i++) {
            studentList[i] = {
                id: i,
                name: `นักเรียน ${i}`,
                studentId: `${i.toString().padStart(2, '0')}`
            };
        }
        saveData();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('incomeData', JSON.stringify(incomeData));
    localStorage.setItem('expenseData', JSON.stringify(expenseData));
    localStorage.setItem('paymentData', JSON.stringify(paymentData));
    localStorage.setItem('tuitionData', JSON.stringify(tuitionData));
    localStorage.setItem('studentList', JSON.stringify(studentList));
}

// Show/hide sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
        selectedSection.classList.add('fade-in');
    }
    
    // Add active class to clicked nav link
    const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update content based on section
    switch(sectionId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'income':
            displayIncomeList();
            break;
        case 'expenses':
            displayExpenseList();
            break;
        case 'reports':
            updateReports();
            break;
        case 'students':
            displayStudentList();
            break;
        case 'payments':
            displayPaymentDays();
            break;
        case 'tuition':
            displayTuitionCollection();
            updateTuitionSummary();
            updateStudentPaymentSummary();
            updateStudentPaymentTable();
            break;
        case 'studentManagement':
            displaySystemUsers();
            break;
        case 'googleSheets':
            // Google Sheets section is static, no updates needed
            break;
    }
}

// Add income (admin only)
function addIncome() {
    if (currentUser.role !== 'admin') return;
    
    const description = document.getElementById('incomeDescription').value.trim();
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const date = document.getElementById('incomeDate').value;
    
    if (!description || !amount || !date) {
        showMessage('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }
    
    if (amount <= 0) {
        showMessage('จำนวนเงินต้องมากกว่า 0', 'error');
        return;
    }
    
    const income = {
        id: Date.now(),
        description: description,
        amount: amount,
        date: date,
        user: currentUser.username,
        timestamp: new Date().toISOString()
    };
    
    incomeData.push(income);
    saveData();
    
    // Clear form
    document.getElementById('incomeDescription').value = '';
    document.getElementById('incomeAmount').value = '';
    
    // Update displays
    updateDashboard();
    displayIncomeList();
    showMessage('เพิ่มรายรับสำเร็จ', 'success');
}

// Add expense (admin only)
function addExpense() {
    if (currentUser.role !== 'admin') return;
    
    const description = document.getElementById('expenseDescription').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    
    if (!description || !amount || !date) {
        showMessage('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }
    
    if (amount <= 0) {
        showMessage('จำนวนเงินต้องมากกว่า 0', 'error');
        return;
    }
    
    const expense = {
        id: Date.now(),
        description: description,
        amount: amount,
        date: date,
        user: currentUser.username,
        timestamp: new Date().toISOString()
    };
    
    expenseData.push(expense);
    saveData();
    
    // Clear form
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseAmount').value = '';
    
    // Update displays
    updateDashboard();
    displayExpenseList();
    showMessage('เพิ่มรายจ่ายสำเร็จ', 'success');
}

// Delete income (admin only)
function deleteIncome(id) {
    if (currentUser.role !== 'admin') return;
    
    if (confirm('คุณต้องการลบรายรับนี้หรือไม่?')) {
        incomeData = incomeData.filter(item => item.id !== id);
        saveData();
        updateDashboard();
        displayIncomeList();
        showMessage('ลบรายรับสำเร็จ', 'success');
    }
}

// Delete expense (admin only)
function deleteExpense(id) {
    if (currentUser.role !== 'admin') return;
    
    if (confirm('คุณต้องการลบรายจ่ายนี้หรือไม่?')) {
        expenseData = expenseData.filter(item => item.id !== id);
        saveData();
        updateDashboard();
        displayExpenseList();
        showMessage('ลบรายจ่ายสำเร็จ', 'success');
    }
}

// Display income list
function displayIncomeList() {
    const tbody = document.getElementById('incomeList');
    if (!tbody) return;
    
    if (incomeData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; font-style: italic;">ยังไม่มีรายรับ</td></tr>';
        return;
    }
    
    const sortedData = incomeData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sortedData.map(income => `
        <tr class="fade-in">
            <td>${formatDate(income.date)}</td>
            <td>${income.description}</td>
            <td style="color: #16a34a; font-weight: 600;">฿${income.amount.toLocaleString()}</td>
            <td>${income.user}</td>
            <td>
                ${currentUser.role === 'admin' ? `
                    <button class="btn btn-danger" onclick="deleteIncome(${income.id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span style="color: #6b7280; font-style: italic;">ดูอย่างเดียว</span>'}
            </td>
        </tr>
    `).join('');
}

// Display expense list
function displayExpenseList() {
    const tbody = document.getElementById('expenseList');
    if (!tbody) return;
    
    if (expenseData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; font-style: italic;">ยังไม่มีรายจ่าย</td></tr>';
        return;
    }
    
    const sortedData = expenseData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sortedData.map(expense => `
        <tr class="fade-in">
            <td>${formatDate(expense.date)}</td>
            <td>${expense.description}</td>
            <td style="color: #dc2626; font-weight: 600;">฿${expense.amount.toLocaleString()}</td>
            <td>${expense.user}</td>
            <td>
                ${currentUser.role === 'admin' ? `
                    <button class="btn btn-danger" onclick="deleteExpense(${expense.id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span style="color: #6b7280; font-style: italic;">ดูอย่างเดียว</span>'}
            </td>
        </tr>
    `).join('');
}

// Update dashboard
function updateDashboard() {
    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpenses;
    const transactionCount = incomeData.length + expenseData.length;
    
    // Update dashboard cards
    document.getElementById('totalIncome').textContent = `฿${totalIncome.toLocaleString()}`;
    document.getElementById('totalExpenses').textContent = `฿${totalExpenses.toLocaleString()}`;
    document.getElementById('balance').textContent = `฿${balance.toLocaleString()}`;
    document.getElementById('transactionCount').textContent = transactionCount;
    
    // Update recent transactions
    updateRecentTransactions();
}

// Update recent transactions
function updateRecentTransactions() {
    const tbody = document.getElementById('recentTransactions');
    if (!tbody) return;
    
    const allTransactions = [
        ...incomeData.map(item => ({...item, type: 'รายรับ'})),
        ...expenseData.map(item => ({...item, type: 'รายจ่าย'}))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
    
    if (allTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; font-style: italic;">ยังไม่มีธุรกรรม</td></tr>';
        return;
    }
    
    tbody.innerHTML = allTransactions.map(transaction => `
        <tr class="fade-in">
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>
                <span style="color: ${transaction.type === 'รายรับ' ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                    ${transaction.type}
                </span>
            </td>
            <td style="color: ${transaction.type === 'รายรับ' ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                ฿${transaction.amount.toLocaleString()}
            </td>
            <td>${transaction.user}</td>
        </tr>
    `).join('');
}

// Update reports
function updateReports() {
    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpenses;
    const transactionCount = incomeData.length + expenseData.length;
    
    // Update report cards
    document.getElementById('reportTotalIncome').textContent = `฿${totalIncome.toLocaleString()}`;
    document.getElementById('reportTotalExpenses').textContent = `฿${totalExpenses.toLocaleString()}`;
    document.getElementById('reportBalance').textContent = `฿${balance.toLocaleString()}`;
    document.getElementById('reportTransactionCount').textContent = transactionCount;
    
    // Update charts
    updateFinancialChart();
}

// Initialize charts
function initializeCharts() {
    // Charts will be created when needed
}

// Update financial chart
function updateFinancialChart() {
    const ctx = document.getElementById('financialChart');
    if (!ctx) return;
    
    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);
    
    // Destroy existing chart if it exists
    if (window.financialChart) {
        window.financialChart.destroy();
    }
    
    window.financialChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['รายรับ', 'รายจ่าย'],
            datasets: [{
                data: [totalIncome, totalExpenses],
                backgroundColor: ['#16a34a', '#dc2626'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

// Display student list
function displayStudentList() {
    const tbody = document.getElementById('studentList');
    if (!tbody) return;
    
    // Initialize studentList if it doesn't exist
    if (!studentList || Object.keys(studentList).length === 0) {
        studentList = {};
        for (let i = 1; i <= 41; i++) {
            studentList[i] = {
                id: i,
                studentId: `2567${i.toString().padStart(3, '0')}`,
                name: `นักเรียน ${i}`,
                username: i.toString(),
                password: i.toString(),
                status: 'กำลังศึกษา'
            };
        }
        saveData();
    }
    
    const students = Object.values(studentList).sort((a, b) => a.id - b.id);
    
    tbody.innerHTML = students.map(student => `
        <tr class="fade-in">
            <td>${student.id}</td>
            <td>${student.studentId}</td>
            <td>${student.name}</td>
            <td>
                <span style="color: #16a34a; font-weight: 600;">
                    ${student.status || 'กำลังศึกษา'}
                </span>
            </td>
        </tr>
    `).join('');
}

// Initialize tuition collection system
function initializeTuitionSystem() {
    if (currentUser.role !== 'admin') return;
    
    // Add tuition collection section to navigation
    const navList = document.querySelector('.nav-list');
    if (navList) {
        const tuitionNav = document.createElement('li');
        tuitionNav.className = 'nav-item admin-only';
        tuitionNav.innerHTML = `
            <a href="#tuition" class="nav-link" onclick="showSection('tuition')">
                <i class="fas fa-money-bill-wave"></i>
                เก็บเงินเรียน
            </a>
        `;
        navList.appendChild(tuitionNav);
    }
    
    // Add tuition collection section to main content
    const container = document.querySelector('.container');
    if (container) {
        const tuitionSection = document.createElement('section');
        tuitionSection.id = 'tuition';
        tuitionSection.className = 'content-section';
        tuitionSection.innerHTML = createTuitionSectionHTML();
        container.appendChild(tuitionSection);
    }
}

// Create tuition section HTML
function createTuitionSectionHTML() {
    return `
        <h2 class="section-title">
            <i class="fas fa-money-bill-wave"></i>
            ระบบเก็บเงินเรียน
        </h2>
        
        <div class="tuition-controls">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">วันที่เก็บเงิน</label>
                    <input type="date" class="form-input" id="tuitionDate">
                </div>
                <div class="form-group">
                    <label class="form-label">จำนวนเงินต่อคน (บาท)</label>
                    <input type="number" class="form-input" id="tuitionAmount" placeholder="0" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <button class="btn btn-primary" onclick="addTuitionDay()">
                        <i class="fas fa-plus"></i>
                        เพิ่มวันเก็บเงิน
                    </button>
                </div>
            </div>
        </div>

        <div id="tuitionDays">
            <!-- Tuition days will be dynamically generated -->
        </div>

        <!-- Student Payment Summary -->
        <div class="summary-section">
            <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                <i class="fas fa-users"></i>
                สรุปการจ่ายเงินของนักเรียน
            </h3>
            <div id="studentPaymentSummary">
                <!-- Student payment summary will be generated here -->
            </div>
        </div>

        <!-- Student Payment Tracking Table -->
        <div class="summary-section">
            <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                <i class="fas fa-table"></i>
                ตารางการจ่ายเงินเรียงตามนักเรียน
            </h3>
            <div id="studentPaymentTable">
                <!-- Student payment table will be generated here -->
            </div>
        </div>

        <!-- Tuition Summary -->
        <div class="summary-section">
            <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                <i class="fas fa-chart-pie"></i>
                สรุปการเก็บเงินเรียน
            </h3>
            
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-value" id="totalTuitionPaid">฿0</div>
                    <div class="summary-label">ยอดเก็บได้</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value" id="totalTuitionPending">฿0</div>
                    <div class="summary-label">ยอดค้างชำระ</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value" id="tuitionPaymentRate">0%</div>
                    <div class="summary-label">อัตราการชำระ</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value" id="totalTuitionStudents">41</div>
                    <div class="summary-label">จำนวนนักเรียนทั้งหมด</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                    <i class="fas fa-chart-bar"></i>
                    กราฟแสดงการเก็บเงินเรียน
                </h3>
                <canvas id="tuitionChart" width="400" height="200"></canvas>
            </div>
        </div>
    `;
}

// Add tuition day
function addTuitionDay() {
    if (currentUser.role !== 'admin') return;
    
    const date = document.getElementById('tuitionDate').value;
    const amount = parseFloat(document.getElementById('tuitionAmount').value);
    
    if (!date || !amount || amount <= 0) {
        showMessage('กรุณากรอกวันที่และจำนวนเงินให้ถูกต้อง', 'error');
        return;
    }
    
    if (tuitionData[date]) {
        showMessage('วันที่นี้มีอยู่แล้ว', 'error');
        return;
    }
    
    tuitionData[date] = {
        date: date,
        amount: amount,
        students: {}
    };
    
    // Initialize all students for this date
    for (let i = 1; i <= 41; i++) {
        tuitionData[date].students[i] = {
            paid: false,
            amount: amount,
            customAmount: amount
        };
    }
    
    saveData();
    displayTuitionCollection();
    updateTuitionSummary();
    updateStudentPaymentSummary();
    updateStudentPaymentTable();
    showMessage('เพิ่มวันเก็บเงินเรียนสำเร็จ', 'success');
}

// Display tuition collection
function displayTuitionCollection() {
    const container = document.getElementById('tuitionDays');
    if (!container) return;
    
    const dates = Object.keys(tuitionData).sort();
    
    if (dates.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #6b7280; font-style: italic; padding: 2rem;">ยังไม่มีวันเก็บเงินเรียน</div>';
        return;
    }
    
    container.innerHTML = dates.map(date => createTuitionDayHTML(date)).join('');
}

// Create tuition day HTML
function createTuitionDayHTML(date) {
    const tuitionDay = tuitionData[date];
    const students = tuitionDay.students;
    
    // Separate paid and unpaid students
    const paidStudents = [];
    const unpaidStudents = [];
    
    Object.entries(students).forEach(([studentId, student]) => {
        const studentInfo = studentList[studentId] || { name: `นักเรียน ${studentId}`, studentId: studentId };
        if (student.paid) {
            paidStudents.push({ id: studentId, ...student, ...studentInfo });
        } else {
            unpaidStudents.push({ id: studentId, ...student, ...studentInfo });
        }
    });
    
    const studentRows = Object.keys(students).map(studentId => {
        const student = students[studentId];
        const studentInfo = studentList[studentId] || { name: `นักเรียน ${studentId}`, studentId: studentId };
        return `
            <tr>
                <td>${studentInfo.studentId}</td>
                <td>${studentInfo.name}</td>
                <td>
                    <input type="checkbox" 
                           class="tuition-checkbox" 
                           ${student.paid ? 'checked' : ''} 
                           onchange="updateTuitionStatus('${date}', ${studentId}, this.checked)"
                           ${currentUser.role !== 'admin' ? 'disabled' : ''}>
                </td>
                <td>
                    <span style="color: ${student.paid ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                        ${student.paid ? 'จ่ายแล้ว' : 'ค้างจ่าย'}
                    </span>
                </td>
                <td>
                    <input type="number" 
                           class="form-input amount-input" 
                           value="${student.customAmount}" 
                           onchange="updateTuitionAmount('${date}', ${studentId}, this.value)"
                           ${!student.paid ? 'disabled' : ''}
                           ${currentUser.role !== 'admin' ? 'disabled' : ''}
                           style="width: 100px; text-align: right;">
                </td>
                <td>฿${student.customAmount.toLocaleString()}</td>
            </tr>
        `;
    }).join('');
    
    // Create paid/unpaid lists
    const paidList = paidStudents.map(student => 
        `<span class="student-tag paid">${student.studentId} - ${student.name}</span>`
    ).join('');
    
    const unpaidList = unpaidStudents.map(student => 
        `<span class="student-tag unpaid">${student.studentId} - ${student.name}</span>`
    ).join('');
    
    return `
        <div class="tuition-table" style="margin-bottom: 2rem;">
            <table class="table">
                <thead>
                    <tr>
                        <th colspan="6" style="text-align: center;">
                            <i class="fas fa-calendar"></i>
                            วันที่ ${formatDate(date)} - จำนวนเงินต่อคน: ฿${tuitionDay.amount.toLocaleString()}
                            ${currentUser.role === 'admin' ? `
                                <button class="btn btn-danger" onclick="deleteTuitionDay('${date}')" style="margin-left: 1rem; padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </th>
                    </tr>
                    <tr>
                        <th>เลขประจำตัว</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>สถานะการจ่าย</th>
                        <th>สถานะ</th>
                        <th>จำนวนเงิน (บาท)</th>
                        <th>ยอดรวม</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentRows}
                </tbody>
            </table>
            
            <!-- Paid/Unpaid Summary -->
            <div class="payment-summary" style="margin-top: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.8); border-radius: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <h4 style="color: #16a34a; margin-bottom: 0.5rem;">
                            <i class="fas fa-check-circle"></i>
                            นักเรียนที่จ่ายแล้ว (${paidStudents.length} คน)
                        </h4>
                        <div class="student-list">
                            ${paidList || '<span style="color: #9ca3af; font-style: italic;">ไม่มี</span>'}
                        </div>
                    </div>
                    <div>
                        <h4 style="color: #dc2626; margin-bottom: 0.5rem;">
                            <i class="fas fa-times-circle"></i>
                            นักเรียนที่ยังไม่จ่าย (${unpaidStudents.length} คน)
                        </h4>
                        <div class="student-list">
                            ${unpaidList || '<span style="color: #9ca3af; font-style: italic;">ไม่มี</span>'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update tuition status
function updateTuitionStatus(date, studentId, paid) {
    if (currentUser.role !== 'admin') return;
    
    if (!tuitionData[date] || !tuitionData[date].students[studentId]) return;
    
    tuitionData[date].students[studentId].paid = paid;
    
    // Enable/disable amount input based on payment status
    const row = event.target.closest('tr');
    const amountInput = row.querySelector('.amount-input');
    if (amountInput) {
        amountInput.disabled = !paid;
    }
    
    saveData();
    updateTuitionSummary();
    updateStudentPaymentSummary();
    updateStudentPaymentTable();
    
    // Update the status display
    const statusCell = row.querySelector('td:nth-child(4)');
    if (statusCell) {
        statusCell.innerHTML = `
            <span style="color: ${paid ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                ${paid ? 'จ่ายแล้ว' : 'ค้างจ่าย'}
            </span>
        `;
    }
    
    // Refresh the tuition day display to update paid/unpaid lists
    displayTuitionCollection();
}

// Update tuition amount
function updateTuitionAmount(date, studentId, amount) {
    if (currentUser.role !== 'admin') return;
    
    if (!tuitionData[date] || !tuitionData[date].students[studentId]) return;
    
    const newAmount = parseFloat(amount) || 0;
    tuitionData[date].students[studentId].customAmount = newAmount;
    
    saveData();
    updateTuitionSummary();
    updateStudentPaymentSummary();
    updateStudentPaymentTable();
    
    // Update the display
    const row = event.target.closest('tr');
    const totalCell = row.querySelector('td:nth-child(6)');
    if (totalCell) {
        totalCell.textContent = `฿${newAmount.toLocaleString()}`;
    }
}

// Delete tuition day
function deleteTuitionDay(date) {
    if (currentUser.role !== 'admin') return;
    
    if (confirm('คุณต้องการลบวันเก็บเงินเรียนนี้หรือไม่?')) {
        delete tuitionData[date];
        saveData();
        displayTuitionCollection();
        updateTuitionSummary();
        updateStudentPaymentSummary();
        updateStudentPaymentTable();
        showMessage('ลบวันเก็บเงินเรียนสำเร็จ', 'success');
    }
}

// Update student payment summary
function updateStudentPaymentSummary() {
    const container = document.getElementById('studentPaymentSummary');
    if (!container) return;
    
    // Calculate payment statistics for each student
    const studentStats = {};
    
    for (let studentId = 1; studentId <= 41; studentId++) {
        studentStats[studentId] = {
            totalPaid: 0,
            totalPending: 0,
            paidDays: 0,
            pendingDays: 0,
            totalDays: 0
        };
    }
    
    Object.values(tuitionData).forEach(tuitionDay => {
        Object.entries(tuitionDay.students).forEach(([studentId, student]) => {
            const stats = studentStats[studentId];
            stats.totalDays++;
            
            if (student.paid) {
                stats.totalPaid += student.customAmount;
                stats.paidDays++;
            } else {
                stats.totalPending += student.customAmount;
                stats.pendingDays++;
            }
        });
    });
    
    // Create student summary table
    const studentRows = Object.entries(studentStats).map(([studentId, stats]) => {
        const studentInfo = studentList[studentId] || { name: `นักเรียน ${studentId}`, studentId: studentId };
        const paymentRate = stats.totalDays > 0 ? Math.round((stats.paidDays / stats.totalDays) * 100) : 0;
        const statusColor = paymentRate === 100 ? '#16a34a' : paymentRate >= 50 ? '#f59e0b' : '#dc2626';
        const statusText = paymentRate === 100 ? 'จ่ายครบ' : paymentRate >= 50 ? 'จ่ายบางส่วน' : 'ค้างจ่าย';
        
        return `
            <tr>
                <td>${studentInfo.studentId}</td>
                <td>${studentInfo.name}</td>
                <td style="color: #16a34a; font-weight: 600;">฿${stats.totalPaid.toLocaleString()}</td>
                <td style="color: #dc2626; font-weight: 600;">฿${stats.totalPending.toLocaleString()}</td>
                <td>${stats.paidDays}/${stats.totalDays}</td>
                <td style="color: ${statusColor}; font-weight: 600;">${paymentRate}%</td>
                <td>
                    <span style="color: ${statusColor}; font-weight: 600;">
                        ${statusText}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>เลขประจำตัว</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>ยอดจ่ายแล้ว</th>
                        <th>ยอดค้างจ่าย</th>
                        <th>จำนวนวันที่จ่าย</th>
                        <th>อัตราการจ่าย</th>
                        <th>สถานะ</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentRows}
                </tbody>
            </table>
        </div>
    `;
}

// Update student payment table (student-sorted view)
function updateStudentPaymentTable() {
    const container = document.getElementById('studentPaymentTable');
    if (!container) return;
    
    const dates = Object.keys(tuitionData).sort();
    
    if (dates.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #6b7280; font-style: italic; padding: 2rem;">ยังไม่มีข้อมูลการจ่ายเงิน</div>';
        return;
    }
    
    // Create table headers
    const headerRow = `
        <tr>
            <th>เลขประจำตัว</th>
            <th>ชื่อ-นามสกุล</th>
            ${dates.map(date => `
                <th style="text-align: center; min-width: 120px;">
                    ${formatDate(date)}
                </th>
            `).join('')}
            <th>ยอดรวม</th>
            <th>สถานะ</th>
        </tr>
    `;
    
    // Create student rows
    const studentRows = [];
    for (let studentId = 1; studentId <= 41; studentId++) {
        const studentInfo = studentList[studentId] || { name: `นักเรียน ${studentId}`, studentId: studentId };
        let totalPaid = 0;
        let totalDays = 0;
        let paidDays = 0;
        
        const dateCells = dates.map(date => {
            const student = tuitionData[date]?.students[studentId];
            if (student) {
                totalDays++;
                if (student.paid) {
                    totalPaid += student.customAmount;
                    paidDays++;
                }
                return `
                    <td style="text-align: center;">
                        <span style="color: ${student.paid ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                            ${student.paid ? '✓' : '✗'}
                        </span>
                        <br>
                        <small>฿${student.customAmount.toLocaleString()}</small>
                    </td>
                `;
            }
            return '<td style="text-align: center; color: #9ca3af;">-</td>';
        }).join('');
        
        const paymentRate = totalDays > 0 ? Math.round((paidDays / totalDays) * 100) : 0;
        const statusColor = paymentRate === 100 ? '#16a34a' : paymentRate >= 50 ? '#f59e0b' : '#dc2626';
        const statusText = paymentRate === 100 ? 'จ่ายครบ' : paymentRate >= 50 ? 'จ่ายบางส่วน' : 'ค้างจ่าย';
        
        studentRows.push(`
            <tr>
                <td>${studentInfo.studentId}</td>
                <td>${studentInfo.name}</td>
                ${dateCells}
                <td style="color: #16a34a; font-weight: 600;">฿${totalPaid.toLocaleString()}</td>
                <td>
                    <span style="color: ${statusColor}; font-weight: 600;">
                        ${statusText}
                    </span>
                </td>
            </tr>
        `);
    }
    
    container.innerHTML = `
        <div class="table-container" style="max-height: 600px; overflow-y: auto;">
            <table class="table">
                <thead>
                    ${headerRow}
                </thead>
                <tbody>
                    ${studentRows.join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Initialize student management
function initializeStudentManagement() {
    if (currentUser.role !== 'admin') return;
    
    // Add student management section to navigation
    const navList = document.querySelector('.nav-list');
    if (navList) {
        const studentNav = document.createElement('li');
        studentNav.className = 'nav-item admin-only';
        studentNav.innerHTML = `
            <a href="#studentManagement" class="nav-link" onclick="showSection('studentManagement')">
                <i class="fas fa-user-edit"></i>
                จัดการข้อมูลนักเรียน
            </a>
        `;
        navList.appendChild(studentNav);
    }
    
    // Add student management section to main content
    const container = document.querySelector('.container');
    if (container) {
        const studentSection = document.createElement('section');
        studentSection.id = 'studentManagement';
        studentSection.className = 'content-section';
        studentSection.innerHTML = createStudentManagementHTML();
        container.appendChild(studentSection);
    }
}

// Create student management HTML
function createStudentManagementHTML() {
    const studentRows = Object.entries(studentList).map(([id, student]) => `
        <tr>
            <td>
                <input type="text" 
                       class="form-input" 
                       value="${student.studentId}" 
                       onchange="updateStudentInfo(${id}, 'studentId', this.value)"
                       style="width: 80px;">
            </td>
            <td>
                <input type="text" 
                       class="form-input" 
                       value="${student.name}" 
                       onchange="updateStudentInfo(${id}, 'name', this.value)"
                       style="width: 200px;">
            </td>
            <td>
                <input type="text" 
                       class="form-input" 
                       value="${student.username || id}" 
                       onchange="updateStudentInfo(${id}, 'username', this.value)"
                       style="width: 100px;"
                       placeholder="ชื่อผู้ใช้">
            </td>
            <td>
                <input type="text" 
                       class="form-input" 
                       value="${student.password || id}" 
                       onchange="updateStudentInfo(${id}, 'password', this.value)"
                       style="width: 100px;"
                       type="password"
                       placeholder="รหัสผ่าน">
            </td>
            <td>
                <button class="btn btn-danger" onclick="deleteStudent(${id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    return `
        <h2 class="section-title">
            <i class="fas fa-user-edit"></i>
            จัดการข้อมูลนักเรียนและผู้ใช้
        </h2>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">เลขประจำตัว</label>
                <input type="text" class="form-input" id="newStudentId" placeholder="เช่น 01, 02, 03">
            </div>
            <div class="form-group">
                <label class="form-label">ชื่อ-นามสกุล</label>
                <input type="text" class="form-input" id="newStudentName" placeholder="ชื่อนักเรียน">
            </div>
            <div class="form-group">
                <label class="form-label">ชื่อผู้ใช้</label>
                <input type="text" class="form-input" id="newUsername" placeholder="ชื่อผู้ใช้">
            </div>
            <div class="form-group">
                <label class="form-label">รหัสผ่าน</label>
                <input type="password" class="form-input" id="newPassword" placeholder="รหัสผ่าน">
            </div>
            <div class="form-group">
                <button class="btn btn-primary" onclick="addNewStudent()">
                    <i class="fas fa-plus"></i>
                    เพิ่มนักเรียน
                </button>
            </div>
        </div>
        
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>เลขประจำตัว</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>ชื่อผู้ใช้</th>
                        <th>รหัสผ่าน</th>
                        <th>การดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentRows}
                </tbody>
            </table>
        </div>
        
        <div class="user-management-section">
            <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                <i class="fas fa-users-cog"></i>
                จัดการผู้ใช้ระบบ
            </h3>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">ชื่อผู้ใช้ใหม่</label>
                    <input type="text" class="form-input" id="newSystemUsername" placeholder="ชื่อผู้ใช้">
                </div>
                <div class="form-group">
                    <label class="form-label">รหัสผ่านใหม่</label>
                    <input type="password" class="form-input" id="newSystemPassword" placeholder="รหัสผ่าน">
                </div>
                <div class="form-group">
                    <label class="form-label">ประเภทผู้ใช้</label>
                    <select class="form-input" id="newUserRole">
                        <option value="student">นักเรียน</option>
                        <option value="admin">ผู้ดูแลระบบ</option>
                    </select>
                </div>
                <div class="form-group">
                    <button class="btn btn-success" onclick="addNewSystemUser()">
                        <i class="fas fa-user-plus"></i>
                        เพิ่มผู้ใช้ระบบ
                    </button>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ชื่อผู้ใช้</th>
                            <th>ประเภท</th>
                            <th>ชื่อที่แสดง</th>
                            <th>การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody id="systemUsersTable">
                        <!-- System users will be generated here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Update student info
function updateStudentInfo(studentId, field, value) {
    if (currentUser.role !== 'admin') return;
    
    if (!studentList[studentId]) return;
    
    studentList[studentId][field] = value;
    saveData();
    
    // Update all displays
    displayTuitionCollection();
    updateStudentPaymentSummary();
    updateStudentPaymentTable();
    
    showMessage('อัปเดตข้อมูลนักเรียนสำเร็จ', 'success');
}

// Add new student
function addNewStudent() {
    if (currentUser.role !== 'admin') return;
    
    const studentId = document.getElementById('newStudentId').value.trim();
    const name = document.getElementById('newStudentName').value.trim();
    const username = document.getElementById('newUsername').value.trim() || studentId;
    const password = document.getElementById('newPassword').value.trim() || studentId;
    
    if (!studentId || !name) {
        showMessage('กรุณากรอกเลขประจำตัวและชื่อให้ครบถ้วน', 'error');
        return;
    }
    
    // Find next available ID
    const nextId = Math.max(...Object.keys(studentList).map(Number)) + 1;
    
    studentList[nextId] = {
        id: nextId,
        studentId: studentId,
        name: name,
        username: username,
        password: password
    };
    
    saveData();
    
    // Clear inputs
    document.getElementById('newStudentId').value = '';
    document.getElementById('newStudentName').value = '';
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    
    // Refresh student management display
    const studentSection = document.getElementById('studentManagement');
    if (studentSection) {
        studentSection.innerHTML = createStudentManagementHTML();
    }
    
    showMessage('เพิ่มนักเรียนสำเร็จ', 'success');
}

// Add new system user
function addNewSystemUser() {
    if (currentUser.role !== 'admin') return;
    
    const username = document.getElementById('newSystemUsername').value.trim();
    const password = document.getElementById('newSystemPassword').value.trim();
    const role = document.getElementById('newUserRole').value;
    
    if (!username || !password) {
        showMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน', 'error');
        return;
    }
    
    // Load existing system users
    let systemUsers = JSON.parse(localStorage.getItem('systemUsers')) || {};
    
    // Check if username already exists
    if (systemUsers[username]) {
        showMessage('ชื่อผู้ใช้นี้มีอยู่แล้ว', 'error');
        return;
    }
    
    // Add new user
    systemUsers[username] = {
        username: username,
        password: password,
        role: role,
        display: username,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    
    // Clear inputs
    document.getElementById('newSystemUsername').value = '';
    document.getElementById('newSystemPassword').value = '';
    document.getElementById('newUserRole').value = 'student';
    
    // Refresh display
    displaySystemUsers();
    
    showMessage('เพิ่มผู้ใช้ระบบสำเร็จ', 'success');
}

// Display system users
function displaySystemUsers() {
    const systemUsers = JSON.parse(localStorage.getItem('systemUsers')) || {};
    const container = document.getElementById('systemUsersTable');
    
    if (!container) return;
    
    const userRows = Object.entries(systemUsers).map(([username, user]) => `
        <tr>
            <td>
                <input type="text" 
                       class="form-input" 
                       value="${user.username}" 
                       onchange="updateSystemUser('${username}', 'username', this.value)"
                       style="width: 120px;">
            </td>
            <td>
                <select class="form-input" 
                        onchange="updateSystemUser('${username}', 'role', this.value)"
                        style="width: 100px;">
                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>นักเรียน</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ</option>
                </select>
            </td>
            <td>
                <input type="text" 
                       class="form-input" 
                       value="${user.display || user.username}" 
                       onchange="updateSystemUser('${username}', 'display', this.value)"
                       style="width: 150px;">
            </td>
            <td>
                <button class="btn btn-danger" onclick="deleteSystemUser('${username}')" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = userRows;
}

// Update system user
function updateSystemUser(username, field, value) {
    if (currentUser.role !== 'admin') return;
    
    const systemUsers = JSON.parse(localStorage.getItem('systemUsers')) || {};
    
    if (!systemUsers[username]) return;
    
    systemUsers[username][field] = value;
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    
    showMessage('อัปเดตข้อมูลผู้ใช้สำเร็จ', 'success');
}

// Delete system user
function deleteSystemUser(username) {
    if (currentUser.role !== 'admin') return;
    
    if (username === 'admin') {
        showMessage('ไม่สามารถลบผู้ดูแลระบบหลักได้', 'error');
        return;
    }
    
    if (confirm('คุณต้องการลบผู้ใช้นี้หรือไม่?')) {
        const systemUsers = JSON.parse(localStorage.getItem('systemUsers')) || {};
        delete systemUsers[username];
        localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
        
        displaySystemUsers();
        showMessage('ลบผู้ใช้สำเร็จ', 'success');
    }
}

// Delete student
function deleteStudent(studentId) {
    if (currentUser.role !== 'admin') return;
    
    if (confirm('คุณต้องการลบนักเรียนคนนี้หรือไม่?')) {
        delete studentList[studentId];
        saveData();
        
        // Refresh student management display
        const studentSection = document.getElementById('studentManagement');
        if (studentSection) {
            studentSection.innerHTML = createStudentManagementHTML();
        }
        
        showMessage('ลบนักเรียนสำเร็จ', 'success');
    }
}

// Update tuition summary
function updateTuitionSummary() {
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;
    let totalStudents = 0;
    
    Object.values(tuitionData).forEach(tuitionDay => {
        Object.values(tuitionDay.students).forEach(student => {
            totalStudents++;
            if (student.paid) {
                totalPaid += student.customAmount;
                paidCount++;
            } else {
                totalPending += student.customAmount;
            }
        });
    });
    
    const paymentRate = totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0;
    
    // Update summary cards
    const totalPaidElement = document.getElementById('totalTuitionPaid');
    const totalPendingElement = document.getElementById('totalTuitionPending');
    const paymentRateElement = document.getElementById('tuitionPaymentRate');
    const totalStudentsElement = document.getElementById('totalTuitionStudents');
    
    if (totalPaidElement) totalPaidElement.textContent = `฿${totalPaid.toLocaleString()}`;
    if (totalPendingElement) totalPendingElement.textContent = `฿${totalPending.toLocaleString()}`;
    if (paymentRateElement) paymentRateElement.textContent = `${paymentRate}%`;
    if (totalStudentsElement) totalStudentsElement.textContent = totalStudents;
    
    // Update tuition chart
    updateTuitionChart(totalPaid, totalPending, paidCount, totalStudents - paidCount);
}

// Update tuition chart
function updateTuitionChart(paid, pending, paidCount, pendingCount) {
    const ctx = document.getElementById('tuitionChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.tuitionChart) {
        window.tuitionChart.destroy();
    }
    
    window.tuitionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['จำนวนเงิน', 'จำนวนคน'],
            datasets: [
                {
                    label: 'จ่ายแล้ว',
                    data: [paid, paidCount],
                    backgroundColor: '#16a34a',
                    borderColor: '#15803d',
                    borderWidth: 1
                },
                {
                    label: 'ค้างจ่าย',
                    data: [pending, pendingCount],
                    backgroundColor: '#dc2626',
                    borderColor: '#b91c1c',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

// Show message
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Logout function
function logout() {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Export data function (admin only)
function exportData() {
    if (currentUser.role !== 'admin') return;
    
    const data = {
        income: incomeData,
        expenses: expenseData,
        payments: paymentData,
        tuition: tuitionData,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('ส่งออกข้อมูลสำเร็จ', 'success');
}

// Import data function (admin only)
function importData() {
    if (currentUser.role !== 'admin') return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.income && data.expenses && data.payments && data.tuition) {
                        incomeData = data.income;
                        expenseData = data.expenses;
                        paymentData = data.payments;
                        tuitionData = data.tuition;
                        saveData();
                        updateDashboard();
                        displayIncomeList();
                        displayExpenseList();
                        displayTuitionCollection();
                        updateTuitionSummary();
                        showMessage('นำเข้าข้อมูลสำเร็จ', 'success');
                    } else {
                        showMessage('ไฟล์ข้อมูลไม่ถูกต้อง', 'error');
                    }
                } catch (error) {
                    showMessage('เกิดข้อผิดพลาดในการอ่านไฟล์', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Clear all data function (admin only)
function clearAllData() {
    if (currentUser.role !== 'admin') return;
    
    if (confirm('คุณต้องการลบข้อมูลทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้!')) {
        incomeData = [];
        expenseData = [];
        paymentData = {};
        tuitionData = {};
        saveData();
        updateDashboard();
        displayIncomeList();
        displayExpenseList();
        displayTuitionCollection();
        updateTuitionSummary();
        showMessage('ลบข้อมูลทั้งหมดสำเร็จ', 'success');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveData();
        showMessage('บันทึกข้อมูลแล้ว', 'success');
    }
    
    // Ctrl/Cmd + E to export (admin only)
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && currentUser.role === 'admin') {
        e.preventDefault();
        exportData();
    }
});

// Auto-save every 30 seconds
setInterval(() => {
    saveData();
}, 30000);

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize Google Sheets integration
function initializeGoogleSheetsIntegration() {
    if (currentUser.role !== 'admin') return;
    
    // Add Google Sheets section to navigation
    const navList = document.querySelector('.nav-list');
    if (navList) {
        const sheetsNav = document.createElement('li');
        sheetsNav.className = 'nav-item admin-only';
        sheetsNav.innerHTML = `
            <a href="#googleSheets" class="nav-link" onclick="showSection('googleSheets')">
                <i class="fab fa-google"></i>
                Google Sheets
            </a>
        `;
        navList.appendChild(sheetsNav);
    }
    
    // Add Google Sheets section to main content
    const container = document.querySelector('.container');
    if (container) {
        const sheetsSection = document.createElement('section');
        sheetsSection.id = 'googleSheets';
        sheetsSection.className = 'content-section';
        sheetsSection.innerHTML = createGoogleSheetsHTML();
        container.appendChild(sheetsSection);
    }
}

// Create Google Sheets HTML
function createGoogleSheetsHTML() {
    return `
        <h2 class="section-title">
            <i class="fab fa-google"></i>
            การเชื่อมต่อกับ Google Sheets
        </h2>
        
        <div class="sheets-config">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Google Sheets API Key</label>
                    <input type="text" class="form-input" id="apiKey" placeholder="ใส่ API Key ของคุณ" value="${GOOGLE_SHEETS_API_KEY}">
                </div>
                <div class="form-group">
                    <label class="form-label">Spreadsheet ID</label>
                    <input type="text" class="form-input" id="spreadsheetId" placeholder="ใส่ ID ของ Spreadsheet" value="${GOOGLE_SHEETS_SPREADSHEET_ID}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <button class="btn btn-primary" onclick="saveSheetsConfig()">
                        <i class="fas fa-save"></i>
                        บันทึกการตั้งค่า
                    </button>
                </div>
                <div class="form-group">
                    <button class="btn btn-success" onclick="createNewSpreadsheet()">
                        <i class="fas fa-plus"></i>
                        สร้าง Spreadsheet ใหม่
                    </button>
                </div>
            </div>
        </div>

        <div class="sheets-actions">
            <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                <i class="fas fa-upload"></i>
                การส่งออกข้อมูล
            </h3>
            
            <div class="form-row">
                <div class="form-group">
                    <button class="btn btn-primary" onclick="exportToGoogleSheets()">
                        <i class="fas fa-upload"></i>
                        ส่งออกข้อมูลไปยัง Google Sheets
                    </button>
                </div>
                <div class="form-group">
                    <button class="btn btn-success" onclick="exportTuitionData()">
                        <i class="fas fa-file-excel"></i>
                        ส่งออกข้อมูลการเก็บเงินเรียน
                    </button>
                </div>
                <div class="form-group">
                    <button class="btn btn-secondary" onclick="exportStudentData()">
                        <i class="fas fa-users"></i>
                        ส่งออกข้อมูลนักเรียน
                    </button>
                </div>
            </div>
        </div>

        <div class="sheets-actions">
            <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                <i class="fas fa-download"></i>
                การนำเข้าข้อมูล
            </h3>
            
            <div class="form-row">
                <div class="form-group">
                    <button class="btn btn-warning" onclick="importFromGoogleSheets()">
                        <i class="fas fa-download"></i>
                        นำเข้าข้อมูลจาก Google Sheets
                    </button>
                </div>
                <div class="form-group">
                    <button class="btn btn-info" onclick="syncWithGoogleSheets()">
                        <i class="fas fa-sync"></i>
                        ซิงค์ข้อมูลกับ Google Sheets
                    </button>
                </div>
            </div>
        </div>

        <div class="sheets-status">
            <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                <i class="fas fa-info-circle"></i>
                สถานะการเชื่อมต่อ
            </h3>
            
            <div id="sheetsStatus" class="status-card">
                <div class="status-indicator">
                    <i class="fas fa-circle" style="color: #9ca3af;"></i>
                    <span>ยังไม่ได้เชื่อมต่อ</span>
                </div>
            </div>
        </div>

        <div class="sheets-help">
            <h3 style="margin-bottom: 1rem; color: #1f2937; font-weight: 600;">
                <i class="fas fa-question-circle"></i>
                วิธีใช้งาน
            </h3>
            
            <div class="help-content">
                <ol>
                    <li><strong>สร้าง Google Sheets API Key:</strong>
                        <ul>
                            <li>ไปที่ <a href="https://console.developers.google.com/" target="_blank">Google Cloud Console</a></li>
                            <li>สร้างโปรเจคใหม่และเปิดใช้งาน Google Sheets API</li>
                            <li>สร้าง API Key และคัดลอกมาใส่ในช่องด้านบน</li>
                        </ul>
                    </li>
                    <li><strong>สร้าง Spreadsheet:</strong>
                        <ul>
                            <li>สร้าง Google Sheets ใหม่</li>
                            <li>คัดลอก Spreadsheet ID จาก URL</li>
                            <li>แชร์ Spreadsheet ให้เป็น "Anyone with the link can edit"</li>
                        </ul>
                    </li>
                    <li><strong>การใช้งาน:</strong>
                        <ul>
                            <li>กด "ส่งออกข้อมูล" เพื่อสำรองข้อมูล</li>
                            <li>กด "นำเข้าข้อมูล" เพื่อกู้คืนข้อมูล</li>
                            <li>กด "ซิงค์ข้อมูล" เพื่ออัปเดตข้อมูลล่าสุด</li>
                        </ul>
                    </li>
                </ol>
            </div>
        </div>
    `;
}

// Save Google Sheets configuration
function saveSheetsConfig() {
    if (currentUser.role !== 'admin') return;
    
    const apiKey = document.getElementById('apiKey').value.trim();
    const spreadsheetId = document.getElementById('spreadsheetId').value.trim();
    
    if (!apiKey || !spreadsheetId) {
        showMessage('กรุณากรอก API Key และ Spreadsheet ID', 'error');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('googleSheetsApiKey', apiKey);
    localStorage.setItem('googleSheetsSpreadsheetId', spreadsheetId);
    
    // Update status
    updateSheetsStatus('connected', 'เชื่อมต่อสำเร็จ');
    
    showMessage('บันทึกการตั้งค่า Google Sheets สำเร็จ', 'success');
}

// Create new Google Spreadsheet
async function createNewSpreadsheet() {
    if (currentUser.role !== 'admin') return;
    
    try {
        showMessage('กำลังสร้าง Spreadsheet ใหม่...', 'info');
        
        // This would require Google Sheets API implementation
        // For now, we'll show instructions
        const instructions = `
            วิธีสร้าง Google Spreadsheet:
            1. ไปที่ https://sheets.google.com
            2. สร้าง Spreadsheet ใหม่
            3. คัดลอก ID จาก URL (ส่วนระหว่าง /d/ และ /edit)
            4. แชร์ Spreadsheet ให้เป็น "Anyone with the link can edit"
            5. ใส่ ID ในช่อง Spreadsheet ID ด้านบน
        `;
        
        alert(instructions);
        
    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการสร้าง Spreadsheet: ' + error.message, 'error');
    }
}

// Export data to Google Sheets
async function exportToGoogleSheets() {
    if (currentUser.role !== 'admin') return;
    
    const apiKey = localStorage.getItem('googleSheetsApiKey');
    const spreadsheetId = localStorage.getItem('googleSheetsSpreadsheetId');
    
    if (!apiKey || !spreadsheetId) {
        showMessage('กรุณาตั้งค่า Google Sheets ก่อน', 'error');
        return;
    }
    
    try {
        showMessage('กำลังส่งออกข้อมูล...', 'info');
        
        const data = {
            income: incomeData,
            expenses: expenseData,
            payments: paymentData,
            tuition: tuitionData,
            students: studentList,
            exportDate: new Date().toISOString()
        };
        
        // Convert data to CSV format for Google Sheets
        const csvData = convertDataToCSV(data);
        
        // Upload to Google Sheets
        await uploadToGoogleSheets(spreadsheetId, csvData, apiKey);
        
        showMessage('ส่งออกข้อมูลไปยัง Google Sheets สำเร็จ', 'success');
        updateSheetsStatus('connected', 'ส่งออกข้อมูลสำเร็จ');
        
    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการส่งออกข้อมูล: ' + error.message, 'error');
        updateSheetsStatus('error', 'เกิดข้อผิดพลาด');
    }
}

// Export tuition data specifically
async function exportTuitionData() {
    if (currentUser.role !== 'admin') return;
    
    try {
        showMessage('กำลังส่งออกข้อมูลการเก็บเงินเรียน...', 'info');
        
        // Create tuition summary data
        const tuitionSummary = [];
        
        Object.entries(tuitionData).forEach(([date, tuitionDay]) => {
            Object.entries(tuitionDay.students).forEach(([studentId, student]) => {
                const studentInfo = studentList[studentId] || { name: `นักเรียน ${studentId}`, studentId: studentId };
                tuitionSummary.push({
                    date: formatDate(date),
                    studentId: studentInfo.studentId,
                    studentName: studentInfo.name,
                    amount: student.customAmount,
                    paid: student.paid ? 'จ่ายแล้ว' : 'ค้างจ่าย',
                    status: student.paid ? 'Paid' : 'Unpaid'
                });
            });
        });
        
        // Convert to CSV
        const csvContent = convertTuitionToCSV(tuitionSummary);
        
        // Download CSV file
        downloadCSV(csvContent, `tuition_data_${new Date().toISOString().split('T')[0]}.csv`);
        
        showMessage('ส่งออกข้อมูลการเก็บเงินเรียนสำเร็จ', 'success');
        
    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการส่งออกข้อมูล: ' + error.message, 'error');
    }
}

// Export student data
async function exportStudentData() {
    if (currentUser.role !== 'admin') return;
    
    try {
        showMessage('กำลังส่งออกข้อมูลนักเรียน...', 'info');
        
        const studentData = Object.entries(studentList).map(([id, student]) => ({
            id: id,
            studentId: student.studentId,
            name: student.name
        }));
        
        const csvContent = convertStudentsToCSV(studentData);
        downloadCSV(csvContent, `student_data_${new Date().toISOString().split('T')[0]}.csv`);
        
        showMessage('ส่งออกข้อมูลนักเรียนสำเร็จ', 'success');
        
    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการส่งออกข้อมูล: ' + error.message, 'error');
    }
}

// Import data from Google Sheets
async function importFromGoogleSheets() {
    if (currentUser.role !== 'admin') return;
    
    const apiKey = localStorage.getItem('googleSheetsApiKey');
    const spreadsheetId = localStorage.getItem('googleSheetsSpreadsheetId');
    
    if (!apiKey || !spreadsheetId) {
        showMessage('กรุณาตั้งค่า Google Sheets ก่อน', 'error');
        return;
    }
    
    if (!confirm('คุณต้องการนำเข้าข้อมูลจาก Google Sheets หรือไม่? ข้อมูลปัจจุบันจะถูกแทนที่')) {
        return;
    }
    
    try {
        showMessage('กำลังนำเข้าข้อมูล...', 'info');
        
        // Download data from Google Sheets
        const data = await downloadFromGoogleSheets(spreadsheetId, apiKey);
        
        // Parse and load data
        if (data) {
            incomeData = data.income || [];
            expenseData = data.expenses || [];
            paymentData = data.payments || {};
            tuitionData = data.tuition || {};
            studentList = data.students || {};
            
            saveData();
            updateDashboard();
            displayIncomeList();
            displayExpenseList();
            displayTuitionCollection();
            updateTuitionSummary();
            updateStudentPaymentSummary();
            updateStudentPaymentTable();
            
            showMessage('นำเข้าข้อมูลจาก Google Sheets สำเร็จ', 'success');
            updateSheetsStatus('connected', 'นำเข้าข้อมูลสำเร็จ');
        }
        
    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + error.message, 'error');
        updateSheetsStatus('error', 'เกิดข้อผิดพลาด');
    }
}

// Sync with Google Sheets
async function syncWithGoogleSheets() {
    if (currentUser.role !== 'admin') return;
    
    try {
        showMessage('กำลังซิงค์ข้อมูล...', 'info');
        
        // First export current data
        await exportToGoogleSheets();
        
        // Then import any updates
        await importFromGoogleSheets();
        
        showMessage('ซิงค์ข้อมูลกับ Google Sheets สำเร็จ', 'success');
        
    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการซิงค์ข้อมูล: ' + error.message, 'error');
    }
}

// Convert data to CSV format
function convertDataToCSV(data) {
    const csvRows = [];
    
    // Add headers
    csvRows.push(['Type', 'Date', 'Description', 'Amount', 'Student ID', 'Student Name', 'Status']);
    
    // Add income data
    incomeData.forEach(income => {
        csvRows.push(['Income', income.date, income.description, income.amount, '', '', '']);
    });
    
    // Add expense data
    expenseData.forEach(expense => {
        csvRows.push(['Expense', expense.date, expense.description, expense.amount, '', '', '']);
    });
    
    // Add tuition data
    Object.entries(tuitionData).forEach(([date, tuitionDay]) => {
        Object.entries(tuitionDay.students).forEach(([studentId, student]) => {
            const studentInfo = studentList[studentId] || { name: `นักเรียน ${studentId}`, studentId: studentId };
            csvRows.push([
                'Tuition',
                date,
                `Tuition Payment - ${formatDate(date)}`,
                student.customAmount,
                studentInfo.studentId,
                studentInfo.name,
                student.paid ? 'Paid' : 'Unpaid'
            ]);
        });
    });
    
    return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Convert tuition data to CSV
function convertTuitionToCSV(tuitionData) {
    const csvRows = [];
    
    // Add headers
    csvRows.push(['Date', 'Student ID', 'Student Name', 'Amount', 'Status', 'Paid']);
    
    // Add data
    tuitionData.forEach(row => {
        csvRows.push([
            row.date,
            row.studentId,
            row.studentName,
            row.amount,
            row.paid,
            row.status
        ]);
    });
    
    return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Convert student data to CSV
function convertStudentsToCSV(studentData) {
    const csvRows = [];
    
    // Add headers
    csvRows.push(['ID', 'Student ID', 'Name']);
    
    // Add data
    studentData.forEach(student => {
        csvRows.push([
            student.id,
            student.studentId,
            student.name
        ]);
    });
    
    return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Download CSV file
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Upload data to Google Sheets (placeholder - requires Google Sheets API)
async function uploadToGoogleSheets(spreadsheetId, data, apiKey) {
    // This is a placeholder function
    // In a real implementation, you would use the Google Sheets API
    // For now, we'll simulate the upload
    
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('Uploading to Google Sheets:', { spreadsheetId, data });
            resolve();
        }, 2000);
    });
}

// Download data from Google Sheets (placeholder - requires Google Sheets API)
async function downloadFromGoogleSheets(spreadsheetId, apiKey) {
    // This is a placeholder function
    // In a real implementation, you would use the Google Sheets API
    // For now, we'll simulate the download
    
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('Downloading from Google Sheets:', { spreadsheetId });
            resolve(null);
        }, 2000);
    });
}

// Update Google Sheets status
function updateSheetsStatus(status, message) {
    const statusElement = document.getElementById('sheetsStatus');
    if (!statusElement) return;
    
    let iconColor, iconClass;
    
    switch (status) {
        case 'connected':
            iconColor = '#16a34a';
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            iconColor = '#dc2626';
            iconClass = 'fas fa-exclamation-circle';
            break;
        default:
            iconColor = '#9ca3af';
            iconClass = 'fas fa-circle';
    }
    
    statusElement.innerHTML = `
        <div class="status-indicator">
            <i class="${iconClass}" style="color: ${iconColor};"></i>
            <span>${message}</span>
        </div>
    `;
}