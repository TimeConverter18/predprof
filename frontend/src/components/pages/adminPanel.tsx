import {type FC, useState} from "react";
import styled from "@emotion/styled";
import {
    Form, Input, Select, Modal, Drawer, Button,
    Tag, Divider, Upload, Pagination, message
} from "antd";
import {
    PlusOutlined, UploadOutlined, DownloadOutlined, ArrowLeftOutlined
} from "@ant-design/icons";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {useMediaQuery} from "react-responsive";
import {useNavigate} from "react-router";
import StyledTitle from "../components/textComponents/StyledTitle";
import PrimaryButton from "../public/primaryButton";
import PageContainer from "../components/containers/PageContainer";

const Panel = styled.div`
    width: 100%;
    max-width: 1280px;
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const Card = styled.div`
    background: #323A7F61;
    border: 3px solid #343434;
    border-radius: 15px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const CardTitle = styled.h3`
    margin: 0;
    color: #E0FF25;
    font-size: 18px;
    font-weight: 500;
`;

const MutedText = styled.span`
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
`;

const TopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
`;

const HeaderRow = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
`;

const TabRow = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

const TaskItem = styled.div`
    background: #323A7F61;
    border: 3px solid #343434;
    border-radius: 20px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
`;

const TaskItemHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
`;

const TaskItemId = styled.span`
    color: #83868e;
    font-size: 14px;
    font-weight: 600;
`;

const TaskItemQuestion = styled.p`
    color: #ffffff;
    font-size: 16px;
    line-height: 1.5;
    margin: 0;
    white-space: pre-line;
    text-align: left;
`;

const TaskItemMeta = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
`;

const TaskItemAnswer = styled.div`
    padding: 10px 14px;
    background: #323A7F61;
    border: 2px solid #343434;
    border-radius: 12px;
    font-size: 14px;
    color: #E0FF25;
    font-weight: 500;
    word-break: break-word;
`;

const ItemList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const UserItem = styled.div`
    background: #323A7F61;
    border: 3px solid #343434;
    border-radius: 15px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
        border-color: #E0FF25;
    }
`;

const UserInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
`;

const UserName = styled.span`
    font-weight: 600;
    font-size: 15px;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const UserEmail = styled.span`
    color: rgba(255, 255, 255, 0.45);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const UserRating = styled.span`
    font-weight: 800;
    font-size: 20px;
    color: #E0FF25;
    white-space: nowrap;
`;

const PaginationWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 4px;
`;

const IOButtonGroup = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
`;

const IORow = styled.div`
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
`;

const TabInactiveButton = styled(Button)`
    && {
        font-weight: bold;
        background: transparent;
        color: #fff;
        border-color: #343434;

        &:hover, &:focus {
            color: #E0FF25;
            border-color: #E0FF25;
            background: transparent;
        }
    }
