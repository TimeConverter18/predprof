import type {FC} from "react";
import {Form, Input, Typography, message} from "antd";
import styled from "@emotion/styled";
import PrimaryButton from "../public/primaryButton";
import {Link, useNavigate} from "react-router";
import api from "../../api/api";
import {useAuth} from "../../hooks/auth/hook";

const FormWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
'`;

const { Title } = Typography;

type FieldType = {
    mail: string;
    username: string;
    password: string;
    passwordConfirm: string;
};

const onFinishFailed = () => {}

const Page: FC = () => {
    const navigate = useNavigate();
    const { reload } = useAuth();

    const onFinish = async (values: FieldType) => {
        try {
            const res = await api.post("/auth/register/", {
                email: values.mail,
                username: values.username,
                password: values.password,
                password_confirm: values.passwordConfirm,
            });
            if (res && (res.status === 201 || res.status === 200)) {
                message.success("Регистрация прошла успешно!");
                await reload();
                navigate("/main");
            }
        } catch {
            // errors handled by interceptor
        }
    };

    return (
        <FormWrapper>
            <Title level={2}>РЕГИСТРАЦИЯ</Title>
            <Form
                layout="vertical"
                name="signup"
                labelCol={{span: 16}}
                style={{maxWidth: "90%", width: "450px", alignSelf: "center"}}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item<FieldType>
                    label="Почта"
                    name="mail"
                    rules={[{required: true, message: 'Введите свою почту!'}, {type: "email", message: 'Некорректная почта!'}]}
                >
                    <Input/>
                </Form.Item>
                <Form.Item<FieldType>
                    label="Никнейм"
                    name="username"
                    rules={[{required: true, message: 'Введите свой никнейм!'}, {min: 4, message: 'Никнейм слишком короткий!'}]}
                >
                    <Input/>
                </Form.Item>
                <Form.Item<FieldType>
                    label="Пароль"
                    name="password"
                    rules={[{required: true, message: 'Введите свой пароль!'}, {min: 8, message: 'Пароль слишком короткий!'}]}
                >
                    <Input.Password/>
                </Form.Item>
                <Form.Item<FieldType>
                    label="Подтверждение пароля"
                    name="passwordConfirm"
                    rules={[{required: true, message: 'Введите своё подтверждение пароля!'}, ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('Пароли не совпадают!'));
                        },
                    }),]}
                >
                    <Input.Password/>
                </Form.Item>
                <Form.Item style={{marginTop: "40px"}}>
                    <PrimaryButton htmlType="submit" size="large" style={{ width: "100%"}}>
                        Зарегистрироваться
                    </PrimaryButton>
                    <div style={{marginTop: "10px"}}>
                        <Link to="/signin" style={{color: "white"}}>У меня уже есть аккаунт</Link>
                    </div>
                </Form.Item>
            </Form>
        </FormWrapper>
    );
}

export default Page;