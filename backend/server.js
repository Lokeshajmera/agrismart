require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');
const { startEngine } = require('./mqttService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
};

const isAdmin = async (req, res, next) => {
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

    if (error || data.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    next();
};

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'Platform API is running', timestamp: new Date() });
});

// Authentication
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
        return res.status(400).json({ error: 'All fields (name, email, mobile, password) are required.' });
    }

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, phone: mobile }
            }
        });

        if (authError) throw authError;

        // 2. Generate Unique Farmer ID
        const firstName = name.split(' ')[0].toUpperCase();
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .ilike('name', `${firstName}%`);

        if (countError) throw countError;
        const farmer_id = `${firstName}${String((count || 0) + 1).padStart(3, '0')}`;

        // 3. Insert into public.users
        const { error: dbError } = await supabase
            .from('users')
            .insert([{
                id: authData.user.id,
                name,
                email,
                phone: mobile,
                farmer_id
            }]);

        if (dbError) throw dbError;

        res.status(201).json({ message: 'User created successfully', farmer_id });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// User Endpoints
app.get('/api/user', authenticateUser, async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.put('/api/user/update', authenticateUser, async (req, res) => {
    const updates = req.body;
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', req.user.id)
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Complaints
app.post('/api/complaint', authenticateUser, async (req, res) => {
    const { message, category } = req.body;
    const { data, error } = await supabase
        .from('complaints')
        .insert([{ user_id: req.user.id, message, category, status: 'pending' }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.get('/api/complaints', authenticateUser, async (req, res) => {
    const { data, error } = await supabase
        .from('complaints')
        .select('*, users(name, farmer_id)')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Suggestions
app.post('/api/suggestion', authenticateUser, async (req, res) => {
    const { message } = req.body;
    const { data, error } = await supabase
        .from('suggestions')
        .insert([{ user_id: req.user.id, message }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Admin: View all suggestions
app.get('/api/suggestions', authenticateUser, isAdmin, async (req, res) => {
    const { data, error } = await supabase
        .from('suggestions')
        .select('*, users(name, farmer_id)')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Search
app.get('/api/search', authenticateUser, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('name, farmer_id')
        .or(`name.ilike.%${q}%,farmer_id.ilike.%${q}%`);

    if (userError) return res.status(400).json({ error: userError.message });
    res.json({ users });
});

// Owner Dashboard endpoints (Hackathon demo bypass)
app.get('/api/owner/complaints', async (req, res) => {
    const { data, error } = await supabase.from('complaints').select('*, users(name, farmer_id)').order('created_at', { ascending: false });
    res.json(data || []);
});

app.get('/api/owner/suggestions', async (req, res) => {
    const { data, error } = await supabase.from('suggestions').select('*, users(name, farmer_id)').order('created_at', { ascending: false });
    res.json(data || []);
});

app.get('/api/owner/users', async (req, res) => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    res.json(data || []);
});

// IoT Hardware Endpoint (ESP32 / Simulator)
app.post('/api/sensor-data', async (req, res) => {
    const { farmer_id, moisture, temperature, ph, water_level } = req.body;
    
    if (!farmer_id) {
        return res.status(400).json({ error: 'farmer_id is required to log hardware metrics' });
    }

    // Direct insertion using bypass/anon key for hardware ingest
    const { error } = await supabase
        .from('sensor_data')
        .insert([{ 
            farmer_id, 
            moisture, 
            temperature, 
            ph, 
            water_level 
        }]);

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json({ success: true, message: 'Sensor data logged locally and broadcast to Supabase Realtime' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startEngine();
});
