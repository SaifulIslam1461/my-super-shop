let adminProducts = [];
let adminOrders = [];
let adminExpenses = [];
let adminCategories = [];
let salesChartInstance = null;
let uploadedImagesArray = [];

window.onload = async function() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(session) {
        showDashboard(session.user.email);
    }
};

function toggleMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error) {
        alert('লগইন ব্যর্থ হয়েছে: ' + error.message);
        return;
    }
    showDashboard(data.user.email);
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    document.getElementById('dashboardApp').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
}

function showDashboard(email) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardApp').classList.remove('hidden');
    document.getElementById('adminUserEmail').innerText = email;
    if(document.getElementById('permEmail')) {
        document.getElementById('permEmail').innerText = email;
    }
    loadDashboardData();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('bg-leather-800', 'text-gold-400'));
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if(targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar.classList.contains('-translate-x-full')) {
        toggleMobileSidebar();
    }
    
    const titles = {
        'dashboard': 'ড্যাশবোর্ড ওভারভিউ',
        'products': 'পণ্য ব্যবস্থাপনা',
        'categories': 'ক্যাটাগরি ম্যানেজমেন্ট',
        'orders': 'অর্ডার ম্যানেজমেন্ট',
        'customers': 'কাস্টমার তালিকা',
        'inventory': 'ইনভেন্টরি স্টক',
        'coupons': 'কুপন ও অফার',
        'payments': 'পেমেন্ট ট্র্যাকিং',
        'courier': 'কুরিয়ার ও শিপিং',
        'expenses': 'খরচ রেজিস্টার',
        'reports': 'সেলস রিপোর্টস',
        'content': 'ওয়েবসাইট কনটেন্ট আপডেট',
        'notifications': 'নোটিফিকেশন',
        'seo': 'SEO সেটিংস',
        'permissions': 'অ্যাডমিন পারমিশন',
        'settings': 'জেনারেল সেটিংস',
        'backup': 'ডাটাবেস ব্যাকআপ'
    };
    document.getElementById('pageTitle').innerText = titles[tabName] || 'অ্যাডমিন প্যানেল';
}

