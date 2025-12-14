const supabase = require('../config/db');

class UserProgress {
  static async create(userId, levelId, progressData = {}) {
    const { status = 'in_progress', progress = {}, points_earned = 0 } = progressData;

    const { data, error } = await supabase
      .from('user_progress')
      .insert([{
        user_id: userId,
        level_id: levelId,
        status,
        progress,
        points_earned
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByUserAndLevel(userId, levelId) {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        levels (
          id,
          level_index,
          title,
          points_reward,
          estimated_minutes,
          subject_level_id
        )
      `)
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByUserId(userId, filters = {}) {
    let query = supabase
      .from('user_progress')
      .select(`
        *,
        levels (
          id,
          level_index,
          title,
          description,
          points_reward,
          estimated_minutes,
          subject_level_id,
          subject_levels (
            id,
            subject_id,
            class_id,
            subjects (
              id,
              code,
              title
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
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async update(userId, levelId, progressData) {
    const { data, error } = await supabase
      .from('user_progress')
      .update(progressData)
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async complete(userId, levelId, pointsEarned = 0) {
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        status: 'completed',
        points_earned: pointsEarned,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getJourneyMap(userId, subjectLevelId) {
    // Get all levels in subject level
    const { data: levels, error: levelsError } = await supabase
      .from('levels')
      .select('id, level_index, title, points_reward')
      .eq('subject_level_id', subjectLevelId)
      .order('level_index', { ascending: true });

    if (levelsError) throw levelsError;

    // Get user progress for these levels
    const levelIds = levels.map(level => level.id);
    
    const { data: progressList, error: progressError } = await supabase
      .from('user_progress')
      .select('level_id, status, progress, points_earned, started_at, completed_at')
      .eq('user_id', userId)
      .in('level_id', levelIds);

    if (progressError) throw progressError;

    // Map progress to levels
    const progressMap = {};
    (progressList || []).forEach(progress => {
      progressMap[progress.level_id] = progress;
    });

    // Build journey map with unlock logic
    const journeyMap = levels.map((level, index) => {
      const progress = progressMap[level.id];
      
      let journeyStatus = 'locked';
      let isUnlocked = false;

      // If level has progress, use its status
      if (progress) {
        if (progress.status === 'completed') {
          journeyStatus = 'completed';
          isUnlocked = true;
        } else if (progress.status === 'in_progress') {
          journeyStatus = 'in_progress';
          isUnlocked = true;
        }
      } else {
        // No progress - check unlock logic
        if (index === 0) {
          // First level is always unlocked
          journeyStatus = 'current';
          isUnlocked = true;
        } else {
          // Check if previous level is completed
          const prevLevel = levels[index - 1];
          const prevProgress = progressMap[prevLevel.id];
          
          if (prevProgress && prevProgress.status === 'completed') {
            // Previous level completed, this level should be unlocked
            journeyStatus = 'current';
            isUnlocked = true;
          } else {
            // Previous level not completed, this level is locked
            journeyStatus = 'locked';
            isUnlocked = false;
          }
        }
      }

      return {
        level_id: level.id,
        level_index: level.level_index,
        title: level.title,
        points_reward: level.points_reward,
        status: progress?.status || null,
        journey_status: journeyStatus,
        is_unlocked: isUnlocked,
        progress: progress?.progress || null,
        points_earned: progress?.points_earned || 0,
        started_at: progress?.started_at || null,
        completed_at: progress?.completed_at || null
      };
    });

    return journeyMap;
  }

  static async getProgressStats(userId) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      completed: data?.filter(p => p.status === 'completed').length || 0,
      in_progress: data?.filter(p => p.status === 'in_progress').length || 0
    };

    return stats;
  }
}

module.exports = UserProgress;

