import {type FC, useEffect, useState} from "react";
import styled from "@emotion/styled";
import Task from "../../public/task.tsx";
import {Modal, notification, Pagination, Space} from "antd";
import PrimaryButton from "../../public/primaryButton.tsx";
import {useNavigate, useSearchParams} from "react-router";
import {ClockCircleOutlined} from "@ant-design/icons";
import {useWebSocket} from "@siberiacancode/reactuse";
import domain from "../../../api/domain.ts";
import NFPage from "../notFound.tsx";

export type TaskState = "right" | "wrong" | "base"

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
    const [current, setCurrent] = useState(() => {
        const saved = localStorage.getItem("training_single_current");
        return saved ? parseInt(saved) : 1;
    });
    const totalTasks = 12;
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [modalText, setModalText] = useState<string>("");
    const [answers, setAnswers] = useState<string[]>(() => {
        const saved = localStorage.getItem("training_single_answers");
        return saved ? JSON.parse(saved) : Array(totalTasks).fill("");
    });
    const [taskStates, setTaskStates] = useState<TaskState[]>(Array(totalTasks).fill("base"));
    const [messageApi, contextHolder] = notification.useNotification();

    useEffect(() => {
        localStorage.setItem("training_single_answers", JSON.stringify(answers));
    }, [answers]);

    useEffect(() => {
        localStorage.setItem("training_single_current", current.toString());
    }, [current]);

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
        } else if (data.type === 'finish_training') {
            setModalText(data.message || "Тренировка завершена!");
            setModalOpen(true);
        }
    }

    const webSocket = useWebSocket(`wss://${domain}/api/ws/training/${id ? id + '/' : ''}`, {
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
            task_index: current - 1,
            answer: answer
        }));
    }

    if (!isIdValid) {
        return <NFPage />;
    }

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFinish = () => {
        if (confirm("Вы уверены, что хотите завершить тренировку?")) {
            localStorage.removeItem("training_single_answers");
            localStorage.removeItem("training_single_current");
            localStorage.removeItem("training_single_seconds");
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
                question={"В кармане у Миши было четыре конфеты — «Грильяж», «Белочка», «Коровка» и «Ласточка», а также ключи от квартиры. Вынимая ключи, Миша случайно выронил из кармана одну конфету. Найдите вероятность того, что потерялась конфета «Грильяж». В кармане у Миши было четыре конфеты — «Грильяж», «Белочка», «Коровка» и «Ласточка», а также ключи от квартиры. Вынимая ключи, Миша случайно выронил из кармана одну конфету. Найдите вероятность того, что потерялась конфета «Грильяж»."}
                value={answers[current - 1]}
                onChange={handleAnswerChange}
                onCheck={handleSendAnswer}
                is_correct={taskStates[current - 1] === "right" ? true : taskStates[current - 1] === "wrong" ? false : undefined}
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
                    localStorage.removeItem("training_single_answers");
                    localStorage.removeItem("training_single_current");
                    navigate("/training");
                }}>Выйти</PrimaryButton>}>
                {modalText}
            </Modal>
        </PageWrapper>
    );
}

export default Page;