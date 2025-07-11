const express = require('express');
const router = express.Router();
const openRouterService = require('../services/openrouter');

// Start a new conversation with streaming
router.post('/start-stream', async (req, res) => {
  try {
    const { topic, models, systemPrompts, tones, responseCount, responseType } = req.body;
    
    // Validation
    if (!topic || !models || !Array.isArray(models) || models.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Topic and models are required',
      });
    }
    
    if (models.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Too many models',
        message: 'Maximum 10 models allowed per conversation',
      });
    }
    
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    
    // Initial message to start the conversation
    const participantNames = models.map(m => m.name).join(', ');
    const initialMessages = [
      { 
        role: 'user', 
        content: `Let's discuss the following topic: ${topic}. 

You are participating in a group discussion with the following AI models: ${participantNames}. Please provide your perspective and insights, and feel free to respond to and build upon what others say.` 
      }
    ];
    
    // Create conversation object
    const conversation = {
      id: generateConversationId(),
      topic: topic,
      models: models,
      systemPrompts: systemPrompts || {},
      tones: tones || {},
      responseCount: responseCount || 1,
      messages: [...initialMessages],
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Send initial conversation data
    res.write(`data: ${JSON.stringify({ type: 'conversation', data: conversation })}\n\n`);
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🚀 CONVERSATION STARTED:`);
      console.log('━'.repeat(80));
      console.log('📝 Topic:', topic);
      console.log('🤖 Models:', models.map(m => m.name).join(', '));
      console.log('🔄 Rounds:', responseCount || 1);
      console.log('📋 Response Type:', responseType || 'normal');
      console.log('━'.repeat(80));
    }
    
    // Generate conversation rounds where each model responds in sequence
    const totalRounds = responseCount || 1;
    
    for (let round = 1; round <= totalRounds; round++) {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔄 ROUND ${round} of ${totalRounds} STARTING:`);
        console.log('━'.repeat(40));
      }
      
      res.write(`data: ${JSON.stringify({ 
        type: 'round_start', 
        data: { round, totalRounds } 
      })}\n\n`);
      
      for (const model of models) {
        try {
          const systemPrompt = openRouterService.buildSystemPrompt(
            systemPrompts[model.id] || '',
            tones[model.id] || '',
            responseType || 'normal',
            model.name,
            participantNames
          );
          
          // Development logging
          if (process.env.NODE_ENV === 'development') {
            console.log(`\n🤖 [${model.name}] STARTING (Round ${round}/${totalRounds}):`);
            console.log('━'.repeat(60));
          }
          
          // Send model start event with round info
          res.write(`data: ${JSON.stringify({ 
            type: 'model_start', 
            data: { 
              model: model, 
              round: round,
              totalRounds: totalRounds
            } 
          })}\n\n`);
          
          const stream = await openRouterService.generateStreamingResponse(
            model.id,
            conversation.messages,
            systemPrompt
          );
        
        let responseText = '';
        let responseCompleted = false;
        
        const completeResponse = () => {
          if (!responseCompleted && responseText) {
            responseCompleted = true;
            const response = {
              model: model,
              response: responseText,
              timestamp: new Date().toISOString(),
            };
            conversation.responses.push(response);
            
            // Add the response to conversation history for next models to see
            conversation.messages.push({
              role: 'user',
              content: `Here's what ${model.name} said: ${responseText}`
            });
            
            res.write(`data: ${JSON.stringify({ 
              type: 'model_complete', 
              data: response 
            })}\n\n`);
          }
        };
        
        stream.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Stream finished for this model
                if (process.env.NODE_ENV === 'development') {
                  console.log(`\n🏁 [${model.id}] STREAMING COMPLETE:`);
                  console.log('━'.repeat(80));
                  console.log('📤 Final Response:', responseText);
                  console.log('━'.repeat(80));
                }
                completeResponse();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  if (delta.content) {
                    responseText += delta.content;
                    
                    // Development logging for chunks
                    // if (process.env.NODE_ENV === 'development') {
                    //   console.log(`📦 [${model.id}] CHUNK: "${delta.content}"`);
                    // }
                    
                    res.write(`data: ${JSON.stringify({ 
                      type: 'model_chunk', 
                      data: { 
                        model: model,
                        chunk: delta.content,
                        fullText: responseText
                      } 
                    })}\n\n`);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing streaming data:', parseError);
              }
            }
          }
        });
        
        stream.on('end', () => {
          completeResponse();
        });
        
        stream.on('error', (error) => {
          console.error(`Streaming error for model ${model.id}:`, error);
          const errorResponse = {
            model: model,
            response: `Error: ${error.message}`,
            timestamp: new Date().toISOString(),
            error: true,
          };
          conversation.responses.push(errorResponse);
          res.write(`data: ${JSON.stringify({ 
            type: 'model_error', 
            data: errorResponse 
          })}\n\n`);
        });
        
          // Wait for stream to complete before moving to next model
          await new Promise((resolve) => {
            stream.on('end', resolve);
            stream.on('error', resolve);
          });
          
        } catch (error) {
          // Development logging
          if (process.env.NODE_ENV === 'development') {
            console.log(`\n❌ [${model.name}] ERROR (Round ${round}/${totalRounds}):`);
            console.log('━'.repeat(60));
            console.log('🚨 Error Message:', error.message);
            console.log('━'.repeat(60));
          }
          
          console.error(`Error with model ${model.id} in round ${round}:`, error.message);
          const errorResponse = {
            model: model,
            response: `Error: ${error.message}`,
            timestamp: new Date().toISOString(),
            error: true,
          };
          conversation.responses.push(errorResponse);
          
          // Add error to conversation history
          conversation.messages.push({
            role: 'user',
            content: `Here's what ${model.name} said: [Error: Unable to generate response]`
          });
          
          res.write(`data: ${JSON.stringify({ 
            type: 'model_error', 
            data: errorResponse 
          })}\n\n`);
        }
      }
      
      res.write(`data: ${JSON.stringify({ 
        type: 'round_complete', 
        data: { round, totalRounds } 
      })}\n\n`);
    }
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🎉 CONVERSATION COMPLETE:`);
      console.log('━'.repeat(80));
      console.log('📊 Total Responses:', conversation.responses.length);
      console.log('✅ Successful Responses:', conversation.responses.filter(r => !r.error).length);
      console.log('❌ Failed Responses:', conversation.responses.filter(r => r.error).length);
      console.log('━'.repeat(80));
    }
    
    // Send completion event
    res.write(`data: ${JSON.stringify({ 
      type: 'conversation_complete', 
      data: conversation 
    })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error('Error starting streaming conversation:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      data: { message: error.message } 
    })}\n\n`);
    res.end();
  }
});

// Start a new conversation
router.post('/start', async (req, res) => {
  try {
    const { topic, models, systemPrompts, tones, responseCount, responseType } = req.body;
    
    // Validation
    if (!topic || !models || !Array.isArray(models) || models.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Topic and models are required',
      });
    }
    
    if (models.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Too many models',
        message: 'Maximum 10 models allowed per conversation',
      });
    }
    
    // Initial message to start the conversation
    const participantNames = models.map(m => m.name).join(', ');
    const initialMessages = [
      { 
        role: 'user', 
        content: `Let's discuss the following topic: ${topic}. 

