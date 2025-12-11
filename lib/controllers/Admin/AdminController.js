const Achievement = require('../../models/Achievement');
const Subject = require('../../models/Subject');
const Question = require('../../models/Question');
const Choice = require('../../models/Choice');
const Material = require('../../models/Material');
const Level = require('../../models/Level');
const supabase = require('../../config/db');

class AdminController {
  // ===== ACHIEVEMENTS =====
  
  static async createAchievement(req, res) {
    try {
      const { code, title, description, icon_url, criteria, points_reward } = req.body;

      if (!code || !title) {
        return res.status(400).json({
          success: false,
          errors: [
            { field: 'code', message: 'Code is required', code: 'CODE_REQUIRED' },
            { field: 'title', message: 'Title is required', code: 'TITLE_REQUIRED' }
          ]
        });
      }

      // Check if code already exists
      const existing = await Achievement.findByCode(code);
      if (existing) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'code', message: 'Achievement code already exists', code: 'CODE_EXISTS' }]
        });
      }

      const { data, error } = await supabase
        .from('achievements')
        .insert([{
          code,
          title,
          description: description || null,
          icon_url: icon_url || null,
          criteria: criteria || {},
          points_reward: points_reward || 0
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Achievement created successfully',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create achievement',
        error: error.message
      });
    }
  }

  static async updateAchievement(req, res) {
    try {
      const { id } = req.params;
      const { code, title, description, icon_url, criteria, points_reward } = req.body;

      const achievement = await Achievement.findById(parseInt(id));
      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Achievement not found'
        });
      }

      // Check code uniqueness if changed
      if (code && code !== achievement.code) {
        const existing = await Achievement.findByCode(code);
        if (existing) {
          return res.status(400).json({
            success: false,
            errors: [{ field: 'code', message: 'Achievement code already exists', code: 'CODE_EXISTS' }]
          });
        }
      }

      const updateData = {};
      if (code !== undefined) updateData.code = code;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (icon_url !== undefined) updateData.icon_url = icon_url;
      if (criteria !== undefined) updateData.criteria = criteria;
      if (points_reward !== undefined) updateData.points_reward = points_reward;

      const { data, error } = await supabase
        .from('achievements')
        .update(updateData)
        .eq('id', parseInt(id))
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Achievement updated successfully',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update achievement',
        error: error.message
      });
    }
  }

  static async deleteAchievement(req, res) {
    try {
      const { id } = req.params;

      const achievement = await Achievement.findById(parseInt(id));
      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Achievement not found'
        });
      }

      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Achievement deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete achievement',
        error: error.message
      });
    }
  }

  // ===== SUBJECTS =====

  static async createSubject(req, res) {
    try {
      const { code, title, description } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'title', message: 'Title is required', code: 'TITLE_REQUIRED' }]
        });
      }

      // Check code uniqueness if provided
      if (code) {
        const existing = await Subject.findByCode(code);
        if (existing) {
          return res.status(400).json({
            success: false,
            errors: [{ field: 'code', message: 'Subject code already exists', code: 'CODE_EXISTS' }]
          });
        }
      }

      const { data, error } = await supabase
        .from('subjects')
        .insert([{
          code: code || null,
          title,
          description: description || null
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create subject',
        error: error.message
      });
    }
  }

  static async updateSubject(req, res) {
    try {
      const { id } = req.params;
      const { code, title, description } = req.body;

      const subject = await Subject.findById(parseInt(id));
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Check code uniqueness if changed
      if (code && code !== subject.code) {
        const existing = await Subject.findByCode(code);
        if (existing) {
          return res.status(400).json({
            success: false,
            errors: [{ field: 'code', message: 'Subject code already exists', code: 'CODE_EXISTS' }]
          });
        }
      }

      const updateData = {};
      if (code !== undefined) updateData.code = code;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;

      const { data, error } = await supabase
        .from('subjects')
        .update(updateData)
        .eq('id', parseInt(id))
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update subject',
        error: error.message
      });
    }
  }

  static async deleteSubject(req, res) {
    try {
      const { id } = req.params;

      const subject = await Subject.findById(parseInt(id));
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete subject',
        error: error.message
      });
    }
  }

  // ===== QUESTIONS =====

  static async createQuestion(req, res) {
    try {
      const { level_id, question_text, type, metadata, order_index, choices } = req.body;

      if (!level_id || !question_text) {
        return res.status(400).json({
          success: false,
          errors: [
            { field: 'level_id', message: 'Level ID is required', code: 'LEVEL_ID_REQUIRED' },
            { field: 'question_text', message: 'Question text is required', code: 'QUESTION_TEXT_REQUIRED' }
          ]
        });
      }

      // Validate level exists
      const level = await Level.findById(parseInt(level_id));
      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      // Create question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert([{
          level_id: parseInt(level_id),
          question_text,
          type: type || 'single_choice',
          metadata: metadata || {},
          order_index: order_index || 0,
          created_by: req.user.id
        }])
        .select()
        .single();

      if (questionError) throw questionError;

      // Create choices if provided
      if (choices && Array.isArray(choices) && choices.length > 0) {
        const choicesData = choices.map((choice, index) => ({
          question_id: question.id,
          choice_text: choice.choice_text,
          is_correct: choice.is_correct || false,
          order_index: choice.order_index !== undefined ? choice.order_index : index
        }));

        const { data: createdChoices, error: choicesError } = await supabase
          .from('choices')
          .insert(choicesData)
          .select();

        if (choicesError) throw choicesError;

        question.choices = createdChoices;
      }

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: question
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create question',
        error: error.message
      });
    }
  }

  static async updateQuestion(req, res) {
    try {
      const { id } = req.params;
      const { question_text, type, metadata, order_index, choices } = req.body;

      const question = await Question.findById(parseInt(id), true);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      const updateData = {};
      if (question_text !== undefined) updateData.question_text = question_text;
      if (type !== undefined) updateData.type = type;
      if (metadata !== undefined) updateData.metadata = metadata;
      if (order_index !== undefined) updateData.order_index = order_index;

      if (Object.keys(updateData).length > 0) {
        const { data, error } = await supabase
          .from('questions')
          .update(updateData)
          .eq('id', parseInt(id))
          .select()
          .single();

        if (error) throw error;
      }

      // Update choices if provided
      if (choices && Array.isArray(choices)) {
        // Delete existing choices
        await supabase
          .from('choices')
          .delete()
          .eq('question_id', parseInt(id));

        // Create new choices
        if (choices.length > 0) {
          const choicesData = choices.map((choice, index) => ({
            question_id: parseInt(id),
            choice_text: choice.choice_text,
            is_correct: choice.is_correct || false,
            order_index: choice.order_index !== undefined ? choice.order_index : index
          }));

          const { error: choicesError } = await supabase
            .from('choices')
            .insert(choicesData);

          if (choicesError) throw choicesError;
        }
      }

      // Fetch updated question with choices
      const updatedQuestion = await Question.findById(parseInt(id), true);

      res.status(200).json({
        success: true,
        message: 'Question updated successfully',
        data: updatedQuestion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update question',
        error: error.message
      });
    }
  }

  static async deleteQuestion(req, res) {
    try {
      const { id } = req.params;

      const question = await Question.findById(parseInt(id));
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      // Delete choices first (CASCADE should handle this, but explicit is better)
      await supabase
        .from('choices')
        .delete()
        .eq('question_id', parseInt(id));

      // Delete question
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete question',
        error: error.message
      });
    }
  }

  // ===== MATERIALS =====

  static async createMaterial(req, res) {
    try {
      const { level_id, content, order_index } = req.body;

      if (!level_id || !content) {
        return res.status(400).json({
          success: false,
          errors: [
            { field: 'level_id', message: 'Level ID is required', code: 'LEVEL_ID_REQUIRED' },
            { field: 'content', message: 'Content is required', code: 'CONTENT_REQUIRED' }
          ]
        });
      }

      // Validate level exists
      const level = await Level.findById(parseInt(level_id));
      if (!level) {
        return res.status(404).json({
          success: false,
          message: 'Level not found'
        });
      }

      // Validate content is JSONB
      let contentData;
      if (typeof content === 'string') {
        try {
          contentData = JSON.parse(content);
        } catch (e) {
          return res.status(400).json({
            success: false,
            errors: [{ field: 'content', message: 'Content must be valid JSON', code: 'INVALID_JSON' }]
          });
        }
      } else {
        contentData = content;
      }

      const material = await Material.create({
        level_id: parseInt(level_id),
        content: contentData,
        order_index: order_index || 0
      });

      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: material
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create material',
        error: error.message
      });
    }
  }

  static async updateMaterial(req, res) {
    try {
      const { id } = req.params;
      const { content, order_index } = req.body;

      const material = await Material.findById(parseInt(id));
      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }

      const updateData = {};
      if (content !== undefined) {
        let contentData;
        if (typeof content === 'string') {
          try {
            contentData = JSON.parse(content);
          } catch (e) {
            return res.status(400).json({
              success: false,
              errors: [{ field: 'content', message: 'Content must be valid JSON', code: 'INVALID_JSON' }]
            });
          }
        } else {
          contentData = content;
        }
        updateData.content = contentData;
      }
      if (order_index !== undefined) updateData.order_index = order_index;

      const updatedMaterial = await Material.update(parseInt(id), updateData);

      res.status(200).json({
        success: true,
        message: 'Material updated successfully',
        data: updatedMaterial
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update material',
        error: error.message
      });
    }
  }

  static async deleteMaterial(req, res) {
    try {
      const { id } = req.params;

      const material = await Material.findById(parseInt(id));
      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }

      await Material.delete(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Material deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete material',
        error: error.message
      });
    }
  }
}

module.exports = AdminController;

