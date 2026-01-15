'use client';

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
    chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose'
        });

        if (ref.current) {
            mermaid.contentLoaded();
        }
    }, []);

    useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = chart;
            try {
                mermaid.run({
                    nodes: [ref.current]
                });
            } catch (e) {
                console.error("Mermaid render error", e);
                ref.current.innerHTML = "Error rendering chart";
            }
        }
    }, [chart]);

    return (
        <div className="mermaid bg-black/20 p-4 rounded-lg overflow-x-auto" ref={ref}>
            {chart}
        </div>
    );
}
