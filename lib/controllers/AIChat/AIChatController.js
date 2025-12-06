const AIChatSession = require('../../models/AIChatSession');
const AIChatMessage = require('../../models/AIChatMessage');

class AIChatController {
  // Create new chat session
  static async createSession(req, res) {
    try {
      const userId = req.user.id;
      const { subject_id, level_id } = req.body;

      const session = await AIChatSession.create({
        user_id: userId,
        subject_id: subject_id || null,
        level_id: level_id || null
      });

      res.status(201).json({
        success: true,
        message: 'Chat session created',
        data: session
      });
    } catch (error) {
      console.error('Create chat session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat session',
        error: error.message
      });
    }
  }

  // Get all user sessions
  static async getSessions(req, res) {
    try {
      const userId = req.user.id;

      const sessions = await AIChatSession.findByUserId(userId);

      res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat sessions',
        error: error.message
      });
    }
  }

  // Get messages in session
  static async getMessages(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Verify session belongs to user
      const session = await AIChatSession.findById(parseInt(sessionId));
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      const messages = await AIChatMessage.findBySessionId(parseInt(sessionId));

      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        error: error.message
      });
    }
  }

  // Send message (placeholder - AI integration needed)
  static async sendMessage(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'message', message: 'Message is required', code: 'MESSAGE_REQUIRED' }]
        });
      }

      // Verify session
      const session = await AIChatSession.findById(parseInt(sessionId));
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Save user message
      const userMessage = await AIChatMessage.create({
        session_id: parseInt(sessionId),
        sender: 'user',
        message
      });

      // TODO: Integrate with AI service (OpenAI, Gemini, etc.)
      // For now, return placeholder response
      const aiResponse = await AIChatMessage.create({
        session_id: parseInt(sessionId),
        sender: 'bot',
        message: 'AI chat feature coming soon! This is a placeholder response.',
        metadata: { model: 'placeholder' }
      });

      res.status(200).json({
        success: true,
        data: {
          user_message: userMessage,
          ai_message: aiResponse
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }
}

module.exports = AIChatController;

