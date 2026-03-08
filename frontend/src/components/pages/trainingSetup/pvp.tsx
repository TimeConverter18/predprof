import {type FC, Fragment, useState} from "react";
import styled from "@emotion/styled";
import PrimaryButton from "../../public/primaryButton";
import {Tag, Form, notification, Spin} from "antd";
import {useSubjectThemes} from "../../../hooks/subjectThemes/hook";
import {createStyles} from 'antd-style';
import useWebSocket from 'react-use-websocket';
import StyledTitle from "../../components/textComponents/StyledTitle";
import PageContainer from "../../components/containers/PageContainer";
import StyledLead from "../../components/textComponents/StyledLead";
import {useNavigate} from "react-router";

const PageShell = styled.div`
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 4px 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const Hero = styled.div`
    display: grid;
    gap: 4px;
    text-align: center;
`;

const StatePanel = styled.div`
    display: grid;
    gap: 8px;
    width: 100%;
    padding: 10px 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;

    @media (max-width: 640px) {
        padding: 8px 6px;
    }
`;

const SectionTitle = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #f2f2f2;
    text-align: center;
`;

const Hint = styled.p`
    margin: 0;
    color: #a5a5a5;
    text-align: center;
    line-height: 1.35;
    font-size: 13px;
`;

const StatusRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
`;

const StatusBadge = styled.span<{ tone: 'idle' | 'connect' | 'search' | 'found' }>`
    padding: 6px 10px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 12px;
    color: #0c0c0c;
    background: ${props => {
        if (props.tone === 'connect') return '#ffe58f';
        if (props.tone === 'search') return '#91caff';
        if (props.tone === 'found') return '#b7eb8f';
        return '#e0e0e0';
    }};
`;

const ActionsRow = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`;

const InlineTag = styled(Tag)`
    margin: 0;
    padding: 2px 7px;
    font-size: 12px;
    border-radius: 9px;
`;

const SoftText = styled.span`
    color: #8c8c8c;
    font-size: 13px;
`;

const useStyles = createStyles(({token, css}) => ({
    tagGroup: css`
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;

        .ant-tag {
            background: transparent;
            border: 2px solid ${token.colorBorder};
            color: ${token.colorText};
            font-size: 15px;
            padding: 9px 18px;
            cursor: pointer;
            margin: 0;
            border-radius: 22px;
            transition: all 0.3s ease;
            font-weight: 500;

            &:hover {
                border-color: #bad609;
                color: #bad609;
                transform: translateY(-1px);
                box-shadow: 0 3px 10px rgba(186, 214, 9, 0.18);
            }
        }

        .ant-tag-checkable-checked {
            background: #bad609 !important;
            border-color: #bad609 !important;
            color: #000000 !important;
            font-weight: 600;
            box-shadow: 0 5px 12px rgba(186, 214, 9, 0.35);
            transform: scale(1.03);

            &:hover {
                background: #c9e010 !important;
                border-color: #c9e010 !important;
                color: #000000 !important;
                transform: scale(1.03) translateY(-1px);
                box-shadow: 0 6px 16px rgba(186, 214, 9, 0.4);
            }
        }
    `,
}));

type UIState = "IDLE" | "CONNECTING" | "SEARCH" | "FOUND";

