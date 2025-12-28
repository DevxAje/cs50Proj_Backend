require('dotenv').config();
const supabase = require('./src/config/database');

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();
    
    console.log('✅ Supabase Connected!');
    console.log('Users table:', data);
  } catch (error) {
    console.error('❌ Supabase Error:', error.message);
  }
}

testConnection();
