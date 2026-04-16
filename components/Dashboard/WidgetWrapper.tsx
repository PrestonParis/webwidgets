import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical } from "lucide-react";
import { WidgetConfig } from "@/types/dashboard";

interface Props {
    config: WidgetConfig;
    onToggleVisible: (id: string) => void;
    children: React.ReactNode;
}

export default function WidgetWrapper({ config, onToggleVisible, children }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: config.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    if (!config.visible) return null;

    return (
        <div
        ref={setNodeRef}
        style={style}
        className="relative group rounded-xl"
        >
        {/* Toolbar — visible on hover */}
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Drag handle */}
            <button
            {...attributes}
            {...listeners}
            className="p-1 rounded bg-black/20 hover:bg-black/40 cursor-grab active:cursor-grabbing text-white"
            title="Drag to reorder"
            >
            <GripVertical size={14} />
            </button>
            {/* Hide */}
            <button
            onClick={() => onToggleVisible(config.id)}
            className="p-1 rounded bg-black/20 hover:bg-black/40 text-white"
            title="Hide widget"
            >
            <EyeOff size={14} />
            </button>
        </div>
        {children}
        </div>
    );
}