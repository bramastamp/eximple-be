const supabase = require('../config/db');

class UserSubject {
  /**
   * Set subjects untuk user (replace semua)
   * @param {number} userId - User ID
   * @param {Array<number>} subjectIds - Array of subject IDs
   */
  static async setUserSubjects(userId, subjectIds) {
    // Hapus semua subject yang ada
    await supabase
      .from('user_subjects')
      .delete()
      .eq('user_id', userId);

    // Insert subject baru jika ada
    if (subjectIds && subjectIds.length > 0) {
      const insertData = subjectIds.map(subjectId => ({
        user_id: userId,
        subject_id: parseInt(subjectId)
      }));

      const { data, error } = await supabase
        .from('user_subjects')
        .insert(insertData)
        .select();

      if (error) throw error;
      return data;
    }

    return [];
  }

  /**
   * Get semua subjects yang dipilih user
   * @param {number} userId - User ID
   */
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_subjects')
      .select(`
        *,
        subjects (
          id,
          code,
          title,
          description
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Check apakah user sudah memilih subject
   * @param {number} userId - User ID
   * @param {number} subjectId - Subject ID
   */
  static async hasSubject(userId, subjectId) {
    const { data, error } = await supabase
      .from('user_subjects')
      .select('id')
      .eq('user_id', userId)
      .eq('subject_id', subjectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  /**
   * Validate subject IDs
   * @param {Array<number>} subjectIds - Array of subject IDs
   */
  static async validateSubjectIds(subjectIds) {
    if (!subjectIds || subjectIds.length === 0) {
      return { valid: false, invalidIds: [] };
    }

    const { data, error } = await supabase
      .from('subjects')
      .select('id')
      .in('id', subjectIds.map(id => parseInt(id)));

    if (error) throw error;

    const validIds = data.map(s => s.id);
    const invalidIds = subjectIds.filter(id => !validIds.includes(parseInt(id)));

    return {
      valid: invalidIds.length === 0,
      invalidIds
    };
  }
}

module.exports = UserSubject;

