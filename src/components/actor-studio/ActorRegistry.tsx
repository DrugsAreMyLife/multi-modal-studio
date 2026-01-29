'use client';

import { useState } from 'react';
import { useActorStore, Actor } from '@/lib/store/actor-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Plus,
  Trash2,
  UserCircle,
  Sparkles,
  Search,
  MoreVertical,
  Fingerprint,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function ActorRegistry() {
  const { actors, addActor, removeActor, setActiveActor, activeActorId } = useActorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [enrollType, setEnrollType] = useState<'enrollment' | 'casting'>('enrollment');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [persona, setPersona] = useState('');
  const [imageUrl, setImageUrl] = useState('https://picsum.photos/400/500');

  const filteredActors = actors.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateActor = () => {
    if (!name) {
      toast.error('Please provide a name for the actor');
      return;
    }

    const newActor: Actor = {
      id: `actor-${Date.now()}`,
      name,
      thumbnailUrl: imageUrl,
      sourceType: enrollType,
      faceIdUrl: enrollType === 'enrollment' ? imageUrl : undefined,
      description: enrollType === 'casting' ? description : undefined,
      persona: persona || 'Neutral/Professional',
      tags: [enrollType === 'enrollment' ? 'FaceID' : 'Prompt-Based'],
      createdAt: Date.now(),
      metadata: {
        traits: persona ? persona.split(',').map((t) => t.trim()) : ['Neutral'],
      },
    };

    addActor(newActor);
    setIsDialogOpen(false);
    setName('');
    setDescription('');
    setPersona('');
    toast.success(`${name} enrolled in the studio cast.`);
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Fingerprint className="text-primary animate-pulse" />
            Actor Registry
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage persistent identities and UAT-analogous personalities
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-primary/20 gap-2 shadow-lg">
              <Plus size={16} /> Enroll New Actor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-white/10 bg-[#0c0c0c]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold italic">
                <Users className="text-primary" /> Enrollment Workflow
              </DialogTitle>
            </DialogHeader>

            <Tabs
              defaultValue="enrollment"
              value={enrollType}
              onValueChange={(v) => setEnrollType(v as any)}
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-2 bg-white/5">
                <TabsTrigger value="enrollment" className="gap-2">
                  <ImageIcon size={14} /> Image Enrollment
                </TabsTrigger>
                <TabsTrigger value="casting" className="gap-2">
                  <MessageSquare size={14} /> Description Casting
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 flex gap-6">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                      Actor Stage Name
                    </Label>
                    <Input
                      placeholder="e.g. Detective Miller"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-white/10 bg-white/5"
                    />
                  </div>

                  <TabsContent value="enrollment" className="m-0 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                        Face Reference URL
                      </Label>
                      <Input
                        placeholder="Paste image URL for FaceID persistence"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="border-white/10 bg-white/5"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="casting" className="m-0 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                        Physical Description
                      </Label>
                      <Textarea
                        placeholder="Describe features, ethnicity, age, hair style..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px] border-white/10 bg-white/5"
                      />
                    </div>
                  </TabsContent>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-60">
                      Persona Mapping (UAT Personality)
                      <Badge
                        variant="outline"
                        className="h-4 border-amber-500/30 px-1 text-[8px] text-amber-500"
                      >
                        Advanced
                      </Badge>
                    </Label>
                    <Textarea
                      placeholder="Stoic, easily agitated, corporate professional..."
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="min-h-[80px] border-white/10 bg-white/5"
                    />
                  </div>
                </div>

                <div className="w-48 shrink-0">
                  <Label className="mb-2 block text-[10px] font-bold tracking-widest uppercase opacity-60">
                    Cast Preview
                  </Label>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {imageUrl ? (
                      <img src={imageUrl} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground flex h-full items-center justify-center text-xs italic">
                        No image
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateActor} className="bg-primary hover:bg-primary/90">
                Finalize Enrollment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-muted/30 flex items-center gap-4 rounded-xl border border-white/5 p-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={16}
          />
          <Input
            placeholder="Search actors by DNA or persona..."
            className="bg-background/50 border-white/10 pl-10 ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 h-8">
            Active Cast
          </Badge>
          <Badge variant="outline" className="h-8 opacity-40">
            UAT Persona
          </Badge>
          <Badge variant="outline" className="h-8 opacity-40">
            Identity Proof
          </Badge>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-1 gap-6 pb-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredActors.map((actor) => (
            <Card
              key={actor.id}
              className={cn(
                'group hover:shadow-primary/10 relative overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
                activeActorId === actor.id
                  ? 'border-primary bg-primary/5 shadow-primary/5 shadow-lg'
                  : 'border-white/5 bg-black/60',
              )}
              onClick={() => setActiveActor(actor.id)}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={actor.thumbnailUrl}
                  alt={actor.name}
                  className="h-full w-full object-cover grayscale-[20%] transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white italic">{actor.name}</h3>
                    {actor.sourceType === 'enrollment' ? (
                      <Fingerprint size={16} className="text-primary" />
                    ) : (
                      <Zap size={16} className="text-amber-500" />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge className="bg-primary/20 h-4 border-none text-[8px] text-white">
                      {actor.sourceType === 'enrollment' ? 'FaceID-Locked' : 'Neural Casting'}
                    </Badge>
                    {actor.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="h-4 border-none bg-white/10 text-[8px] text-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="absolute top-2 right-2 flex translate-y-[-10px] gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeActor(actor.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <CardContent className="space-y-4 p-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-60">
                      Identity Coherence
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500">VERIFIED</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="from-primary h-full w-[94%] bg-gradient-to-r to-emerald-500" />
                  </div>
                </div>

                <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <ShieldCheck size={12} className="text-primary" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">
                      UAT Personality
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400 italic">
                    {actor.persona || 'Default neutral behavioral mapping.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredActors.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-40 text-center opacity-40">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5">
                <Users size={32} className="stroke-1" />
              </div>
              <h3 className="text-2xl font-light tracking-tight">Studio Cast Empty</h3>
              <p className="mt-2 max-w-xs text-sm">
                Enroll characters or perform a neural casting call to begin building your project's
                identity registry.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
