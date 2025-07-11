const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://manazra.com',
        'X-Title': 'Manazra - AI Conversation Tool',
        'Content-Type': 'application/json',
      },
    });
  }

  async getAvailableModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.data.filter(model => !model.id.includes('free')); // Filter out free models for quality
    } catch (error) {
      console.error('Error fetching models:', error.response?.data || error.message);
      throw new Error('Failed to fetch available models');
    }
  }

  async generateResponse(model, messages, systemPrompt = '', temperature = 0.7) {
    try {
      const requestData = {
        model: model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ],
        temperature: temperature,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      };

      const response = await this.client.post('/chat/completions', requestData);
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error.response?.data || error.message);
      throw new Error(`Failed to generate response from ${model}: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateMultipleResponses(models, messages, systemPrompts = {}, tones = {}) {
    const responses = [];
    
    for (const model of models) {
      try {
        const systemPrompt = this.buildSystemPrompt(systemPrompts[model.id], tones[model.id]);
        const response = await this.generateResponse(model.id, messages, systemPrompt);
        
        responses.push({
          model: model,
          response: response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Error with model ${model.id}:`, error.message);
        responses.push({
          model: model,
          response: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
          error: true,
        });
      }
    }
    
    return responses;
  }

  buildSystemPrompt(customPrompt, tone) {
    let systemPrompt = customPrompt || 'You are a helpful AI assistant participating in a group discussion.';
    
    if (tone) {
      const toneInstructions = {
        'professional': 'Maintain a professional and formal tone in your responses.',
        'casual': 'Use a casual, friendly, and conversational tone.',
        'academic': 'Provide detailed, analytical responses with academic rigor.',
        'creative': 'Be creative, imaginative, and think outside the box.',
        'humorous': 'Add appropriate humor and wit to your responses.',
        'diplomatic': 'Be diplomatic, balanced, and consider multiple perspectives.',
        'direct': 'Be direct, concise, and to the point.',
        'empathetic': 'Show empathy and understanding in your responses.',
      };
      
      systemPrompt += ` ${toneInstructions[tone] || ''}`;
    }
    
    return systemPrompt;
  }
}

module.exports = new OpenRouterService(); 