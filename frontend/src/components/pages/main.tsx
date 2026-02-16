import {type FC, Fragment} from "react";
import styled from "@emotion/styled";
import {Button} from "antd";
import {Desktop, Mobile} from "../responsiveWrappers.tsx";
import PrimaryButton from "../public/primaryButton.tsx";

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 15px;
    align-self: start;
    margin-top: 30px;
    margin-left: 100px;
`

const ColorText = styled.p`
    background-color: #867DEA;
    color: black;
    border-radius: 15px;
    padding: 10px;
    font-size: 20px;
    font-weight: 500;
`

const Text = styled.p`
    color: white;
    font-size: 20px;
    font-weight: 500;
`

const BgSmile = styled.img`
    position: absolute;
    z-index: -1;
    right: 0;
    top: 100px;
    height: 750px;
`;

const Page: FC = () => {
    return (
        <Fragment>
            <Desktop>
                <Wrapper>
                    <ColorText>МЫ ХОТИМ УЗНАТЬ ВАС ПОЛУЧШЕ</ColorText>
                    <Text>ПРОЙДИТЕ ТЕСТ, ЧТОБЫ ОПРЕДЕЛИТЬ ВАШ УРОВЕНЬ</Text>
                    <PrimaryButton>Пройти тест!</PrimaryButton>
                </Wrapper>
                <BgSmile src="src/files/bgsmile.svg" alt="smile"/>
            </Desktop>
            <Mobile>
                <ColorText>МЫ ХОТИМ УЗНАТЬ ВАС ПОЛУЧШЕ</ColorText>
                <Text>ПРОЙДИТЕ ТЕСТ, ЧТОБЫ ОПРЕДЕЛИТЬ ВАШ УРОВЕНЬ</Text>
                <PrimaryButton>Пройти тест!</PrimaryButton>
            </Mobile>
        </Fragment>
    );
}

export default Page;