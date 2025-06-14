// src/services/authService.ts
import bcrypt from 'bcryptjs';
import { supabase } from '@/integrations/supabase/client';
import { adminLogger } from '@/lib/adminLogger';

// User types
export type UserRole = 'stakeholder' | 'product_manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt?: string;
}

// Enhanced logging function for admin logs
function logAdminAction(action: string, details: any, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  adminLogger(`AuthService: ${action}`, details, level);
}

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    logAdminAction('Password hashed successfully', { hashPreview: hash.substring(0, 10) + '...' }, 'INFO');
    console.log('Hashed password: ',hash)
    return hash;
  } catch (error) {
    logAdminAction('Error hashing password', { error }, 'ERROR');
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns Boolean indicating if password matches
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  logAdminAction('Attempting password verification', {}, 'INFO');
  const hashp = "$2b$10$IF4LrfKeZ9tFipPQsyH0M.8gApocXxIPWD1Kb6NlgOk9qEwFE9X1a";

bcrypt.compare("Bath@2025", hashp).then(result => {
  console.log("Matches with the result?", result); // should print true
});
  try {
    const match = await bcrypt.compare(password, hash);
    console.log('VerifyPassword: bcrypt.compare result - Plain text:', password, 'Hashed from DB:', hash, 'Match:', match);
    logAdminAction('Password verification result', { match }, 'INFO');
    return match;
  } catch (error) {
    logAdminAction('Error verifying password', { error }, 'ERROR');
    return false;
  }
};

/**
 * Create a new user
 * @param email User email
 * @param password Plain text password
 * @param name User name
 * @param role User role
 * @returns Created user or null if failed
 */
export const createUser = async (
  email: string, 
  password: string, 
  name: string, 
  role: UserRole
): Promise<User | null> => {
  try {
    logAdminAction('Attempting to create user', { email, role }, 'INFO');
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      logAdminAction('User already exists, cannot create', { email }, 'WARN');
      return null;
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('portalusers') // Changed from 'users' to 'portalusers'
      .insert([
        {
          email,
          name,
          role,
          password_hash: passwordHash
        }
      ])
      .select('id, email, name, role, password_hash, created_at')
      .single();

    if (error) {
      logAdminAction('Error inserting user into Supabase', { error: error.message }, 'ERROR');
      return null;
    }

    logAdminAction('User created successfully in Supabase', { email, role, id: data.id }, 'INFO');
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      passwordHash: data.password_hash,
      createdAt: data.created_at
    };
  } catch (error) {
    logAdminAction('Error creating user', { error }, 'ERROR');
    return null;
  }
};

/**
 * Login a user
 * @param email User email
 * @param password Plain text password
 * @returns User object if login successful, null otherwise
 */
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  logAdminAction('Login attempt initiated', { email }, 'INFO');

  try {
    // Find the user by email in Supabase
    const user = await getUserByEmail(email);
    
    if (!user) {
      logAdminAction('User not found during login attempt', { email }, 'WARN');
      throw new Error('Invalid email or password');
    }

    // Add a log here to show what's being passed to verifyPassword
    console.log('LoginUser: Comparing entered password with DB hash.');
    console.log('LoginUser: Entered password (plain text):', password);
    console.log('LoginUser: Hashed password from DB:', user.passwordHash);

    // Verify the password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    
    if (!passwordValid) {
      logAdminAction('Invalid password provided during login', { email }, 'WARN');
      throw new Error('Invalid email or password');
    }

    logAdminAction('User logged in successfully', { email, role: user.role }, 'INFO');
    return user;
  } catch (error) {
    logAdminAction('Error during login process', { email, error: error instanceof Error ? error.message : String(error) }, 'ERROR');
    throw error;
  }
};

/**
 * Change a user's password
 * @param userId User ID
 * @param newPassword New plain text password
 * @param oldPassword Old plain text password (for verification)
 * @returns Boolean indicating success
 */
