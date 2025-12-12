const UserProfile = require('../../models/UserProfile');
const UserSubject = require('../../models/UserSubject');
const UserPoints = require('../../models/UserPoints');
const UserStreaks = require('../../models/UserStreaks');
const StorageService = require('../../services/storageService');
const supabase = require('../../config/db');

class ProfileController {
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const profile = await UserProfile.findByUserId(userId);
      const profileComplete = await UserProfile.isComplete(userId);
      const userSubjects = await UserSubject.findByUserId(userId);
      const userPoints = await UserPoints.getByUserId(userId);
      const userStreaks = await UserStreaks.getByUserId(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      const pointsData = userPoints ? {
        total: userPoints.total_points || 0,
        weekly: userPoints.weekly_points || 0,
        monthly: userPoints.monthly_points || 0
      } : {
        total: 0,
        weekly: 0,
        monthly: 0
      };

      const streakData = userStreaks ? {
        current: userStreaks.current_streak || 0,
        longest: userStreaks.longest_streak || 0,
        last_active_date: userStreaks.last_active_date || null
      } : {
        current: 0,
        longest: 0,
        last_active_date: null
      };

      res.status(200).json({
        success: true,
        data: {
          profile,
          subjects: userSubjects,
          profile_complete: profileComplete,
          points: pointsData,
          // Alias untuk kompatibilitas
          total_points: pointsData.total,
          weekly_points: pointsData.weekly,
          monthly_points: pointsData.monthly,
          // Streak data
          streak: streakData,
          // Alias untuk kompatibilitas
          current_streak: streakData.current,
          longest_streak: streakData.longest
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  static async completeProfile(req, res) {
    try {
      const userId = req.user.id;
      const { full_name, gender, grade_level_id, class_id, bio, subject_ids } = req.body;

      // Validate required fields
      if (!full_name) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'full_name', message: 'Full name is required', code: 'FULL_NAME_REQUIRED' }]
        });
      }

      if (!gender) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'gender', message: 'Gender is required', code: 'GENDER_REQUIRED' }]
        });
      }

      if (!grade_level_id) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'grade_level_id', message: 'Grade level is required', code: 'GRADE_LEVEL_REQUIRED' }]
        });
      }

      if (!class_id) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'class_id', message: 'Class is required', code: 'CLASS_REQUIRED' }]
        });
      }

      if (!subject_ids || !Array.isArray(subject_ids) || subject_ids.length === 0) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'subject_ids', message: 'At least one subject must be selected', code: 'SUBJECT_IDS_REQUIRED' }]
        });
      }

      // Map and validate frontend input (school level + grade number) to database IDs
      // Frontend mengirim:
      // - class_id: school level (1=Elementary, 2=Middle, 3=High)
      // - grade_level_id: grade number (1-6 untuk SD, 1-3 untuk SMP/SMA)
      const mappingResult = await UserProfile.mapAndValidateClassGrade(
        parseInt(class_id),
        parseInt(grade_level_id)
      );

      if (!mappingResult.valid) {
        return res.status(400).json({
          success: false,
          errors: [{
            field: mappingResult.error.includes('school level') ? 'class_id' : 
                   mappingResult.error.includes('grade number') ? 'grade_level_id' : 'class_id',
            message: mappingResult.error || 'Class does not belong to the selected grade level',
            code: 'INVALID_CLASS_GRADE'
          }]
        });
      }

      // Use mapped IDs from database
      const dbClassId = mappingResult.classId;
      const dbGradeLevelId = mappingResult.gradeLevelId;

      // Validate subject IDs
      const subjectValidation = await UserSubject.validateSubjectIds(subject_ids);
      if (!subjectValidation.valid) {
        return res.status(400).json({
          success: false,
          errors: [{
            field: 'subject_ids',
            message: `Invalid subject IDs: ${subjectValidation.invalidIds.join(', ')}`,
            code: 'INVALID_SUBJECT_IDS'
          }]
        });
      }

      const updateData = {
        full_name,
        gender,
        grade_level_id: dbGradeLevelId,
        class_id: dbClassId
      };
      if (bio !== undefined) updateData.bio = bio;

      const profile = await UserProfile.update(userId, updateData);

      await UserSubject.setUserSubjects(userId, subject_ids);
      const userSubjects = await UserSubject.findByUserId(userId);

      const profileComplete = await UserProfile.isComplete(userId);

      res.status(200).json({
        success: true,
        message: 'Profile completed successfully',
        data: {
          profile,
          subjects: userSubjects,
          profile_complete: profileComplete
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to complete profile',
        error: error.message
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { full_name, gender, grade_level_id, class_id, bio, avatar_url } = req.body;

      const updateData = {};
      let dbClassId = null;
      let dbGradeLevelId = null;

      if (class_id || grade_level_id) {
        const currentProfile = await UserProfile.findByUserId(userId);
        const frontendClassId = class_id !== undefined ? parseInt(class_id) : currentProfile?.class_id;
        const frontendGradeLevelId = grade_level_id !== undefined ? parseInt(grade_level_id) : currentProfile?.grade_level_id;

        if (frontendClassId && frontendGradeLevelId) {
          // Check if values are already database IDs (large numbers) or frontend format (small numbers)
          // If both are provided and grade_level_id is <= 6, treat as frontend format
          const isFrontendFormat = frontendGradeLevelId <= 6 && frontendClassId <= 3;
          
          if (isFrontendFormat) {
            // Map frontend format to database IDs
            const mappingResult = await UserProfile.mapAndValidateClassGrade(
              frontendClassId,
              frontendGradeLevelId
            );

            if (!mappingResult.valid) {
              return res.status(400).json({
                success: false,
                errors: [{
                  field: 'class_id',
                  message: mappingResult.error || 'Class does not belong to the selected grade level',
                  code: 'INVALID_CLASS_GRADE'
                }]
              });
            }

            // Store mapped IDs
            dbClassId = mappingResult.classId;
            dbGradeLevelId = mappingResult.gradeLevelId;
          } else {
            // Already in database format, validate directly
            const isValid = await UserProfile.validateClassGrade(
              frontendClassId,
              frontendGradeLevelId
            );
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

            // Use provided IDs directly
            dbClassId = frontendClassId;
            dbGradeLevelId = frontendGradeLevelId;
          }
        }
      }

      if (full_name !== undefined) updateData.full_name = full_name;
      if (gender !== undefined) updateData.gender = gender;
      if (dbGradeLevelId !== null) updateData.grade_level_id = dbGradeLevelId;
      if (dbClassId !== null) updateData.class_id = dbClassId;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar_url !== undefined) {
        // Validasi URL format
        if (avatar_url && avatar_url.trim() !== '') {
          try {
            new URL(avatar_url);
            updateData.avatar_url = avatar_url.trim();
          } catch (e) {
            return res.status(400).json({
              success: false,
              errors: [{
                field: 'avatar_url',
                message: 'Avatar URL must be a valid URL',
                code: 'INVALID_AVATAR_URL'
              }]
            });
          }
        } else {
          // Allow empty string to remove avatar
          updateData.avatar_url = null;
        }
      }

      const profile = await UserProfile.update(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          profile
        }
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }

  // Update avatar only
  static async updateAvatar(req, res) {
    try {
      const userId = req.user.id;
      const { avatar_url } = req.body;

      if (avatar_url === undefined) {
        return res.status(400).json({
          success: false,
          errors: [{
            field: 'avatar_url',
            message: 'Avatar URL is required',
            code: 'AVATAR_URL_REQUIRED'
          }]
        });
      }

      const updateData = {};
      
      if (avatar_url && avatar_url.trim() !== '') {
        // Validasi URL format
        try {
          new URL(avatar_url);
          updateData.avatar_url = avatar_url.trim();
        } catch (e) {
          return res.status(400).json({
            success: false,
            errors: [{
              field: 'avatar_url',
              message: 'Avatar URL must be a valid URL',
              code: 'INVALID_AVATAR_URL'
            }]
          });
        }
      } else {
        // Allow empty string to remove avatar
        updateData.avatar_url = null;
      }

      const profile = await UserProfile.update(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Avatar updated successfully',
        data: {
          profile
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update avatar',
        error: error.message
      });
    }
  }

  // Upload avatar langsung ke Supabase Storage
  static async uploadAvatar(req, res) {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          errors: [{
            field: 'avatar',
            message: 'Avatar file is required',
            code: 'AVATAR_REQUIRED'
          }]
        });
      }

      // Validate file
      const validation = StorageService.validateFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: [{
            field: 'avatar',
            message: validation.error,
            code: 'INVALID_FILE'
          }]
        });
      }

      // Upload to Supabase Storage
      const uploadResult = await StorageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'avatars',
        `user-${userId}`
      );

      // Delete old avatar if exists
      const currentProfile = await UserProfile.findByUserId(userId);
      if (currentProfile && currentProfile.avatar_url) {
        try {
          // Extract path from URL
          const urlParts = currentProfile.avatar_url.split('/');
          const pathIndex = urlParts.indexOf('avatars');
          if (pathIndex !== -1) {
            const oldPath = urlParts.slice(pathIndex + 1).join('/');
            await StorageService.deleteFile(oldPath, 'avatars');
          }
        } catch (deleteError) {
          // Ignore delete error, continue with update
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to delete old avatar:', deleteError.message);
          }
        }
      }

      // Update profile with new avatar URL
      const profile = await UserProfile.update(userId, {
        avatar_url: uploadResult.url
      });

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          profile,
          upload: {
            url: uploadResult.url,
            path: uploadResult.path
          }
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Upload avatar error:', error.message);
        console.error('Stack:', error.stack);
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.stack
        })
      });
    }
  }
}

module.exports = ProfileController;
