const supabase = require('../config/db');

class Choice {
  static async findByQuestionId(questionId) {
    const { data, error } = await supabase
      .from('choices')
      .select('*')
      .eq('question_id', questionId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async findById(choiceId) {
    const { data, error } = await supabase
      .from('choices')
      .select('*')
      .eq('id', choiceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(choiceData) {
    const { question_id, choice_text, is_correct = false, order_index = 0 } = choiceData;

    const { data, error } = await supabase
      .from('choices')
      .insert([{
        question_id,
        choice_text,
        is_correct,
        order_index
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = Choice;

