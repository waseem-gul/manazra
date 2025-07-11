import React, { useState, useEffect } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { Plus, X, Settings, Play, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModelSelector from './ModelSelector';
import ModelConfiguration from './ModelConfiguration';

const ConversationSetup: React.FC = () => {
    const {
        selectedModels,
        systemPrompts,
        tones,
        isGenerating,
        fetchPopularModels,
        fetchTones,
        removeModel,
        startConversation,
        clearConversation,
        currentConversation,
    } = useConversation();

    const [topic, setTopic] = useState('');
    const [responseCount, setResponseCount] = useState(1);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [showConfiguration, setShowConfiguration] = useState<string | null>(null);

    useEffect(() => {
        fetchPopularModels();
        fetchTones();
    }, [fetchPopularModels, fetchTones]);

    const handleStartConversation = async () => {
        if (!topic.trim()) {
            return;
        }
        await startConversation(topic, responseCount);
    };

    const handleClearConversation = () => {
        clearConversation();
        setTopic('');
        setResponseCount(1);
    };

    return (
        <div className="space-y-6">
            {/* Topic Input */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-primary-600" />
                    Conversation Topic
                </h2>
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a topic for the AI models to discuss..."
                    className="textarea min-h-[100px] resize-none"
                    disabled={isGenerating}
                />
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Count per Model
                    </label>
                    <select
                        value={responseCount}
                        onChange={(e) => setResponseCount(parseInt(e.target.value))}
                        className="select"
                        disabled={isGenerating}
                    >
                        <option value={1}>1 Response</option>
                        <option value={2}>2 Responses</option>
                        <option value={3}>3 Responses</option>
                    </select>
                </div>
            </div>

            {/* Selected Models */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Selected Models</h2>
                    <button
                        onClick={() => setShowModelSelector(true)}
                        className="btn btn-primary btn-sm"
                        disabled={isGenerating}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Model
                    </button>
                </div>

                <AnimatePresence>
                    {selectedModels.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-8 text-gray-500"
                        >
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No models selected</p>
                            <p className="text-sm">Add some AI models to start a conversation</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {selectedModels.map((model) => (
                                <motion.div
                                    key={model.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{model.name}</h3>
                                        <p className="text-sm text-gray-500 truncate">{model.description}</p>
                                        {(systemPrompts[model.id] || tones[model.id]) && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                {systemPrompts[model.id] && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Custom Prompt
                                                    </span>
                                                )}
                                                {tones[model.id] && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {tones[model.id]}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setShowConfiguration(model.id)}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            disabled={isGenerating}
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeModel(model.id)}
                                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                            disabled={isGenerating}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="card p-6">
                <div className="flex space-x-3">
                    <button
                        onClick={handleStartConversation}
                        disabled={!topic.trim() || selectedModels.length === 0 || isGenerating}
                        className="btn btn-primary flex-1"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Start Conversation
                            </>
                        )}
                    </button>
                    {currentConversation && (
                        <button
                            onClick={handleClearConversation}
                            className="btn btn-outline"
                            disabled={isGenerating}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showModelSelector && (
                <ModelSelector
                    isOpen={showModelSelector}
                    onClose={() => setShowModelSelector(false)}
                />
            )}
            {showConfiguration && (
                <ModelConfiguration
                    modelId={showConfiguration}
                    isOpen={!!showConfiguration}
                    onClose={() => setShowConfiguration(null)}
                />
            )}
        </div>
    );
};

export default ConversationSetup; 