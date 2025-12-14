const supabase = require('../config/db');

class Level {
  static async findBySubjectLevelId(subjectLevelId) {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('subject_level_id', subjectLevelId)
      .order('level_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async findById(levelId) {
    const { data, error } = await supabase
      .from('levels')
      .select(`
        *,
        subject_levels (
          id,
          subject_id,
          class_id,
          title_override,
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
        )
      `)
      .eq('id', levelId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findBySubjectId(subjectId) {
    const { data, error } = await supabase
      .from('levels')
      .select(`
        *,
        subject_levels!inner (
          id,
          subject_id,
          class_id,
          subjects!inner (
            id
          )
        )
      `)
      .eq('subject_levels.subject_id', subjectId)
      .order('level_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async findByIdWithMaterials(levelId) {
    const { data: level, error: levelError } = await supabase
      .from('levels')
      .select(`
        *,
        subject_levels (
          id,
          subject_id,
          class_id,
          title_override,
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
        )
      `)
      .eq('id', levelId)
      .single();

    if (levelError && levelError.code !== 'PGRST116') throw levelError;

    if (!level) return null;

    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('level_id', levelId)
      .order('order_index', { ascending: true });

    if (materialsError) throw materialsError;

    return {
      ...level,
      materials: materials || []
    };
  }

  // Find next level in the same subject_level
  static async findNextLevel(subjectLevelId, currentLevelIndex) {
    const { data, error } = await supabase
      .from('levels')
      .select('id, level_index, title, points_reward, subject_level_id')
      .eq('subject_level_id', subjectLevelId)
      .eq('level_index', currentLevelIndex + 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
}

module.exports = Level;

