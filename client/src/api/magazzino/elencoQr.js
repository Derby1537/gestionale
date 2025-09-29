import axios from "axios";

const api = axios.create({
    baseURL: "/api/magazzino/elenco_qr"
})

export async function deleteElencoQr(id) {
    const res = await api.delete(`/${id}`);
    return res.data;
}

export async function deleteLottoApi(lotto) {
    const res = await api.delete(`/lotto/${lotto}`);
    return res.data;
}
