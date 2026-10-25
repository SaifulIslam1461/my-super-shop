// Supabase Configuration
// TODO: আপনার Supabase প্রজেক্ট থেকে URL ও Anon Key এখানে বসান
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Initialize Supabase Client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper Functions for Data Fetching
async function fetchProductsFromDB() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: false });
        
        if (error) throw error;
        return data && data.length > 0 ? data : fallbackProducts;
    } catch (err) {
        console.warn('Using local fallback products due to DB error:', err.message);
        return fallbackProducts;
    }
}

async function fetchSettingsFromDB() {
    try {
        const { data } = await supabaseClient.from('store_settings').select('*');
        if (!data) return {};
        return data.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    } catch {
        return {};
    }
}

// Fallback Default Products (if DB is empty or offline)
const fallbackProducts = [
    {
        id: 1,
        name: "Rovix Vintage Executive Short Wallet",
        category: "short-wallet",
        price: 1450,
        original_price: 2050,
        rating: 4.9,
        reviews: 128,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
        badge: "BEST SELLER",
        description: "১০০% প্রিমিয়াম কাউহাইড জেনুইন লেদার। ১২টি কার্ড স্লট, ২ টি ক্যাশ চেম্বার এবং ১টি জিওমেট্রিক কয়েন পকেট।",
        stock: 25,
        is_active: true
    },
    {
        id: 2,
        name: "Samson Metal Chain Short Wallet Black",
        category: "short-wallet",
        price: 1290,
        original_price: 1800,
        rating: 4.8,
        reviews: 95,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        badge: "POPULAR",
        description: "অরিজিনাল লেদারের সাথে মেটালিক ডিটেইলিং। আধুনিক ট্রাভেলার ও মেটাল প্রেমীদের জন্য।",
        stock: 18,
        is_active: true
    },
    {
        id: 3,
        name: "Executive Long Passport & Mobile Wallet",
        category: "long-wallet",
        price: 1850,
        original_price: 2500,
        rating: 4.9,
        reviews: 210,
        image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=600&q=80",
        badge: "PREMIUM",
        description: "মোবাইল ফোন, পাসপোর্ট, চেকবুক ও নগদ টাকা একসঙ্গে রাখার প্রিমিয়াম লং ওয়ালেট।",
        stock: 15,
        is_active: true
    },
    {
        id: 4,
        name: "Minimalist Pop-Up Leather Card Holder",
        category: "card-holder",
        price: 850,
        original_price: 1200,
        rating: 4.7,
        reviews: 84,
        image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80",
        badge: "NEW",
        description: "অ্যালুমিনিয়াম পপ-আপ কেস ও বাইরে চামড়ার ফিনিশিং। RFID ব্লক প্রযুক্তি সহ।",
        stock: 30,
        is_active: true
    },
    {
        id: 5,
        name: "Rovix Handcrafted Formal Oxford Shoes",
        category: "shoes",
        price: 3450,
        original_price: 4800,
        rating: 5.0,
        reviews: 67,
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80",
        badge: "HOT DEAL",
        description: "সম্পূর্ণ হাতে সেলাই করা অরিজিনাল চামড়ার ফর্মাল জুতা। দীর্ঘস্থায়ী সোল ও আরামদায়ক ইনসোল।",
        stock: 10,
        is_active: true
    },
    {
        id: 6,
        name: "Classic Italian Genuine Leather Belt",
        category: "accessories",
        price: 1150,
        original_price: 1600,
        rating: 4.8,
        reviews: 142,
        image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80",
        badge: "BESTSELLER",
        description: "ইম্পোর্টেড মেটাল বাকল সহ ১০০% খাঁটি চামড়ার বেল্ট। ২ বছরের চামড়ার গ্যারান্টি।",
        stock: 22,
        is_active: true
    }
];
