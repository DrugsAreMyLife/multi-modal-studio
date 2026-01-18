import { createServerClient } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Play, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Mermaid } from '@/components/shared/Mermaid';

export default async function SharePage({ params }: { params: { slug: string } }) {
  const supabase = createServerClient();
  const { slug } = params;

  const { data: shared, error } = await supabase
    .from('shared_content')
    .select('*, users(email)')
    .eq('slug', slug)
    .single();

  if (error || !shared) {
    notFound();
  }

  const { type, content, metadata, created_at } = shared;

  return (
    <div className="selection:bg-primary/30 min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="from-primary shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br to-purple-600 shadow-lg">
              <ImageIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Multi-Modal Studio</h1>
              <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
                Shared Generation
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400 capitalize">
            {type}
          </Badge>
        </header>

        <main className="animate-in fade-in slide-in-from-bottom-5 space-y-8 duration-700">
          {type === 'image' && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <Image
                src={content.url}
                alt="Shared Generation"
                fill
                className="bg-black/40 object-contain"
                priority
              />
            </div>
          )}

          {type === 'video' && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              <video
                src={content.url}
                controls
                autoPlay
                loop
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {type === 'analysis' && (
            <div className="space-y-8">
              <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm">
                <CardContent className="space-y-6 p-8">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <FileText className="text-blue-400" size={24} />
                    <h2 className="text-2xl font-bold">Analysis Report</h2>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="leading-relaxed whitespace-pre-wrap text-zinc-300">
                      {content.summary}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {content.diagrams?.map((diag: string, i: number) => (
                <div key={i} className="space-y-4">
                  <h3 className="px-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                    Diagram {i + 1}
                  </h3>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                    <Mermaid chart={diag} />
                  </div>
                </div>
              ))}

              <div className="space-y-4">
                <h3 className="px-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Detailed Nuances
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {content.nuances?.map((nuance: string, i: number) => (
                    <div
                      key={i}
                      className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4"
                    >
                      <span className="text-primary/40 font-mono text-xs font-bold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-zinc-300">{nuance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <section className="flex flex-col items-center space-y-4 border-t border-zinc-900 pt-12 text-center">
            <h2 className="text-lg font-semibold">Want to generate your own?</h2>
            <p className="max-w-md text-sm text-zinc-500">
              Multi-Modal Studio is the ultimate playground for AI-driven creativity. Join and start
              building today.
            </p>
            <div className="flex gap-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
              >
                Launch Studio
                <ExternalLink size={14} />
              </a>
            </div>
          </section>
        </main>

        <footer className="group mt-20 flex items-center justify-between border-t border-zinc-900 pt-8 opacity-40 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
          <div className="font-mono text-[10px] tracking-tighter">ID: {slug.toUpperCase()}</div>
          <div className="font-mono text-[10px] tracking-tighter uppercase">
            CREATED {new Date(created_at).toLocaleDateString()}
          </div>
        </footer>
      </div>
    </div>
  );
}
