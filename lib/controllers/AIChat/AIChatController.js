const AIChatSession = require('../../models/AIChatSession');
const AIChatMessage = require('../../models/AIChatMessage');
const geminiService = require('../../services/geminiService');
const Subject = require('../../models/Subject');
const Level = require('../../models/Level');

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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        error: error.message
      });
    }
  }

  // Send message dengan integrasi Google Gemini AI
  static async sendMessage(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
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
        message: message.trim()
      });

      // Get context information (subject & level) jika ada
      let context = {};
      if (session.subject_id) {
        const subject = await Subject.findById(session.subject_id);
        if (subject) {
          context.subject = subject;
        }
      }
      if (session.level_id) {
        const level = await Level.findById(session.level_id);
        if (level) {
          context.level = level;
        }
      }

      // Get previous messages untuk context conversation
      const previousMessages = await AIChatMessage.findBySessionId(parseInt(sessionId));
      
      // Filter hanya messages sebelum message saat ini (exclude current user message)
      const conversationHistory = previousMessages
        .filter(msg => msg.id !== userMessage.id)
        .slice(-10); // Ambil 10 pesan terakhir untuk context (bisa disesuaikan)

      try {
        // Generate AI response menggunakan Google Gemini
        const aiResponseData = await geminiService.generateResponse(
          conversationHistory,
          context
        );

        // Save AI response
        const aiResponse = await AIChatMessage.create({
          session_id: parseInt(sessionId),
          sender: 'bot',
          message: aiResponseData.content,
          metadata: {
            model: aiResponseData.model || 'gemini-pro',
            usage: aiResponseData.usage,
            finish_reason: aiResponseData.finish_reason
          }
        });

        res.status(200).json({
          success: true,
          data: {
            user_message: userMessage,
            ai_message: aiResponse
          }
        });
      } catch (aiError) {
        // Fallback response jika AI service error
        const fallbackMessage = aiError.message.includes('API key') 
          ? 'Layanan AI sedang dalam maintenance. Silakan coba lagi nanti atau hubungi administrator.'
          : aiError.message.includes('Rate limit') || aiError.message.includes('QUOTA_EXCEEDED')
          ? 'Batas penggunaan harian tercapai. Batas gratis: ~60 request/hari. Silakan coba lagi besok atau verifikasi akun untuk batas lebih tinggi.'
          : 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.';

        const aiResponse = await AIChatMessage.create({
          session_id: parseInt(sessionId),
          sender: 'bot',
          message: fallbackMessage,
          metadata: {
            model: 'fallback',
            error: aiError.message
          }
        });

        res.status(200).json({
          success: true,
          data: {
            user_message: userMessage,
            ai_message: aiResponse
          },
          warning: 'AI service mengalami masalah, menggunakan fallback response'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }
}

module.exports = AIChatController;

