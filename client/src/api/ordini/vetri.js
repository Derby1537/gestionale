import axios from "axios";

const api = axios.create({
    baseURL: "/api/ordini/vetri"
})

export async function getVetriApi(params) {
    const res = await api.get("/", { params });
    return res.data;
}

export async function putVetroApi(vetro) {
    const res = await api.put(`/${vetro.id}`, vetro);
    return res.data;
}

export async function deleteVetroApi(id) {
    const res = await api.delete(`${id}`);
    return res.data;
}

export async function consegnaVetroApi(id) {
    const res = await api.post(`/consegna/${id}`);
    return res.data;
}
