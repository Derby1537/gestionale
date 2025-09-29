import axios from "axios";

const api = axios.create({
    baseURL: "/api/magazzino/elenco_qr"
})

export async function getElencoQr(params) {
    const res = await api.get("/", { params });
    return res.data;
}

export async function putElencoQrApi(params) {
    const res = await api.put(`/${params.id}`, params);
    return res.data;
}
