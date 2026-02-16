import {type FC, Fragment, useState} from "react";
import {Input, Pagination, Select} from "antd";
import {SearchOutlined} from "@ant-design/icons"
import Task from "../public/task.tsx";
import styled from "@emotion/styled";
import TasksContainer from "../public/taskContainer.tsx";
import {BaseTask} from "../../api/serverResponses.ts";
import {useSubjectThemes} from "../../hooks/subjectThemes/hook.ts";

const difficultyOptions = [
    { label: 'Лёгкая', value: 'easy' },
    { label: 'Средняя', value: 'middle' },
    { label: 'Сложная', value: 'high' }
];

const TopRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    gap: 20px;
    overflow: auto;
    padding: 5px 5px 8px 5px;
`;

const SortContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 20px;
`;

const tasks: BaseTask[] = [
    {task_id: 3443, question: "Основания равнобедренной трапеции равны 43 и 73. Косинус острого угла трапеции равен 0.5. Найдите боковую сторону.", is_correct: true},
    {task_id: 3444, question: "Основания равнобедренной трапеции равны 43 и 73. Косинус острого угла трапеции равен 0.5. Найдите боковую сторону.", is_correct: false},
    {task_id: 3445, question: "Основания равнобедренной трапеции равны 43 и 73. Косинус острого угла трапеции равен 0.5. Найдите боковую сторону."},
    {task_id: 3446, question: "Задача 4"},
    {task_id: 3447, question: "Задача 5"},
    {task_id: 3448, question: "Задача 6"},
    {task_id: 3449, question: "Задача 7"},
    {task_id: 3450, question: "Задача 8"},
    {task_id: 3451, question: "Задача 9"},
    {task_id: 3452, question: "Задача 10"},
    {task_id: 3453, question: "Задача 11"},
    {task_id: 3454, question: "Задача 12"},
    {task_id: 3455, question: "Задача 13"},
    {task_id: 3456, question: "Задача 14"},
    {task_id: 3457, question: "Задача 15"},
    {task_id: 3458, question: "Задача 16"},
    {task_id: 3459, question: "Задача 17"},
    {task_id: 3460, question: "Задача 18"},
    {task_id: 3461, question: "Задача 19"},
    {task_id: 3462, question: "Задача 20"},
    {task_id: 3463, question: "Задача 21"},
    {task_id: 3464, question: "Задача 22"},
    {task_id: 3465, question: "Задача 23"},
    {task_id: 3466, question: "Задача 24"},
    {task_id: 3467, question: "Задача 25"},
]

const Page: FC = () => {
    const {subjects} = useSubjectThemes();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const handleAnswerChange = (id: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [id]: value
        }));
    };

    return (
        <Fragment>
            <TopRow>
                <SortContainer>
                    <Select
                        defaultValue={subjects[0]?.id}
                        style={{ width: 200 }}
                        options={subjects.map((it) => ({ label: it.name, value: it.id }))}
                        placeholder="Выберите предмет"
                    />
                    <Select
                        defaultValue={difficultyOptions[0].value}
                        style={{ width: 200 }}
                        options={difficultyOptions}
                    />
                </SortContainer>
                <Input placeholder="Поиск по номеру" suffix={<SearchOutlined />} style={{minWidth: 200, marginLeft: "auto", maxWidth: 200}}/>
            </TopRow>
            <TasksContainer>
                {tasks.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((task) => {
                    const taskId = task.task_id.toString();
                    return (
                        <Task 
                            key={taskId} 
                            {...task}
                            value={answers[taskId] || ""}
                            onChange={(val) => handleAnswerChange(taskId, val)}
                        />
                    );
                })}
            </TasksContainer>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingBottom: '20px' }}>
                <Pagination
                    current={currentPage}
                    total={tasks.length}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                />
            </div>
        </Fragment>
    );
}

export default  Page;