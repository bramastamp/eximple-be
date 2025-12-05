const UserProfile = require('../models/UserProfile');
const supabase = require('../config/db');

class ProfileController {
  /**
   * Get user profile
   * GET /api/profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const profile = await UserProfile.findByUserId(userId);
      const profileComplete = await UserProfile.isComplete(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          profile,
          profile_complete: profileComplete
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  /**
   * Complete profile (onboarding)
   * PUT /api/profile/complete
   */
  static async completeProfile(req, res) {
    try {
      const userId = req.user.id;
      const { full_name, gender, grade_level_id, class_id, bio } = req.body;

      // Validate class belongs to grade level
      if (class_id && grade_level_id) {
        const isValid = await UserProfile.validateClassGrade(class_id, grade_level_id);
        if (!isValid) {
          return res.status(400).json({
            success: false,
            errors: [{
              field: 'class_id',
              message: 'Class does not belong to the selected grade level',
              code: 'INVALID_CLASS_GRADE'
            }]
          });
        }
      }

      // Validate grade level exists
      if (grade_level_id) {
        const { data: gradeLevel } = await supabase
          .from('grade_levels')
          .select('id')
          .eq('id', grade_level_id)
          .single();

        if (!gradeLevel) {
          return res.status(400).json({
            success: false,
            errors: [{
              field: 'grade_level_id',
              message: 'Grade level not found',
              code: 'GRADE_LEVEL_NOT_FOUND'
            }]
          });
        }
      }

      // Validate class exists
      if (class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .eq('id', class_id)
          .single();

        if (!classData) {
          return res.status(400).json({
            success: false,
            errors: [{
              field: 'class_id',
              message: 'Class not found',
              code: 'CLASS_NOT_FOUND'
            }]
          });
        }
      }

      // Update profile
      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (gender !== undefined) updateData.gender = gender;
      if (grade_level_id !== undefined) updateData.grade_level_id = grade_level_id;
      if (class_id !== undefined) updateData.class_id = class_id;
      if (bio !== undefined) updateData.bio = bio;

      const profile = await UserProfile.update(userId, updateData);
      const profileComplete = await UserProfile.isComplete(userId);

      res.status(200).json({
        success: true,
        message: 'Profile completed successfully',
        data: {
          profile,
          profile_complete: profileComplete
        }
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete profile',
        error: error.message
      });
    }
  }

  /**
   * Update profile
   * PUT /api/profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { full_name, gender, grade_level_id, class_id, bio } = req.body;

      // If updating class_id or grade_level_id, validate
      if (class_id || grade_level_id) {
        // Get current profile to check existing values
        const currentProfile = await UserProfile.findByUserId(userId);
        const finalGradeLevelId = grade_level_id || currentProfile?.grade_level_id;
        const finalClassId = class_id || currentProfile?.class_id;

        if (finalClassId && finalGradeLevelId) {
          const isValid = await UserProfile.validateClassGrade(finalClassId, finalGradeLevelId);
          if (!isValid) {
            return res.status(400).json({
              success: false,
              errors: [{
                field: 'class_id',
                message: 'Class does not belong to the selected grade level',
                code: 'INVALID_CLASS_GRADE'
              }]
            });
          }
        }
      }

      // Update profile
      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (gender !== undefined) updateData.gender = gender;
      if (grade_level_id !== undefined) updateData.grade_level_id = grade_level_id;
      if (class_id !== undefined) updateData.class_id = class_id;
      if (bio !== undefined) updateData.bio = bio;

      const profile = await UserProfile.update(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          profile
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
}

module.exports = ProfileController;

