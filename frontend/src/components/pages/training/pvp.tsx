import {type FC, useEffect, useState, useRef} from "react";
import {Flex, Modal, notification, Progress, Spin} from "antd";
import styled from "@emotion/styled";
import Task from "../../public/task";
import {useWebSocket} from "@siberiacancode/reactuse";
import {Desktop, Mobile} from "../../responsiveWrappers";
import PrimaryButton from "../../public/primaryButton";
import {useNavigate, useSearchParams} from "react-router";
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
    currentTask: number;
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

const WaitingText = styled.div`
    color: #83868e;
    font-size: 16px;
    text-align: center;
    padding: 20px;
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

const StatsContainer: FC<StatsProps> = ({playerProgress, enemyProgress, seconds, currentTask, totalTasks}) => {
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
                        <TimerText>Задача {currentTask} / {totalTasks}</TimerText>
                        <TimerText>{formatTime(seconds)}</TimerText>
                    </TimeRoundContainerMobile>
                </Mobile>
                <Desktop>
                    <TimeRoundContainerDesktop>
                        <TimerText>Задача {currentTask} / {totalTasks}</TimerText>
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
    const [current, setCurrent] = useState<number>(0);
    const [playerCorrect, setPlayerCorrect] = useState<number>(0);
    const [enemyCorrect, setEnemyCorrect] = useState<number>(0);
    const [seconds, setSeconds] = useState<number>(0);
    const [waitingForEnemy, setWaitingForEnemy] = useState<boolean>(false);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalText, setModalText] = useState<string>("");
    const [answer, setAnswer] = useState<string>("");

    const sentAnswers = useRef<Set<number>>(new Set());

    const totalTasks = tasks.length;
    const totalTasksRef = useRef(0);
    const modalOpenRef = useRef(false);
    const currentRef = useRef(0);

    useEffect(() => {
        totalTasksRef.current = totalTasks;
    }, [totalTasks]);

    const openModal = (text: string) => {
        modalOpenRef.current = true;
        setModalText(text);
        setModalOpen(true);
    };

    useEffect(() => {
        currentRef.current = current;
    }, [current]);

    useEffect(() => {
        if (!isIdValid) return;
        setLoading(true);
        api.get(`/pvp/api/${id}/`).then((res) => {
            if (res && res.data && res.data.tasks) {
                const fetchedTasks: PvpTaskData[] = res.data.tasks;
                setTasks(fetchedTasks);
                setPlayerCorrect(res.data.user_solved_count || 0);
                setEnemyCorrect(res.data.enemy_solved_count || 0);
                const firstUnsolved = fetchedTasks.findIndex(t => t.user_is_correct === null);
                const startIdx = firstUnsolved >= 0 ? firstUnsolved : fetchedTasks.length;
                setCurrent(startIdx);
                fetchedTasks.forEach((t, i) => {
                    if (t.user_is_correct !== null) sentAnswers.current.add(i);
                });
            }
        }).finally(() => setLoading(false));
    }, [id, isIdValid]);

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
        if (data.type === 'stats') {
            const total = totalTasksRef.current;
            if (total > 0) {
                if (data.correct_percentage !== undefined) {
                    setPlayerCorrect(Math.round((data.correct_percentage / 100) * total));
                }
                if (data.enemy_correct_percentage !== undefined) {
                    setEnemyCorrect(Math.round((data.enemy_correct_percentage / 100) * total));
                }
            }
            if (data.current_task !== undefined) {
                setCurrent(data.current_task);
                setWaitingForEnemy(false);
            }
        } else if (data.type === 'ws_finish_round') {
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
            openModal(text);
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
        onDisconnected: () => {
            if (!modalOpenRef.current) {
                messageApi.error({
                    message: "Соединение разорвано!",
                    description: <PrimaryButton onClick={() => webSocket.open()}>Переподключиться</PrimaryButton>,
                    duration: 5
                });
            }
        },
        onError: (event) => {console.log(event)}
    })

    const handleSendAnswer = () => {
        if (!answer.trim()) return;
        if (current >= totalTasks) return;
        if (sentAnswers.current.has(current)) return;

        sentAnswers.current.add(current);

        webSocket.send(JSON.stringify({
            type: "answer",
            task_index: current,
            answer: answer.trim()
        }));

        setAnswer("");
        setWaitingForEnemy(true);
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
    const allAnswered = current >= totalTasks;

    return (
        <PageWrapper>
            {contextHolder}
            <StatsContainer
                playerProgress={playerPct}
                enemyProgress={enemyPct}
                seconds={seconds}
                currentTask={Math.min(current + 1, totalTasks)}
                totalTasks={totalTasks}
            />
            {allAnswered ? (
                <WaitingText>
                    Вы ответили на все задачи. Ожидание завершения раунда...
                </WaitingText>
            ) : waitingForEnemy ? (
                <WaitingText>
                    Ответ принят. Ожидание ответа противника...
                </WaitingText>
            ) : (
                <Task
                    task_id={current + 1}
                    question={tasks[current]?.question ?? "Загрузка..."}
                    value={answer}
                    onChange={setAnswer}
                    onCheck={handleSendAnswer}
                    is_correct={null}
                />
            )}
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
