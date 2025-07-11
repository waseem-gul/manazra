const express = require('express');
const router = express.Router();
const openRouterService = require('../services/openrouter');

// Start a new conversation
router.post('/start', async (req, res) => {
  try {
    const { topic, models, systemPrompts, tones, responseCount } = req.body;
    
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
    const initialMessages = [
      { role: 'user', content: `Let's discuss the following topic: ${topic}. Please provide your perspective and insights.` }
    ];
    
    // Generate initial responses from all models
    const responses = await openRouterService.generateMultipleResponses(
      models,
      initialMessages,
      systemPrompts || {},
      tones || {}
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
    
    // Generate responses from all models
    const responses = await openRouterService.generateMultipleResponses(
      models,
      messages,
      systemPrompts || {},
      tones || {}
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
    
    // Generate responses from all models
    const responses = await openRouterService.generateMultipleResponses(
      models,
      updatedMessages,
      systemPrompts || {},
      tones || {}
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