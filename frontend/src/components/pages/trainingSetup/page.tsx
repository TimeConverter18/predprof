import {type FC, Fragment, useEffect} from "react";
import styled from "@emotion/styled";
import {useNavigate, useLocation, Routes, Route} from "react-router";
import PvpPage from "./pvp"
import SinglePage from "./single"

const SliderWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    border-radius: 25px;
    background-color: #efefef;
    width: 300px;
    height: 35px;
    cursor: pointer;
    overflow: hidden;
    user-select: none;
    margin: 0;
`;

const Label = styled.div<{ active: boolean }>`
    flex: 1;
    text-align: center;
    z-index: 2;
    font-weight: bold;
    color: ${props => (props.active ? "#333" : "#666")};
    transition: color 0.3s ease;
    pointer-events: none;
`;

const InternalSlider = styled.div<{ isPVP: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 50%;
    border-radius: 16px;
    background-color: #bad609;
    z-index: 1;
    cursor: default;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform: ${props => (props.isPVP ? "translateX(0)" : "translateX(100%)")};
`;

const Slider: FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isPVP = pathname !== "/training/single";

    const toggleSlider = () => {
        if (isPVP) {
            navigate("/training/single");
        } else {
            navigate("/training/pvp");
        }
    };

    return (
        <SliderWrapper onClick={toggleSlider}>
            <InternalSlider isPVP={isPVP}/>
            <Label active={isPVP}>PVP</Label>
            <Label active={!isPVP}>Тренировка</Label>
        </SliderWrapper>
    );
};

const Page: FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        const validPaths = ["/training/pvp", "/training/single"];
        if (!validPaths.includes(pathname)) {
            navigate("/training/pvp");
        }
    }, [pathname, navigate]);

    return (
        <Fragment>
            <Slider/>
            <Routes>
                <Route path="/pvp/*" element={<PvpPage/>}/>
                <Route path="/single/*" element={<SinglePage/>}/>
            </Routes>
        </Fragment>
    );
};

export default Page;