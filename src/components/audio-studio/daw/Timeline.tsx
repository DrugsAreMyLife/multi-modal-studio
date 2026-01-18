'use client';

interface TimelineProps {
  currentTime: number;
  duration: number;
  bpm: number;
}

export function Timeline({ currentTime, duration, bpm }: TimelineProps) {
  const markers = [];
  const beatsPerSecond = bpm / 60;
  const secondsPerBeat = 60 / bpm;

  for (let i = 0; i <= duration; i += secondsPerBeat * 4) {
    // Every 4 beats (1 bar in 4/4)
    markers.push(i);
  }

  return (
    <div className="bg-muted/50 relative flex h-6 items-end border-b">
      {markers.map((time, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: `calc(192px + ${(time / duration) * (100 - 12)}%)` }}
        >
          <span className="text-muted-foreground text-[10px]">{i + 1}</span>
          <div className="bg-border h-2 w-px" />
        </div>
      ))}
      {/* Playhead */}
      <div
        className="bg-primary absolute top-0 bottom-0 w-0.5"
        style={{ left: `calc(192px + ${(currentTime / duration) * (100 - 12)}%)` }}
      />
    </div>
  );
}
