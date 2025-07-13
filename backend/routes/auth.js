const express = require('express');
const router = express.Router();
const axios = require('axios');

// Validate OpenRouter API key
router.post('/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    // Test the API key by making a simple request to OpenRouter
    const testResponse = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://manazra.com',
        'X-Title': 'Manazra - AI Conversation Tool',
      },
      timeout: 10000, // 10 second timeout
    });

    // If we get here, the API key is valid
    res.json({
      success: true,
      message: 'API key is valid'
    });
  } catch (error) {
    console.error('API key validation error:', error.response?.data || error.message);
    
    // Check if it's an authentication error
    if (error.response?.status === 401) {
      return res.status(200).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    // Other errors (network, timeout, etc.)
    res.status(200).json({
      success: false,
      error: 'Failed to validate API key. Please check your connection and try again.'
    });
  }
});

// Save API key (for server-side storage if needed)
router.post('/save-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    // For now, we'll just validate the key again to ensure it's still valid
    // In a production environment, you might want to store this securely
    const testResponse = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://manazra.com',
        'X-Title': 'Manazra - AI Conversation Tool',
      },
      timeout: 10000,
    });

    res.json({
      success: true,
      message: 'API key saved successfully'
    });
  } catch (error) {
    console.error('API key save error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to save API key'
    });
  }
});

module.exports = router; 