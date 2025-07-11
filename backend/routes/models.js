const express = require('express');
const router = express.Router();
const openRouterService = require('../services/openrouter');

// Get available models
router.get('/', async (req, res) => {
  try {
    const models = await openRouterService.getAvailableModels();
    
    // Format models for frontend consumption
    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || 'No description available',
      contextLength: model.context_length || 4096,
      pricing: model.pricing || { prompt: 0, completion: 0 },
      topProvider: model.top_provider || {},
    }));
    
    res.json({
      success: true,
      data: formattedModels,
      count: formattedModels.length,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      message: error.message,
    });
  }
});

// Get popular/recommended models
router.get('/popular', async (req, res) => {
  try {
    const models = await openRouterService.getAvailableModels();
    
    // Filter for popular models
    const popularModelIds = [
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'google/gemini-pro',
      'meta-llama/llama-2-70b-chat',
      'mistralai/mistral-7b-instruct',
      'cohere/command-r',
    ];
    
    const popularModels = models.filter(model => 
      popularModelIds.some(id => model.id.includes(id.split('/')[1]))
    );
    
    res.json({
      success: true,
      data: popularModels.slice(0, 8), // Return top 8
      count: popularModels.length,
    });
  } catch (error) {
    console.error('Error fetching popular models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular models',
      message: error.message,
    });
  }
});

module.exports = router; 