const supabase = require('../config/db');

class Subject {
  static async findAll() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('title', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async findById(subjectId) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByCode(code) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByClassId(classId) {
    const { data, error } = await supabase
      .from('subject_levels')
      .select(`
        *,
        subjects (
          id,
          code,
          title,
          description,
          created_at,
          updated_at
        )
      `)
      .eq('class_id', classId)
      .eq('visible', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

module.exports = Subject;

