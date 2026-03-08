import {type FC, Fragment, useState} from "react"
import styled from "@emotion/styled";
import {Steps, Tag, Button, Result, message} from "antd";
import {CheckOutlined} from '@ant-design/icons';
import PrimaryButton from "../../public/primaryButton";
import {useSubjectThemes} from "../../../hooks/subjectThemes/hook";
import useBreakpoint from "antd/es/grid/hooks/useBreakpoint";
import {createStyles} from 'antd-style';
import StyledTitle from "../../components/textComponents/StyledTitle";
import PageContainer from "../../components/containers/PageContainer";
import CardContainer from "../../components/containers/CardContainer";
import api from "../../../api/api";
import {useNavigate} from "react-router";

const TitleSection = styled.div`
    width: 100%;
    max-width: 1200px;
    margin: 0 auto 4px;
    padding: 10px 8px 0;
    text-align: center;
`;

const StepsWrapper = styled.div`
    width: 100%;
    max-width: 1200px;
    margin: 0 auto 6px;
    padding: 6px 6px 4px
    overflow-x: auto;
    min-width: 240px;
`;

const FinalEndContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 10px;
    
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const ChooseContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    gap: 6px;
    padding: 0 6px 6px;
`;

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 820px;
    gap: 10px;
`;

const TagsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
`;

const NavigationButtons = styled.div`
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 10px;
    flex-wrap: wrap;
    width: 100%;
`;

const FinalCard = styled(CardContainer)`
    width: 100%;
    max-width: 1280px;
    margin: 0;
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
            font-size: 14px;
            padding: 8px 18px;
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

    difficultyTagGroup: css`
        .ant-tag {
            font-size: 14px;
            padding: 8px 20px;
        }
    `,
}));

