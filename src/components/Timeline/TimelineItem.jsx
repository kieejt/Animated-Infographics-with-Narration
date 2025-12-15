import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProject } from '../../context/ProjectContext';
import { BarChart2, Activity, PieChart } from 'lucide-react';

const icons = {
    bar: BarChart2,
    line: Activity,
    pie: PieChart
};

export default function TimelineItem({ scene }) {
    const { setSelectedSceneId, selectedSceneId } = useProject();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: scene.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const Icon = icons[scene.type] || BarChart2;
    const isSelected = selectedSceneId === scene.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => setSelectedSceneId(scene.id)}
            className={`
        relative group cursor-grab active:cursor-grabbing
        w-32 h-16 rounded-md flex flex-col items-center justify-center gap-1
        transition-all border-2 select-none
        ${isSelected ? 'bg-blue-600 border-blue-300 ring-2 ring-blue-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}
      `}
        >
            <span className="text-white text-xs font-semibold truncate w-full text-center px-2">{scene.title}</span>
            <div className="flex items-center gap-1 text-[10px] text-gray-300">
                <Icon size={12} />
                {scene.duration}s
            </div>
        </div>
    );
}
