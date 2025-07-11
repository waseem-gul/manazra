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
      'openai/gpt-4.1',
      'openai/gpt-4.1-mini',
      'x-ai/grok-4',
      'anthropic/claude-sonnet-4',
      'anthropic/claude-3.5-haiku',
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'meta-llama/llama-4-scout',
      'mistralai/mistral-medium-3',
      'deepseek/deepseek-chat-v3-0324',
    ];
    
    const popularModels = models.filter(model => 
      popularModelIds.includes(model.id)
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