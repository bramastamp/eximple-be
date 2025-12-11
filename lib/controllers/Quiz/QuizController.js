const Question = require('../../models/Question');
const Level = require('../../models/Level');

class QuizController {
  // Get questions for a level (without correct answers)
  static async getQuestions(req, res) {
    try {
      const { levelId } = req.params;

      const level = await Level.findById(parseInt(levelId));
      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      const questions = await Question.findByLevelId(parseInt(levelId), true);
      
      // Remove correct answers from response
      const questionsWithoutAnswers = questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        type: q.type,
        metadata: q.metadata,
        order_index: q.order_index,
        choices: q.choices ? q.choices.map(c => ({
          id: c.id,
          choice_text: c.choice_text,
          order_index: c.order_index
        })) : []
      }));

      res.status(200).json({
        success: true,
        data: {
          level_id: parseInt(levelId),
          questions: questionsWithoutAnswers
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to fetch questions',
        error: error.message
      });
    }
  }

  // Submit quiz answers
  static async submitQuiz(req, res) {
    try {
      const userId = req.user.id;
      const { levelId } = req.params;
      const { answers } = req.body; // [{ question_id: 1, answer: [1,2] or 1 }]

      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'answers', message: 'Answers array is required', code: 'ANSWERS_REQUIRED' }]
        });
      }

      const level = await Level.findById(parseInt(levelId));
      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      // Get all questions with correct answers
      const questions = await Question.findByLevelId(parseInt(levelId), true);
      
      if (questions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No questions found for this level'
        });
      }

      // Validate answers
      const results = [];
      let correctCount = 0;
      let totalQuestions = questions.length;

      for (const userAnswer of answers) {
        const question = questions.find(q => q.id === userAnswer.question_id);
        if (!question) continue;

        const validation = await Question.validateAnswers(
          userAnswer.question_id,
          userAnswer.answer
        );

        if (validation && validation.is_correct) {
          correctCount++;
        }

        results.push({
          question_id: userAnswer.question_id,
          is_correct: validation ? validation.is_correct : false,
          user_answer: userAnswer.answer
        });
      }

      const score = Math.round((correctCount / totalQuestions) * 100);
      const passed = score >= 70; // Minimum 70% to pass

      res.status(200).json({
        success: true,
        data: {
          level_id: parseInt(levelId),
          total_questions: totalQuestions,
          correct_answers: correctCount,
          score: score,
          passed: passed,
          results: results
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to submit quiz',
        error: error.message
      });
    }
  }
}

module.exports = QuizController;

