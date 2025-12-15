import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useProject } from '../../context/ProjectContext';
import Track from './Track';
import TimelineItem from './TimelineItem';
import { Plus } from 'lucide-react';

export default function Timeline() {
    const { tracks, setTracks } = useProject();
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        // Find source and diff
        // This logic handles moving within same track or between tracks
        const activeTrackIndex = tracks.findIndex(t => t.scenes.find(s => s.id === active.id));
        const activeSceneIndex = tracks[activeTrackIndex]?.scenes.findIndex(s => s.id === active.id);

        // Check if 'over' is a track or a scene
        let overTrackIndex = tracks.findIndex(t => t.id === over.id);
        let overSceneIndex = -1; // Append if -1

        if (overTrackIndex === -1) {
            // Over is a scene?
            overTrackIndex = tracks.findIndex(t => t.scenes.find(s => s.id === over.id));
            overSceneIndex = tracks[overTrackIndex]?.scenes.findIndex(s => s.id === over.id);
        }

        if (activeTrackIndex === -1 || overTrackIndex === -1) return;

        const newTracks = [...tracks];

        // Moving within same track
        if (activeTrackIndex === overTrackIndex) {
            if (activeSceneIndex !== overSceneIndex) {
                newTracks[activeTrackIndex].scenes = arrayMove(newTracks[activeTrackIndex].scenes, activeSceneIndex, overSceneIndex);
                setTracks(newTracks);
            }
            return;
        }

        // Moving between tracks (Though UI is restricted to 1, logic remains valid)
        const [movedScene] = newTracks[activeTrackIndex].scenes.splice(activeSceneIndex, 1);

        if (overSceneIndex === -1) {
            // Dropped on empty track
            newTracks[overTrackIndex].scenes.push(movedScene);
        } else {
            // Dropped on another scene
            newTracks[overTrackIndex].scenes.splice(overSceneIndex, 0, movedScene);
        }

        setTracks(newTracks);
    };

    return (
        <div className="bg-gray-900 p-4 rounded-xl overflow-x-auto min-h-[140px]">
            <div className="flex items-center justify-between mb-2 text-white">
                <h3 className="font-bold text-sm text-gray-400">Timeline Sequence</h3>
                {/* Add Track button removed as per user request */}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="space-y-4">
                    {tracks.length > 0 && (
                        <Track key={tracks[0].id} track={tracks[0]} />
                    )}
                </div>

                <DragOverlay>
                    {activeId ? <div className="bg-blue-500 text-white p-2 rounded shadow-lg w-32 h-16 flex items-center justify-center">Dragging...</div> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
