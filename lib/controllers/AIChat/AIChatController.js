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

      // Tambahkan current user message ke conversation history untuk context
      const formattedHistory = [
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message
        })),
        {
          role: 'user',
          content: message.trim()
        }
      ];

      try {
        // Generate AI response menggunakan Google Gemini
        const aiResponseData = await geminiService.generateResponse(
          formattedHistory,
          context
        );

        // Validasi response dari Gemini
        if (!aiResponseData || !aiResponseData.content) {
          throw new Error('AI tidak memberikan respons yang valid');
        }

        // Save AI response
        const aiResponse = await AIChatMessage.create({
          session_id: parseInt(sessionId),
          sender: 'bot',
          message: aiResponseData.content.trim(),
          metadata: {
            model: aiResponseData.model || 'gemini-2.5-flash',
            usage: aiResponseData.usage,
            finish_reason: aiResponseData.finish_reason
          }
        });

        // Pastikan response lengkap sebelum dikirim
        if (!aiResponse || !aiResponse.message) {
          throw new Error('Gagal menyimpan respons AI');
        }

        res.status(200).json({
          success: true,
          data: {
            user_message: userMessage,
            ai_message: aiResponse
          }
        });
      } catch (aiError) {
        // Log error hanya di development
        if (process.env.NODE_ENV === 'development') {
          console.error('AI Service Error:', aiError.message);
        }

        // Fallback response jika AI service error
        let fallbackMessage = 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.';
        
        if (aiError.message.includes('API key') || aiError.message.includes('GEMINI_API_KEY')) {
          fallbackMessage = 'Layanan AI sedang dalam maintenance. Silakan coba lagi nanti atau hubungi administrator.';
        } else if (aiError.message.includes('Rate limit') || 
                   aiError.message.includes('QUOTA_EXCEEDED') || 
                   aiError.message.includes('RESOURCE_EXHAUSTED') ||
                   aiError.message.includes('429')) {
          fallbackMessage = 'Batas penggunaan harian tercapai. Batas gratis: ~60 request/hari. Silakan coba lagi besok atau verifikasi akun untuk batas lebih tinggi.';
        } else if (aiError.message.includes('401') || aiError.message.includes('API_KEY_INVALID')) {
          fallbackMessage = 'Konfigurasi AI service tidak valid. Silakan hubungi administrator.';
        } else if (aiError.message.includes('Invalid response format')) {
          fallbackMessage = 'Layanan AI mengalami masalah teknis. Silakan coba lagi nanti.';
        }

        const aiResponse = await AIChatMessage.create({
          session_id: parseInt(sessionId),
          sender: 'bot',
          message: fallbackMessage,
          metadata: {
            model: 'fallback',
            error: aiError.message,
            error_type: aiError.name || 'UnknownError',
            timestamp: new Date().toISOString()
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Send message error:', error.message);
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }

  // Test API key endpoint
  static async testApiKey(req, res) {
    try {
      const geminiService = require('../../services/geminiService');
      
      // Check if API key exists
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          success: false,
          message: 'GEMINI_API_KEY tidak ditemukan di environment variables',
          error: 'API key tidak dikonfigurasi'
        });
      }

      // Test API key dengan request sederhana
      const testResult = await geminiService.validateApiKey();
      
      if (testResult.valid) {
        res.status(200).json({
          success: true,
          message: 'API key valid dan berfungsi',
          data: {
            api_key_exists: true,
            api_key_length: process.env.GEMINI_API_KEY.length,
            api_key_preview: process.env.GEMINI_API_KEY.substring(0, 10) + '...',
            model: geminiService.model
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'API key tidak valid atau error',
          error: testResult.error,
          data: {
            api_key_exists: true,
            api_key_length: process.env.GEMINI_API_KEY.length,
            api_key_preview: process.env.GEMINI_API_KEY.substring(0, 10) + '...'
          }
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Test API key error:', error.message);
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to test API key',
        error: error.message
      });
    }
  }
}

module.exports = AIChatController;

