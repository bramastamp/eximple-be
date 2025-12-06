const supabase = require('../config/db');

class SubjectLevel {
  static async findBySubjectId(subjectId) {
    const { data, error } = await supabase
      .from('subject_levels')
      .select(`
        *,
        classes (
          id,
          name,
          grade_level_id,
          grade_levels (
            id,
            name
          )
        )
      `)
      .eq('subject_id', subjectId)
      .eq('visible', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
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
          description
        )
      `)
      .eq('class_id', classId)
      .eq('visible', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async findById(subjectLevelId) {
    const { data, error } = await supabase
      .from('subject_levels')
      .select(`
        *,
        subjects (
          id,
          code,
          title,
          description
        ),
        classes (
          id,
          name,
          grade_level_id,
          grade_levels (
            id,
            name
          )
        )
      `)
      .eq('id', subjectLevelId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findBySubjectAndClass(subjectId, classId) {
    const { data, error } = await supabase
      .from('subject_levels')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('class_id', classId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

module.exports = SubjectLevel;

