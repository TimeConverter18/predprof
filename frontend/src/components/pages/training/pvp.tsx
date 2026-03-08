import {type FC, useEffect, useState} from "react";
import {Flex, Modal, notification, Progress} from "antd";
import styled from "@emotion/styled";
import Task from "../../public/task";
import {useWebSocket} from "@siberiacancode/reactuse";
import {Desktop, Mobile} from "../../responsiveWrappers";
import PrimaryButton from "../../public/primaryButton";
import {useNavigate, useSearchParams} from "react-router";
import domain from "../../../api/domain";
import type {TaskState} from "./single";
import NFPage from "../notFound";

type StatsProps = {
    playerProgress: number;
    enemyProgress: number;
    seconds: number;
    round: number;
}

const StatsWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: end;
    background-color: #00000024;
    padding: 12px 20px;
    border-radius: 16px;
    border: 3px solid #343434;
    box-sizing: border-box;
`

const PageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    gap: 20px;
    justify-content: start;
    padding: 10px 0;
    box-sizing: border-box;
    max-width: 1280px;
`

const BarContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
`

const PlayerText = styled.div`
    color: white;
    font-weight: bold;
    font-size: 11px;
`

const TimerText = styled.div`
    color: #83868e;
    font-size: 18px;
    font-weight: bold;
    font-family: monospace;
`

const TimeRoundContainerMobile = styled.div`
    display: flex;
    flex-direction: column;
`

const TimeRoundContainerDesktop = styled.div`
    display: flex;
    flex-direction: row;
    gap: 20px;
`

const StatsContainer: FC<StatsProps> = ({playerProgress, enemyProgress, seconds, round}) => {
    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <StatsWrapper>
            <Flex gap="large" align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                <Mobile>
                    <TimeRoundContainerMobile>
                        <TimerText>Раунд {round}</TimerText>
                        <TimerText>{formatTime(seconds)}</TimerText>
                    </TimeRoundContainerMobile>
                </Mobile>
                <Desktop>
                    <TimeRoundContainerDesktop>
                        <TimerText>Раунд {round}</TimerText>
                        <TimerText>{formatTime(seconds)}</TimerText>
                    </TimeRoundContainerDesktop>
                </Desktop>
                <Flex gap="small" vertical align="end">
                    <BarContainer><PlayerText>ВЫ:</PlayerText><Progress percent={playerProgress} style={{width: "140px"}}/></BarContainer>
                    <BarContainer><PlayerText>ПРОТИВНИК:</PlayerText><Progress percent={enemyProgress} style={{width: "140px"}}/></BarContainer>
                </Flex>
            </Flex>
        </StatsWrapper>
    );
}

const Page: FC = () => {
    const [messageApi, contextHolder] = notification.useNotification();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = searchParams.get("id");

    const isIdValid = id !== null && !isNaN(Number(id)) && id.trim() !== "";

    const [round, setRound] = useState<number>(1);
    const [playerProgress, setPlayerProgress] = useState<number>(0);
    const [enemyProgress, setEnemyProgress] = useState<number>(0);
    const [question, setQuestion] = useState<string>("Ожидание задачи...");
    const [taskId, setTaskId] = useState<number | null>(null);
    const [seconds, setSeconds] = useState<number>(0);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalText, setModalText] = useState<string>("");
    const [answer, setAnswer] = useState<string>("");
    const [status, setStatus] = useState<TaskState>("base")

    useEffect(() => {
        if (seconds > 0 && isIdValid) {
            const interval = setInterval(() => {
                setSeconds(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [seconds, isIdValid]);

    const handleExit = () => {
        navigate("/training/pvp");
    };

    const handleWebsocketMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'task') {
            setQuestion(data.question);
            setTaskId(data.task_id);
            setRound(data.round);
            setSeconds(data.seconds);
            setAnswer("");
            setStatus("base");
        } else if (data.type === 'progress') {
            setPlayerProgress(data.player_progress);
            setEnemyProgress(data.enemy_progress);
        } else if (data.type === 'result') {
            if (data.task_index === round - 1) {
                setStatus(data.is_correct ? "right" : "wrong");
            }
        } else if (data.type === 'enemy_result') {
            //
        } else if (data.type === 'finish_round') {
            //
        } else if (data.type === 'end') {
            setModalText(data.modal_text || (data.result === 'win' ? "Вы победили!" : "Вы проиграли!"));
            setModalOpen(true);
        } else if (data.type === 'error') {
            messageApi.error({
                message: "Ошибка",
                description: data.errors
            });
        }
    }

    const webSocket = useWebSocket(`wss://${domain}/api/ws/pvp/${id ? id + '/' : ''}`, {
        onMessage: handleWebsocketMessage,
        onDisconnected: () =>
            (messageApi.error({
                message: "Соединение разорвано!",
                description: <PrimaryButton onClick={() => webSocket.open()}>Переподключиться</PrimaryButton>,
                duration: 5
            })),
        onError: (event) => {console.log(event)}
    })

    const handleSendAnswer = () => {
        if (!answer) return;
        webSocket.send(JSON.stringify({
            task_index: round - 1,
            answer: answer
        }));
    }

    if (!isIdValid) {
        return <NFPage />;
    }

    return (
        <PageWrapper>
            {contextHolder}
            <StatsContainer playerProgress={playerProgress} enemyProgress={enemyProgress} seconds={seconds} round={round}/>
            <Task 
                task_id={taskId ?? 0}
                question={question}
                value={answer}
                onChange={setAnswer}
                onCheck={handleSendAnswer}
                is_correct={status === "right" ? true : status === "wrong" ? false : null}
            />
            <Modal
                title="PvP окончено"
                open={modalOpen}
                width={{xs: '90%', sm: '80%', md: '70%', lg: '60%', xl: '50%', xxl: '40%'}}
                closable={false}
                centered
                footer={<PrimaryButton danger onClick={handleExit}>Выйти</PrimaryButton>}>
                {modalText}
            </Modal>
        </PageWrapper>
    );
}

export default Page;