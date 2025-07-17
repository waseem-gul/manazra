import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateApiKey, saveApiKey } from '../services/api';
import ttsService from '../services/tts';

interface ApiKeySetupProps {
    onApiKeyValidated: (isValid: boolean) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeyValidated }) => {
    // OpenRouter API Key state
    const [openRouterApiKey, setOpenRouterApiKey] = useState('');
    const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
    const [isValidatingOpenRouter, setIsValidatingOpenRouter] = useState(false);
    const [openRouterValidationStatus, setOpenRouterValidationStatus] = useState<'none' | 'valid' | 'invalid'>('none');
    const [showOpenRouterPopup, setShowOpenRouterPopup] = useState(false);
    const [openRouterErrorMessage, setOpenRouterErrorMessage] = useState('');

    // OpenAI API Key state
    const [openAIApiKey, setOpenAIApiKey] = useState('');
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [isValidatingOpenAI, setIsValidatingOpenAI] = useState(false);
    const [openAIValidationStatus, setOpenAIValidationStatus] = useState<'none' | 'valid' | 'invalid'>('none');
    const [showOpenAIPopup, setShowOpenAIPopup] = useState(false);
    const [openAIErrorMessage, setOpenAIErrorMessage] = useState('');

    useEffect(() => {
        // Check if API keys exist in localStorage
        const storedOpenRouterKey = localStorage.getItem('openrouter_api_key');
        const storedOpenAIKey = localStorage.getItem('openai_api_key');

        if (storedOpenRouterKey) {
            setOpenRouterApiKey(storedOpenRouterKey);
            validateStoredOpenRouterKey(storedOpenRouterKey);
        }

        if (storedOpenAIKey) {
            setOpenAIApiKey(storedOpenAIKey);
            validateStoredOpenAIKey(storedOpenAIKey);
        }

        // Validate overall API key status
        onApiKeyValidated(!!storedOpenRouterKey);
    }, [onApiKeyValidated]);

    const validateStoredOpenRouterKey = async (key: string) => {
        setIsValidatingOpenRouter(true);
        setOpenRouterValidationStatus('none');

        try {
            const isValid = await validateApiKey(key);
            setOpenRouterValidationStatus(isValid ? 'valid' : 'invalid');
            onApiKeyValidated(isValid);
        } catch (error) {
            setOpenRouterValidationStatus('invalid');
            onApiKeyValidated(false);
        } finally {
            setIsValidatingOpenRouter(false);
        }
    };

    const validateStoredOpenAIKey = async (key: string) => {
        setIsValidatingOpenAI(true);
        setOpenAIValidationStatus('none');

        try {
            const isValid = await ttsService.validateApiKey(key);
            setOpenAIValidationStatus(isValid ? 'valid' : 'invalid');
        } catch (error) {
            setOpenAIValidationStatus('invalid');
        } finally {
            setIsValidatingOpenAI(false);
        }
    };

    const handleSaveOpenRouterApiKey = async () => {
        if (!openRouterApiKey.trim()) {
            setOpenRouterErrorMessage('Please enter an API key');
            return;
        }

        setIsValidatingOpenRouter(true);
        setOpenRouterErrorMessage('');

        try {
            const isValid = await validateApiKey(openRouterApiKey);
            if (isValid) {
                await saveApiKey(openRouterApiKey);
                setOpenRouterValidationStatus('valid');
                onApiKeyValidated(true);
                setShowOpenRouterPopup(false);
                setOpenRouterErrorMessage('');
            } else {
                setOpenRouterValidationStatus('invalid');
                setOpenRouterErrorMessage('Invalid API key. Please check and try again.');
                onApiKeyValidated(false);
            }
        } catch (error) {
            setOpenRouterValidationStatus('invalid');
            setOpenRouterErrorMessage(error instanceof Error ? error.message : 'Failed to validate API key');
            onApiKeyValidated(false);
        } finally {
            setIsValidatingOpenRouter(false);
        }
    };

    const handleSaveOpenAIApiKey = async () => {
        if (!openAIApiKey.trim()) {
            setOpenAIErrorMessage('Please enter an API key');
            return;
        }

        setIsValidatingOpenAI(true);
        setOpenAIErrorMessage('');

        try {
            const isValid = await ttsService.validateApiKey(openAIApiKey);
            if (isValid) {
                localStorage.setItem('openai_api_key', openAIApiKey);
                setOpenAIValidationStatus('valid');
                setShowOpenAIPopup(false);
                setOpenAIErrorMessage('');
            } else {
                setOpenAIValidationStatus('invalid');
                setOpenAIErrorMessage('Invalid API key. Please check and try again.');
            }
        } catch (error) {
            setOpenAIValidationStatus('invalid');
            setOpenAIErrorMessage(error instanceof Error ? error.message : 'Failed to validate API key');
        } finally {
            setIsValidatingOpenAI(false);
        }
    };

    const handleRemoveOpenRouterApiKey = () => {
        localStorage.removeItem('openrouter_api_key');
        setOpenRouterApiKey('');
        setOpenRouterValidationStatus('none');
        onApiKeyValidated(false);
    };

    const handleRemoveOpenAIApiKey = () => {
        localStorage.removeItem('openai_api_key');
        setOpenAIApiKey('');
        setOpenAIValidationStatus('none');
    };

    const getStatusIcon = (isValidating: boolean, validationStatus: string) => {
        if (isValidating) {
            return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
        }

        switch (validationStatus) {
            case 'valid':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'invalid':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Key className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusText = (isValidating: boolean, validationStatus: string) => {
        if (isValidating) return 'Validating...';

        switch (validationStatus) {
            case 'valid':
                return 'API Key Valid';
            case 'invalid':
                return 'Invalid API Key';
            default:
                return 'No API Key';
        }
    };

    const getStatusColor = (isValidating: boolean, validationStatus: string) => {
        if (isValidating) return 'text-blue-600';

        switch (validationStatus) {
            case 'valid':
                return 'text-green-600';
            case 'invalid':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <>
            {/* API Keys Status Display */}
            <div className="space-y-4">
                {/* OpenRouter API Key */}
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {getStatusIcon(isValidatingOpenRouter, openRouterValidationStatus)}
                            <div>
                                <h3 className="font-medium text-gray-900">OpenRouter API Key</h3>
                                <p className={`text-sm ${getStatusColor(isValidatingOpenRouter, openRouterValidationStatus)}`}>
                                    {getStatusText(isValidatingOpenRouter, openRouterValidationStatus)}
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            {openRouterValidationStatus === 'valid' ? (
                                <button
                                    onClick={handleRemoveOpenRouterApiKey}
                                    className="btn btn-outline btn-sm text-red-600 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowOpenRouterPopup(true)}
                                    className="btn btn-primary btn-sm"
                                >
                                    {openRouterValidationStatus === 'invalid' ? 'Update Key' : 'Add Key'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* OpenAI API Key */}
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {getStatusIcon(isValidatingOpenAI, openAIValidationStatus)}
                            <div>
                                <h3 className="font-medium text-gray-900">OpenAI API Key</h3>
                                <p className={`text-sm ${getStatusColor(isValidatingOpenAI, openAIValidationStatus)}`}>
                                    {getStatusText(isValidatingOpenAI, openAIValidationStatus)}
                                </p>
                                <p className="text-xs text-gray-500">Required for Voice Mode TTS</p>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            {openAIValidationStatus === 'valid' ? (
                                <button
                                    onClick={handleRemoveOpenAIApiKey}
                                    className="btn btn-outline btn-sm text-red-600 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowOpenAIPopup(true)}
                                    className="btn btn-primary btn-sm"
                                >
                                    {openAIValidationStatus === 'invalid' ? 'Update Key' : 'Add Key'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* OpenRouter API Key Setup Popup */}
            <AnimatePresence>
                {showOpenRouterPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowOpenRouterPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">OpenRouter API Key</h2>
                                <button
                                    onClick={() => setShowOpenRouterPopup(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        API Key
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showOpenRouterKey ? 'text' : 'password'}
                                            value={openRouterApiKey}
                                            onChange={(e) => setOpenRouterApiKey(e.target.value)}
                                            placeholder="sk-or-v1-..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                                            disabled={isValidatingOpenRouter}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {openRouterErrorMessage && (
                                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                                        {openRouterErrorMessage}
                                    </div>
                                )}

                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                    <p className="font-medium mb-1">How to get your API key:</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Visit <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">openrouter.ai/keys</a></li>
                                        <li>Sign up or log in to your account</li>
                                        <li>Create a new API key</li>
                                        <li>Copy and paste it here</li>
                                    </ol>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowOpenRouterPopup(false)}
                                        className="btn btn-outline flex-1"
                                        disabled={isValidatingOpenRouter}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveOpenRouterApiKey}
                                        disabled={isValidatingOpenRouter || !openRouterApiKey.trim()}
                                        className="btn btn-primary flex-1"
                                    >
                                        {isValidatingOpenRouter ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Validating...
                                            </>
                                        ) : (
                                            'Save & Validate'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OpenAI API Key Setup Popup */}
            <AnimatePresence>
                {showOpenAIPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowOpenAIPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">OpenAI API Key</h2>
                                <button
                                    onClick={() => setShowOpenAIPopup(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        API Key
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showOpenAIKey ? 'text' : 'password'}
                                            value={openAIApiKey}
                                            onChange={(e) => setOpenAIApiKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                                            disabled={isValidatingOpenAI}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {openAIErrorMessage && (
                                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                                        {openAIErrorMessage}
                                    </div>
                                )}

                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                    <p className="font-medium mb-1">How to get your API key:</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">platform.openai.com/api-keys</a></li>
                                        <li>Sign up or log in to your account</li>
                                        <li>Create a new API key</li>
                                        <li>Copy and paste it here</li>
                                    </ol>
                                    <p className="mt-2 text-xs text-gray-500">
                                        This key is required for Voice Mode Text-to-Speech functionality.
                                    </p>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowOpenAIPopup(false)}
                                        className="btn btn-outline flex-1"
                                        disabled={isValidatingOpenAI}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveOpenAIApiKey}
                                        disabled={isValidatingOpenAI || !openAIApiKey.trim()}
                                        className="btn btn-primary flex-1"
                                    >
                                        {isValidatingOpenAI ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Validating...
                                            </>
                                        ) : (
                                            'Save & Validate'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ApiKeySetup; 