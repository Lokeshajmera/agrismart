const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function setupOwner() {
    console.log('Setting up owner account...');
    const email = 'xyz@gmail.com';
    const password = '654321';
    
    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name: 'Director Owner', phone: '0000000000' }
        }
    });

    if (authError && authError.message !== 'User already registered') {
        console.error('Auth Error:', authError.message);
        // Maybe try login if already registered
    }

    // 2. Login to get session
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login Error:', loginError.message);
        return;
    }

    const userId = loginData.user.id;
    console.log('Logged in successfully. User ID:', userId);

    // 3. Ensure user exists in public.users (Signup endpoint might have done this, but let's check)
    const { data: userRec, error: userRecError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (userRecError && userRecError.code === 'PGRST116') {
        // Not found, insert
        await supabase.from('users').insert([{
            id: userId,
            name: 'Director Owner',
            email: email,
            phone: '0000000000',
            farmer_id: 'OWN001',
            role: 'admin'
        }]);
        console.log('Inserted owner into public.users with admin role.');
    } else {
        // Update to admin
        const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', userId);
        
        if (updateError) {
            console.error('Update Error:', updateError.message);
        } else {
            console.log('Updated owner role to admin.');
        }
    }
    
    console.log('Owner setup complete!');
}

setupOwner();
