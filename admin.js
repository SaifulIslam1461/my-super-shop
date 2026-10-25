// Admin Panel Core Logic
let adminProducts = [];
let adminOrders = [];

window.onload = async function() {
    // Check Supabase Auth Session
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
    loadDashboardData();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('bg-leather-800', 'text-gold-400'));
    
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // Close sidebar on mobile after click
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar.classList.contains('-translate-x-full')) {
        toggleMobileSidebar();
    }
    
    const titles = {
        'dashboard': 'ড্যাশবোর্ড ওভারভিউ',
        'products': 'পণ্য ব্যবস্থাপনা',
        'orders': 'অর্ডার ম্যানেজমেন্ট',
        'inventory': 'ইনভেন্টরি স্টক',
        'settings': 'ওয়েবসাইট সেটিংস'
    };
    document.getElementById('pageTitle').innerText = titles[tabName] || 'অ্যাডমিন প্যানেল';
}

async function loadDashboardData() {
    // Fetch Products
    const { data: prods } = await supabaseClient.from('products').select('*');
    adminProducts = prods || [];

    // Fetch Orders
    const { data: ords } = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
    adminOrders = ords || [];

    // Calculate Stats
    const totalSales = adminOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
    const pendingOrders = adminOrders.filter(o => o.status === 'Pending').length;

    document.getElementById('statTotalSales').innerText = `৳${totalSales.toLocaleString()}`;
    document.getElementById('statTotalOrders').innerText = adminOrders.length;
    document.getElementById('statPendingOrders').innerText = pendingOrders;
    document.getElementById('statTotalProducts').innerText = adminProducts.length;

    renderAdminProducts();
    renderAdminOrders();
    renderAdminInventory();
}

function renderAdminProducts() {
    const tbody = document.getElementById('adminProductTableBody');
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

function openProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('productModalTitle').innerText = 'নতুন পণ্য যোগ করুন';
    document.getElementById('productModal').classList.remove('hidden');
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('prodName').value;
    const category = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const original_price = parseFloat(document.getElementById('prodOrigPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value);
    const image = document.getElementById('prodImage').value;
    const description = document.getElementById('prodDesc').value;

    const payload = { name, category, price, original_price, stock, image, description };

    if(id) {
        await supabaseClient.from('products').update(payload).eq('id', id);
    } else {
        await supabaseClient.from('products').insert([payload]);
    }

    closeModal('productModal');
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
    document.getElementById('prodDesc').value = p.description || '';
    document.getElementById('productModalTitle').innerText = 'পণ্য সম্পাদনা করুন';
    document.getElementById('productModal').classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}
