async function test() {
    try {
        const payload = {
            name: "Director Owner",
            email: "xyz@gmail.com",
            mobile: "0000000000",
            password: "654321"
        };
        console.log("Signing up xyz@gmail.com...");
        const res = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("Signup response:", data);

        console.log("Attempting login xyz@gmail.com...");
        const res2 = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'xyz@gmail.com', password: '654321' })
        });
        const data2 = await res2.json();
        console.log("Login response:", data2);

        // Let's escalate role to admin using the existing public.users policy!
        if (data2.session) {
            const { createClient } = require('@supabase/supabase-js');
            require('dotenv').config();
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

            console.log("Escalating to admin...");
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'admin' })
                .eq('id', data2.user.id);
            console.log('Update Error (Admin):', updateError || 'Success');
        }
    } catch (e) {
        console.error(e);
    }
}
test();
