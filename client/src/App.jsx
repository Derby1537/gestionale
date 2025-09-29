import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';
import NavBar from "./components/NavBar/NavBar";

import HomePage from "./pages/HomePage";

import ProfiliHomePage from "./pages/magazzino/HomePage";
import ScarichiProfili from "./pages/magazzino/scarichi"
import CarichiProfili from "./pages/magazzino/carichi"
import OrdiniProfili from "./pages/magazzino/ordini";
import ConsegneProfili from "./pages/magazzino/consegne";
import Qr from "./pages/magazzino/qr";
import ElencoQr from "./pages/magazzino/listaQr";
import AggiungiElencoQr from "./pages/magazzino/elencoQr";
import QuantitaProfili from "./pages/magazzino/quantita";
import AccessoriProfili from "./pages/magazzino/accessori";
import ColoriProfili from "./pages/magazzino/colori";
import ValoreMagazzino from "./pages/magazzino/valore";

import LoginPage from "./pages/profile/login";
import ProfilePage from "./pages/profile/profile";

import OrdiniHomePage from "./pages/ordini/homepage";
import VetriLotti from "./pages/ordini/VetriLotti";
import VetriOrdini from "./pages/ordini/vetri";
import VetriConsegnati from "./pages/ordini/vetriConsegnati"
import Lotti from "./pages/ordini/lotti"
import AggiungiListaOrdini from "./pages/ordini/aggiungiOrdini";
import AggiungiVetri from "./pages/ordini/aggiungiVetri";

import { UserProvider } from "./contexts/UserContext";
import './App.css'
import AggiungiCarichi from "./pages/magazzino/aggiungiCarichi";
import AggiungiOrdini from "./pages/magazzino/aggiungiOrdini";
import ElencoProfili from "./pages/magazzino/profili";
import AggiungiElenco from "./pages/magazzino/aggiungiElenco";

import SupportoPage from "./pages/supporto";

function App() {
    useEffect(() => {
        document.title = "PlanetWindows";
    }, [])
    return (
        <UserProvider>
            <Router>
                <NavBar/> 
                <div className="main-container">
                    <div className="inner-main-container">
                        <Routes>
                            <Route path="/" element={<HomePage  />}>
                            </Route>

                            <Route path="/magazzino" element={<ProfiliHomePage />}>
                                <Route path="scarichi" element={<ScarichiProfili/>}></Route>
                                <Route path="carichi" element={<CarichiProfili/>}>
                                    <Route path="aggiungi" element={<AggiungiCarichi/>}></Route>
                                </Route>
                                <Route path="qr" element={<Qr/>}></Route>
                                <Route path="qr/elenco" element={<ElencoQr/>}></Route>
                                <Route path="qr/elenco/aggiungi" element={<AggiungiElencoQr/>}></Route>
                                <Route path="ordini" element={<OrdiniProfili/>}>
                                    <Route path="aggiungi" element={<AggiungiOrdini/>}></Route>
                                </Route>
                                <Route path="consegne" element={<ConsegneProfili />}></Route>
                                <Route path="profili" element={<ElencoProfili/>}>
                                    <Route path="aggiungi" element={<AggiungiElenco/>}></Route>
                                </Route>
                                <Route path="quantita" element={<QuantitaProfili/>}></Route>
                                <Route path="accessori" element={<AccessoriProfili/>}></Route>
                                <Route path="colori" element={<ColoriProfili />}></Route>
                                <Route path="valore" element={<ValoreMagazzino/>}></Route>
                            </Route>
                            <Route path="/ordini" element={<OrdiniHomePage/>}>
                                <Route path="aggiungi" element={<AggiungiListaOrdini/>}></Route>
                                <Route path="vetri" element={<VetriLotti/>}></Route>
                                <Route path="vetri_ordinati" element={<VetriOrdini/>}></Route>
                                <Route path="vetri_consegnati" element={<VetriConsegnati/>}></Route>
                                <Route path="vetri/aggiungi" element={<AggiungiVetri/>}></Route>
                                <Route path="lotti" element={<Lotti/>}></Route>
                            </Route>
                            <Route path="/login" element={<LoginPage/>}>

                            </Route>
                            <Route path="/profilo" element={<ProfilePage/>}>

                            </Route>
                            <Route path="/supporto" element={<SupportoPage/>}>

                            </Route>
                        </Routes>
                    </div>
                </div>
            </Router>
        </UserProvider>
    );
}

export default App;
