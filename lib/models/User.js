const supabase = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password_hash, role = 'student', is_active = false } = userData;

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password_hash,
          role,
          is_active
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createOrUpdateFromGoogle(googleData) {
    const { email, name, picture, sub: google_id } = googleData;
    
    // Generate username from email or name
    let baseUsername = email.split('@')[0] || name?.toLowerCase().replace(/\s+/g, '_') || `user_${Date.now()}`;
    baseUsername = baseUsername.replace(/[^a-z0-9_]/g, ''); // Remove special characters
    
    // Check if user exists by email
    const existingUser = await this.findByEmail(email);
    
    if (existingUser) {
      // Update existing user with Google info
      const updateData = {
        is_active: true
      };
      
      return await this.update(existingUser.id, updateData);
    }
    
    // Generate unique username if needed
    let username = baseUsername;
    let counter = 1;
    while (await this.usernameExists(username)) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }
    
    // Create new user from Google
    return await this.create({
      username,
      email,
      password_hash: null, // No password for Google OAuth users
      role: 'student',
      is_active: true // Google verified emails are automatically active
    });
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }


  static async findByIdWithProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_profiles (
          *,
          grade_levels (id, name),
          classes (id, name, grade_level_id)
        )
      `)
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async update(userId, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }


  static async activate(userId) {
    return await this.update(userId, { is_active: true });
  }


  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }


  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }


  static async emailExists(email) {
    const user = await this.findByEmail(email);
    return !!user;
  }

  static async usernameExists(username) {
    const user = await this.findByUsername(username);
    return !!user;
  }
}

module.exports = User;

