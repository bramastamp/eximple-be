const supabase = require('../config/db');

class Material {
  static async findByLevelId(levelId) {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('level_id', levelId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async findById(materialId) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        levels (
          id,
          level_index,
          title,
          subject_level_id
        )
      `)
      .eq('id', materialId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(materialData) {
    const { level_id, content, order_index = 0 } = materialData;

    const { data, error } = await supabase
      .from('materials')
      .insert([{
        level_id,
        content,
        order_index
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(materialId, materialData) {
    const { data, error } = await supabase
      .from('materials')
      .update(materialData)
      .eq('id', materialId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(materialId) {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (error) throw error;
    return true;
  }
}

module.exports = Material;

