import {type FC, useCallback, useEffect, useState} from "react";
import styled from "@emotion/styled";
import {
    Form, Input, Select, Modal, Drawer, Button,
    Tag, Divider, Upload, Pagination, message, Spin
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
import api from "../../api/api";
import {useAuth} from "../../hooks/auth/hook.ts";
import AccessDenied from "./accessDenied.tsx";

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

type SubjectOption = {
    id: number;
    name: string;
    themes: { id: number; name: string }[];
};

const DIFFICULTIES = [
    {value: "easy", label: "Лёгкая"},
    {value: "middle", label: "Средняя"},
    {value: "high", label: "Сложная"},
];

const DIFFICULTY_LABELS: Record<string, string> = {
    "easy": "Лёгкая",
    "middle": "Средняя",
    "high": "Сложная",
};

const diffColor = (d: string) => {
    const key = d.toLowerCase();
    return key === "easy" || key === "лёгкая" ? "success" as const
        : key === "middle" || key === "средняя" ? "warning" as const
            : "error" as const;
};

const diffLabel = (d: string) => DIFFICULTY_LABELS[d] || d;

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
    {
        id: 33,
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


const TasksSection: FC<{
    tasks: TaskRecord[];
    totalCount: number;
    page: number;
    setPage: (p: number) => void;
    onReload: () => void;
    subjects: SubjectOption[];
}> = ({tasks, totalCount, page, setPage, onReload, subjects}) => {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);

    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
    const themeOptions = selectedSubject?.themes.map(t => ({value: t.name, label: t.name})) ?? [];

    const openAdd = () => {
        form.resetFields();
        setSelectedSubjectId(undefined);
        setOpen(true);
    };

    const handleSave = () => {
        form.validateFields().then(async (vals) => {
            setSaving(true);
            try {
                const res = await api.post("/tasks/create/", {
                    question: vals.question,
                    correct_answer: vals.correct_answer,
                    solution: vals.solution || "",
                    subject: vals.subject_id,
                    theme: vals.theme_id || null,
                    difficulty: vals.difficulty,
                });
                if (res && (res.status === 201 || res.status === 200)) {
                    message.success("Задача добавлена");
                    setOpen(false);
                    onReload();
                }
            } finally {
                setSaving(false);
            }
        });
    };

    return (
        <Card>
            <TopBar>
                <CardTitle>База задач ({totalCount})</CardTitle>
                <PrimaryButton icon={<PlusOutlined/>} onClick={openAdd}>Добавить</PrimaryButton>
            </TopBar>

            <ItemList>
                {tasks.map(t => (
                    <TaskItem key={t.id}>
                        <TaskItemHeader>
                            <TaskItemId>№{t.id}</TaskItemId>
                            <TaskItemMeta>
                                <Tag color="blue">{t.subject}</Tag>
                                {t.theme && <Tag>{t.theme}</Tag>}
                                <Tag color={diffColor(t.difficulty)}>{diffLabel(t.difficulty)}</Tag>
                            </TaskItemMeta>
                        </TaskItemHeader>
                        <TaskItemQuestion>{t.question}</TaskItemQuestion>
                        <TaskItemAnswer>Ответ: {t.correct_answer}</TaskItemAnswer>
                    </TaskItem>
                ))}
                {tasks.length === 0 && <MutedText>Нет задач</MutedText>}
            </ItemList>

            {totalCount > TASKS_PER_PAGE && (
                <PaginationWrapper>
                    <Pagination
                        current={page}
                        total={totalCount}
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
                confirmLoading={saving}
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
                    <Form.Item name="subject_id" label="Предмет" rules={[{required: true, message: "Выберите предмет"}]}>
                        <Select
                            placeholder="Выберите предмет"
                            options={subjects.map(s => ({value: s.id, label: s.name}))}
                            onChange={(val) => {
                                setSelectedSubjectId(val);
                                form.setFieldValue("theme_id", undefined);
                            }}
                        />
                    </Form.Item>
                    <Form.Item name="theme_id" label="Тема">
                        <Select
                            placeholder="Выберите тему"
                            options={themeOptions}
                            allowClear
                            disabled={!selectedSubjectId}
                        />
                    </Form.Item>
                    <Form.Item name="difficulty" label="Сложность"
                               rules={[{required: true, message: "Выберите сложность"}]}>
                        <Select placeholder="Выберите сложность" options={DIFFICULTIES}/>
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

    const sorted = [...STUB_USERS].sort((a, b) => b.rating - a.rating);

    return (
        <Card>
            <CardTitle>Пользователи</CardTitle>

            <ItemList>
                {sorted.map(u => (
                    <UserItem key={u.id} onClick={() => setSelected(u)}>
                        <UserInfo>
                            <UserName>{u.name}</UserName>
                            <UserEmail>{u.email}</UserEmail>
                        </UserInfo>
                        <UserRating>{u.rating}</UserRating>
                    </UserItem>
                ))}
            </ItemList>

            <UserStatsDrawer user={selected} onClose={() => setSelected(null)}/>
        </Card>
    );
};


const IOSection: FC<{ onReload: () => void }> = ({onReload}) => {
    const [taskCount, setTaskCount] = useState<number>(0);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        api.get("/tasks/", {params: {page: 1, page_size: 1}}).then((res) => {
            if (res && res.status === 200 && res.data) {
                setTaskCount(res.data.items_count || 0);
            }
        });
    }, []);

    const exportCSV = () => {
        window.open("/api/tasks/export/?export_format=csv", "_blank");
        message.success("CSV экспорт начат");
    };

    const exportJSON = () => {
        window.open("/api/tasks/export/?export_format=json", "_blank");
        message.success("JSON экспорт начат");
    };

    const handleUpload = (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        api.post("/tasks/import/", formData, {
            headers: {"Content-Type": "multipart/form-data"},
        }).then((res) => {
            if (res && res.data) {
                const created = res.data.created || 0;
                const errors = res.data.errors || [];
                if (created > 0) {
                    message.success(`Импортировано ${created} задач`);
                    onReload();
                }
                if (errors.length > 0) {
                    message.warning(`Ошибки: ${errors.length}`);
                }
            }
        }).finally(() => setUploading(false));
        return false;
    };

    return (
        <Card>
            <CardTitle>Импорт / Экспорт задач</CardTitle>

            <IOButtonGroup>
                <MutedText>Экспорт ({taskCount} задач)</MutedText>
                <IORow>
                    <PrimaryButton icon={<DownloadOutlined/>} onClick={exportCSV}>CSV</PrimaryButton>
                    <PrimaryButton icon={<DownloadOutlined/>} onClick={exportJSON}>JSON</PrimaryButton>
                </IORow>

                <Divider style={{margin: "4px 0", borderColor: "#343434"}}/>

                <MutedText>Импорт (.csv / .json)</MutedText>
                <Upload accept=".csv,.json" beforeUpload={handleUpload} showUploadList={false}>
                    <PrimaryButton icon={<UploadOutlined/>} loading={uploading}>Выбрать файл</PrimaryButton>
                </Upload>
            </IOButtonGroup>
        </Card>
    );
};


const AdminPanel: FC = () => {
    const [tab, setTab] = useState<TabKey>("tasks");
    const [tasks, setTasks] = useState<TaskRecord[]>([]);
    const [tasksTotalCount, setTasksTotalCount] = useState(0);
    const [tasksPage, setTasksPage] = useState(1);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const navigate = useNavigate();
    const {user} = useAuth();

    const fetchTasks = useCallback((page: number) => {
        setTasksLoading(true);
        api.get("/tasks/export/", {params: {export_format: "json"}}).then((res) => {
            if (res && res.status === 200 && Array.isArray(res.data)) {
                const all: TaskRecord[] = res.data.map((t: {
                    id: number; question: string; correct_answer: string;
                    subject: string; theme: string | null; difficulty: string;
                }) => ({
                    id: t.id,
                    question: t.question,
                    correct_answer: t.correct_answer,
                    subject: t.subject,
                    theme: t.theme || "",
                    difficulty: t.difficulty,
                }));
                setTasksTotalCount(all.length);
                const start = (page - 1) * TASKS_PER_PAGE;
                setTasks(all.slice(start, start + TASKS_PER_PAGE));
            }
        }).finally(() => setTasksLoading(false));
    }, []);

    useEffect(() => {
        fetchTasks(tasksPage);
    }, [tasksPage, fetchTasks]);

    useEffect(() => {
        api.get("/tasks/subjects/").then((res) => {
            if (res && res.status === 200 && Array.isArray(res.data)) {
                setSubjects(res.data);
            }
        });
    }, []);

    const handleTasksReload = () => {
        fetchTasks(tasksPage);
    };

    if (!user?.admin) {
        return <AccessDenied/>
    }

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

                {tab === "tasks" && (
                    tasksLoading ? (
                        <Card><div style={{display: "flex", justifyContent: "center", padding: 40}}><Spin size="large"/></div></Card>
                    ) : (
                        <TasksSection
                            tasks={tasks}
                            totalCount={tasksTotalCount}
                            page={tasksPage}
                            setPage={setTasksPage}
                            onReload={handleTasksReload}
                            subjects={subjects}
                        />
                    )
                )}
                {tab === "users" && <UsersSection/>}
                {tab === "io" && <IOSection onReload={handleTasksReload}/>}
            </Panel>
        </PageContainer>
    );
};

export default AdminPanel;

