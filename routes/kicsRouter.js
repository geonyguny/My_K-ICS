// const LTCtrl = require("../controllers/kicsCtrl");
// const LTCtrl = require("../controllers/kicsCtrl");
// const view = require("../index")
const deleteDao = require("../controllers/deleteDao");
const insertDao = require("../controllers/insertDao");
const ASqueryDao = require("../controllers/ASqueryDao");
const CRqueryDao = require("../controllers/CRqueryDao");
const OPqueryDao = require("../controllers/OPqueryDao");
const LTqueryDao = require("../controllers/LTqueryDao");
const STqueryDao = require("../controllers/LTqueryDao");
// const uploadExcel = require("../controllers/uploadExcel")
const router = require("express").Router();

router.route('/')
    .get(insertDao.getKics)
    .delete(deleteDao.deleteKics)    
    //.post(insertDao.insertKics)   
    // .post(OPqueryDao.queryKics)
    .post(CRqueryDao.queryKics)
    // .post(ASqueryDao.queryKics)
    // .post(LTqueryDao.queryKics)
    // .post(STqueryDao.queryKics)
module.exports = router;

