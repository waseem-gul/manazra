import React, { useState } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { MessageSquare, Clock, User, Bot, Plus, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConversationView: React.FC = () => {
    const { currentConversation, isGenerating, continueConversation } = useConversation();
    const [followupPrompt, setFollowupPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                    <div className="flex items-center space-x-2">
                        {currentConversation.models.map((model) => (
                            <div
                                key={model.id}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                                {model.name}
                            </div>
                        ))}
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
                        {currentConversation.responses.map((response, index) => (
                            <motion.div
                                key={`${response.model.id}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="flex items-start space-x-3"
                            >
                                <div className={`${response.error ? 'bg-red-100' : 'bg-blue-100'} p-2 rounded-lg`}>
                                    <Bot className={`w-5 h-5 ${response.error ? 'text-red-600' : 'text-blue-600'}`} />
                                </div>
                                <div className="flex-1">
                                    <div className={`${response.error ? 'bg-red-50' : 'bg-blue-50'} rounded-lg p-4`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`font-medium ${response.error ? 'text-red-900' : 'text-blue-900'}`}>
                                                {response.model.name}
                                            </span>
                                            <span className={`text-xs ${response.error ? 'text-red-600' : 'text-blue-600'}`}>
                                                {formatTimestamp(response.timestamp)}
                                            </span>
                                        </div>
                                        <div className={`${response.error ? 'text-red-800' : 'text-blue-800'} whitespace-pre-wrap`}>
                                            {response.response}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Loading State */}
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center py-8"
                        >
                            <div className="flex items-center space-x-3 text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>AI models are thinking...</span>
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