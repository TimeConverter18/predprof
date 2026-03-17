import {type FC, useEffect, useState} from "react";
import styled from "@emotion/styled";
import Task from "../../public/task";
import {Modal, notification, Pagination, Space, Spin} from "antd";
import PrimaryButton from "../../public/primaryButton";
import {useNavigate, useSearchParams} from "react-router";
import {ClockCircleOutlined} from "@ant-design/icons";
import {useWebSocket} from "@siberiacancode/reactuse";
import NFPage from "../notFound";
import api from "../../../api/api";

export type TaskState = "right" | "wrong" | "base"

type TrainingTaskData = {
    question: string;
    is_correct: boolean | null;
}

const PageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    gap: 20px;
    justify-content: start;
    padding: 20px 0;
    box-sizing: border-box;
    max-width: 1280px;
    align-items: center;
`

const HeaderPanel = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: #00000024;
    padding: 16px 24px;
    border-radius: 20px;
    border: 3px solid #343434;
    box-sizing: border-box;
    gap: 20px;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 15px;
    }
`

const TimerContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    color: #E0FF25;
`

const TimerText = styled.div`
    color: #ffffff;
    font-size: 22px;
    font-weight: bold;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
    letter-spacing: 1px;
`

const TaskInfo = styled.div`
    color: #83868e;
    font-size: 16px;
    font-weight: 500;
`

const Page: FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isIdValid = id !== null && !isNaN(Number(id)) && id.trim() !== "";

    const [seconds, setSeconds] = useState(0);
    const [current, setCurrent] = useState(1);
    const [tasks, setTasks] = useState<TrainingTaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const totalTasks = tasks.length;
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalText, setModalText] = useState<string>("");
    const [answers, setAnswers] = useState<string[]>([]);
    const [taskStates, setTaskStates] = useState<TaskState[]>([]);
    const [messageApi, contextHolder] = notification.useNotification();

    useEffect(() => {
        if (!isIdValid) return;
        setLoading(true);
        api.get(`/trainings/${id}/`).then((res) => {
            if (res && res.data && res.data.tasks) {
                const fetchedTasks: TrainingTaskData[] = res.data.tasks;
                setTasks(fetchedTasks);
                setAnswers(Array(fetchedTasks.length).fill(""));
                setTaskStates(fetchedTasks.map(t =>
                    t.is_correct === true ? "right" : t.is_correct === false ? "wrong" : "base"
                ));
            }
        }).finally(() => setLoading(false));
    }, [id, isIdValid]);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleWebsocketMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'result') {
            setTaskStates(prev => {
                const newStates = [...prev];
                newStates[data.task_index] = data.is_correct ? "right" : "wrong";
                return newStates;
            });
        } else if (data.type === 'finish_round' || data.type === 'finish_training') {
            setModalText(data.message || "Тренировка завершена!");
            setModalOpen(true);
        }
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const webSocket = useWebSocket(`${wsProtocol}//${window.location.host}/api/ws/training/${id ? id + '/' : ''}`, {
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
        const answer = answers[current - 1];
        if (!answer) return;
        webSocket.send(JSON.stringify({
            type: "answer",
            task_index: current - 1,
            answer: answer
        }));
    }

    if (!isIdValid) {
        return <NFPage />;
    }

    if (loading) {
        return (
            <PageWrapper>
                <Spin size="large" tip="Загрузка задач..." />
            </PageWrapper>
        );
    }

    if (totalTasks === 0) {
        return <NFPage />;
    }

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFinish = () => {
        if (confirm("Вы уверены, что хотите завершить тренировку?")) {
            navigate("/training");
        }
    };

    const handleAnswerChange = (val: string) => {
        setAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[current - 1] = val;
            return newAnswers;
        });
    }

    return (
        <PageWrapper>
            {contextHolder}
            <HeaderPanel>
                <Space size="large">
                    <TimerContainer>
                        <ClockCircleOutlined style={{ fontSize: '24px' }} />
                        <TimerText>{formatTime(seconds)}</TimerText>
                    </TimerContainer>
                    <TaskInfo>Задача {current} из {totalTasks}</TaskInfo>
                </Space>
                <PrimaryButton 
                    danger 
                    onClick={handleFinish}
                    style={{ height: '40px', padding: '0 20px' }}
                >
                    Завершить
                </PrimaryButton>
            </HeaderPanel>
            <Task 
                task_id={current}
                question={tasks[current - 1]?.question ?? "Загрузка..."}
                value={answers[current - 1]}
                onChange={handleAnswerChange}
                onCheck={handleSendAnswer}
                is_correct={taskStates[current - 1] === "right" ? true : taskStates[current - 1] === "wrong" ? false : null}
            />
            <Pagination
                current={current}
                onChange={setCurrent}
                pageSize={1}
                total={totalTasks}
                showSizeChanger={false}
            />
            <Modal
                title="Тренировка завершена"
                open={modalOpen}
                width={{xs: '90%', sm: '80%', md: '70%', lg: '60%', xl: '50%', xxl: '40%'}}
                closable={false}
                centered
                footer={<PrimaryButton danger onClick={() => {
                    navigate("/training");
                }}>Выйти</PrimaryButton>}>
                {modalText}
            </Modal>
        </PageWrapper>
    );
}

export default Page;