#!/bin/bash

echo "🚀 Setting up Manazra..."
echo ""

# Create root .env file for Docker Compose
if [ ! -f .env ]; then
    echo "📝 Creating .env file for Docker Compose..."
    cat > .env << 'EOF'
# Docker Compose Environment Variables
# Add your OpenRouter API key below

OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "✅ Created .env file"
else
    echo "ℹ️  .env file already exists"
fi

# Create backend .env file
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file..."
    cp env.example backend/.env
    echo "✅ Created backend/.env file"
else
    echo "ℹ️  backend/.env file already exists"
fi

echo ""
echo "🔑 IMPORTANT: You need to set your OpenRouter API key!"
echo ""
echo "1. Get your API key from: https://openrouter.ai/keys"
echo "2. Edit both .env files and replace 'your_openrouter_api_key_here' with your actual key:"
echo "   - .env (for Docker Compose)"
echo "   - backend/.env (for local development)"
echo ""
echo "3. Then run one of these commands:"
echo "   🐳 Docker: docker-compose up -d"
echo "   💻 Local: npm run dev"
echo ""
echo "📚 For more details, see README.md" 