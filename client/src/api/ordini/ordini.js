import axios from "axios";

const api = axios.create({
    baseURL: "/api/ordini"
})

export async function getPezziTotaliApi(params) {
    const res = await api.get("/pezzi", { params });
    return res.data;
}
