import axios, {AxiosError, type AxiosResponse} from "axios";
import {message} from "antd";

const apiURL = "/api"

const api = axios.create({
    baseURL: apiURL,
    timeout: 10000,
    withCredentials: true,
})

api.interceptors.response.use(
    (res: AxiosResponse): AxiosResponse => {
        return res
    },
    async function (error: AxiosError) {
        const status = error.response?.status;

        if (!status) {
            message.error("Нет подключения к серверу", 1);
            return Promise.resolve(null);
        }

        switch (status) {
            case 400:
                message.error("400 Некорректные данные", 1);
                break;
            case 401:
                if (!error.request?.responseURL?.includes("/users/me/")) {
                    message.error("401 Ошибка авторизации", 1);
                }
                return Promise.reject(error);
            case 403:
                message.error("403 Нехватка полномочий", 1);
                break;
            case 404:
                message.error("404 Не найдено", 1);
                break;
            case 498:
                message.error("Неизвестная ошибка", 1);
                break;
            case 499:
                message.error("Неизвестная ошибка", 1);
                break;
            default:
                message.error(`Неопознанная ошибка ${error.status}`, 1);

        }

        return Promise.resolve({
            data: null,
            status: status,
            headers: {},
            config: error.config,
        });
    }
)

export default api;