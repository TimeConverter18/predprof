import {type FC, useEffect, useState} from "react";
import {Flex, Modal, notification, Progress, Spin} from "antd";
import styled from "@emotion/styled";
import Task from "../../public/task";
import {useWebSocket} from "@siberiacancode/reactuse";
import {Desktop, Mobile} from "../../responsiveWrappers";
import PrimaryButton from "../../public/primaryButton";
import {useNavigate, useSearchParams} from "react-router";
import type {TaskState} from "./single";
import NFPage from "../notFound";
import api from "../../../api/api";

type PvpTaskData = {
    question: string;
    user_is_correct: boolean | null;
    enemy_is_correct: boolean | null;
}

type StatsProps = {
    playerProgress: number;
    enemyProgress: number;
    seconds: number;
    round: number;
    totalTasks: number;
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

const StatsContainer: FC<StatsProps> = ({playerProgress, enemyProgress, seconds, round, totalTasks}) => {
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
                        <TimerText>Задача {round} / {totalTasks}</TimerText>
                        <TimerText>{formatTime(seconds)}</TimerText>
                    </TimeRoundContainerMobile>
                </Mobile>
                <Desktop>
                    <TimeRoundContainerDesktop>
                        <TimerText>Задача {round} / {totalTasks}</TimerText>
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

    const [tasks, setTasks] = useState<PvpTaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState<number>(0); // текущий индекс задачи (0-based)
    const [playerCorrect, setPlayerCorrect] = useState<number>(0);
    const [enemyCorrect, setEnemyCorrect] = useState<number>(0);
    const [seconds, setSeconds] = useState<number>(0);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalText, setModalText] = useState<string>("");
    const [answer, setAnswer] = useState<string>("");
    const [taskStates, setTaskStates] = useState<TaskState[]>([]);

    const totalTasks = tasks.length;

    // Загрузка задач через HTTP API
    useEffect(() => {
        if (!isIdValid) return;
        setLoading(true);
        api.get(`/pvp/api/${id}/`).then((res) => {
            if (res && res.data && res.data.tasks) {
                const fetchedTasks: PvpTaskData[] = res.data.tasks;
                setTasks(fetchedTasks);
                setTaskStates(fetchedTasks.map(t =>
                    t.user_is_correct === true ? "right" : t.user_is_correct === false ? "wrong" : "base"
                ));
                setPlayerCorrect(res.data.user_solved_count || 0);
                setEnemyCorrect(res.data.enemy_solved_count || 0);
                // Установить текущую задачу на первую нерешённую
                const firstUnsolved = fetchedTasks.findIndex(t => t.user_is_correct === null);
                setCurrent(firstUnsolved >= 0 ? firstUnsolved : 0);
            }
        }).finally(() => setLoading(false));
    }, [id, isIdValid]);

    // Таймер
    useEffect(() => {
        if (!isIdValid) return;
        const interval = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isIdValid]);

    const handleExit = () => {
        navigate("/training/pvp");
    };

    const handleWebsocketMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'result') {
            // Наш результат
            setTaskStates(prev => {
                const newStates = [...prev];
                newStates[data.task_index] = data.is_correct ? "right" : "wrong";
                return newStates;
            });
            if (data.is_correct) {
                setPlayerCorrect(prev => prev + 1);
            }
        } else if (data.type === 'enemy_result') {
            if (data.is_correct) {
                setEnemyCorrect(prev => prev + 1);
            }
        } else if (data.type === 'stats') {
            // Статистика от бэка
            if (data.correct_percentage !== undefined) {
                setPlayerCorrect(Math.round((data.correct_percentage / 100) * totalTasks));
            }
            if (data.enemy_correct_percentage !== undefined) {
                setEnemyCorrect(Math.round((data.enemy_correct_percentage / 100) * totalTasks));
            }
        } else if (data.type === 'finish_round' || data.type === 'ws_finish_round') {
            // Раунд завершён
            let text = "Раунд завершён!";
            if (data.my_delta !== undefined) {
                if (data.my_delta > 0) {
                    text = `Вы победили! Рейтинг: ${data.my_old_rating} → ${data.my_new_rating} (+${data.my_delta})`;
                } else if (data.my_delta < 0) {
                    text = `Вы проиграли. Рейтинг: ${data.my_old_rating} → ${data.my_new_rating} (${data.my_delta})`;
                } else {
                    text = `Ничья! Рейтинг: ${data.my_old_rating} → ${data.my_new_rating}`;
                }
            }
            setModalText(text);
            setModalOpen(true);
        } else if (data.type === 'error') {
            messageApi.error({
                message: "Ошибка",
                description: data.errors
            });
        }
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const webSocket = useWebSocket(`${wsProtocol}//${window.location.host}/api/ws/pvp/${id ? id + '/' : ''}`, {
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
            type: "answer",
            task_index: current,
            answer: answer
        }));
    }

    const goToNextTask = () => {
        if (current < totalTasks - 1) {
            setCurrent(prev => prev + 1);
            setAnswer("");
        }
    }

    const goToPrevTask = () => {
        if (current > 0) {
            setCurrent(prev => prev - 1);
            setAnswer("");
        }
    }

    if (!isIdValid) {
        return <NFPage />;
    }

    if (loading) {
        return (
            <PageWrapper>
                <Spin size="large" tip="Загрузка..." />
            </PageWrapper>
        );
    }

    if (totalTasks === 0) {
        return <NFPage />;
    }

    const playerPct = totalTasks > 0 ? Math.round((playerCorrect / totalTasks) * 100) : 0;
    const enemyPct = totalTasks > 0 ? Math.round((enemyCorrect / totalTasks) * 100) : 0;

    return (
        <PageWrapper>
            {contextHolder}
            <StatsContainer
                playerProgress={playerPct}
                enemyProgress={enemyPct}
                seconds={seconds}
                round={current + 1}
                totalTasks={totalTasks}
            />
            <Task
                task_id={current + 1}
                question={tasks[current]?.question ?? "Загрузка..."}
                value={answer}
                onChange={setAnswer}
                onCheck={handleSendAnswer}
                is_correct={taskStates[current] === "right" ? true : taskStates[current] === "wrong" ? false : null}
            />
            <Flex gap="small" justify="center">
                <PrimaryButton onClick={goToPrevTask} disabled={current === 0}>
                    ← Назад
                </PrimaryButton>
                <PrimaryButton onClick={goToNextTask} disabled={current >= totalTasks - 1}>
                    Вперёд →
                </PrimaryButton>
            </Flex>
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