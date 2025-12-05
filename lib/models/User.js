const supabase = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password_hash, role = 'student' } = userData;

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password_hash,
          role,
          is_active: false // Inactive until email verified
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Find user by ID
   */
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

x
  static async usernameExists(username) {
    const user = await this.findByUsername(username);
    return !!user;
  }
}

module.exports = User;

