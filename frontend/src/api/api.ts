import axios, {AxiosError, type AxiosResponse} from "axios";
import {message} from "antd";
import domain from "./domain.ts";
import {isCustomError} from "./serverResponses.ts";

const apiURL = "/api"

const api = axios.create({
    baseURL: apiURL,
    timeout: 2000,
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
                if (error.request.responseURL === `${domain}${apiURL}/users/me`) {
                    return Promise.reject(error);
                }
                message.error("401 Ошибка авторизации", 1);
                break;
            case 403:
                message.error("403 Нехватка полномочий", 1);
                break;
            case 404:
                message.error("404 Не найдено", 1);
                break;
            case 498:
                { const originalRequest = error.config;

                const res = await api.post(`${apiURL}/auth/refresh`)

                if (res.request.status === 401) {
                    api.post(`${apiURL}/auth/exit`).then(() => {
                        window.location.reload();
                    })
                } else {
                    if (!originalRequest) {
                        return Promise.reject(error);
                    }
                    return api(originalRequest);
                }
                break; }
            case 499:
                { const errorData = error?.response?.data
                if (isCustomError(errorData)) {
                    message.error(errorData.error, 1);
                }
                else {
                    message.error("Неизвестная ошибка", 1);
                }
                break; }
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