const Page: FC = () => {
    const {subjects} = useSubjectThemes();
    const navigate = useNavigate();
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const screens = useBreakpoint();
    const {styles} = useStyles();

    const currentSubject = subjects.find(s => s.id === selectedSubjectId);
    const availableThemes = currentSubject ? currentSubject.themes : [];

    const difficultyOptions = [
        { value: 'easy', label: 'Лёгкая' },
        { value: 'middle', label: 'Средняя' },
        { value: 'high', label: 'Сложная' }
    ];

    const steps = [
        { title: 'Сложность' },
        { title: 'Предмет' },
        { title: 'Тема' },
        { title: 'Готово' },
    ];

    const handleNext = () => {
        if (currentStep === 0 && selectedDifficulty) {
            setCurrentStep(1);
        } else if (currentStep === 1 && selectedSubjectId) {
            setCurrentStep(2);
        } else if (currentStep === 2 && selectedThemeId) {
            setCurrentStep(3);
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleReset = () => {
        setSelectedDifficulty(null);
        setSelectedSubjectId(null);
        setSelectedThemeId(null);
        setCurrentStep(0);
    };

    const handleSubmit = async () => {
        try {
            const res = await api.post("/trainings/start_training/", null, {
                params: {
                    difficulty: selectedDifficulty,
                    subject_id: selectedSubjectId,
                    theme_id: selectedThemeId,
                }
            });
            if (res && (res.status === 201 || res.status === 200)) {
                const trainingId = res.data.training_id;
                navigate(`/single?id=${trainingId}`);
            } else {
                message.error("Не удалось начать тренировку");
            }
        } catch {
            message.error("Ошибка при создании тренировки");
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <TagsWrapper>
                        <Tag.CheckableTagGroup
                            options={difficultyOptions}
                            value={selectedDifficulty}
                            onChange={(val) => setSelectedDifficulty(val)}
                            className={`${styles.tagGroup} ${styles.difficultyTagGroup}`}
                            multiple={false}
                        />
                    </TagsWrapper>
                );

            case 1:
                return (
                    <TagsWrapper>
                        <Tag.CheckableTagGroup
                            options={subjects.map(v => ({value: v.id, label: v.name}))}
                            value={selectedSubjectId}
                            onChange={(val) => {
                                setSelectedSubjectId(val);
                                setSelectedThemeId(null);
                            }}
                            className={styles.tagGroup}
                            multiple={false}
                        />
                    </TagsWrapper>
                );

            case 2:
                return (
                    <TagsWrapper>
                        {!selectedSubjectId ? (
                            <Button type="link" onClick={() => setCurrentStep(1)}>
                                Сначала выберите предмет
                            </Button>
                        ) : (
                            <Tag.CheckableTagGroup
                                options={availableThemes.map(v => ({value: v.id, label: v.name}))}
                                value={selectedThemeId}
                                onChange={(val) => setSelectedThemeId(val)}
                                className={styles.tagGroup}
                                multiple={false}
                            />
                        )}
                    </TagsWrapper>
                );

            case 3:
                return (
                    <FinalCard style={{padding: 0}}>
                        <Result
                            style={{padding: `15px 30px`}}
                            status="success"
                            title="Параметры тренировки выбраны!"
                            subTitle={
                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px'}}>
                                    <div>
                                        <span style={{color: '#888', marginRight: '10px'}}>Сложность:</span>
                                        <Tag color={
                                            selectedDifficulty === 'easy' ? 'success' :
                                                selectedDifficulty === 'middle' ? 'warning' : 'error'
                                        } style={{padding: '4px 12px', fontSize: '14px'}}>
                                            {difficultyOptions.find(d => d.value === selectedDifficulty)?.label}
                                        </Tag>
                                    </div>
                                    <div>
                                        <span style={{color: '#888', marginRight: '10px'}}>Предмет:</span>
                                        <Tag style={{padding: '4px 12px', fontSize: '14px'}}>
                                            {subjects.find(s => s.id === selectedSubjectId)?.name}
                                        </Tag>
                                    </div>
                                    <div>
                                        <span style={{color: '#888', marginRight: '10px'}}>Тема:</span>
                                        <Tag style={{padding: '4px 12px', fontSize: '14px'}}>
                                            {availableThemes.find(t => t.id === selectedThemeId)?.name}
                                        </Tag>
                                    </div>
                                </div>
                            }
                            extra={
                            <FinalEndContainer>
                                <PrimaryButton key="start" onClick={handleSubmit} style={{marginRight: '10px'}}>
                                    Начать тренировку! <CheckOutlined />
                                </PrimaryButton>
                                <Button key="reset" onClick={handleReset}>
                                    Выбрать заново
                                </Button>
                            </FinalEndContainer>
                            }
                        />
                    </FinalCard>
                );

            default:
                return null;
        }
    };

    const isNextDisabled = () => {
        if (currentStep === 0) return !selectedDifficulty;
        if (currentStep === 1) return !selectedSubjectId;
        if (currentStep === 2) return !selectedThemeId;
        return false;
    };

    return (
        <Fragment>
            <PageContainer>
                <TitleSection>
                    <StyledTitle>
                        Тренируйся в удобном темпе и закрепляй знания по темам
                    </StyledTitle>
                </TitleSection>

                <StepsWrapper>
                    <Steps
                        current={currentStep}
                        size={screens.xs ? "small" : "default"}
                        orientation="horizontal"
                        titlePlacement="vertical"
                        responsive={false}
                        onChange={setCurrentStep}
                        items={steps.map((step, index) => ({
                            title: step.title,
                            disabled: index > currentStep &&
                                !(index === 1 && selectedDifficulty) &&
                                !(index === 2 && selectedSubjectId) &&
                                !(index === 3 && selectedThemeId),
                            status: index < currentStep ? 'finish' :
                                index === currentStep ? 'process' : 'wait'
                        }))}
                    />
                </StepsWrapper>

                <ChooseContainer>
                    <ContentContainer>
                        {renderStepContent()}
                    </ContentContainer>

                    {currentStep < 3 && (
                        <NavigationButtons>
                            {currentStep > 0 && (
                                <Button size="large" onClick={handlePrev}>
                                    Назад
                                </Button>
                            )}
                            <PrimaryButton
                                size="large"
                                onClick={handleNext}
                                disabled={isNextDisabled()}
                            >
                                {currentStep === 2 ? 'Завершить' : 'Далее'}
                            </PrimaryButton>
                        </NavigationButtons>
                    )}
                </ChooseContainer>
            </PageContainer>
        </Fragment>
    )
}

export default Page;

