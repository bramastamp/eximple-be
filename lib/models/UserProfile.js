const supabase = require('../config/db');

class UserProfile {
  static async create(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        grade_levels (id, name),
        classes (id, name, grade_level_id)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async update(userId, profileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async isComplete(userId) {
    const profile = await this.findByUserId(userId);
    
    if (!profile) return false;

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (user?.role === 'student') {
      const profileFieldsComplete = !!(profile.full_name && profile.gender && profile.grade_level_id && profile.class_id);
      
      const { data: userSubjects } = await supabase
        .from('user_subjects')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      const hasSubjects = userSubjects && userSubjects.length > 0;
      
      return profileFieldsComplete && hasSubjects;
    } else {
      return !!profile.full_name;
    }
  }

  static mapSchoolLevelToGradeLevelId(schoolLevel) {
    const mapping = {
      1: 1, 
      2: 2,
      3: 3  
    };
    return mapping[schoolLevel] || null;
  }


  static async findClassIdByGrade(gradeLevelId, gradeNumber) {
    if (!gradeLevelId || !gradeNumber) return null;
  
    const { data: gradeLevel, error: gradeError } = await supabase
      .from('grade_levels')
      .select('name')
      .eq('id', gradeLevelId)
      .single();

    if (gradeError || !gradeLevel) return null;

    const gradeLevelName = gradeLevel.name; 
    const className = `${gradeNumber} ${gradeLevelName}`;

    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('grade_level_id', gradeLevelId)
      .eq('name', className)
      .single();

    if (classError || !classData) return null;
    return classData.id;
  }

  static async mapAndValidateClassGrade(frontendClassId, frontendGradeLevelId) {
    if (!frontendClassId || !frontendGradeLevelId) {
      return {
        valid: false,
        classId: null,
        gradeLevelId: null,
        error: 'class_id and grade_level_id are required'
      };
    }

    // Map school level to grade_level_id
    const gradeLevelId = this.mapSchoolLevelToGradeLevelId(frontendClassId);
    if (!gradeLevelId) {
      return {
        valid: false,
        classId: null,
        gradeLevelId: null,
        error: 'Invalid school level. Must be 1 (Elementary), 2 (Middle), or 3 (High)'
      };
    }

    // Validate grade number range
    const maxGrade = frontendClassId === 1 ? 6 : 3; // SD: 1-6, SMP/SMA: 1-3
    if (frontendGradeLevelId < 1 || frontendGradeLevelId > maxGrade) {
      return {
        valid: false,
        classId: null,
        gradeLevelId: null,
        error: `Invalid grade number. Must be between 1 and ${maxGrade} for the selected school level`
      };
    }

    // Find actual class_id from database
    const classId = await this.findClassIdByGrade(gradeLevelId, frontendGradeLevelId);
    if (!classId) {
      return {
        valid: false,
        classId: null,
        gradeLevelId: null,
        error: `Class not found for grade ${frontendGradeLevelId} in the selected school level`
      };
    }

    // Validate the relationship
    const isValid = await this.validateClassGrade(classId, gradeLevelId);
    if (!isValid) {
      return {
        valid: false,
        classId: null,
        gradeLevelId: null,
        error: 'Class does not belong to the selected grade level'
      };
    }

    return {
      valid: true,
      classId,
      gradeLevelId,
      error: null
    };
  }

  static async validateClassGrade(classId, gradeLevelId) {
    if (!classId || !gradeLevelId) return false;

    const { data, error } = await supabase
      .from('classes')
      .select('grade_level_id')
      .eq('id', classId)
      .eq('grade_level_id', gradeLevelId)
      .single();

    if (error || !data) return false;
    return true;
  }
}

module.exports = UserProfile;
