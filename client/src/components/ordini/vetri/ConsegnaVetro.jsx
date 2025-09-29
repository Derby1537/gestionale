import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Button } from "react-bootstrap";
import { consegnaVetroApi } from "../../../api/ordini/vetri";

const ConsegnaVetro = ({ vetro }) => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (vetro) => {
            return consegnaVetroApi(vetro.id);
        },
        onSuccess: () => {
            alert("Vetro consegnato con successo");
            queryClient.invalidateQueries({ queryKey: ["vetri"] });
        },
        onError: (e) => {
            console.error(e);
        }
    })

    const onClick = () => {
        mutation.mutate(vetro);
    }

    return (
            <Button variant="light" size="sm" onClick={onClick}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-seam-fill" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461z"/>
                </svg>
            </Button>
    )
}

export default ConsegnaVetro;
