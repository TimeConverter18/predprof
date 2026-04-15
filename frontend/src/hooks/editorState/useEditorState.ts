import {useContext} from "react"
import {EditorStateProviderContext} from "./editorStateContext.ts"

export function useEditorState() {
    const context = useContext(EditorStateProviderContext)

    if (context === undefined)
        throw new Error("useEditorState must be used within a EditorStateProvider")

    return context
}
