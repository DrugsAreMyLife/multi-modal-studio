'use client';

import { useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, Move, Image as ImageIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Types
interface CanvasItem {
  id: string;
  type: 'image' | 'text' | 'rect';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  src?: string;
  fill?: string;
  draggable?: boolean;
}

const URLImage = ({ src, ...props }: any) => {
  const [img] = useImage(src, 'anonymous');
  return <KonvaImage image={img} {...props} />;
};

export function MediaCanvas() {
  const [items, setItems] = useState<CanvasItem[]>([
    {
      id: '1',
      type: 'text',
      x: 50,
      y: 50,
      text: 'Design Garden',
      draggable: true,
      fill: '#ffffff',
    },
    {
      id: '2',
      type: 'rect',
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      fill: '#d97757',
      draggable: true,
    },
  ]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setPosition(newPos);
  };

  const addText = () => {
    setItems([
      ...items,
      {
        id: uuidv4(),
        type: 'text',
        x: 100,
        y: 100,
        text: 'New Note',
        draggable: true,
        fill: '#ffffff',
      },
    ]);
  };

  const addRect = () => {
    setItems([
      ...items,
      {
        id: uuidv4(),
        type: 'rect',
        x: 150,
        y: 150,
        width: 100,
        height: 100,
        fill: '#' + Math.floor(Math.random() * 16777215).toString(16),
        draggable: true,
      },
    ]);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-900">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Card className="bg-background/80 flex gap-2 p-2 backdrop-blur">
          <Button variant="ghost" size="icon" onClick={addText}>
            T
          </Button>
          <Button variant="ghost" size="icon" onClick={addRect}>
            <ImageIcon size={18} />
          </Button>
          <div className="bg-border mx-1 h-6 w-px" />
          <Button variant="ghost" size="icon" onClick={() => setScale(scale * 1.2)}>
            <ZoomIn size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setScale(scale / 1.2)}>
            <ZoomOut size={18} />
          </Button>
        </Card>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
      >
        <Layer>
          {items.map((item, i) => {
            if (item.type === 'image' && item.src) {
              return <URLImage key={item.id} {...item} />;
            }
            if (item.type === 'text') {
              return <Text key={item.id} {...item} fontSize={24} />;
            }
            if (item.type === 'rect') {
              return <Rect key={item.id} {...item} shadowBlur={10} />;
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}
