import React from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import ConversationSetup from './components/ConversationSetup';
import ConversationView from './components/ConversationView';
import { ConversationProvider } from './contexts/ConversationContext';
import { motion } from 'framer-motion';

function App() {
    return (
        <ConversationProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <Header />

                <main className="container mx-auto px-4 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-7xl mx-auto"
                    >
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-4">
                                Welcome to Manazra
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Create engaging conversations between different AI models.
                                Choose your topic, select models, and watch them discuss!
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <ConversationSetup />
                            </div>

                            <div className="lg:col-span-2">
                                <ConversationView />
                            </div>
                        </div>
                    </motion.div>
                </main>

                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                    }}
                />
            </div>
        </ConversationProvider>
    );
}

export default App; 