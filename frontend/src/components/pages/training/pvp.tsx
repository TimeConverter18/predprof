import {type FC, useEffect, useState, useRef} from "react";
import {Flex, Modal, notification, Progress, Spin, Typography, Button} from "antd";
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

type FinishData = {
    my_delta: number;
    my_old_rating: number;
    my_new_rating: number;
    enemy_delta: number;
    enemy_old_rating: number;
    enemy_new_rating: number;
}

type StatsProps = {
    playerProgress: number;
    enemyProgress: number;
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

const StatsContainer: FC<StatsProps> = ({playerProgress, enemyProgress, currentTask, totalTasks}) => {
    return (
        <StatsWrapper>
            <Flex gap="large" align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                <Mobile>
                    <TimeRoundContainerMobile>
                        <TimerText>Задача {currentTask} / {totalTasks}</TimerText>
                    </TimeRoundContainerMobile>
                </Mobile>
                <Desktop>
                    <TimeRoundContainerDesktop>
                        <TimerText>Задача {currentTask} / {totalTasks}</TimerText>
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
    const [answers, setAnswers] = useState<string[]>([]);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [finishData, setFinishData] = useState<FinishData | null>(null);

    const sentAnswers = useRef<Set<number>>(new Set());

    const totalTasks = tasks.length;
    const totalTasksRef = useRef(0);
    const modalOpenRef = useRef(false);
    const currentRef = useRef(0);

    useEffect(() => {
        totalTasksRef.current = totalTasks;
    }, [totalTasks]);

    const openFinishModal = (data: FinishData) => {
        modalOpenRef.current = true;
        setFinishData(data);
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
                setAnswers(new Array(fetchedTasks.length).fill(""));
                setPlayerCorrect(res.data.user_solved_count || 0);
                setEnemyCorrect(res.data.enemy_solved_count || 0);
                const firstUnsolved = fetchedTasks.findIndex(t => t.user_is_correct === null);
                const startIdx = firstUnsolved >= 0 ? firstUnsolved : fetchedTasks.length - 1;
                setCurrent(startIdx);
                fetchedTasks.forEach((t, i) => {
                    if (t.user_is_correct !== null) sentAnswers.current.add(i);
                });
            }
        }).finally(() => setLoading(false));
    }, [id, isIdValid]);

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
        } else if (data.type === 'finish_round') {
            openFinishModal({
                my_delta: data.my_delta,
                my_old_rating: data.my_old_rating,
                my_new_rating: data.my_new_rating,
                enemy_delta: data.enemy_delta,
                enemy_old_rating: data.enemy_old_rating,
                enemy_new_rating: data.enemy_new_rating,
            });
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

    const handleSendAnswer = (answer: string) => {
        if (!answer.trim()) return;
        if (current >= totalTasks) return;
        if (sentAnswers.current.has(current)) return;

        sentAnswers.current.add(current);

        webSocket.send(JSON.stringify({
            type: "answer",
            task_index: current,
            answer: answer.trim()
        }));
    }

    const handleSurrender = () => {
        webSocket.send(JSON.stringify({
            type: "surrender"
        }));
    }

    const handlePrevTask = () => {
        setCurrent(Math.max(0, current - 1));
    }

    const handleNextTask = () => {
        setCurrent(Math.min(totalTasks - 1, current + 1));
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
                currentTask={current + 1}
                totalTasks={totalTasks}
            />
            <Task
                task_id={current + 1}
                question={tasks[current]?.question ?? "Загрузка..."}
                value={answers[current] || ""}
                onChange={(val) => {
                    const newAns = [...answers];
                    newAns[current] = val;
                    setAnswers(newAns);
                }}
                onCheck={() => handleSendAnswer(answers[current] || "")}
                is_correct={tasks[current]?.user_is_correct}
            />
            <Flex gap="small" justify="center">
                <Button onClick={handlePrevTask} disabled={current === 0}>Предыдущая</Button>
                <Button onClick={handleNextTask} disabled={current === totalTasks - 1}>Следующая</Button>
                <PrimaryButton danger onClick={handleSurrender}>Сдаться</PrimaryButton>
            </Flex>
            <Modal
                title={
                    finishData
                        ? finishData.my_delta > 0
                            ? "🏆 Победа!"
                            : finishData.my_delta < 0
                                ? "💀 Поражение"
                                : "🤝 Ничья"
                        : "PvP окончено"
                }
                open={modalOpen}
                width={{xs: '90%', sm: '80%', md: '70%', lg: '60%', xl: '50%', xxl: '40%'}}
                closable={false}
                centered
                footer={<PrimaryButton danger onClick={handleExit}>Выйти</PrimaryButton>}>
                {finishData && (
                    <Flex vertical gap="middle" style={{padding: "8px 0"}}>
                        <Flex vertical gap={4}>
                            <Typography.Text strong style={{fontSize: 16}}>Ваш рейтинг</Typography.Text>
                            <Typography.Text style={{fontSize: 22}}>
                                {finishData.my_old_rating} → {finishData.my_new_rating}{" "}
                                <Typography.Text
                                    strong
                                    style={{
                                        color: finishData.my_delta > 0 ? "#52c41a" : finishData.my_delta < 0 ? "#ff4d4f" : "#faad14",
                                        fontSize: 20,
                                    }}
                                >
                                    ({finishData.my_delta > 0 ? "+" : ""}{finishData.my_delta})
                                </Typography.Text>
                            </Typography.Text>
                        </Flex>
                        <Flex vertical gap={4}>
                            <Typography.Text type="secondary" style={{fontSize: 14}}>Рейтинг противника</Typography.Text>
                            <Typography.Text style={{fontSize: 16}}>
                                {finishData.enemy_old_rating} → {finishData.enemy_new_rating}{" "}
                                <Typography.Text
                                    style={{
                                        color: finishData.enemy_delta > 0 ? "#52c41a" : finishData.enemy_delta < 0 ? "#ff4d4f" : "#faad14",
                                    }}
                                >
                                    ({finishData.enemy_delta > 0 ? "+" : ""}{finishData.enemy_delta})
                                </Typography.Text>
                            </Typography.Text>
                        </Flex>
                    </Flex>
                )}
            </Modal>
        </PageWrapper>
    );
}

export default Page;
