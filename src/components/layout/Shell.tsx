'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, ViewMode } from './Sidebar';
import { TopBar } from './TopBar';
import { ChatOrchestrator } from '@/components/chat/ChatOrchestrator';
import { WorkbenchGrid } from '@/components/workbench/WorkbenchGrid';
import { ImageStudio } from '@/components/image-studio/ImageStudio';
import { VideoStudio } from '@/components/video-studio/VideoStudio';
import { WorkflowStudio } from '@/components/workflow/WorkflowStudio';
import { AudioStudio } from '@/components/audio-studio/AudioStudio';
import { IconStudio } from '@/components/icon-studio/IconStudio';
import { AnalysisStudio } from '@/components/analysis-studio/AnalysisStudio';
import { Timeline } from '@/components/timeline/Timeline';
import { KeyframeEditor } from '@/components/timeline/KeyframeEditor';
import { AudioVisualizer } from '@/components/audio/AudioVisualizer';
import { IntegrationSettings } from '@/components/integrations/IntegrationSettings';
import { UnifiedAssetPicker } from '@/components/cloud/UnifiedAssetPicker';
import { GlobalChatOverlay } from '@/components/chat/GlobalChatOverlay';
import { DetachedChatManager } from '@/components/chat/DetachedChatManager';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useUIStore } from '@/lib/store/ui-store';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShortcutOverlay } from '@/components/ui/ShortcutOverlay';
import { useAutoTitle } from '@/lib/store/useAutoTitle';

interface ShellProps {
    children?: React.ReactNode;
}

export function Shell() {
    const [currentView, setCurrentView] = useState<ViewMode>('workbench');
    const { isFocused, toggleFocused } = useUIStore();

    // Global Hooks
    useAutoTitle();

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden text-foreground relative">
            {/* Left Rail - Hidden in Focus Mode */}
            <AnimatePresence>
                {!isFocused && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full z-30"
                    >
                        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Top Bar - Hidden in Focus Mode */}
                <AnimatePresence>
                    {!isFocused && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden z-20"
                        >
                            <TopBar />
                        </motion.div>
                    )}
                </AnimatePresence>

                <main className="flex-1 relative overflow-hidden bg-grid-slate-500/[0.05] dark:bg-grid-slate-100/[0.05]">
                    {/* Gradients/Backdrops */}
                    <div className="absolute inset-0 bg-background/50 pointer-events-none" />

                    <div className="relative h-full p-6 overflow-auto">
                        {/* Dynamic View Rendering */}
                        <AnimatePresence mode="wait">
                            {currentView === 'workbench' && (
                                <motion.div
                                    key="workbench"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    <WorkbenchGrid />
                                </motion.div>
                            )}

                            {currentView === 'chat' && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full z-10 relative"
                                >
                                    <ChatOrchestrator />
                                </motion.div>
                            )}

                            {currentView === 'image' && (
                                <motion.div
                                    key="image"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    <ImageStudio />
                                </motion.div>
                            )}

                            {currentView === 'video' && (
                                <motion.div
                                    key="video"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full flex flex-col gap-4"
                                >
                                    <div className="flex-1 flex gap-4 min-h-0">
                                        <div className="flex-1 bg-muted/20 rounded-xl flex items-center justify-center border border-dashed">
                                            <span className="text-muted-foreground">Preview Area</span>
                                        </div>
                                        <div className="w-[300px] flex flex-col gap-4">
                                            <UnifiedAssetPicker onSelect={(file, url) => console.log(file, url)} />
                                            <KeyframeEditor />
                                        </div>
                                    </div>
                                    <div className="h-[300px] shrink-0">
                                        <Timeline />
                                    </div>
                                </motion.div>
                            )}

                            {currentView === 'workflow' && (
                                <motion.div
                                    key="workflow"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    <WorkflowStudio />
                                </motion.div>
                            )}

                            {currentView === 'audio' && (
                                <motion.div
                                    key="audio"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full p-4 flex flex-col gap-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold">Audio Studio</h2>
                                        <UnifiedAssetPicker onSelect={(file, url) => console.log(file, url)} />
                                    </div>
                                    <AudioVisualizer url="https://actions.google.com/sounds/v1/science_fiction/scifi_laser_gun.ogg" />
                                    <AudioVisualizer url="https://actions.google.com/sounds/v1/ambiences/industrial_hum.ogg" height={80} waveColor="#a855f7" progressColor="#d8b4fe" />
                                </motion.div>
                            )}

                            {currentView === 'analysis' && (
                                <motion.div
                                    key="analysis"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    <AnalysisStudio />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Right Inspector (Collapsible) - Hidden in Focus Mode OR if explicitly collapsed (future) */}
            <AnimatePresence>
                {!isFocused && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="border-l border-border bg-background/50 backdrop-blur-sm hidden xl:block p-4 overflow-hidden"
                    >
                        <div className="w-80">
                            <div className="text-sm font-medium mb-4">Properties</div>
                            <div className="text-xs text-muted-foreground">Select an item to view properties.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Overlays */}
            <GlobalChatOverlay />
            <DetachedChatManager />
            <CommandPalette currentView={currentView} onViewChange={setCurrentView} />
            <ShortcutOverlay />

            {/* Floating Focus Toggle & Settings */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <div className="bg-background/50 backdrop-blur rounded-lg border shadow-sm flex items-center p-1">
                    <IntegrationSettings />
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-20 hover:opacity-100 transition-opacity rounded-full bg-background/50 backdrop-blur"
                    onClick={() => toggleFocused()}
                    title={isFocused ? "Exit Focus Mode" : "Enter Focus Mode"}
                >
                    {isFocused ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
            </div>
        </div>
    );
}
