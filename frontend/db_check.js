const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('complaints').select('*').limit(1);
  console.log("Complaints Data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
check();
