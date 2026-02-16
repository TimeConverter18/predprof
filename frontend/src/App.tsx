import './App.css'
import {BrowserRouter, Route, Routes} from "react-router"
import {AuthProvider} from "./hooks/auth/authContextProvider.tsx"
import {App as AntApp, ConfigProvider, theme} from "antd"
import {type FC} from "react"
import NavWrapperComponent from "./components/navigation/navWrapper.tsx"
import SignInPage from "./components/pages/signIn.tsx"
import SignUpPage from "./components/pages/signUp.tsx"
import BankPage from "./components/pages/bank.tsx"
import TrainingPage from "./components/pages/trainingSetup/page.tsx"
import ProfilePage from "./components/pages/profile"
import MainPage from "./components/pages/main"
import PVPPage from "./components/pages/training/pvp.tsx"
import {SubjectThemesProvider} from "./hooks/subjectThemes/subjectThemesContextProvider.tsx"
import SinglePage from "./components/pages/training/single.tsx"
import NFPage from "./components/pages/notFound.tsx"

const App: FC = () => {
    return (
        <SubjectThemesProvider>
            <ConfigProvider theme={{
                token: {
                    "colorPrimary": "#E0FF25",
                }, algorithm: theme.darkAlgorithm}
            }>
                <AntApp style={{width: "100%"}}>
                    <BrowserRouter>
                        <AuthProvider>
                            <Routes>
                                <Route path="/signin" element={<SignInPage />}/>
                                <Route path="/signup" element={<SignUpPage />}/>
                                <Route path="/*" element={
                                    <NavWrapperComponent>
                                        <Routes>
                                            <Route path="/main/*" element={<MainPage></MainPage>}/>
                                            <Route path="/bank/*" element={<BankPage/>}/>
                                            <Route path="/training/*" element={<TrainingPage/>}/>
                                            <Route path="/profile/*" element={<ProfilePage/>}/>
                                            <Route path="/pvp/*" element={<PVPPage/>}/>
                                            <Route path="/single/*" element={<SinglePage/>}/>
                                            <Route path="*" element={<NFPage/>}/>
                                        </Routes>
                                    </NavWrapperComponent>}/>
                            </Routes>
                        </AuthProvider>
                    </BrowserRouter>
                </AntApp>
            </ConfigProvider>
        </SubjectThemesProvider>
    )
}

export default App;
