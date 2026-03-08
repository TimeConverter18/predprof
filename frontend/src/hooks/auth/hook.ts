import {useContext} from "react";
import {AuthContextProvider} from "./authContext";

export function useAuth() {
    const context = useContext(AuthContextProvider);
    if (!context) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return context;
}