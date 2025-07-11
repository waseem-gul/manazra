import React, { useState, useEffect } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { X, Save, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModelConfigurationProps {
    modelId: string;
    isOpen: boolean;
    onClose: () => void;
}

const ModelConfiguration: React.FC<ModelConfigurationProps> = ({ modelId, isOpen, onClose }) => {
    const {
        selectedModels,
        availableTones,
        systemPrompts,
        tones,
        updateSystemPrompt,
        updateTone,
    } = useConversation();

    const [localSystemPrompt, setLocalSystemPrompt] = useState('');
    const [localTone, setLocalTone] = useState('');

    const model = selectedModels.find(m => m.id === modelId);

    useEffect(() => {
        if (isOpen && modelId) {
            setLocalSystemPrompt(systemPrompts[modelId] || '');
            setLocalTone(tones[modelId] || '');
        }
    }, [isOpen, modelId, systemPrompts, tones]);

    const handleSave = () => {
        if (localSystemPrompt.trim()) {
            updateSystemPrompt(modelId, localSystemPrompt);
        }
        if (localTone) {
            updateTone(modelId, localTone);
        }
        onClose();
    };

    const handleCancel = () => {
        setLocalSystemPrompt(systemPrompts[modelId] || '');
        setLocalTone(tones[modelId] || '');
        onClose();
    };

    // Helper function to safely format pricing
    const formatPrice = (price: any): string => {
        if (price === null || price === undefined) return '0';

        // If it's already a number
        if (typeof price === 'number') {
            return price.toFixed(6);
        }

        // If it's a string, try to convert it
        if (typeof price === 'string') {
            const numPrice = parseFloat(price);
            if (!isNaN(numPrice)) {
                return numPrice.toFixed(6);
            }
        }

        // Fallback
        return '0';
    };

    // Helper function to safely format context length
    const formatContextLength = (length: any): string => {
        if (length === null || length === undefined) return 'N/A';

        if (typeof length === 'number') {
            return length.toLocaleString();
        }

        if (typeof length === 'string') {
            const numLength = parseInt(length);
            if (!isNaN(numLength)) {
                return numLength.toLocaleString();
            }
        }

        return 'N/A';
    };

    if (!isOpen || !model) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                            <Settings className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Configure Model</h2>
                            <p className="text-sm text-gray-500">{model.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Configuration Form */}
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {/* System Prompt */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                System Prompt
                            </label>
                            <textarea
                                value={localSystemPrompt}
                                onChange={(e) => setLocalSystemPrompt(e.target.value)}
                                placeholder="Enter a custom system prompt for this model..."
                                className="textarea min-h-[120px]"
                                rows={5}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                This will override the default system prompt for this model. Leave empty to use the default.
                            </p>
                        </div>

                        {/* Tone Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Conversation Tone
                            </label>
                            <select
                                value={localTone}
                                onChange={(e) => setLocalTone(e.target.value)}
                                className="select"
                            >
                                <option value="">Select a tone (optional)</option>
                                {availableTones.map((tone) => (
                                    <option key={tone.id} value={tone.id}>
                                        {tone.name} - {tone.description}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Choose a tone to influence how this model responds in conversations.
                            </p>
                        </div>

                        {/* Model Information */}
                        <div className="border-t pt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Model Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Context Length:</span>
                                    <span className="ml-2 font-medium">
                                        {formatContextLength(model.contextLength)}
                                    </span>
                                </div>
                                {model.pricing && (
                                    <>
                                        <div>
                                            <span className="text-gray-500">Prompt Cost:</span>
                                            <span className="ml-2 font-medium">
                                                ${formatPrice(model.pricing.prompt)}/token
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Completion Cost:</span>
                                            <span className="ml-2 font-medium">
                                                ${formatPrice(model.pricing.completion)}/token
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={handleCancel}
                        className="btn btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Configuration
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ModelConfiguration; 