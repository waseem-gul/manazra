import React, { useState, useEffect } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { Plus, X, Play, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModelSelector from './ModelSelector';
import ApiKeySetup from './ApiKeySetup';

const ConversationSetup: React.FC = () => {
    const {
        selectedModels,
        systemPrompts,
        tones,
        availableTones,
        isGenerating,
        fetchPopularModels,
        fetchTones,
        removeModel,
        updateSystemPrompt,
        updateTone,
        startStreamingConversation,
        clearConversation,
        currentConversation,
    } = useConversation();

    const [topic, setTopic] = useState('');
    const [responseCount, setResponseCount] = useState(1);
    const [responseType, setResponseType] = useState('normal');
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [isApiKeyValid, setIsApiKeyValid] = useState(false);


    useEffect(() => {
        fetchPopularModels();
        fetchTones();
    }, [fetchPopularModels, fetchTones]);

    const handleStartConversation = async () => {
        if (!topic.trim()) {
            return;
        }
        // Start conversation with proper round-based flow
        // Each round: Model A responds → Model B responds → Model C responds
        // Continue for the specified number of rounds
        await startStreamingConversation(topic, responseCount, responseType);
    };

    const handleClearConversation = () => {
        clearConversation();
        setTopic('');
        setResponseCount(1);
        setResponseType('normal');
    };

    return (
        <div className="space-y-6">
            {/* API Key Setup */}
            <ApiKeySetup onApiKeyValidated={setIsApiKeyValid} />

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
                        Response Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => setResponseType('precise')}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${responseType === 'precise'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            disabled={isGenerating}
                        >
                            Precise
                            <span className="block text-xs opacity-75">≤30 words</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setResponseType('normal')}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${responseType === 'normal'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            disabled={isGenerating}
                        >
                            Normal
                            <span className="block text-xs opacity-75">≤100 words</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setResponseType('detailed')}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${responseType === 'detailed'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            disabled={isGenerating}
                        >
                            Detailed
                            <span className="block text-xs opacity-75">No limit</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setResponseType('voice')}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${responseType === 'voice'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            disabled={isGenerating}
                        >
                            Voice
                            <span className="block text-xs opacity-75">Audio TTS</span>
                        </button>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conversation Rounds: {responseCount}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        Number of rounds where each model responds in sequence
                    </p>
                    <div className="px-2">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={responseCount}
                            onChange={(e) => setResponseCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            disabled={isGenerating}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1 round</span>
                            <span>5 rounds</span>
                            <span>10 rounds</span>
                        </div>
                    </div>
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
                                    className="p-4 bg-gray-50 rounded-lg border"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-medium text-gray-900">{model.name}</h3>
                                        <button
                                            onClick={() => removeModel(model.id)}
                                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                            disabled={isGenerating}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Custom Prompt Input */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Custom Prompt (Optional)
                                        </label>
                                        <textarea
                                            value={systemPrompts[model.id] || ''}
                                            onChange={(e) => updateSystemPrompt(model.id, e.target.value)}
                                            placeholder="Enter a custom system prompt for this model..."
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
                                            rows={2}
                                            disabled={isGenerating}
                                        />
                                    </div>

                                    {/* Tone Selection */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Conversation Tone
                                        </label>
                                        <div className="grid grid-cols-2 gap-1">
                                            {availableTones.map((tone) => (
                                                <button
                                                    key={tone.id}
                                                    type="button"
                                                    onClick={() => updateTone(model.id, tones[model.id] === tone.id ? '' : tone.id)}
                                                    className={`px-2 py-1 text-xs rounded transition-colors ${tones[model.id] === tone.id
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    disabled={isGenerating}
                                                    title={tone.description}
                                                >
                                                    {tone.name}
                                                </button>
                                            ))}
                                            {tones[model.id] && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateTone(model.id, '')}
                                                    className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors col-span-2"
                                                    disabled={isGenerating}
                                                >
                                                    Clear Tone
                                                </button>
                                            )}
                                        </div>
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
                        disabled={!topic.trim() || selectedModels.length === 0 || isGenerating || !isApiKeyValid}
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
        </div>
    );
};

export default ConversationSetup; 