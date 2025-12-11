const UserProfile = require('../../models/UserProfile');
const UserSubject = require('../../models/UserSubject');
const supabase = require('../../config/db');

class ProfileController {
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const profile = await UserProfile.findByUserId(userId);
      const profileComplete = await UserProfile.isComplete(userId);
      const userSubjects = await UserSubject.findByUserId(userId);

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
          subjects: userSubjects,
          profile_complete: profileComplete
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
      const { full_name, gender, grade_level_id, class_id, bio } = req.body;

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
}

module.exports = ProfileController;
