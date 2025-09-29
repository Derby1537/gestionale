import axios from "axios";

const api = axios.create({
    baseURL: "/api/magazzino/scarichi"
})

export async function postScarico(params) {
    const res = await api.post("/", { ...params });
    return res.data;
}

