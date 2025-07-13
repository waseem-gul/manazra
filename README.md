# Manazra 🤖💬

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Available-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

**Manazra** is an opensource AI conversation tool that allows users to create engaging discussions between different AI models. Choose your topic, select multiple AI models, configure their personalities, and watch them have thoughtful conversations!

## 🎥 Demo

[https://github.com/waseem-gul/manazra/assets/manazra-demo.mp4](https://github.com/waseem-gul/manazra/blob/main/assets/manazra-demo.mp4)

*Watch Manazra in action - See how easy it is to create engaging AI conversations!*

## ✨ Features

- 🎯 **Multi-Model Conversations**: Select from various AI models (GPT-4, Claude, Gemini, etc.)
- 🎭 **Personality Configuration**: Set custom tones and system prompts for each model
- 🔗 **OpenRouter Integration**: Powered by OpenRouter.ai for reliable AI model access
- 💬 **Real-time Conversations**: Watch AI models discuss topics in real-time
- 🎨 **Beautiful UI**: Modern, responsive interface built with React and Tailwind CSS
- 🚀 **Easy Deployment**: Docker support for simple self-hosting
- 📱 **Mobile Friendly**: Works great on desktop and mobile devices

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/waseem-gul/manazra.git
   cd manazra
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenRouter API key
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Installation

#### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenRouter API key

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
PORT=5000
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Getting an OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to the API Keys section
4. Generate a new API key
5. Add credits to your account for model usage

## 📖 Usage

### Starting a Conversation

1. **Enter a Topic**: Describe what you want the AI models to discuss
2. **Select Models**: Choose from popular AI models or browse all available options
3. **Configure Models** (Optional): 
   - Set custom system prompts
   - Choose conversation tones (professional, casual, academic, etc.)
4. **Start Conversation**: Click "Start Conversation" to begin

### Managing Conversations

- **Follow-up Questions**: Add new prompts to continue the discussion
- **Model Configuration**: Click the settings icon to customize individual models
- **Clear Conversation**: Start fresh with a new topic

### Available Tones

- **Professional**: Formal and business-like responses
- **Casual**: Friendly and conversational
- **Academic**: Scholarly and analytical
- **Creative**: Imaginative and artistic
- **Humorous**: Witty and entertaining
- **Diplomatic**: Balanced and tactful
- **Direct**: Straightforward and concise
- **Empathetic**: Understanding and supportive

## 🏗️ Architecture

### Tech Stack

**Frontend**
- React 18 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Axios for API calls
- React Hot Toast for notifications

**Backend**
- Node.js with Express
- OpenRouter.ai API integration
- Rate limiting and security middleware
- RESTful API design

**Infrastructure**
- Docker containerization
- Nginx reverse proxy
- Multi-stage builds for optimization

### Project Structure

```
manazra/
├── backend/
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API services
│   │   └── main.tsx     # Entry point
│   ├── public/          # Static assets
│   └── package.json
├── docker-compose.yml   # Production deployment
├── docker-compose.dev.yml # Development environment
├── Dockerfile          # Multi-stage production build
└── README.md
```

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and run in production mode
docker-compose up -d

# With custom environment file
docker-compose --env-file .env.production up -d

# With nginx reverse proxy
docker-compose --profile production up -d
```

### Development Environment

```bash
# Run in development mode with hot reload
docker-compose -f docker-compose.dev.yml up -d
```

### Custom Docker Build

```bash
# Build custom image
docker build -t manazra:latest .

# Run with custom settings
docker run -d \
  --name manazra \
  -p 5000:5000 \
  -e OPENROUTER_API_KEY=your_key_here \
  manazra:latest
```

## 🌐 Production Deployment

### Using Docker Compose

1. **Server Setup**
   ```bash
   # Clone repository
   git clone https://github.com/waseem-gul/manazra.git
   cd manazra
   
   # Set up environment
   cp .env.example .env
   nano .env  # Edit with your configuration
   ```

2. **SSL Configuration (Optional)**
   ```bash
   # Place SSL certificates in ./ssl/ directory
   cp your_certificate.crt ./ssl/
   cp your_private_key.key ./ssl/
   
   # Edit nginx.conf to enable HTTPS
   ```

3. **Deploy**
   ```bash
   docker-compose --profile production up -d
   ```

### Manual Deployment

1. **Build Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   npm install --production
   NODE_ENV=production npm start
   ```

3. **Serve Frontend**
   Use nginx or any static file server to serve the `frontend/dist` directory.

## 🔍 API Documentation

### Endpoints

#### Models
- `GET /api/models` - Get all available models
- `GET /api/models/popular` - Get popular models

#### Conversations
- `POST /api/conversations/start` - Start a new conversation
- `POST /api/conversations/continue` - Continue existing conversation
- `POST /api/conversations/followup` - Add follow-up to conversation
- `GET /api/conversations/tones` - Get available conversation tones

#### Health
- `GET /health` - Health check endpoint

### Rate Limiting

- API endpoints: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Implements exponential backoff for failed requests

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Cursor](https://cursor.com) for their brilliant IDE
- [OpenRouter.ai](https://openrouter.ai) for providing access to multiple AI models
- [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/) for the amazing frontend tools
- [Express.js](https://expressjs.com/) for the robust backend framework
- All contributors and users who make this project possible

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs or request features via GitHub Issues
- **Community**: Join our discussions in GitHub Discussions
- **Email**: Contact us at support@manazra.com

## 🗺️ Roadmap

- [ ] Conversation history and persistence
- [ ] User authentication and profiles
- [ ] Conversation sharing and export
- [ ] Advanced model parameters (temperature, top-p, etc.)
- [ ] Conversation templates and presets
- [ ] Real-time collaboration features
- [ ] Model performance analytics
- [ ] Plugin system for custom integrations

---

**Made with ❤️ by Waseem Gul**

[Live Demo](https://manazra.com) • [Documentation](https://docs.manazra.com) • [GitHub](https://github.com/waseem-gul/manazra) 
