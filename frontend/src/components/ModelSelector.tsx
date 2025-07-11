import React, { useState, useEffect } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { X, Search, Plus, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ModelSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ isOpen, onClose }) => {
    const {
        availableModels,
        popularModels,
        selectedModels,
        isLoading,
        fetchModels,
        addModel,
    } = useConversation();

    const [searchTerm, setSearchTerm] = useState('');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (isOpen && availableModels.length === 0) {
            fetchModels();
        }
    }, [isOpen, availableModels.length, fetchModels]);

    const filteredModels = (showAll ? availableModels : popularModels).filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddModel = (model: any) => {
        addModel(model);
        toast.success(`${model.name} added to conversation!`);
    };

    const isSelected = (modelId: string) => {
        return selectedModels.some(m => m.id === modelId);
    };

    // Helper function to safely format pricing per 1M tokens
    const formatPricePer1M = (price: any): string => {
        if (price === null || price === undefined) return '0';

        let numPrice = 0;
        // If it's already a number
        if (typeof price === 'number') {
            numPrice = price;
        } else if (typeof price === 'string') {
            // If it's a string, try to convert it
            numPrice = parseFloat(price);
            if (isNaN(numPrice)) {
                return '0';
            }
        } else {
            return '0';
        }

        // Convert to price per 1M tokens
        const pricePer1M = numPrice * 1000000;
        return pricePer1M.toFixed(2);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold">Select AI Models</h2>
                        {selectedModels.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                {selectedModels.length} model{selectedModels.length === 1 ? '' : 's'} selected
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="p-6 border-b">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search models..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowAll(false)}
                            className={`btn ${!showAll ? 'btn-primary' : 'btn-outline'}`}
                        >
                            <Star className="w-4 h-4 mr-1" />
                            Popular Models
                        </button>
                        <button
                            onClick={() => setShowAll(true)}
                            className={`btn ${showAll ? 'btn-primary' : 'btn-outline'}`}
                        >
                            All Models ({availableModels.length})
                        </button>
                    </div>
                </div>

                {/* Models List */}
                <div className="p-6 overflow-y-auto max-h-96">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {filteredModels.map((model) => (
                                    <motion.div
                                        key={model.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className={`border rounded-lg p-4 transition-all hover:shadow-md ${isSelected(model.id)
                                            ? 'border-primary-300 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{model.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                                    <span>Context: {formatContextLength(model.contextLength)}</span>
                                                    {model.pricing && (
                                                        <span>
                                                            Input: ${formatPricePer1M(model.pricing.prompt)}/1M •
                                                            Output: ${formatPricePer1M(model.pricing.completion)}/1M
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddModel(model)}
                                                disabled={isSelected(model.id)}
                                                className={`btn ${isSelected(model.id)
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'btn-primary'
                                                    }`}
                                            >
                                                {isSelected(model.id) ? (
                                                    'Selected'
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Add
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {filteredModels.length === 0 && !isLoading && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No models found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ModelSelector; 