async function loadDashboardData() {
    // 1. Fetch Categories
    try {
        const { data: cats } = await supabaseClient.from('categories').select('*');
        adminCategories = cats && cats.length > 0 ? cats : [
            { id: 1, name: 'Short Wallet', slug: 'short-wallet' },
            { id: 2, name: 'Long Wallet', slug: 'long-wallet' },
            { id: 3, name: 'Card Holder', slug: 'card-holder' },
            { id: 4, name: 'Shoes', slug: 'shoes' },
            { id: 5, name: 'Accessories', slug: 'accessories' }
        ];
    } catch {
        adminCategories = [
            { id: 1, name: 'Short Wallet', slug: 'short-wallet' },
            { id: 2, name: 'Long Wallet', slug: 'long-wallet' },
            { id: 3, name: 'Card Holder', slug: 'card-holder' },
            { id: 4, name: 'Shoes', slug: 'shoes' },
            { id: 5, name: 'Accessories', slug: 'accessories' }
        ];
    }
    renderCategoriesManagement();
    populateCategoryDropdowns();

    // 2. Fetch Products
    const { data: prods } = await supabaseClient.from('products').select('*');
    adminProducts = prods || [];

    // 3. Fetch Orders
    const { data: ords } = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
    adminOrders = ords || [];

    // 4. Fetch Expenses
    try {
        const { data: exps } = await supabaseClient.from('expenses').select('*').order('created_at', { ascending: false });
        adminExpenses = exps || [];
    } catch {
        adminExpenses = [];
    }

    // 5. Fetch Settings / Content & Auto-sync global links
    try {
        const { data: sets } = await supabaseClient.from('store_settings').select('*');
        if(sets) {
            const setObj = {};
            sets.forEach(s => setObj[s.key] = s.value);
            if(document.getElementById('contentAnnouncement')) document.getElementById('contentAnnouncement').value = setObj.announcement || '';
            if(document.getElementById('contentBrandName')) document.getElementById('contentBrandName').value = setObj.brand_name || '';
            if(document.getElementById('contentPhone')) document.getElementById('contentPhone').value = setObj.phone || '';

            if(document.getElementById('settingBrand')) document.getElementById('settingBrand').value = setObj.brand_name || '';
            if(document.getElementById('settingPhone')) document.getElementById('settingPhone').value = setObj.phone || '';
            if(document.getElementById('settingWhatsapp')) document.getElementById('settingWhatsapp').value = setObj.whatsapp || '';
            if(document.getElementById('settingFacebook')) document.getElementById('settingFacebook').value = setObj.facebook || '';
            if(document.getElementById('settingYoutube')) document.getElementById('settingYoutube').value = setObj.youtube || '';
            if(document.getElementById('settingLocation')) document.getElementById('settingLocation').value = setObj.location || '';
        }
    } catch {}

    // Calculations
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = adminOrders
        .filter(o => o.created_at && o.created_at.startsWith(todayStr))
        .reduce((sum, o) => sum + (o.grand_total || 0), 0);

    const totalSales = adminOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
    const pendingOrders = adminOrders.filter(o => o.status === 'Pending').length;
    const processingOrders = adminOrders.filter(o => o.status === 'Processing' || o.status === 'Confirmed').length;
    const deliveredOrders = adminOrders.filter(o => o.status === 'Delivered').length;
    const lowStockCount = adminProducts.filter(p => (p.stock || 0) <= 5).length;

    const totalExpenses = adminExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const estProfit = Math.max(0, totalSales - totalExpenses);

    const pendingCOD = adminOrders
        .filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled')
        .reduce((sum, o) => sum + (o.grand_total || 0), 0);

    // Update Dashboard Metrics UI
    document.getElementById('statTodaySales').innerText = `৳${todaySales.toLocaleString()}`;
    document.getElementById('statTotalSales').innerText = `৳${totalSales.toLocaleString()}`;
    document.getElementById('statTotalOrders').innerText = adminOrders.length;
    document.getElementById('statPendingOrders').innerText = pendingOrders;
    document.getElementById('statProcessingOrders').innerText = processingOrders;
    document.getElementById('statDeliveredOrders').innerText = deliveredOrders;
    document.getElementById('statTotalProducts').innerText = adminProducts.length;
    document.getElementById('statLowStock').innerText = lowStockCount;
    document.getElementById('statTotalExpenses').innerText = `৳${totalExpenses.toLocaleString()}`;
    document.getElementById('statEstProfit').innerText = `৳${estProfit.toLocaleString()}`;
    document.getElementById('statPendingCOD').innerText = `৳${pendingCOD.toLocaleString()}`;

    // Render Sub-tables & Components
    renderAdminProducts();
    renderAdminOrders();
    renderAdminInventory();
    renderRecentOrders();
    renderLowStockTable();
    renderCustomersTable();
    renderExpensesTable();
    renderSalesAnalyticsChart();
}

