import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateApiKey, saveApiKey } from '../services/api';

interface ApiKeySetupProps {
    onApiKeyValidated: (isValid: boolean) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeyValidated }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'invalid'>('none');
    const [showPopup, setShowPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Check if API key exists in localStorage
        const storedKey = localStorage.getItem('openrouter_api_key');
        if (storedKey) {
            setApiKey(storedKey);
            validateStoredKey(storedKey);
        } else {
            onApiKeyValidated(false);
        }
    }, [onApiKeyValidated]);

    const validateStoredKey = async (key: string) => {
        setIsValidating(true);
        setValidationStatus('none');

        try {
            const isValid = await validateApiKey(key);
            setValidationStatus(isValid ? 'valid' : 'invalid');
            onApiKeyValidated(isValid);
        } catch (error) {
            setValidationStatus('invalid');
            onApiKeyValidated(false);
        } finally {
            setIsValidating(false);
        }
    };

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            setErrorMessage('Please enter an API key');
            return;
        }

        setIsValidating(true);
        setErrorMessage('');

        try {
            const isValid = await validateApiKey(apiKey);
            if (isValid) {
                await saveApiKey(apiKey);
                setValidationStatus('valid');
                onApiKeyValidated(true);
                setShowPopup(false);
                setErrorMessage('');
            } else {
                setValidationStatus('invalid');
                setErrorMessage('Invalid API key. Please check and try again.');
                onApiKeyValidated(false);
            }
        } catch (error) {
            setValidationStatus('invalid');
            setErrorMessage(error instanceof Error ? error.message : 'Failed to validate API key');
            onApiKeyValidated(false);
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemoveApiKey = () => {
        localStorage.removeItem('openrouter_api_key');
        setApiKey('');
        setValidationStatus('none');
        onApiKeyValidated(false);
    };

    const getStatusIcon = () => {
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

    const getStatusText = () => {
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

    const getStatusColor = () => {
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
            {/* API Key Status Display */}
            <div className="card p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {getStatusIcon()}
                        <div>
                            <h3 className="font-medium text-gray-900">OpenRouter API Key</h3>
                            <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        {validationStatus === 'valid' ? (
                            <button
                                onClick={handleRemoveApiKey}
                                className="btn btn-outline btn-sm text-red-600 hover:text-red-700"
                            >
                                Remove
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowPopup(true)}
                                className="btn btn-primary btn-sm"
                            >
                                {validationStatus === 'invalid' ? 'Update Key' : 'Add Key'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* API Key Setup Popup */}
            <AnimatePresence>
                {showPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPopup(false)}
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
                                    onClick={() => setShowPopup(false)}
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
                                            type={showKey ? 'text' : 'password'}
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="sk-or-v1-..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                                            disabled={isValidating}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                                        {errorMessage}
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
                                        onClick={() => setShowPopup(false)}
                                        className="btn btn-outline flex-1"
                                        disabled={isValidating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveApiKey}
                                        disabled={isValidating || !apiKey.trim()}
                                        className="btn btn-primary flex-1"
                                    >
                                        {isValidating ? (
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