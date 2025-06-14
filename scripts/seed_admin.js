// scripts/seed_admin.js
// This script seeds the default admin user in the database

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kejfopmmiyhpxgbfarmg.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Admin user details
const ADMIN_EMAIL = 'admin@tnqtech.com';
const ADMIN_PASSWORD = 'AdminTNQ@12342025';
const ADMIN_NAME = 'Admin User';
const ADMIN_ROLE = 'admin';

async function seedAdmin() {
  try {
    console.log('Checking if admin user already exists...');
    
    // Check if admin user already exists
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .limit(1);
    
    if (queryError) {
      throw new Error(`Error checking for existing admin: ${queryError.message}`);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Admin user already exists, skipping creation');
      return;
    }
    
    // Hash the password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    // Create the admin user
    console.log('Creating admin user...');
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          role: ADMIN_ROLE,
          password_hash: passwordHash
        }
      ]);
    
    if (error) {
      throw new Error(`Error creating admin user: ${error.message}`);
    }
    
    console.log('Admin user created successfully!');
    
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  });