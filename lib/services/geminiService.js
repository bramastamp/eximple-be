require('dotenv').config();

/**
 * Google Gemini AI Service
 * API Documentation: https://ai.google.dev/docs
 * Gratis dengan batas: ~60 request/hari (dapat ditingkatkan dengan verifikasi)
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    // Menggunakan Google AI Studio API (gratis)
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.model = 'gemini-pro';
  }

  /**
   * Generate AI response dengan context edukasi
   * @param {Array} messages - Array of messages dengan format {role: 'user'|'assistant'|'system', content: string}
   * @param {Object} context - Context informasi edukasi (subject, level, dll)
   * @returns {Promise<Object>} Response dari Gemini API
   */
  async generateResponse(messages, context = {}) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables');
    }

    // Build system prompt dengan context edukasi
    const systemPrompt = this.buildSystemPrompt(context);
    
    // Format messages untuk Gemini API
    const formattedContent = this.formatContent(messages, systemPrompt);

    try {
      const url = `${this.apiUrl}?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: formattedContent,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `Gemini API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const content = data.candidates[0].content.parts[0].text;

      return {
        content: content,
        model: this.model,
        usage: data.usageMetadata || {},
        finish_reason: data.candidates[0].finishReason
      };
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('401') || error.message.includes('API_KEY_INVALID')) {
        throw new Error('API Key tidak valid. Periksa GEMINI_API_KEY di .env');
      }
      
      if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Rate limit tercapai. Batas gratis: ~60 request/hari. Silakan coba lagi nanti atau verifikasi akun untuk batas lebih tinggi.');
      }

      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('Quota harian tercapai. Batas gratis: ~60 request/hari. Silakan coba lagi besok.');
      }

      throw error;
    }
  }

  /**
   * Build system prompt dengan context edukasi
   */
  buildSystemPrompt(context) {
    let prompt = `Kamu adalah asisten AI tutor yang sabar dan edukatif untuk membantu siswa belajar. 
Tugasmu adalah membantu siswa memahami materi, menyelesaikan tugas, dan menjawab pertanyaan mereka.

Panduan dalam memberikan bantuan:
1. Jangan langsung memberikan jawaban lengkap, tetapi bimbing siswa untuk menemukan jawabannya sendiri
2. Berikan penjelasan yang jelas dan bertahap
3. Gunakan contoh yang relevan dan mudah dipahami
4. Jika siswa bingung, tanyakan lebih detail untuk memahami masalahnya
5. Berikan motivasi dan dukungan positif
6. Jawab dalam bahasa Indonesia yang baik dan benar`;

    // Tambahkan context subject jika ada
    if (context.subject) {
      prompt += `\n\nKonteks Pembelajaran:
- Mata Pelajaran: ${context.subject.title || context.subject.code || 'Tidak ditentukan'}
${context.subject.description ? `- Deskripsi: ${context.subject.description}` : ''}`;
    }

    // Tambahkan context level jika ada
    if (context.level) {
      prompt += `\n- Level: ${context.level.title || 'Tidak ditentukan'}
${context.level.description ? `- Deskripsi Level: ${context.level.description}` : ''}`;
    }

    return prompt;
  }

  /**
   * Format content untuk Gemini API
   * Gemini menggunakan format yang berbeda dari OpenAI
   */
  formatContent(messages, systemPrompt) {
    const contents = [];

    // Gemini tidak memiliki system role, jadi kita gabungkan system prompt ke user message pertama
    let systemPromptAdded = false;

    messages.forEach((msg, index) => {
      if (msg.role && msg.content) {
        // Format dari API
        if (msg.role === 'system') {
          // System prompt akan digabungkan dengan user message pertama
          return;
        }
        
        if (msg.role === 'user' && !systemPromptAdded && systemPrompt) {
          // Gabungkan system prompt dengan user message pertama
          contents.push({
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${msg.content}` }]
          });
          systemPromptAdded = true;
        } else {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      } else if (msg.sender && msg.message) {
        // Format dari database
        if (msg.sender === 'user' && !systemPromptAdded && systemPrompt) {
          // Gabungkan system prompt dengan user message pertama
          contents.push({
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${msg.message}` }]
          });
          systemPromptAdded = true;
        } else {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.message }]
          });
        }
      }
    });

    // Jika tidak ada messages, tambahkan system prompt sebagai user message
    if (contents.length === 0 && systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
    }

    return contents;
  }

  /**
   * Check apakah API key valid
   */
  async validateApiKey() {
    if (!this.apiKey) {
      return { valid: false, error: 'API key tidak ditemukan' };
    }

    try {
      const url = `${this.apiUrl}?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'test' }]
          }],
          generationConfig: {
            maxOutputTokens: 5
          }
        })
      });

      return {
        valid: response.ok,
        error: response.ok ? null : `Status: ${response.status}`
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeminiService();

