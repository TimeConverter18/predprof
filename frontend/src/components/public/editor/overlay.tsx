import {
    useState,
    useRef,
    useEffect,
    lazy,
    Suspense,
    type ReactNode,
} from 'react'
import { useEditorState } from "../../../hooks/editorState/useEditorState.ts";
import { DraggablePanel } from "../../dock/DraggablePanel.tsx";

const EditorComponent = lazy(() => import('./index.tsx'))

export default function EditorOverlay({children}: { children: ReactNode }) {
    const {open: isIdeOpen} = useEditorState()
    
    const [isEditorMounted, setIsEditorMounted] = useState(false);
    const hasSetMounted = useRef(false);

    useEffect(() => {
        if (isIdeOpen && !isEditorMounted && !hasSetMounted.current) {
            hasSetMounted.current = true;
            const timer = setTimeout(() => {
                setIsEditorMounted(true);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isIdeOpen, isEditorMounted]);

    return (
        <>
            {children}

            {isEditorMounted && (
                <DraggablePanel id="editor" isOpen={isIdeOpen} hideWhenClosed={false} useDocking={true} showHandle={true} disableFilters={false} defaultPosition={{right: 250, top: 180}}>
                    <Suspense fallback={<div className="text-white w-[450px] h-[615px] font-semibold text-center" >Загрузка редактора...</div>}>
                        <EditorComponent />
                    </Suspense>
                </DraggablePanel>
            )}
        </>
    )
}