You are participating in a group discussion with the following AI models: ${participantNames}. Please provide your perspective and insights, and feel free to respond to and build upon what others say.` 
      }
    ];
    
    // Generate initial responses from all models
    const responses = await openRouterService.generateMultipleResponses(
      models,
      initialMessages,
      systemPrompts || {},
      tones || {},
      responseType || 'normal',
      responseCount || 1
    );
    
    // Create conversation object
    const conversation = {
      id: generateConversationId(),
      topic: topic,
      models: models,
      systemPrompts: systemPrompts || {},
      tones: tones || {},
      responseCount: responseCount || 1,
      messages: initialMessages,
      responses: responses,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation',
      message: error.message,
    });
  }
});

// Continue a conversation
router.post('/continue', async (req, res) => {
  try {
    const { conversationId, models, systemPrompts, tones, messages } = req.body;
    
    // Validation
    if (!conversationId || !models || !messages) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Conversation ID, models, and messages are required',
      });
    }
    
    // Generate responses from all models (single round for continue/followup)
    const responses = await openRouterService.generateMultipleResponses(
      models,
      messages,
      systemPrompts || {},
      tones || {},
      'normal',
      1
    );
    
    res.json({
      success: true,
      data: {
        conversationId: conversationId,
        responses: responses,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error continuing conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to continue conversation',
      message: error.message,
    });
  }
});

// Generate follow-up responses
router.post('/followup', async (req, res) => {
  try {
    const { messages, models, systemPrompts, tones, followupPrompt } = req.body;
    
    // Validation
    if (!messages || !models || !followupPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Messages, models, and followup prompt are required',
      });
    }
    
    // Add followup prompt to messages
    const updatedMessages = [
      ...messages,
      { role: 'user', content: followupPrompt }
    ];
    
    // Generate responses from all models (single round for followup)
    const responses = await openRouterService.generateMultipleResponses(
      models,
      updatedMessages,
      systemPrompts || {},
      tones || {},
      'normal',
      1
    );
    
    res.json({
      success: true,
      data: {
        responses: responses,
        messages: updatedMessages,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating followup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate followup',
      message: error.message,
    });
  }
});

// Get conversation tones
router.get('/tones', (req, res) => {
  const tones = [
    { id: 'professional', name: 'Professional', description: 'Formal and business-like' },
    { id: 'casual', name: 'Casual', description: 'Friendly and conversational' },
    { id: 'academic', name: 'Academic', description: 'Scholarly and analytical' },
    { id: 'creative', name: 'Creative', description: 'Imaginative and artistic' },
    { id: 'humorous', name: 'Humorous', description: 'Witty and entertaining' },
    { id: 'diplomatic', name: 'Diplomatic', description: 'Balanced and tactful' },
    { id: 'direct', name: 'Direct', description: 'Straightforward and concise' },
    { id: 'empathetic', name: 'Empathetic', description: 'Understanding and supportive' },
  ];
  
  res.json({
    success: true,
    data: tones,
  });
});

// Utility function to generate conversation ID
function generateConversationId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = router; 