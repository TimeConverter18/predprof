import {useState, type ReactNode} from "react"
import {EditorStateProviderContext} from "./editorStateContext.ts"

type EditorStateProviderProps = {
    children: ReactNode,
}

export function EditorStateProvider({children, ...props}: EditorStateProviderProps) {
    const [open, setOpen] = useState<boolean>(false)

    return (
        <EditorStateProviderContext.Provider {...props} value={{open, setOpen}}>
            {children}
        </EditorStateProviderContext.Provider>
    )
}
