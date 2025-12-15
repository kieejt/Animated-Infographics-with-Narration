import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import TimelineItem from './TimelineItem';

export default function Track({ track }) {
    const { setNodeRef } = useDroppable({
        id: track.id,
    });

    return (
        <div className="flex gap-2">
            <div
                ref={setNodeRef}
                className="flex-1 bg-gray-800 p-2 rounded-lg min-h-[80px] flex items-center gap-2 overflow-x-auto border border-gray-700"
            >
                <SortableContext
                    items={track.scenes.map(s => s.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    {track.scenes.map(scene => (
                        <TimelineItem key={scene.id} scene={scene} />
                    ))}
                </SortableContext>
                {track.scenes.length === 0 && <span className="text-gray-600 text-xs italic ml-2">Drop scenes here</span>}
            </div>
        </div>
    );
}
