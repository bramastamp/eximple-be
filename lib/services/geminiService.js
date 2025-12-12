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
    // Model yang berhasil: gemini-2.5-flash (v1) - TESTED & WORKING ✅
    // API version: v1 (bukan v1beta)
    // Dokumentasi: https://ai.google.dev/docs
    // Catatan: gemini-2.5-pro memerlukan paid tier, gemini-pro dan gemini-1.5-flash sudah deprecated
    this.model = 'gemini-2.5-flash'; // Model yang berhasil dan gratis
    this.apiVersion = 'v1'; // Gunakan v1 (bukan v1beta)
    this.apiUrl = `https://generativelanguage.googleapis.com/${this.apiVersion}/models/${this.model}:generateContent`;
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

    // Validasi messages
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages harus berupa array yang tidak kosong');
    }

    // Build system prompt dengan context edukasi
    const systemPrompt = this.buildSystemPrompt(context);
    
    // Format messages untuk Gemini API
    const formattedContent = this.formatContent(messages, systemPrompt);

    // Validasi formatted content
    if (!formattedContent || formattedContent.length === 0) {
      throw new Error('Tidak dapat memformat messages untuk Gemini API');
    }

    try {
      const url = `${this.apiUrl}?key=${this.apiKey}`;
      
      const requestBody = {
        contents: formattedContent,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };


      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorData = {};
        let errorText = '';
        try {
          errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Jika response bukan JSON, gunakan status text
          errorData = { error: { message: response.statusText || errorText } };
        }

        // Log error hanya di development
        if (process.env.NODE_ENV === 'development') {
          console.error('Gemini API Error:', response.status, errorData.error?.message || response.statusText);
        }

        const errorMessage = errorData.error?.message || 
                           errorData.message || 
                           `Gemini API error: ${response.status} ${response.statusText}`;

        // Handle specific HTTP status codes
        if (response.status === 401) {
          throw new Error('API Key tidak valid. Periksa GEMINI_API_KEY di .env');
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit tercapai. Batas gratis: ~60 request/hari. Silakan coba lagi nanti atau verifikasi akun untuk batas lebih tinggi.');
        }

        if (response.status === 400) {
          throw new Error(`Request tidak valid: ${errorMessage}`);
        }

        if (response.status >= 500) {
          throw new Error(`Server error dari Gemini API: ${errorMessage}`);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validasi response structure
      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error('Invalid response format from Gemini API: no candidates');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response format from Gemini API: no content parts');
      }

      const content = candidate.content.parts[0].text;
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('Invalid response format from Gemini API: invalid or empty content');
      }

      // Pastikan content tidak kosong
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        throw new Error('AI tidak memberikan respons (content kosong)');
      }

      return {
        content: trimmedContent,
        model: this.model || 'gemini-2.5-flash',
        usage: data.usageMetadata || {},
        finish_reason: candidate.finishReason || 'STOP'
      };
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Tidak dapat terhubung ke Gemini API. Periksa koneksi internet Anda.');
      }

      // Handle specific error cases (jika belum di-handle di atas)
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        throw new Error('API Key tidak valid. Periksa GEMINI_API_KEY di .env');
      }
      
      if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Rate limit tercapai. Batas gratis: ~60 request/hari. Silakan coba lagi nanti atau verifikasi akun untuk batas lebih tinggi.');
      }

      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('Quota harian tercapai. Batas gratis: ~60 request/hari. Silakan coba lagi besok.');
      }

      // Re-throw error dengan message yang lebih jelas jika belum di-handle
      if (!error.message || error.message.includes('Gemini API error')) {
        throw new Error(`Error dari Gemini API: ${error.message || 'Unknown error'}`);
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
      // Validasi message format
      if (!msg) {
        return;
      }

      // Format dari API (role + content)
      if (msg.role && msg.content) {
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
        } else if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(msg.content) }]
          });
        }
      } 
      // Format dari database (sender + message)
      else if (msg.sender && msg.message) {
        if (msg.sender === 'user' && !systemPromptAdded && systemPrompt) {
          // Gabungkan system prompt dengan user message pertama
          contents.push({
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${String(msg.message)}` }]
          });
          systemPromptAdded = true;
        } else if (msg.sender === 'user' || msg.sender === 'bot') {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: String(msg.message) }]
          });
        }
      }
    });

    // Jika tidak ada messages yang valid, tambahkan system prompt sebagai user message
    if (contents.length === 0) {
      if (systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
      } else {
        throw new Error('Tidak ada messages yang valid untuk dikirim ke Gemini API');
      }
    }

    // Validasi: harus dimulai dengan user message
    if (contents.length > 0 && contents[0].role !== 'user') {
      throw new Error('Conversation harus dimulai dengan user message');
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
      // Gunakan model yang sudah terbukti bekerja (dari test)
      // gemini-2.5-flash adalah satu-satunya yang bekerja untuk free tier
      const testConfigs = [
        { model: 'gemini-2.5-flash', version: 'v1' }, // ✅ TESTED & WORKING - Free tier
        // gemini-2.5-pro memerlukan paid tier (quota exceeded untuk free tier)
        // gemini-pro dan gemini-1.5-flash sudah deprecated (404)
      ];
      
      let lastError = null;
      for (const config of testConfigs) {
        const testUrl = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${this.apiKey}`;
        
        try {
          const testResponse = await fetch(testUrl, {
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
          
          if (testResponse.ok) {
            // Model dan version ini berhasil, update service
            this.model = config.model;
            this.apiVersion = config.version;
            this.apiUrl = `https://generativelanguage.googleapis.com/${this.apiVersion}/models/${this.model}:generateContent`;
            
            return {
              valid: true,
              error: null,
              workingModel: config.model,
              workingVersion: config.version
            };
          } else {
            const errorData = await testResponse.json().catch(() => ({}));
            lastError = `${config.model} (${config.version}): ${testResponse.status} - ${errorData.error?.message || testResponse.statusText}`;
            // Continue to next config
            continue;
          }
        } catch (e) {
          lastError = `${config.model} (${config.version}): ${e.message}`;
          continue;
        }
      }
      
      // All configs failed
      return {
        valid: false,
        error: lastError || 'Semua model dan version gagal. Coba cek model yang tersedia di dokumentasi.'
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

