import { supabase } from '@/integrations/supabase/client';
import { adminLogger } from '@/lib/adminLogger';
import { hashPassword, verifyPassword, UserRole } from './authService';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

// Enhanced logging function for admin logs
function logAdminAction(action: string, details: any, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  adminLogger(`UserService: ${action}`, details, level);
}

/**
 * Get all users
 * @returns Array of users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    logAdminAction('Getting all users', {}, 'INFO');
    
    // In a real app with Supabase, we would do:
    // const { data, error } = await supabase
    //   .from('users')
    //   .select('id, name, email, role, created_at')
    //   .order('created_at', { ascending: false });
    
    // For now, we'll return sample data
    const sampleUsers: User[] = [
      { id: '1', name: 'Admin User', email: 'admin@tnqtech.com', role: 'admin', createdAt: '2025-01-01T00:00:00Z' },
      { id: '2', name: 'PM User', email: 'pm@example.com', role: 'product_manager', createdAt: '2025-01-02T00:00:00Z' },
      { id: '3', name: 'Stakeholder', email: 'stakeholder@example.com', role: 'stakeholder', createdAt: '2025-01-03T00:00:00Z' }
    ];
    
    logAdminAction('Users retrieved successfully', { count: sampleUsers.length }, 'INFO');
    return sampleUsers;
  } catch (error) {
    logAdminAction('Error getting users', { error }, 'ERROR');
    throw error;
  }
};

/**
 * Create a new user
 * @param user User data
 * @param password Plain text password
 * @returns Created user
 */
export const createUser = async (
  user: Omit<User, 'id' | 'createdAt'>, 
  password: string
): Promise<User> => {
  try {
    logAdminAction('Creating new user', { email: user.email, role: user.role }, 'INFO');
    
    // Check if user already exists
    const existingUser = await getUserByEmail(user.email);
    if (existingUser) {
      logAdminAction('User already exists', { email: user.email }, 'WARN');
      throw new Error('A user with this email already exists');
    }
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // In a real app with Supabase, we would do:
    // const { data, error } = await supabase
    //   .from('users')
    //   .insert([{ 
    //     name: user.name, 
    //     email: user.email, 
    //     role: user.role, 
    //     password_hash: passwordHash 
    //   }])
    //   .select('id, name, email, role, created_at')
    //   .single();
    
    // For now, we'll just create a new user object
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString()
    };
    
    logAdminAction('User created successfully', { id: newUser.id, email: newUser.email }, 'INFO');
    return newUser;
  } catch (error) {
    logAdminAction('Error creating user', { error }, 'ERROR');
    throw error;
  }
};

/**
 * Update a user
 * @param id User ID
 * @param updates User data updates
 * @param password Optional new password
 * @returns Updated user
 */
export const updateUser = async (
  id: string, 
  updates: Partial<Omit<User, 'id' | 'createdAt'>>,
  password?: string
): Promise<User> => {
  try {
    logAdminAction('Updating user', { id, updates: { ...updates, password: password ? '********' : undefined } }, 'INFO');
    
    // Get the existing user
    const existingUser = await getUserById(id);
    if (!existingUser) {
      logAdminAction('User not found', { id }, 'ERROR');
      throw new Error('User not found');
    }
    
    // Prepare update data
    const updateData: any = { ...updates };
    
    // If password is provided, hash it
    if (password) {
      updateData.password_hash = await hashPassword(password);
    }
    
    // In a real app with Supabase, we would do:
    // const { data, error } = await supabase
    //   .from('users')
    //   .update(updateData)
    //   .eq('id', id)
    //   .select('id, name, email, role, created_at')
    //   .single();
    
    // For now, we'll just update the existing user object
    const updatedUser: User = {
      ...existingUser,
      ...updates
    };
    
    logAdminAction('User updated successfully', { id, email: updatedUser.email }, 'INFO');
    return updatedUser;
  } catch (error) {
    logAdminAction('Error updating user', { error }, 'ERROR');
    throw error;
  }
};

/**
 * Delete a user
 * @param id User ID
 * @returns Boolean indicating success
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    logAdminAction('Deleting user', { id }, 'INFO');
    
    // Get the existing user
    const existingUser = await getUserById(id);
    if (!existingUser) {
      logAdminAction('User not found', { id }, 'ERROR');
      throw new Error('User not found');
    }
    
    // In a real app with Supabase, we would do:
    // const { error } = await supabase
    //   .from('users')
    //   .delete()
    //   .eq('id', id);
    
    logAdminAction('User deleted successfully', { id, email: existingUser.email }, 'INFO');
    return true;
  } catch (error) {
    logAdminAction('Error deleting user', { error }, 'ERROR');
    throw error;
  }
};

/**
 * Get a user by ID
 * @param id User ID
 * @returns User object or null if not found
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    logAdminAction('Getting user by ID', { id }, 'INFO');
    
    // In a real app with Supabase, we would do:
    // const { data, error } = await supabase
    //   .from('users')
    //   .select('id, name, email, role, created_at')
    //   .eq('id', id)
    //   .single();
    
    // For now, we'll just return a sample user
    if (id === '1') {
      return { id: '1', name: 'Admin User', email: 'admin@tnqtech.com', role: 'admin', createdAt: '2025-01-01T00:00:00Z' };
    } else if (id === '2') {
      return { id: '2', name: 'PM User', email: 'pm@example.com', role: 'product_manager', createdAt: '2025-01-02T00:00:00Z' };
    } else if (id === '3') {
      return { id: '3', name: 'Stakeholder', email: 'stakeholder@example.com', role: 'stakeholder', createdAt: '2025-01-03T00:00:00Z' };
    }
    
    return null;
  } catch (error) {
    logAdminAction('Error getting user by ID', { error }, 'ERROR');
    return null;
  }
};

/**
 * Get a user by email
 * @param email User email
 * @returns User object or null if not found
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    logAdminAction('Getting user by email', { email }, 'INFO');
    
    // In a real app with Supabase, we would do:
    // const { data, error } = await supabase
    //   .from('users')
    //   .select('id, name, email, role, created_at')
    //   .eq('email', email)
    //   .single();
    
    // For now, we'll just return a sample user
    if (email.toLowerCase() === 'admin@tnqtech.com') {
      return { id: '1', name: 'Admin User', email: 'admin@tnqtech.com', role: 'admin', createdAt: '2025-01-01T00:00:00Z' };
    } else if (email.toLowerCase() === 'pm@example.com') {
      return { id: '2', name: 'PM User', email: 'pm@example.com', role: 'product_manager', createdAt: '2025-01-02T00:00:00Z' };
    } else if (email.toLowerCase() === 'stakeholder@example.com') {
      return { id: '3', name: 'Stakeholder', email: 'stakeholder@example.com', role: 'stakeholder', createdAt: '2025-01-03T00:00:00Z' };
    }
    
    return null;
  } catch (error) {
    logAdminAction('Error getting user by email', { error }, 'ERROR');
    return null;
  }
};