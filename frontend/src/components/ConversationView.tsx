import React, { useState, useMemo } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { MessageSquare, Clock, User, Bot, Send, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// Color palette for models - distinct colors that work well together
const MODEL_COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-600', bgLight: 'bg-blue-50', textDark: 'text-blue-900', textLight: 'text-blue-800' },
    { bg: 'bg-purple-100', text: 'text-purple-600', bgLight: 'bg-purple-50', textDark: 'text-purple-900', textLight: 'text-purple-800' },
    { bg: 'bg-green-100', text: 'text-green-600', bgLight: 'bg-green-50', textDark: 'text-green-900', textLight: 'text-green-800' },
    { bg: 'bg-orange-100', text: 'text-orange-600', bgLight: 'bg-orange-50', textDark: 'text-orange-900', textLight: 'text-orange-800' },
    { bg: 'bg-pink-100', text: 'text-pink-600', bgLight: 'bg-pink-50', textDark: 'text-pink-900', textLight: 'text-pink-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600', bgLight: 'bg-indigo-50', textDark: 'text-indigo-900', textLight: 'text-indigo-800' },
    { bg: 'bg-teal-100', text: 'text-teal-600', bgLight: 'bg-teal-50', textDark: 'text-teal-900', textLight: 'text-teal-800' },
    { bg: 'bg-yellow-100', text: 'text-yellow-600', bgLight: 'bg-yellow-50', textDark: 'text-yellow-900', textLight: 'text-yellow-800' },
    { bg: 'bg-red-100', text: 'text-red-600', bgLight: 'bg-red-50', textDark: 'text-red-900', textLight: 'text-red-800' },
    { bg: 'bg-cyan-100', text: 'text-cyan-600', bgLight: 'bg-cyan-50', textDark: 'text-cyan-900', textLight: 'text-cyan-800' },
];

const ConversationView: React.FC = () => {
    const { currentConversation, isGenerating, continueConversation, clearConversation, streamingResponses } = useConversation();
    const [followupPrompt, setFollowupPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create a color mapping for models
    const modelColors = useMemo(() => {
        if (!currentConversation) return {};

        const colorMap: Record<string, typeof MODEL_COLORS[0]> = {};
        currentConversation.models.forEach((model, index) => {
            colorMap[model.id] = MODEL_COLORS[index % MODEL_COLORS.length];
        });
        return colorMap;
    }, [currentConversation]);

    const handleFollowup = async () => {
        if (!followupPrompt.trim()) return;

        setIsSubmitting(true);
        try {
            await continueConversation(followupPrompt);
            setFollowupPrompt('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToSetup = () => {
        clearConversation();
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    if (!currentConversation) {
        return (
            <div className="card p-8 h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No Conversation Yet</h3>
                    <p>Start a conversation to see AI models discuss your topic</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Conversation Header */}
            <div className="card p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleBackToSetup}
                            className="btn btn-outline btn-sm"
                            disabled={isGenerating}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Setup
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{currentConversation.topic}</h2>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatTimestamp(currentConversation.createdAt)}
                                </div>
                                <div className="flex items-center">
                                    <Bot className="w-4 h-4 mr-1" />
                                    {currentConversation.models.length} models
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {currentConversation.models.map((model) => {
                            const colors = modelColors[model.id];
                            return (
                                <div
                                    key={model.id}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.textDark}`}
                                >
                                    {model.name}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Conversation Messages */}
            <div className="card p-6">
                <div className="space-y-6">
                    {/* Initial Topic */}
                    <div className="flex items-start space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-green-900">You</span>
                                    <span className="text-xs text-green-600">
                                        {formatTimestamp(currentConversation.createdAt)}
                                    </span>
                                </div>
                                <p className="text-green-800">
                                    Let's discuss the following topic: {currentConversation.topic}. Please provide your perspective and insights.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI Responses */}
                    <AnimatePresence>
                        {currentConversation.responses.map((response, index) => {
                            const colors = modelColors[response.model.id];
                            return (
                                <motion.div
                                    key={`${response.model.id}-${index}`}
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="flex items-start space-x-3"
                                >
                                    <div className={`${response.error ? 'bg-red-100' : colors.bg} p-2 rounded-lg`}>
                                        <Bot className={`w-5 h-5 ${response.error ? 'text-red-600' : colors.text}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`${response.error ? 'bg-red-50' : colors.bgLight} rounded-lg p-4`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-medium ${response.error ? 'text-red-900' : colors.textDark}`}>
                                                    {response.model.name}
                                                </span>
                                                <span className={`text-xs ${response.error ? 'text-red-600' : colors.text}`}>
                                                    {formatTimestamp(response.timestamp)}
                                                </span>
                                            </div>
                                            <div className={`${response.error ? 'text-red-800' : colors.textLight} prose prose-sm max-w-none`}>
                                                {response.error ? (
                                                    <div className="whitespace-pre-wrap">{response.response}</div>
                                                ) : (
                                                    <ReactMarkdown>{response.response}</ReactMarkdown>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Streaming Responses */}
                    <AnimatePresence>
                        {Object.entries(streamingResponses).map(([modelId, response]) => {
                            const model = currentConversation.models.find(m => m.id === modelId);
                            if (!model) return null;

                            return (
                                <motion.div
                                    key={`streaming-${modelId}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-start space-x-3"
                                >
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <Bot className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-blue-900">
                                                    {model.name}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                                    <span className="text-xs text-blue-600">
                                                        Streaming...
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-blue-800 prose prose-sm max-w-none">
                                                <ReactMarkdown>{response}</ReactMarkdown>
                                                <span className="inline-block w-2 h-5 bg-blue-600 ml-1 animate-pulse"></span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Loading State */}
                    {isGenerating && Object.keys(streamingResponses).length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center py-8"
                        >
                            <div className="flex items-center space-x-3 text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Starting conversation...</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Follow-up Input */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Continue the Conversation</h3>
                <div className="flex space-x-3">
                    <input
                        type="text"
                        value={followupPrompt}
                        onChange={(e) => setFollowupPrompt(e.target.value)}
                        placeholder="Add a follow-up question or comment..."
                        className="input flex-1"
                        disabled={isGenerating || isSubmitting}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleFollowup();
                            }
                        }}
                    />
                    <button
                        onClick={handleFollowup}
                        disabled={!followupPrompt.trim() || isGenerating || isSubmitting}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConversationView; 