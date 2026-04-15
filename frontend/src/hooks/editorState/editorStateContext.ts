import {createContext, type Dispatch, type SetStateAction} from "react"

export type EditorStateProviderState = {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
}

const initialState: EditorStateProviderState = {
    open: false,
    setOpen: () => null,
}

export const EditorStateProviderContext = createContext<EditorStateProviderState>(initialState)