`;

const PIE_COLORS = ["#3fb950", "#f85149", "#3d4f6e"];

type TabKey = "tasks" | "users" | "io";

type TaskRecord = {
    id: number;
    question: string;
    correct_answer: string;
    subject: string;
    theme: string;
    difficulty: string;
};

type UserRecord = {
    id: number;
    name: string;
    email: string;
    rating: number;
    correct: number;
    wrong: number;
    unsolved: number;
    history: number[];
};

const SUBJECTS = ["Математика", "Информатика", "Физика", "Русский язык"];
const THEMES = ["Алгебра", "Геометрия", "Комбинаторика", "Теория вероятностей", "Алгоритмы", "Структуры данных"];
const DIFFICULTIES = ["Лёгкая", "Средняя", "Сложная"];

const diffColor = (d: string) =>
    d === "Лёгкая" ? "success" as const : d === "Средняя" ? "warning" as const : "error" as const;

const STUB_TASKS: TaskRecord[] = [
    {
        id: 1,
        question: "Найдите значение выражения 2+2*3",
        correct_answer: "6",
        subject: "Математика",
        theme: "Алгебра",
        difficulty: "Лёгкая"
    },
    {
        id: 2,
        question: "Что выведет print(type([]))?",
        correct_answer: "<class 'list'>",
        subject: "Информатика",
        theme: "Алгоритмы",
        difficulty: "Средняя"
    },
    {
        id: 3,
        question: "Чему равно ускорение свободного падения?",
        correct_answer: "9.8",
        subject: "Физика",
        theme: "Геометрия",
        difficulty: "Лёгкая"
    },
    {
        id: 4,
        question: "Решите уравнение x² − 5x + 6 = 0",
        correct_answer: "2; 3",
        subject: "Математика",
        theme: "Алгебра",
        difficulty: "Средняя"
    },
    {
        id: 5,
        question: "Какая сложность бинарного поиска?",
        correct_answer: "O(log n)",
        subject: "Информатика",
        theme: "Алгоритмы",
        difficulty: "Сложная"
    },
    {
        id: 6,
        question: "Найдите производную функции x³",
        correct_answer: "3x²",
        subject: "Математика",
        theme: "Алгебра",
        difficulty: "Сложная"
    },
    {
        id: 7,
        question: "Сколько диагоналей у выпуклого шестиугольника?",
        correct_answer: "9",
        subject: "Математика",
        theme: "Комбинаторика",
        difficulty: "Средняя"
    },
    {
        id: 8,
        question: "Вероятность выпадения орла при подбрасывании монеты?",
        correct_answer: "0.5",
        subject: "Математика",
        theme: "Теория вероятностей",
        difficulty: "Лёгкая"
    },
];

const STUB_USERS: UserRecord[] = [
    {
        id: 4,
        name: "Екатерина Новикова",
        email: "e.novikova@mail.ru",
        rating: 2100,
        correct: 26,
        wrong: 1,
        unsolved: 1,
        history: [1600, 1680, 1750, 1820, 1880, 1940, 2000, 2040, 2075, 2100]
    },
    {
        id: 2,
        name: "Мария Иванова",
        email: "m.ivanova@yandex.ru",
        rating: 1580,
        correct: 24,
        wrong: 2,
        unsolved: 2,
        history: [1100, 1150, 1200, 1280, 1330, 1390, 1450, 1500, 1545, 1580]
    },
    {
        id: 1,
        name: "Алексей Смирнов",
        email: "a.smirnov@mail.ru",
        rating: 1340,
        correct: 18,
        wrong: 4,
        unsolved: 6,
        history: [980, 1020, 1050, 1100, 1140, 1190, 1230, 1270, 1310, 1340]
    },
    {
        id: 5,
        name: "Иван Петров",
        email: "i.petrov@yandex.ru",
        rating: 1120,
        correct: 14,
        wrong: 6,
        unsolved: 8,
        history: [800, 840, 870, 900, 940, 980, 1020, 1060, 1090, 1120]
    },
    {
        id: 3,
        name: "Дмитрий Козлов",
        email: "d.kozlov@gmail.com",
        rating: 890,
        correct: 10,
        wrong: 8,
        unsolved: 10,
        history: [700, 720, 750, 780, 800, 820, 840, 860, 875, 890]
    },
];

const TASKS_PER_PAGE = 5;
const USERS_PER_PAGE = 5;


const TasksSection: FC<{ tasks: TaskRecord[]; setTasks: (fn: (prev: TaskRecord[]) => TaskRecord[]) => void }> = ({
                                                                                                                     tasks,
                                                                                                                     setTasks
                                                                                                                 }) => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const [page, setPage] = useState(1);

    const sorted = [...tasks].sort((a, b) => a.id - b.id);
    const paginated = sorted.slice((page - 1) * TASKS_PER_PAGE, page * TASKS_PER_PAGE);

    const openAdd = () => {
        form.resetFields();
        setOpen(true);
    };

    const handleSave = () => {
        form.validateFields().then((vals) => {
            setTasks(prev => [...prev, {...vals, id: Math.max(0, ...prev.map(t => t.id)) + 1}]);
            setOpen(false);
            message.success("Задача добавлена");
        });
    };

    return (
        <Card>
            <TopBar>
                <CardTitle>База задач</CardTitle>
                <PrimaryButton icon={<PlusOutlined/>} onClick={openAdd}>Добавить</PrimaryButton>
            </TopBar>

            <ItemList>
                {paginated.map(t => (
                    <TaskItem key={t.id}>
                        <TaskItemHeader>
                            <TaskItemId>№{t.id}</TaskItemId>
                            <TaskItemMeta>
                                <Tag color="blue">{t.subject}</Tag>
                                <Tag>{t.theme}</Tag>
                                <Tag color={diffColor(t.difficulty)}>{t.difficulty}</Tag>
                            </TaskItemMeta>
                        </TaskItemHeader>
                        <TaskItemQuestion>{t.question}</TaskItemQuestion>
                        <TaskItemAnswer>Ответ: {t.correct_answer}</TaskItemAnswer>
                    </TaskItem>
                ))}
            </ItemList>

            {tasks.length > TASKS_PER_PAGE && (
                <PaginationWrapper>
                    <Pagination
                        current={page}
                        total={tasks.length}
                        pageSize={TASKS_PER_PAGE}
                        onChange={setPage}
                        showSizeChanger={false}
                        size="small"
                    />
                </PaginationWrapper>
            )}

            <Modal
                title="Новая задача"
                open={open}
                onOk={handleSave}
                onCancel={() => setOpen(false)}
                okText="Сохранить"
                cancelText="Отмена"
                okButtonProps={{style: {color: "#000", fontWeight: "bold"}}}
            >
                <Form form={form} layout="vertical" style={{marginTop: 16}}>
                    <Form.Item name="question" label="Текст задачи"
                               rules={[{required: true, message: "Введите текст"}]}>
                        <Input.TextArea rows={3} placeholder="Условие задачи"/>
                    </Form.Item>
                    <Form.Item name="correct_answer" label="Правильный ответ"
                               rules={[{required: true, message: "Введите ответ"}]}>
                        <Input placeholder="Ответ"/>
                    </Form.Item>
                    <Form.Item name="subject" label="Предмет" rules={[{required: true, message: "Выберите предмет"}]}>
                        <Select placeholder="Выберите предмет" options={SUBJECTS.map(s => ({value: s, label: s}))}/>
                    </Form.Item>
                    <Form.Item name="theme" label="Тема" rules={[{required: true, message: "Выберите тему"}]}>
                        <Select placeholder="Выберите тему" options={THEMES.map(t => ({value: t, label: t}))}/>
                    </Form.Item>
                    <Form.Item name="difficulty" label="Сложность"
                               rules={[{required: true, message: "Выберите сложность"}]}>
                        <Select placeholder="Выберите сложность"
                                options={DIFFICULTIES.map(d => ({value: d, label: d}))}/>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};


const UserStatsDrawer: FC<{ user: UserRecord | null; onClose: () => void }> = ({user, onClose}) => {
    const isMobile = useMediaQuery({maxWidth: 767});
    if (!user) return null;

    const total = user.correct + user.wrong + user.unsolved;
    const pie = [
        {name: "Верно", value: user.correct},
        {name: "Неверно", value: user.wrong},
        {name: "Не решено", value: user.unsolved},
    ];
    const history = user.history.map((r, i) => ({label: `#${i + 1}`, rating: r}));

    return (
        <Drawer
            title={<span style={{color: "#E0FF25", fontWeight: 700}}>{user.name}</span>}
            open
            onClose={onClose}
            width={isMobile ? "100%" : 520}
        >
            <MutedText>{user.email}</MutedText>
            <Divider/>
            <div style={{textAlign: "center", marginBottom: 20}}>
                <MutedText style={{display: "block", marginBottom: 4}}>Рейтинг</MutedText>
                <span style={{fontSize: 36, fontWeight: 900, color: "#E0FF25"}}>{user.rating}</span>
            </div>
            <MutedText style={{fontSize: 12, textTransform: "uppercase", letterSpacing: 1}}>
                Статистика задач ({total})
            </MutedText>
            <div style={{marginTop: 8}}>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie data={pie} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                             paddingAngle={4} dataKey="value">
                            {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                        </Pie>
                        <Tooltip/>
                        <Legend/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <Divider/>
            <MutedText style={{fontSize: 12, textTransform: "uppercase", letterSpacing: 1}}>
                Рейтинг за последние 10 PvP
            </MutedText>
            <div style={{marginTop: 8}}>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={history} margin={{top: 5, right: 10, left: -20, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#343434"/>
                        <XAxis dataKey="label" tick={{fill: "#83868e", fontSize: 10}}/>
                        <YAxis tick={{fill: "#83868e", fontSize: 10}}/>
                        <Line type="monotone" dataKey="rating" stroke="#E0FF25" strokeWidth={2.5}
                              dot={{fill: "#E0FF25", r: 4, strokeWidth: 0}} activeDot={{r: 6}}/>
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Drawer>
    );
};


const UsersSection: FC = () => {
    const [selected, setSelected] = useState<UserRecord | null>(null);
    const [page, setPage] = useState(1);

    const sorted = [...STUB_USERS].sort((a, b) => b.rating - a.rating);
    const paginated = sorted.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

    return (
        <Card>
            <CardTitle>Пользователи</CardTitle>

            <ItemList>
                {paginated.map(u => (
                    <UserItem key={u.id} onClick={() => setSelected(u)}>
                        <UserInfo>
                            <UserName>{u.name}</UserName>
                            <UserEmail>{u.email}</UserEmail>
                        </UserInfo>
                        <UserRating>{u.rating}</UserRating>
                    </UserItem>
                ))}
            </ItemList>

            {STUB_USERS.length > USERS_PER_PAGE && (
                <PaginationWrapper>
                    <Pagination
                        current={page}
                        total={STUB_USERS.length}
                        pageSize={USERS_PER_PAGE}
                        onChange={setPage}
                        showSizeChanger={false}
                        size="small"
                    />
                </PaginationWrapper>
            )}

            <UserStatsDrawer user={selected} onClose={() => setSelected(null)}/>
        </Card>
    );
};


const IOSection: FC<{ tasks: TaskRecord[]; setTasks: (fn: (prev: TaskRecord[]) => TaskRecord[]) => void }> = ({
                                                                                                                  tasks,
                                                                                                                  setTasks
                                                                                                              }) => {
    const download = (content: string, filename: string, mime: string) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([content], {type: mime}));
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const exportCSV = () => {
        const header = "id,question,correct_answer,subject,theme,difficulty";
        const rows = tasks.map(t => `${t.id},"${t.question}","${t.correct_answer}","${t.subject}","${t.theme}","${t.difficulty}"`);
        download([header, ...rows].join("\n"), "tasks.csv", "text/csv");
        message.success("CSV экспортирован");
    };

    const exportJSON = () => {
        download(JSON.stringify(tasks, null, 2), "tasks.json", "application/json");
        message.success("JSON экспортирован");
    };

    const handleUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target?.result as string;
                let parsed: TaskRecord[];

                if (file.name.endsWith(".json")) {
                    const data = JSON.parse(text);
                    if (!Array.isArray(data)) {
                        message.error("JSON должен содержать массив");
                        return;
                    }
                    parsed = data as TaskRecord[];
                } else {
                    parsed = text.trim().split("\n").slice(1).map((line, i) => {
                        const p = line.split(",");
                        return {
                            id: Date.now() + i,
                            question: p[1]?.replace(/"/g, "") || "",
                            correct_answer: p[2]?.replace(/"/g, "") || "",
                            subject: p[3]?.replace(/"/g, "") || "",
                            theme: p[4]?.replace(/"/g, "") || "",
                            difficulty: p[5]?.replace(/"/g, "") || "Лёгкая",
                        };
                    });
                }

                setTasks(prev => {
                    const maxId = prev.reduce((acc, t) => Math.max(acc, t.id), 0);
                    return [...prev, ...parsed.map((t, i) => ({...t, id: maxId + i + 1}))];
                });
                message.success(`Импортировано ${parsed.length} задач`);
            } catch {
                message.error("Не удалось прочитать файл");
            }
        };
        reader.readAsText(file);
        return false;
    };

    return (
        <Card>
            <CardTitle>Импорт / Экспорт задач</CardTitle>

            <IOButtonGroup>
                <MutedText>Экспорт ({tasks.length} задач)</MutedText>
                <IORow>
                    <PrimaryButton icon={<DownloadOutlined/>} onClick={exportCSV}>CSV</PrimaryButton>
                    <PrimaryButton icon={<DownloadOutlined/>} onClick={exportJSON}>JSON</PrimaryButton>
                </IORow>

                <Divider style={{margin: "4px 0", borderColor: "#343434"}}/>

                <MutedText>Импорт (.csv / .json)</MutedText>
                <Upload accept=".csv,.json" beforeUpload={handleUpload} showUploadList={false}>
                    <PrimaryButton icon={<UploadOutlined/>}>Выбрать файл</PrimaryButton>
                </Upload>
            </IOButtonGroup>
        </Card>
    );
};


const AdminPanel: FC = () => {
    const [tab, setTab] = useState<TabKey>("tasks");
    const [tasks, setTasks] = useState<TaskRecord[]>(STUB_TASKS);
    const navigate = useNavigate();

    return (
        <PageContainer>
            <Panel>
                <HeaderRow>
                    <PrimaryButton
                        icon={<ArrowLeftOutlined/>}
                        onClick={() => navigate("/main")}
                    >
                        На главную
                    </PrimaryButton>
                    <StyledTitle>Панель администратора</StyledTitle>
                </HeaderRow>

                <TabRow>
                    {tab === "tasks" ? (
                        <PrimaryButton onClick={() => setTab("tasks")}>Задачи</PrimaryButton>
                    ) : (
                        <TabInactiveButton onClick={() => setTab("tasks")}>Задачи</TabInactiveButton>
                    )}
                    {tab === "users" ? (
                        <PrimaryButton onClick={() => setTab("users")}>Пользователи</PrimaryButton>
                    ) : (
                        <TabInactiveButton onClick={() => setTab("users")}>Пользователи</TabInactiveButton>
                    )}
                    {tab === "io" ? (
                        <PrimaryButton onClick={() => setTab("io")}>Импорт / Экспорт</PrimaryButton>
                    ) : (
                        <TabInactiveButton onClick={() => setTab("io")}>Импорт / Экспорт</TabInactiveButton>
                    )}
                </TabRow>

                {tab === "tasks" && <TasksSection tasks={tasks} setTasks={setTasks}/>}
                {tab === "users" && <UsersSection/>}
                {tab === "io" && <IOSection tasks={tasks} setTasks={setTasks}/>}
            </Panel>
        </PageContainer>
    );
};

export default AdminPanel;