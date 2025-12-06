const supabase = require('../config/db');

class Question {
  static async findByLevelId(levelId, includeChoices = false) {
    let query = supabase
      .from('questions')
      .select(includeChoices ? 
        `*,
        choices (
          id,
          choice_text,
          is_correct,
          order_index
        )` : '*'
      )
      .eq('level_id', levelId)
      .order('order_index', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async findById(questionId, includeChoices = true) {
    let query = supabase
      .from('questions')
      .select(includeChoices ? 
        `*,
        choices (
          id,
          choice_text,
          is_correct,
          order_index
        )` : '*'
      )
      .eq('id', questionId)
      .single();

    const { data, error } = await query;

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByIdWithoutAnswers(questionId) {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        choices (
          id,
          choice_text,
          order_index
        )
      `)
      .eq('id', questionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByIds(questionIds, includeChoices = false) {
    let query = supabase
      .from('questions')
      .select(includeChoices ? 
        `*,
        choices (
          id,
          choice_text,
          is_correct,
          order_index
        )` : '*'
      )
      .in('id', questionIds);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async validateAnswers(questionId, userAnswers) {
    const question = await this.findById(questionId, true);
    if (!question) return null;

    const correctChoices = question.choices
      .filter(choice => choice.is_correct)
      .map(choice => choice.id)
      .sort();

    const userAnswerIds = Array.isArray(userAnswers) 
      ? userAnswers.map(id => parseInt(id)).sort()
      : [parseInt(userAnswers)].sort();

    const isCorrect = JSON.stringify(correctChoices) === JSON.stringify(userAnswerIds);

    return {
      question_id: questionId,
      is_correct: isCorrect,
      correct_choices: correctChoices,
      user_answers: userAnswerIds
    };
  }
}

module.exports = Question;

