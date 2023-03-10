// const LTCtrl = require("../controllers/kicsCtrl");
// const LTCtrl = require("../controllers/kicsCtrl");
// const view = require("../index")
const deleteDao = require("../dao/deleteDao");
const insertDao = require("../dao/insertDao");
const MKqueryDao = require("../dao/MKqueryDao");
const RTOqueryDao = require("../dao/RTOqueryDao");
const AVCqueryDao = require("../dao/AVCqueryDao");
const RQCqueryDao = require("../dao/RQCqueryDao");
const CRqueryDao = require("../dao/CRqueryDao");
const OPqueryDao = require("../dao/OPqueryDao");
const LTqueryDao = require("../dao/LTqueryDao");
const STqueryDao = require("../dao/STqueryDao");
// const uploadExcel = require("../controllers/uploadExcel")
const router = require("express").Router();

router.route('/')
    .get(insertDao.getKics)
    .delete(deleteDao.deleteKics)    
    // .post(AVCqueryDao.queryKics)
    // .post(RQCqueryDao.queryKics)
    // .post(RTOqueryDao.queryKics)
    //.post(insertDao.insertKics)   
    // .post(OPqueryDao.queryKics)
    // .post(CRqueryDao.queryKics)
    .post(MKqueryDao.queryKics)
    // .post(LTqueryDao.queryKics)
    // .post(STqueryDao.queryKics)
module.exports = router;