export const changePassword = async (
  userId: string, 
  newPassword: string, 
  oldPassword?: string
): Promise<boolean> => {
  try {
    logAdminAction('Attempting to change password for user', { userId }, 'INFO');
    
    // Find the user
    const user = await getUserById(userId);
    if (!user) {
      logAdminAction('User not found for password change', { userId }, 'WARN');
      return false;
    }

    // If oldPassword is provided, verify it
    if (oldPassword) {
      const passwordValid = await verifyPassword(oldPassword, user.passwordHash);
      if (!passwordValid) {
        logAdminAction('Invalid old password during change', { userId }, 'WARN');
        return false;
      }
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from('portalusers') // Changed from 'users' to 'portalusers'
      .update({ password_hash: newPasswordHash })
      .eq('id', userId);

    if (error) {
      logAdminAction('Error updating password in Supabase', { userId, error: error.message }, 'ERROR');
      return false;
    }

    logAdminAction('Password changed successfully in Supabase', { userId }, 'INFO');
    return true;
  } catch (error) {
    logAdminAction('Error changing password', { userId, error }, 'ERROR');
    return false;
  }
};

/**
 * Get a user by email
 * @param email User email
 * @returns User object or null if not found
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  logAdminAction('Fetching user by email from Supabase', { email }, 'INFO');
  try {
    const { data, error } = await supabase
      .from('portalusers') // Changed from 'users' to 'portalusers'
      .select('id, name, email, role, password_hash, created_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        logAdminAction('User not found in Supabase by email', { email }, 'INFO');
        return null;
      }
      logAdminAction('Error querying Supabase for user by email', { email, error: error.message }, 'ERROR');
      throw error;
    }

    if (!data) {
      logAdminAction('No data returned for user by email query', { email }, 'INFO');
      return null;
    }

    logAdminAction('User found in Supabase by email', { email: data.email, id: data.id }, 'INFO');
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      passwordHash: data.password_hash,
      createdAt: data.created_at
    };
  } catch (error) {
    logAdminAction('Error getting user by email', { email, error }, 'ERROR');
    return null;
  }
};

/**
 * Get a user by ID
 * @param id User ID
 * @returns User object or null if not found
 */
export const getUserById = async (id: string): Promise<User | null> => {
  logAdminAction('Fetching user by ID from Supabase', { id }, 'INFO');
  try {
    const { data, error } = await supabase
      .from('portalusers') // Changed from 'users' to 'portalusers'
      .select('id, name, email, role, password_hash, created_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        logAdminAction('User not found in Supabase by ID', { id }, 'INFO');
        return null;
      }
      logAdminAction('Error querying Supabase for user by ID', { id, error: error.message }, 'ERROR');
      throw error;
    }

    if (!data) {
      logAdminAction('No data returned for user by ID query', { id }, 'INFO');
      return null;
    }

    logAdminAction('User found in Supabase by ID', { id: data.id, email: data.email }, 'INFO');
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      passwordHash: data.password_hash,
      createdAt: data.created_at
    };
  } catch (error) {
    logAdminAction('Error getting user by ID', { id, error }, 'ERROR');
    return null;
  }
};

/**
 * Seed the default admin user if it doesn't exist
 */
export const seedDefaultAdmin = async (): Promise<void> => {
  try {
    // Consider making this configurable via environment variables or a dedicated admin setup page
    const adminEmail = 'admin@tnqtech.com'; // Changed from 'admin@yourdomain.com'
    const adminPassword = 'AdminTNQ@12342025'; // Changed from 'DefaultAdminPassword123'
    const adminName = 'Admin User';

    logAdminAction('Checking for existing default admin user', { email: adminEmail }, 'INFO');
    const existingAdmin = await getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      logAdminAction('Default admin user not found, attempting to create', { email: adminEmail }, 'INFO');
      await createUser(
        adminEmail,
        adminPassword,
        adminName,
        'admin'
      );
      logAdminAction('Default admin user seeded successfully', { email: adminEmail }, 'INFO');
    } else {
      logAdminAction('Default admin user already exists', { email: adminEmail }, 'INFO');
    }
  } catch (error) {
    logAdminAction('Error seeding default admin user', { error }, 'ERROR');
  }
};

// Initialize the auth service
export const initAuthService = async (): Promise<void> => {
  try {
    // Seed the default admin user
   await seedDefaultAdmin();
    logAdminAction('Auth service initialized', {}, 'INFO');
  } catch (error) {
    logAdminAction('Error initializing auth service', { error }, 'ERROR');
  }
};

