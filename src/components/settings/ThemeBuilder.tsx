'use client';

import { useUIStore } from '@/lib/store/ui-store';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { useEffect } from 'react';
import { Palette } from 'lucide-react';

const THEMES = [
    { id: 'default', name: 'Default Dark', primary: '221.2 83.2% 53.3%' },
    { id: 'deep-space', name: 'Deep Space', primary: '260 100% 60%' },
    { id: 'cyberpunk', name: 'Cyberpunk', primary: '300 100% 50%' },
    { id: 'soft-paper', name: 'Soft Paper', primary: '30 50% 50%' },
] as const;

export function ThemeBuilder() {
    const { activeTheme, setTheme } = useUIStore();

    // Effect to apply theme (In a real app, this might be in a Layout wrapper)
    useEffect(() => {
        const root = document.documentElement;
        if (activeTheme === 'default') {
            root.style.removeProperty('--primary');
            root.classList.remove('theme-deep-space', 'theme-cyberpunk', 'theme-soft-paper');
        } else {
            // Simple hack for immediate feedback without full CSS vars setup
            const theme = THEMES.find(t => t.id === activeTheme);
            if (theme) {
                root.style.setProperty('--primary', theme.primary);
            }
        }
    }, [activeTheme]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Palette className="text-primary" size={20} />
                <h2 className="text-lg font-semibold">Theme & Appearance</h2>
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label>Color Theme</Label>
                    <RadioGroup defaultValue={activeTheme} onValueChange={setTheme} className="grid grid-cols-2 gap-4">
                        {THEMES.map((theme) => (
                            <div key={theme.id}>
                                <RadioGroupItem value={theme.id} id={theme.id} className="peer sr-only" />
                                <Label
                                    htmlFor={theme.id}
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <span className="mb-2 text-sm font-medium">{theme.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full" style={{ background: `hsl(${theme.primary})` }} />
                                        <div className="h-4 w-12 rounded-md bg-muted" />
                                    </div>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </div>
        </div>
    );
}
