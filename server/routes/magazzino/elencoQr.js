const express = require("express");
const router = express.Router();
const { checkAuth, authorizeRoles } = require("../../middlewares/auth");
const { getElencoQr, postElencoQr, deleteElencoQr, deleteLotto, putElencoQr } = require("../../controllers/magazzino/elencoQr");

router.get("/", getElencoQr);
router.post("/", checkAuth, authorizeRoles("admin"), postElencoQr);
router.put("/:id", checkAuth, authorizeRoles("admin"), putElencoQr);
router.delete("/:id", checkAuth, authorizeRoles("admin"), deleteElencoQr);
router.delete("/lotto/:lotto", checkAuth, authorizeRoles("admin"), deleteLotto);

module.exports = router;
