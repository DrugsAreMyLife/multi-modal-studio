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
import { StudioErrorBoundary } from '@/components/shared/StudioErrorBoundary';

interface ShellProps {
  children?: React.ReactNode;
}

export function Shell() {
  const [currentView, setCurrentView] = useState<ViewMode>('workbench');
  const { isFocused, toggleFocused } = useUIStore();

  // Global Hooks
  useAutoTitle();

  return (
    <div className="bg-background text-foreground relative flex h-screen w-full overflow-hidden">
      {/* Left Rail - Hidden in Focus Mode */}
      <AnimatePresence>
        {!isFocused && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="z-30 h-full"
          >
            <Sidebar currentView={currentView} onViewChange={setCurrentView} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar - Hidden in Focus Mode */}
        <AnimatePresence>
          {!isFocused && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="z-20 overflow-hidden"
            >
              <TopBar />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="bg-grid-slate-500/[0.05] dark:bg-grid-slate-100/[0.05] relative flex-1 overflow-hidden">
          {/* Gradients/Backdrops */}
          <div className="bg-background/50 pointer-events-none absolute inset-0" />

          <div className="relative h-full overflow-auto p-6">
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
                  className="relative z-10 h-full"
                >
                  <StudioErrorBoundary name="Chat Orchestrator">
                    <ChatOrchestrator />
                  </StudioErrorBoundary>
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
                  <StudioErrorBoundary name="Image Studio">
                    <ImageStudio />
                  </StudioErrorBoundary>
                </motion.div>
              )}

              {currentView === 'video' && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-full flex-col gap-4"
                >
                  <StudioErrorBoundary name="Video Studio">
                    <div className="flex min-h-0 flex-1 gap-4">
                      <div className="bg-muted/20 flex flex-1 items-center justify-center rounded-xl border border-dashed">
                        <span className="text-muted-foreground">Preview Area</span>
                      </div>
                      <div className="flex w-[300px] flex-col gap-4">
                        <UnifiedAssetPicker onSelect={(file, url) => console.log(file, url)} />
                        <KeyframeEditor />
                      </div>
                    </div>
                    <div className="h-[300px] shrink-0">
                      <Timeline />
                    </div>
                  </StudioErrorBoundary>
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
                  <StudioErrorBoundary name="Workflow Studio">
                    <WorkflowStudio />
                  </StudioErrorBoundary>
                </motion.div>
              )}

              {currentView === 'audio' && (
                <motion.div
                  key="audio"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-full flex-col gap-4 p-4"
                >
                  <StudioErrorBoundary name="Audio Studio">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Audio Studio</h2>
                      <UnifiedAssetPicker onSelect={(file, url) => console.log(file, url)} />
                    </div>
                    <AudioVisualizer url="https://actions.google.com/sounds/v1/science_fiction/scifi_laser_gun.ogg" />
                    <AudioVisualizer
                      url="https://actions.google.com/sounds/v1/ambiences/industrial_hum.ogg"
                      height={80}
                      waveColor="#a855f7"
                      progressColor="#d8b4fe"
                    />
                  </StudioErrorBoundary>
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
                  <StudioErrorBoundary name="Analysis Studio">
                    <AnalysisStudio />
                  </StudioErrorBoundary>
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
            className="border-border bg-background/50 hidden overflow-hidden border-l p-4 backdrop-blur-sm xl:block"
          >
            <div className="w-80">
              <div className="mb-4 text-sm font-medium">Properties</div>
              <div className="text-muted-foreground text-xs">
                Select an item to view properties.
              </div>
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
        <div className="bg-background/50 flex items-center rounded-lg border p-1 shadow-sm backdrop-blur">
          <IntegrationSettings />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="bg-background/50 rounded-full opacity-20 backdrop-blur transition-opacity hover:opacity-100"
          onClick={() => toggleFocused()}
          title={isFocused ? 'Exit Focus Mode' : 'Enter Focus Mode'}
        >
          {isFocused ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>
    </div>
  );
}
