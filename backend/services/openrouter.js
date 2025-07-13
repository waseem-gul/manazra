const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  }

  createClient(apiKey = null) {
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error('No API key provided');
    }
    
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://manazra.com',
        'X-Title': 'Manazra - AI Conversation Tool',
        'Content-Type': 'application/json',
      },
    });
  }

  async getAvailableModels(apiKey = null) {
    try {
      const client = this.createClient(apiKey);
      const response = await client.get('/models');
      return response.data.data.filter(model => !model.id.includes('free')); // Filter out free models for quality
    } catch (error) {
      console.error('Error fetching models:', error.response?.data || error.message);
      throw new Error('Failed to fetch available models');
    }
  }

  async generateResponse(model, messages, systemPrompt = '', temperature = 0.7, apiKey = null) {
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

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🤖 [${model}] REQUEST:`);
        console.log('━'.repeat(80));
        console.log('📋 System Prompt:', systemPrompt || 'None');
        console.log('💬 Messages (Total:', messages.length, '):', JSON.stringify(messages, null, 2));
        console.log('⚙️ Temperature:', temperature);
        console.log('━'.repeat(80));
      }

      const client = this.createClient(apiKey);
      const response = await client.post('/chat/completions', requestData);
      const content = response.data.choices[0].message.content;

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n✅ [${model}] RESPONSE:`);
        console.log('━'.repeat(80));
        console.log('📤 Content:', content);
        console.log('💰 Usage:', response.data.usage || 'No usage data');
        console.log('━'.repeat(80));
      }

      return content;
    } catch (error) {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n❌ [${model}] ERROR:`);
        console.log('━'.repeat(80));
        console.log('🚨 Error:', error.response?.data || error.message);
        console.log('━'.repeat(80));
      }
      console.error('Error generating response:', error.response?.data || error.message);
      throw new Error(`Failed to generate response from ${model}: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateStreamingResponse(model, messages, systemPrompt = '', temperature = 0.7, apiKey = null) {
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
        stream: true,
      };

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🌊 [${model}] STREAMING REQUEST:`);
        console.log('━'.repeat(80));
        console.log('📋 System Prompt:', systemPrompt || 'None');
        console.log('💬 Messages (Total:', messages.length, '):', JSON.stringify(messages, null, 2));
        console.log('⚙️ Temperature:', temperature);
        console.log('🔄 Stream: true');
        console.log('━'.repeat(80));
      }

      const client = this.createClient(apiKey);
      const response = await client.post('/chat/completions', requestData, {
        responseType: 'stream',
      });

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🌊 [${model}] STREAMING STARTED:`);
        console.log('━'.repeat(80));
        console.log('📡 Stream initialized successfully');
        console.log('━'.repeat(80));
      }

      return response.data;
    } catch (error) {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n❌ [${model}] STREAMING ERROR:`);
        console.log('━'.repeat(80));
        console.log('🚨 Error:', error.response?.data || error.message);
        console.log('━'.repeat(80));
      }
      console.error('Error generating streaming response:', error.response?.data || error.message);
      throw new Error(`Failed to generate streaming response from ${model}: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateMultipleResponses(models, messages, systemPrompts = {}, tones = {}, responseType = 'normal', responseCount = 1, apiKey = null) {
    const responses = [];
    const conversationMessages = [...messages];
    const participantNames = models.map(m => m.name).join(', ');
    
    // Generate conversation rounds where each model responds in sequence
    for (let round = 1; round <= responseCount; round++) {
      for (const model of models) {
        try {
          const systemPrompt = this.buildSystemPrompt(
            systemPrompts[model.id], 
            tones[model.id], 
            responseType,
            model.name,
            participantNames
          );
          const response = await this.generateResponse(model.id, conversationMessages, systemPrompt, 0.7, apiKey);
          
          responses.push({
            model: model,
            response: response,
            timestamp: new Date().toISOString(),
          });
          
          // Add response to conversation history for next models to see
          conversationMessages.push({
            role: 'user',
            content: `Here's what ${model.name} said: ${response}`
          });
          
        } catch (error) {
          console.error(`Error with model ${model.id} in round ${round}:`, error.message);
          const errorResponse = {
            model: model,
            response: `Error: ${error.message}`,
            timestamp: new Date().toISOString(),
            error: true,
          };
          responses.push(errorResponse);
          
          // Add error to conversation history
          conversationMessages.push({
            role: 'user',
            content: `Here's what ${model.name} said: [Error: Unable to generate response]`
          });
        }
      }
    }
    
    return responses;
  }

  buildSystemPrompt(customPrompt, tone, responseType, modelName, participantNames) {
    let systemPrompt = customPrompt || 'You are a helpful AI assistant participating in a group discussion.';
    
    // Add participant awareness
    if (modelName && participantNames) {
      systemPrompt += ` You are ${modelName}. You are having a conversation with: ${participantNames}. When you see messages from other participants, respond naturally and build upon what they've said.`;
    }
    
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
    
    if (responseType) {
      const responseTypeInstructions = {
        'precise': 'Keep your response very concise and to the point. Respond with exactly one paragraph containing no more than 30 words.',
        'normal': 'Keep your response concise but informative. Respond with one to two paragraphs containing no more than 100 words total.',
        'detailed': 'Provide a comprehensive and detailed response. You can use multiple paragraphs and include as much relevant information as needed.',
      };
      
      systemPrompt += ` ${responseTypeInstructions[responseType] || ''}`;
    }
    
    return systemPrompt;
  }
}

module.exports = new OpenRouterService(); 