function renderCategoriesManagement() {
    const container = document.getElementById('categoryListContainer');
    if(!container) return;
    container.innerHTML = adminCategories.map(c => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border text-xs">
            <div>
                <span class="font-bold text-gray-800 text-sm">${c.name}</span>
                <p class="text-[10px] text-gray-500">Slug: ${c.slug}</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">সক্রিয়</span>
                <button onclick="deleteCategory(${c.id})" class="bg-red-100 text-red-600 hover:bg-red-600 hover:text-white w-7 h-7 rounded-lg flex items-center justify-center transition" title="ডিলিট করুন">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function addNewCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const name = nameInput.value.trim();
    if(!name) {
        alert('দয়া করে ক্যাটাগরির নাম লিখুন!');
        return;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
        const { error } = await supabaseClient.from('categories').insert([{ name, slug }]);
        if(error) throw error;
        nameInput.value = '';
        loadDashboardData();
    } catch (err) {
        adminCategories.push({ id: Date.now(), name, slug });
        nameInput.value = '';
        renderCategoriesManagement();
        populateCategoryDropdowns();
    }
}

async function deleteCategory(id) {
    if(confirm('এই ক্যাটাগরি ডিলিট করতে চান?')) {
        try {
            await supabaseClient.from('categories').delete().eq('id', id);
        } catch {}
        adminCategories = adminCategories.filter(c => c.id !== id);
        renderCategoriesManagement();
        populateCategoryDropdowns();
    }
}

function populateCategoryDropdowns() {
    const select = document.getElementById('prodCategory');
    const filterSelect = document.getElementById('prodCatFilter');
    if(select) {
        select.innerHTML = adminCategories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
    }
    if(filterSelect) {
        filterSelect.innerHTML = `<option value="all">সকল ক্যাটাগরি</option>` + adminCategories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
    }
}

// Save Settings Function (Handles WhatsApp, Facebook, YouTube, Location properly for website sync)
async function saveSettings(e) {
    e.preventDefault();
    const brand_name = document.getElementById('settingBrand').value;
    const phone = document.getElementById('settingPhone').value;
    const whatsapp = document.getElementById('settingWhatsapp').value;
    const facebook = document.getElementById('settingFacebook').value;
    const youtube = document.getElementById('settingYoutube').value;
    const location = document.getElementById('settingLocation').value;

    const settings = [
        { key: 'brand_name', value: brand_name },
        { key: 'phone', value: phone },
        { key: 'whatsapp', value: whatsapp },
        { key: 'facebook', value: facebook },
        { key: 'youtube', value: youtube },
        { key: 'location', value: location }
    ];

    try {
        for(let s of settings) {
            await supabaseClient.from('store_settings').upsert({ key: s.key, value: s.value }, { onConflict: 'key' });
        }
        alert('সেটিংস ও সোশ্যাল লিংক সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err) {
        alert('সেটিংস সেভ করতে সমস্যা হয়েছে: ' + err.message);
    }
}

async function saveWebsiteContent(e) {
    e.preventDefault();
    const announcement = document.getElementById('contentAnnouncement').value;
    const brand_name = document.getElementById('contentBrandName').value;
    const phone = document.getElementById('contentPhone').value;

    const settings = [
        { key: 'announcement', value: announcement },
        { key: 'brand_name', value: brand_name },
        { key: 'phone', value: phone }
    ];

    try {
        for(let s of settings) {
            await supabaseClient.from('store_settings').upsert({ key: s.key, value: s.value }, { onConflict: 'key' });
        }
        alert('ওয়েবসাইট কনটেন্ট সফলভাবে আপডেট করা হয়েছে!');
    } catch (err) {
        alert('সেভ করতে সমস্যা হয়েছে: ' + err.message);
    }
}

function renderRecentOrders() {
    const tbody = document.getElementById('recentOrdersTableBody');
    if(!tbody) return;
    const top5 = adminOrders.slice(0, 5);
    if(top5.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-gray-400">কোন সাম্প্রতিক অর্ডার নেই</td></tr>`;
        return;
    }
    tbody.innerHTML = top5.map(o => `
        <tr class="border-b">
            <td class="p-2 font-bold text-leather-900">#${o.order_id}</td>
            <td class="p-2">${o.customer_name}</td>
            <td class="p-2 font-bold">৳${o.grand_total}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">${o.status}</span></td>
        </tr>
    `).join('');
}

function renderLowStockTable() {
    const tbody = document.getElementById('lowStockTableBody');
    if(!tbody) return;
    const lowProds = adminProducts.filter(p => (p.stock || 0) <= 5);
    if(lowProds.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-3 text-center text-gray-400">সকল পণ্যের স্টক পর্যাপ্ত রয়েছে</td></tr>`;
        return;
    }
    tbody.innerHTML = lowProds.map(p => `
        <tr class="border-b">
            <td class="p-2 font-bold truncate max-w-[120px]">${p.name}</td>
            <td class="p-2 font-bold text-red-600">${p.stock} টি</td>
            <td class="p-2 text-right"><button onclick="adjustStock(${p.id}, 10)" class="bg-gray-200 text-[10px] px-2 py-1 rounded font-bold">+১০</button></td>
        </tr>
    `).join('');
}

function renderSalesAnalyticsChart() {
    const ctx = document.getElementById('salesAnalyticsChart');
    if(!ctx) return;
    
    if(salesChartInstance) {
        salesChartInstance.destroy();
    }

    const labels = ['৬ দিন আগে', '৫ দিন আগে', '৪ দিন আগে', '৩ দিন আগে', 'পরশু', 'গতকাল', 'আজ'];
    const dataValues = [0, 0, 0, 0, 0, 0, 0];
    const totalSales = adminOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
    dataValues[6] = totalSales > 0 ? totalSales : 0;

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'বিক্রয় (৳)',
                data: dataValues,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                fill: true,
                tension: 0.3,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderAdminProducts() {
    const tbody = document.getElementById('adminProductTableBody');
    if(!tbody) return;
    tbody.innerHTML = adminProducts.map(p => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-3 flex items-center gap-2">
                <img src="${p.image}" class="w-8 h-8 object-cover rounded border shrink-0">
                <span class="font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">${p.name}</span>
            </td>
            <td class="p-3 font-semibold text-gray-600">${p.category}</td>
            <td class="p-3 font-bold text-gray-900">৳${p.price}</td>
            <td class="p-3 font-bold ${p.stock <= 5 ? 'text-red-600' : 'text-emerald-600'}">${p.stock} টি</td>
            <td class="p-3 text-right space-x-1">
                <button onclick="editProduct(${p.id})" class="text-blue-600 hover:text-blue-800 p-1"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteProduct(${p.id})" class="text-red-600 hover:text-red-800 p-1"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderAdminOrders() {
    const tbody = document.getElementById('adminOrderTableBody');
    if(!tbody) return;
    tbody.innerHTML = adminOrders.map(o => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-3 font-bold text-leather-900">#${o.order_id}</td>
            <td class="p-3">
                <p class="font-bold text-gray-900">${o.customer_name}</p>
                <p class="text-gray-500 text-[11px]">${o.customer_phone}</p>
            </td>
            <td class="p-3 font-black text-gray-900">৳${o.grand_total}</td>
            <td class="p-3">
                <select onchange="updateOrderStatus('${o.order_id}', this.value)" class="border rounded p-1 text-[11px] font-bold bg-white">
                    <option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option>
                    <option value="Confirmed" ${o.status==='Confirmed'?'selected':''}>Confirmed</option>
                    <option value="Processing" ${o.status==='Processing'?'selected':''}>Processing</option>
                    <option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option>
                    <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option>
                    <option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
                </select>
            </td>
            <td class="p-3 text-right">
                <a href="https://wa.me/88${o.customer_phone}" target="_blank" class="bg-green-500 text-white px-2 py-1 rounded text-[11px] font-bold"><i class="fa-brands fa-whatsapp"></i> Chat</a>
            </td>
        </tr>
    `).join('');
}

function renderAdminInventory() {
    const tbody = document.getElementById('adminInventoryTableBody');
    if(!tbody) return;
    tbody.innerHTML = adminProducts.map(p => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-3 font-bold text-gray-900 truncate max-w-[130px] sm:max-w-none">${p.name}</td>
            <td class="p-3 font-bold">${p.stock} টি</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">${p.stock <= 5 ? 'Low Stock' : 'In Stock'}</span></td>
            <td class="p-3 text-right">
                <button onclick="adjustStock(${p.id}, 5)" class="bg-gray-200 hover:bg-gray-300 text-[10px] font-bold px-2 py-1 rounded">+৫</button>
            </td>
        </tr>
    `).join('');
}

function renderCustomersTable() {
    const tbody = document.getElementById('adminCustomerTableBody');
    if(!tbody) return;
    const uniqueCust = [];
    const map = new Map();
    for (const o of adminOrders) {
        if(!map.has(o.customer_phone)){
            map.set(o.customer_phone, true);
            uniqueCust.push(o);
        }
    }
    document.getElementById('statTotalCustomers').innerText = uniqueCust.length;

    tbody.innerHTML = uniqueCust.map(c => `
        <tr class="border-b">
            <td class="p-3 font-bold">${c.customer_name}</td>
            <td class="p-3">${c.customer_phone}</td>
            <td class="p-3 text-xs text-gray-600 truncate max-w-[150px]">${c.customer_address}</td>
            <td class="p-3 font-bold">${adminOrders.filter(o => o.customer_phone === c.customer_phone).length} টি</td>
        </tr>
    `).join('');
}

function renderExpensesTable() {
    const tbody = document.getElementById('expenseTableBody');
    if(!tbody) return;
    tbody.innerHTML = adminExpenses.map(e => `
        <tr class="border-b">
            <td class="p-3 font-bold">${e.title}</td>
            <td class="p-3 text-xs">${e.category}</td>
            <td class="p-3 font-bold text-red-600">৳${e.amount}</td>
            <td class="p-3 text-xs text-gray-500">${e.expense_date || '-'}</td>
        </tr>
    `).join('');
}

function exportOrdersCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Name,Phone,Amount,Status\n";
    adminOrders.forEach(o => {
        csvContent += `${o.order_id},${o.customer_name},${o.customer_phone},${o.grand_total},${o.status}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ROVIX_Orders_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function updateOrderStatus(orderId, status) {
    const { error } = await supabaseClient.from('orders').update({ status }).eq('order_id', orderId);
    if(error) alert('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে'); else loadDashboardData();
}

async function adjustStock(productId, amount) {
    const prod = adminProducts.find(p => p.id === productId);
    const newStock = (prod.stock || 0) + amount;
    await supabaseClient.from('products').update({ stock: newStock }).eq('id', productId);
    loadDashboardData();
}

function handleImageSelection(e) {
    const files = e.target.files;
    uploadedImagesArray = [];
    const previewContainer = document.getElementById('imagePreviewContainer');
    previewContainer.innerHTML = '';

    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(uploadEvent) {
                const base64String = uploadEvent.target.result;
                uploadedImagesArray.push(base64String);

                const imgTag = document.createElement('img');
                imgTag.src = base64String;
                imgTag.className = "w-12 h-12 object-cover rounded border";
                previewContainer.appendChild(imgTag);

                if(i === 0) {
                    document.getElementById('prodImage').value = base64String;
                }
            };
            reader.readAsDataURL(file);
        }
    }
}

function openProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('imagePreviewContainer').innerHTML = '';
    document.getElementById('prodVideoUrl').value = '';
    uploadedImagesArray = [];
    document.getElementById('productModalTitle').innerText = 'নতুন পণ্য যোগ করুন';
    document.getElementById('productModal').classList.remove('hidden');
}

function openExpenseModal() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseModal').classList.remove('hidden');
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('prodName').value;
    const category = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const original_price = parseFloat(document.getElementById('prodOrigPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value);
    let image = document.getElementById('prodImage').value;
    const video_url = document.getElementById('prodVideoUrl').value;
    const description = document.getElementById('prodDesc').value;

    if(uploadedImagesArray.length > 0) {
        image = uploadedImagesArray[0];
    }

    const payload = { name, category, price, original_price, stock, image, video_url, description };

    if(id) {
        await supabaseClient.from('products').update(payload).eq('id', id);
    } else {
        await supabaseClient.from('products').insert([payload]);
    }

    closeModal('productModal');
    loadDashboardData();
}

async function saveExpense(e) {
    e.preventDefault();
    const title = document.getElementById('expTitle').value;
    const category = document.getElementById('expCategory').value;
    const amount = parseFloat(document.getElementById('expAmount').value);

    try {
        await supabaseClient.from('expenses').insert([{ title, category, amount }]);
    } catch {
        adminExpenses.push({ title, category, amount, expense_date: new Date().toISOString().split('T')[0] });
    }

    closeModal('expenseModal');
    loadDashboardData();
}

async function deleteProduct(id) {
   if(confirm('পণ্যটি ডিলিট করতে চান?')) {
       await supabaseClient.from('products').delete().eq('id', id);
       loadDashboardData();
   }
}

function editProduct(id) {
    const p = adminProducts.find(item => item.id === id);
    document.getElementById('editProductId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodOrigPrice').value = p.original_price;
    document.getElementById('prodStock').value = p.stock;
    document.getElementById('prodImage').value = p.image;
    document.getElementById('prodVideoUrl').value = p.video_url || '';
    document.getElementById('prodDesc').value = p.description || '';
    
    uploadedImagesArray = [];
    const previewContainer = document.getElementById('imagePreviewContainer');
    previewContainer.innerHTML = p.image ? `<img src="${p.image}" class="w-12 h-12 object-cover rounded border">` : '';

    document.getElementById('productModalTitle').innerText = 'পণ্য সম্পাদনা করুন';
    document.getElementById('productModal').classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function filterProductsTable() {
    const query = document.getElementById('prodSearchInput').value.toLowerCase();
    const cat = document.getElementById('prodCatFilter').value;
    const filtered = adminProducts.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(query);
        const matchesCat = cat === 'all' || p.category === cat;
        return matchesQuery && matchesCat;
    });
    const tbody = document.getElementById('adminProductTableBody');
    tbody.innerHTML = filtered.map(p => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-3 flex items-center gap-2">
                <img src="${p.image}" class="w-8 h-8 object-cover rounded border shrink-0">
                <span class="font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">${p.name}</span>
            </td>
            <td class="p-3 font-semibold text-gray-600">${p.category}</td>
            <td class="p-3 font-bold text-gray-900">৳${p.price}</td>
            <td class="p-3 font-bold ${p.stock <= 5 ? 'text-red-600' : 'text-emerald-600'}">${p.stock} টি</td>
            <td class="p-3 text-right space-x-1">
                <button onclick="editProduct(${p.id})" class="text-blue-600 hover:text-blue-800 p-1"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteProduct(${p.id})" class="text-red-600 hover:text-red-800 p-1"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function filterOrdersTable() {
    const query = document.getElementById('orderSearchInput').value.toLowerCase();
    const filtered = adminOrders.filter(o => 
        o.order_id.toLowerCase().includes(query) || 
        o.customer_phone.includes(query) ||
        o.customer_name.toLowerCase().includes(query)
    );
    const tbody = document.getElementById('adminOrderTableBody');
    tbody.innerHTML = filtered.map(o => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-3 font-bold text-leather-900">#${o.order_id}</td>
            <td class="p-3">
                <p class="font-bold text-gray-900">${o.customer_name}</p>
                <p class="text-gray-500 text-[11px]">${o.customer_phone}</p>
            </td>
            <td class="p-3 font-black text-gray-900">৳${o.grand_total}</td>
            <td class="p-3">
                <select onchange="updateOrderStatus('${o.order_id}', this.value)" class="border rounded p-1 text-[11px] font-bold bg-white">
                    <option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option>
                    <option value="Confirmed" ${o.status==='Confirmed'?'selected':''}>Confirmed</option>
                    <option value="Processing" ${o.status==='Processing'?'selected':''}>Processing</option>
                    <option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option>
                    <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option>
                    <option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
                </select>
            </td>
            <td class="p-3 text-right">
                <a href="https://wa.me/88${o.customer_phone}" target="_blank" class="bg-green-500 text-white px-2 py-1 rounded text-[11px] font-bold"><i class="fa-brands fa-whatsapp"></i> Chat</a>
            </td>
        </tr>
    `).join('');
}