const Page: FC = () => {
    const {subjects} = useSubjectThemes();
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [messageApi, contextHolder] = notification.useNotification();
    const [uiState, setUiState] = useState<UIState>("IDLE");
    const [shouldConnect, setShouldConnect] = useState(false);
    const navigate = useNavigate();

    const {styles} = useStyles();

    const subjectOptions = subjects.map(v => ({value: v.id, label: v.name}));

    const handleWebsocketMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'room_id') {
            setUiState("FOUND");
            setTimeout(() => {
                navigate(`/pvp?id=${data.room_id}`);
            }, 1500);
        }
    };

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = shouldConnect && selectedSubjectId
        ? `${wsProtocol}//${window.location.host}/api/ws/pvp/`
        : null;

    const matchmakingWS = useWebSocket(socketUrl, {
        onMessage: handleWebsocketMessage,
        onOpen: () => {
            setUiState("SEARCH");
            matchmakingWS.sendMessage(JSON.stringify({
                "type": "is_search",
                "is_search": true,
                "subject": selectedSubjectId
            }));
        },
        onClose: () => {
            messageApi.error({ message: "Соединение разорвано!", duration: 5 });
            setUiState("IDLE");
            setShouldConnect(false);
        },
        onError: () => {
            messageApi.error({ message: "Ошибка подключения", duration: 5 });
            setUiState("IDLE");
            setShouldConnect(false);
        },
        shouldReconnect: () => false,
    }, shouldConnect);

    const startMatchmaking = () => {
        if (!selectedSubjectId) return;
        setShouldConnect(true);
        setUiState("CONNECTING");
    };

    const cancelMatchmaking = () => {
        setShouldConnect(false);
        setUiState("IDLE");
    };

    const renderContent = () => {
        switch (uiState) {
            case "IDLE":
                return (
                    <StatePanel>
                        <SectionTitle>Выбери предмет для дуэли</SectionTitle>
                        <Hint>Мы подберём соперника по выбранной дисциплине.</Hint>
                        <Form.Item style={{marginBottom: 6}}>
                            <Tag.CheckableTagGroup
                                options={subjectOptions}
                                value={selectedSubjectId}
                                onChange={(val) => setSelectedSubjectId(val)}
                                className={styles.tagGroup}
                                multiple={false}
                                disabled={shouldConnect}
                            />
                        </Form.Item>
                        <ActionsRow>
                            <PrimaryButton
                                onClick={startMatchmaking}
                                disabled={!selectedSubjectId || shouldConnect}
                            >
                                Найти соперника
                            </PrimaryButton>
                            {selectedSubjectId && (
                                <SoftText>
                                    Предмет: {subjectOptions.find(s => s.value === selectedSubjectId)?.label}
                                </SoftText>
                            )}
                        </ActionsRow>
                    </StatePanel>
                );

            case "CONNECTING":
                return (
                    <StatePanel>
                        <StatusRow>
                            <StatusBadge tone="connect">Подключаемся</StatusBadge>
                            {selectedSubjectId && (
                                <InlineTag color="processing">
                                    {subjectOptions.find(s => s.value === selectedSubjectId)?.label}
                                </InlineTag>
                            )}
                        </StatusRow>
                        <Spin/>
                        <Hint>Устанавливаем защищённое соединение, это займёт несколько секунд.</Hint>
                        <ActionsRow>
                            <PrimaryButton
                                onClick={cancelMatchmaking}
                                style={{background: '#ff4d4f', border: 'none'}}
                            >
                                Отменить
                            </PrimaryButton>
                        </ActionsRow>
                    </StatePanel>
                );

            case "SEARCH":
                return (
                    <StatePanel>
                        <StatusRow>
                            <StatusBadge tone="search">Ищем соперника</StatusBadge>
                            {selectedSubjectId && (
                                <InlineTag color="success">
                                    {subjectOptions.find(s => s.value === selectedSubjectId)?.label}
                                </InlineTag>
                            )}
                        </StatusRow>
                        <Spin/>
                        <Hint>Поиск может занять до минуты.</Hint>
                        <ActionsRow>
                            <PrimaryButton
                                onClick={cancelMatchmaking}
                                style={{background: '#ff4d4f', border: 'none'}}
                            >
                                Отменить поиск
                            </PrimaryButton>
                            <SoftText>Оставайтесь в этом окне.</SoftText>
                        </ActionsRow>
                    </StatePanel>
                );

            case "FOUND":
                return (
                    <StatePanel>
                        <StatusRow>
                            <StatusBadge tone="found">Соперник найден</StatusBadge>
                            {selectedSubjectId && (
                                <InlineTag color="success">
                                    {subjectOptions.find(s => s.value === selectedSubjectId)?.label}
                                </InlineTag>
                            )}
                        </StatusRow>
                        <StyledLead style={{textAlign: 'center'}}>
                            Перенаправляем в комнату сражения...
                        </StyledLead>
                        <Spin/>
                    </StatePanel>
                );

            default:
                return null;
        }
    };

    return (
        <Fragment>
            <PageContainer>
                <PageShell>
                    {contextHolder}
                    <Hero>
                        <StyledTitle>
                            Соревнуйся в знаниях и повышай рейтинг
                        </StyledTitle>
                    </Hero>
                    {renderContent()}
                </PageShell>
            </PageContainer>
        </Fragment>
    )
}

export default Page;
