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
        
        // Voice mode specific logging
        if (systemPrompt.includes('Text-to-Speech') || systemPrompt.includes('TTS')) {
          console.log('🎤 VOICE MODE DETECTED in system prompt');
          console.log('📋 Expected response format: JSON with input/instructions');
        }
        
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
        
        // Voice mode specific logging
        if (systemPrompt.includes('Text-to-Speech') || systemPrompt.includes('TTS')) {
          // Clean response for voice mode - remove markdown code blocks
          let cleanedContent = content;
          if (content.includes('```json')) {
            cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            console.log('🧹 VOICE MODE: Cleaned markdown formatting from response');
          }
          
          try {
            const parsedResponse = JSON.parse(cleanedContent);
            if (parsedResponse.input && parsedResponse.instructions) {
              console.log('✅ VOICE MODE: Valid JSON response detected');
              console.log('🎤 TTS Input:', parsedResponse.input);
              console.log('📋 TTS Instructions:', parsedResponse.instructions);
              console.log('🔊 Ready for TTS processing');
            } else {
              console.log('⚠️ VOICE MODE: Invalid JSON structure - missing input or instructions');
              console.log('📋 Raw response will be used as fallback');
            }
          } catch (parseError) {
            console.log('❌ VOICE MODE: JSON parsing failed - response is not valid JSON');
            console.log('📋 Raw response will be used as fallback');
            console.log('🚨 Parse error:', parseError.message);
          }
        }
        
        console.log('━'.repeat(80));
      }

      return content;
    } catch (error) {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n❌ [${model}] ERROR:`);
        console.log('━'.repeat(80));
        console.log('🚨 Error:', error.response?.data || error.message);
        
        // Voice mode specific error logging
        if (systemPrompt.includes('Text-to-Speech') || systemPrompt.includes('TTS')) {
          console.log('🎤 VOICE MODE: TTS response generation failed');
          console.log('🔊 TTS processing will be skipped for this model');
        }
        
        console.log('━'.repeat(80));
      }
      console.error('Error generating response:', error.response?.data || error.message);
      throw new Error(`Failed to generate response from ${model}: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateStreamingResponse(model, messages, systemPrompt = '', temperature = 0.7, apiKey = null, streamResponse = true) {
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
        stream: streamResponse,
      };

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🌊 [${model}] STREAMING REQUEST:`);
        console.log('━'.repeat(80));
        console.log('📋 System Prompt:', systemPrompt || 'None');
        // console.log('💬 Messages (Total:', messages.length, '):', JSON.stringify(messages, null, 2));
        console.log('💬 Messages (Total:', messages.length, ')');
        console.log('⚙️ Temperature:', temperature);
        console.log('🔄 Stream:', streamResponse);
        
        // Voice mode specific logging
        if (systemPrompt.includes('Text-to-Speech') || systemPrompt.includes('TTS')) {
          console.log('🎤 VOICE MODE DETECTED in system prompt');
          console.log('📋 Expected response format: JSON with input/instructions');
        }
        
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
        
        // Voice mode specific logging
        if (systemPrompt.includes('Text-to-Speech') || systemPrompt.includes('TTS')) {
          console.log('🎤 VOICE MODE: Streaming TTS-formatted response');
          console.log('🔊 Waiting for JSON response with input/instructions');
        }
        
        console.log('━'.repeat(80));
      }

      return response.data;
    } catch (error) {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n❌ [${model}] STREAMING ERROR:`);
        console.log('━'.repeat(80));
        console.log('🚨 Error:', error.response?.data || error.message);
        
        // Voice mode specific error logging
        if (systemPrompt.includes('Text-to-Speech') || systemPrompt.includes('TTS')) {
          console.log('🎤 VOICE MODE: TTS response generation failed');
          console.log('🔊 TTS processing will be skipped for this model');
        }
        
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
    
    // Development logging for multiple responses
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔄 GENERATING MULTIPLE RESPONSES:`);
      console.log('━'.repeat(80));
      console.log('🤖 Models:', models.map(m => m.name).join(', '));
      console.log('🔄 Rounds:', responseCount);
      console.log('📋 Response Type:', responseType);
      
      // Voice mode specific logging
      if (responseType === 'voice') {
        console.log('🎤 VOICE MODE: Generating TTS-formatted responses');
        console.log('🔊 Each response will be JSON with input/instructions');
      }
      
      console.log('━'.repeat(80));
    }
    
    // Generate conversation rounds where each model responds in sequence
    for (let round = 1; round <= responseCount; round++) {
      // Development logging for each round
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔄 ROUND ${round} of ${responseCount} STARTING:`);
        console.log('━'.repeat(40));
      }
      
      for (const model of models) {
        try {
          const systemPrompt = this.buildSystemPrompt(
            systemPrompts[model.id], 
            tones[model.id], 
            responseType,
            model.name,
            participantNames
          );
          
          // Development logging for each model
          if (process.env.NODE_ENV === 'development') {
            console.log(`\n🤖 [${model.name}] GENERATING RESPONSE (Round ${round}/${responseCount}):`);
            console.log('━'.repeat(60));
            
            // Voice mode specific logging
            if (responseType === 'voice') {
              console.log('🎤 VOICE MODE: Generating TTS-formatted response');
              console.log('📋 Expected format: JSON with input/instructions');
            }
          }
          
          const response = await this.generateResponse(model.id, conversationMessages, systemPrompt, 0.7, apiKey);
          
          responses.push({
            model: model,
            response: response,
            timestamp: new Date().toISOString(),
          });
          
          // Development logging for successful response
          if (process.env.NODE_ENV === 'development') {
            console.log(`\n✅ [${model.name}] RESPONSE GENERATED (Round ${round}/${responseCount}):`);
            console.log('━'.repeat(60));
            console.log('📤 Response:', response);
            
            // Voice mode specific logging
            if (responseType === 'voice') {
              // Clean response for voice mode - remove markdown code blocks
              let cleanedResponse = response;
              if (response.includes('```json')) {
                cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                console.log('🧹 VOICE MODE: Cleaned markdown formatting from response');
              }
              
              try {
                const parsedResponse = JSON.parse(cleanedResponse);
                if (parsedResponse.input && parsedResponse.instructions) {
                  console.log('✅ VOICE MODE: Valid JSON response detected');
                  console.log('🎤 TTS Input:', parsedResponse.input);
                  console.log('📋 TTS Instructions:', parsedResponse.instructions);
                  console.log('🔊 Ready for TTS processing');
                } else {
                  console.log('⚠️ VOICE MODE: Invalid JSON structure - missing input or instructions');
                  console.log('📋 Raw response will be used as fallback');
                }
              } catch (parseError) {
                console.log('❌ VOICE MODE: JSON parsing failed - response is not valid JSON');
                console.log('📋 Raw response will be used as fallback');
                console.log('🚨 Parse error:', parseError.message);
              }
            }
            
            console.log('━'.repeat(60));
          }
          
          // Add response to conversation history for next models to see
          conversationMessages.push({
            role: 'user',
            content: `Here's what ${model.name} said: ${response}`
          });
          
        } catch (error) {
          console.error(`Error with model ${model.id} in round ${round}:`, error.message);
          
          // Development logging for error
          if (process.env.NODE_ENV === 'development') {
            console.log(`\n❌ [${model.name}] ERROR (Round ${round}/${responseCount}):`);
            console.log('━'.repeat(60));
            console.log('🚨 Error Message:', error.message);
            
            // Voice mode specific error logging
            if (responseType === 'voice') {
              console.log('🎤 VOICE MODE: TTS response generation failed');
              console.log('🔊 TTS processing will be skipped for this model');
            }
            
            console.log('━'.repeat(60));
          }
          
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
    
    // Development logging for completion
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🎉 MULTIPLE RESPONSES COMPLETE:`);
      console.log('━'.repeat(80));
      console.log('📊 Total Responses:', responses.length);
      console.log('✅ Successful Responses:', responses.filter(r => !r.error).length);
      console.log('❌ Failed Responses:', responses.filter(r => r.error).length);
      
      // Voice mode specific completion logging
      if (responseType === 'voice') {
        const voiceResponses = responses.filter(r => !r.error);
        const validVoiceResponses = voiceResponses.filter(r => {
          try {
            // Clean response before parsing
            let cleanedResponse = r.response;
            if (r.response.includes('```json')) {
              cleanedResponse = r.response.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            }
            const parsed = JSON.parse(cleanedResponse);
            return parsed.input && parsed.instructions;
          } catch {
            return false;
          }
        });
        
        console.log('🎤 VOICE MODE SUMMARY:');
        console.log('🔊 Total Voice Responses:', voiceResponses.length);
        console.log('✅ Valid TTS Responses:', validVoiceResponses.length);
        console.log('⚠️ Invalid TTS Responses:', voiceResponses.length - validVoiceResponses.length);
        console.log('🔊 Ready for frontend TTS processing');
      }
      
      console.log('━'.repeat(80));
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
        'voice': `Your response will be converted to speech using Text-to-Speech technology. 
IMPORTANT: Respond with ONLY a valid JSON object - no markdown formatting, no code blocks, no additional text.

Format your response as a JSON object with two fields:
- "input": The actual text that will be spoken (keep it natural and conversational, suitable for speech)
- "instructions": Voice instructions for the TTS system describing the tone, emotion, delivery style, and speaking characteristics

The "input" should be engaging and natural when spoken aloud. The "instructions" should describe:
- Affect/character (e.g., enthusiastic teacher, wise mentor, friendly expert)
- Tone (e.g., warm, confident, mysterious, casual)
- Delivery style (e.g., clear and measured, animated, thoughtful pauses)
- Emotion (e.g., excited, calm, curious, reassuring)
- Speaking characteristics (e.g., emphasize key points, use natural pauses, vary pace)

Example format (respond with ONLY this JSON, no markdown):
{
  "input": "That's a fascinating question! Let me share my thoughts on this topic...",
  "instructions": "Affect: An enthusiastic teacher sharing knowledge. Tone: Warm and engaging. Delivery: Clear and animated with emphasis on key points. Emotion: Excited about the topic. Speaking: Use natural pauses and vary pace for emphasis."
}

Keep the input concise but informative, optimized for speech rather than reading.`,
      };
      
      systemPrompt += ` ${responseTypeInstructions[responseType] || ''}`;
      
      // Development logging for voice mode system prompt
      if (process.env.NODE_ENV === 'development' && responseType === 'voice') {
        console.log(`\n🎤 VOICE MODE SYSTEM PROMPT BUILT:`);
        console.log('━'.repeat(80));
        console.log('📋 Model:', modelName || 'Unknown');
        console.log('🎭 Tone:', tone || 'None');
        console.log('📝 Custom Prompt:', customPrompt ? 'Yes' : 'No');
        console.log('🔊 TTS Instructions: Added to system prompt');
        console.log('━'.repeat(80));
      }
    }
    
    return systemPrompt;
  }
}

module.exports = new OpenRouterService(); 