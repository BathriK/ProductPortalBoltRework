import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Edit, Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminLogger } from '@/lib/adminLogger';
import { createUser, getUserByEmail, UserRole } from '@/services/authService';
import { Badge } from './ui/badge';

// User interface for the component
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'stakeholder' as UserRole,
    password: '',
    confirmPassword: ''
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Function to load users from localStorage (in a real app, this would fetch from the database)
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be a database query
      // For now, we'll use sample data
      const sampleUsers: User[] = [
        { id: '1', name: 'Admin User', email: 'admin@tnqtech.com', role: 'admin', createdAt: '2025-01-01T00:00:00Z' },
        { id: '2', name: 'PM User', email: 'pm@example.com', role: 'product_manager', createdAt: '2025-01-02T00:00:00Z' },
        { id: '3', name: 'Stakeholder', email: 'stakeholder@example.com', role: 'stakeholder', createdAt: '2025-01-03T00:00:00Z' }
      ];
      
      setUsers(sampleUsers);
      adminLogger('Users loaded successfully', { count: sampleUsers.length }, 'INFO');
    } catch (error) {
      console.error('Error loading users:', error);
      adminLogger('Failed to load users', { error: error instanceof Error ? error.message : String(error) }, 'ERROR');
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'stakeholder',
      password: '',
      confirmPassword: ''
    });
    setFormError(null);
  };

  // Open add user dialog
  const handleAddUser = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Open edit user dialog
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setIsEditDialogOpen(true);
  };

  // Open delete user dialog
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle role selection
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as UserRole }));
  };

  // Validate form data
  const validateForm = (isPasswordRequired: boolean = true): boolean => {
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    if (isPasswordRequired) {
      if (!formData.password) {
        setFormError('Password is required');
        return false;
      }
      
      if (formData.password.length < 8) {
        setFormError('Password must be at least 8 characters long');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  // Submit add user form
  const handleAddUserSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      // Check if user already exists
      const existingUser = await getUserByEmail(formData.email);
      if (existingUser) {
        setFormError('A user with this email already exists');
        return;
      }
      
      // Create the user
      const newUser = await createUser(
        formData.email,
        formData.password,
        formData.name,
        formData.role
      );
      
      if (newUser) {
        // Add the new user to the list
        setUsers(prev => [...prev, {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: new Date().toISOString()
        }]);
        
        toast({
          title: "Success",
          description: "User created successfully",
        });
        
        setIsAddDialogOpen(false);
        resetForm();
        
        adminLogger('User created successfully', { email: formData.email, role: formData.role }, 'INFO');
      } else {
        setFormError('Failed to create user');
        adminLogger('Failed to create user', { email: formData.email }, 'ERROR');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setFormError(error instanceof Error ? error.message : 'An unknown error occurred');
      adminLogger('Error creating user', { error: error instanceof Error ? error.message : String(error) }, 'ERROR');
    }
  };

  // Submit edit user form
  const handleEditUserSubmit = async () => {
    if (!selectedUser) return;
    
    // Only validate password if it's provided
    if (!validateForm(false)) return;
    
    try {
      // In a real app, this would update the user in the database
      // For now, we'll just update the local state
      
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            name: formData.name,
            email: formData.email,
            role: formData.role
          };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      
      adminLogger('User updated successfully', { id: selectedUser.id, email: formData.email }, 'INFO');
    } catch (error) {
      console.error('Error updating user:', error);
      setFormError(error instanceof Error ? error.message : 'An unknown error occurred');
      adminLogger('Error updating user', { error: error instanceof Error ? error.message : String(error) }, 'ERROR');
    }
  };

  // Confirm user deletion
  const handleDeleteUserConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      // In a real app, this would delete the user from the database
      // For now, we'll just update the local state
      
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      
      adminLogger('User deleted successfully', { id: selectedUser.id, email: selectedUser.email }, 'INFO');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
      adminLogger('Error deleting user', { error: error instanceof Error ? error.message : String(error) }, 'ERROR');
    }
  };

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>;
      case 'product_manager':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Product Manager</Badge>;
      case 'stakeholder':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Stakeholder</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Users</h3>
          <Button 
            onClick={handleAddUser}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-tnq-blue border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={user.email === 'admin@tnqtech.com'} // Prevent deleting the main admin
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Add User Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with specific permissions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="product_manager">Product Manager</SelectItem>
                    <SelectItem value="stakeholder">Stakeholder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
              
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUserSubmit}>
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  disabled={selectedUser?.email === 'admin@tnqtech.com'} // Prevent editing admin email
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                  disabled={selectedUser?.email === 'admin@tnqtech.com'} // Prevent changing admin role
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="product_manager">Product Manager</SelectItem>
                    <SelectItem value="stakeholder">Stakeholder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-confirmPassword">Confirm New Password</Label>
                <Input
                  id="edit-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
              
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUserSubmit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete User Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="py-4">
                <p className="mb-2"><strong>Name:</strong> {selectedUser.name}</p>
                <p className="mb-2"><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteUserConfirm}
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserManagement;