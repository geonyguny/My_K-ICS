const fs = require('fs');
const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host : conf.host,
    user : conf.user,
    password : conf.password,
    port : conf.port,
    database : conf.database
});
const readXlsxFile = require('read-excel-file/node')

//control get / insert
exports.getKics = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        try {
            const selectQuery = "SELECT * FROM LTerm_Risk_Shock;";
            const [row] = await connection.query(selectQuery);
            connection.release();
            console.log(row);
            return row;
        } catch (err) {
            console.error(` ##### getUserRows Query error ##### `);
            connection.release();
            return false;
        }
    } catch (err) {
        console.error(` ##### getUserRows DB error #####`);
        return false;
    }
};

exports.queryKics = async function () {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        try{
        //SQL - 장기손보 대재해위험액 산출 - 노출비율, 계수 하드코딩
        //LTerm_Risk_Cat
        connection.query(
            `INSERT INTO LTerm_Risk_Cat 
            (SETL_YM, EXE_IDNO, DISE_RISK, BIG_DTH_RISK, BIG_OBS_RISK, BIG_PROP_RISK)
            VALUES(202212,1    
            ,(SELECT (OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.0001
                FROM LTerm_CAT_DT
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND CAT_CD =1)
            ,(SELECT ROUND(
                IF(((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.15- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT))>0,
                    ((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.15- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT)),0)*0.0000711
                + IF(((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.015- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT))>0,
                    ((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.015- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT)),0)*0.0003733
                ,3)
                FROM LTerm_CAT_DT
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND CAT_CD =2)
            ,(SELECT ROUND( 
                    IF(((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.2- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT))>0,
                        ((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.2- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT)),0)*0.0000711
                    + IF(((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.1- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT))>0,
                            ((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.1- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT)),0)*0.0003733
                    ,3)
                FROM LTerm_CAT_DT
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND CAT_CD =3)
            ,(SELECT ROUND(
                    IF(((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*1-(OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT))>0,
                        ((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*1- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT)),0)*0.0000711
                    + IF(((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.25- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT))>0,
                        ((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.25- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT)),0)*0.0002133
                    + IF(((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.1- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT))>0,
                        ((OR_JOIN_AMT + SU_JOIN_AMT - RE_JOIN_AMT)*0.1- (OR_PAID_AMT+SU_PAID_AMT-RE_PAID_AMT)),0)*0.00016                                        
                    ,3)
                FROM LTerm_CAT_DT
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND CAT_CD =4)
            );                                
            `
        );

        // SQL - 장기손보 보험/금리 충격시나리오별 공정가치 :
        // LTerm_FV
        connection.query(
            `INSERT INTO LTerm_FV 
            (SETL_YM, EXE_IDNO, SHOCK_SCN_CD, KICS_LTPF_CD, RSV_AMT, PREM_AMT,RE_RSV_AMT,RE_PREM_AMT,CL_LOAN, LT_NAV)
            SELECT A.SETL_YM
                , A.EXE_IDNO
                , A.SHOCK_SCN_CD
                , A.KICS_LTPF_CD
                , A.IBNR_AMT + A.OS_AMT + A.LOSS_SVYEXP
                , A.BEL_TVOG + A.BEL_AMT
                , B.RE_IBNR_AMT + B.RE_OS_AMT + B.RE_LOSS_SVYEXP - B.RE_RSV_LSS
                , B.RE_TVOG_AMT + B.RE_CEBF_AMT - B.RE_CE_LSS
                , A.CL_LOAN_NEW - A.CL_LOAN_REPAY + A.CL_LOAN_INT-A.CL_LOAN_MGEXP+A.CL_LOAN_TVOG
                , (A.CL_LOAN_NEW - A.CL_LOAN_REPAY + A.CL_LOAN_INT-A.CL_LOAN_MGEXP+A.CL_LOAN_TVOG) 
                    + (B.RE_IBNR_AMT + B.RE_OS_AMT + B.RE_LOSS_SVYEXP - B.RE_RSV_LSS) 
                    + (B.RE_TVOG_AMT + B.RE_CEBF_AMT - B.RE_CE_LSS)
                    - (A.IBNR_AMT + A.OS_AMT + A.LOSS_SVYEXP)
                    - (A.BEL_TVOG + A.BEL_AMT)
            FROM LTerm_CF_DT A, LTerm_RECF_DT B
            WHERE A.SETL_YM = B.SETL_YM
            AND A.EXE_IDNO = B.EXE_IDNO
            AND A.SHOCK_SCN_CD = B.SHOCK_SCN_CD
            AND A.KICS_LTPF_CD = B.KICS_LTPF_CD;
            `                                
        );

        // SQL : 장기손보 보험/금리 충격리스크별 위험액 
        // LTerm_Risk_Shock
        connection.query(
            `INSERT INTO LTerm_Risk_Shock 
            (SETL_YM, EXE_IDNO, LT_RISK_DEAD, LT_RISK_LONG, LT_RISK_FXCOMP, LT_RISK_PMCOMP, LT_RISK_PROP,
            LT_RISK_OPINC, LT_RISK_OPDEC, LT_RISK_MASS, LT_RISK_BIZEXP)
            VALUES(202212,1                                
            ,(SELECT IF(NAV_101 - NAV_100 >=0,0,NAV_100 - NAV_101) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM LTerm_FV
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_101
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 101
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            ,(SELECT IF(NAV_102 - NAV_100 >=0,0,NAV_100 - NAV_102) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_102
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 102
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            ,(SELECT IF(NAV_103 - NAV_100 >=0,0,NAV_100 - NAV_103) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_103
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 103
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            ,(SELECT IF(NAV_104 - NAV_100 >=0,0,NAV_100 - NAV_104) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_104
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 104
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            ,(SELECT IF(NAV_105 - NAV_100 >=0,0,NAV_100 - NAV_105) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_105
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 105
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            ,(SELECT IF(NAV_106 - NAV_100 >=0,0,NAV_100 - NAV_106) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_106
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 106
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            ,(SELECT IF(NAV_107 - NAV_100 >=0,0,NAV_100 - NAV_107) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_107
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 107
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            ,(SELECT IF(NAV_108 - NAV_100 >=0,0,NAV_100 - NAV_108) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_108
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 108
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            ,(SELECT IF(NAV_109 - NAV_100 >=0,0,NAV_100 - NAV_109) FROM 
                (SELECT SUM(LT_NAV) AS NAV_100
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 100
                GROUP BY SETL_YM, EXE_IDNO) AS A
                ,(SELECT SUM(LT_NAV) AS NAV_109
                FROM lterm_fv
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1
                AND SHOCK_SCN_CD = 109
                GROUP BY SETL_YM, EXE_IDNO) AS B)
            )
            `
        );	         
       
        // SQL : 장기손보 세부위험 및 단순합산 위험액
        // LTerm_Risk_SUM 입력
        connection.query(
            `INSERT INTO LTerm_Risk_SUM 
            (SETL_YM, EXE_IDNO, LT_RISK_DEAD, LT_RISK_LONG, LT_RISK_OBSDIS, LT_RISK_PROP,
            LT_RISK_CANC, LT_RISK_BIZEXP, LT_RISK_CAT, LT_RISK_SUM)
            VALUES(202212,1                                
            ,(SELECT LT_RISK_DEAD
                FROM LTerm_RISK_SHOCK
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1)	                    
            ,(SELECT LT_RISK_LONG
                FROM LTerm_RISK_SHOCK
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1)	     
            ,(SELECT LT_RISK_FXCOMP+LT_RISK_PMCOMP
                FROM LTerm_RISK_SHOCK
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1)	  
            ,(SELECT LT_RISK_PROP
                FROM LTerm_RISK_SHOCK
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1)	   
            ,(SELECT IF(LT_RISK_MASS > IF(LT_RISK_OPINC > LT_RISK_OPDEC ,LT_RISK_OPINC,LT_RISK_OPDEC),
                        LT_RISK_MASS, 
                        IF(LT_RISK_OPINC > LT_RISK_OPDEC ,LT_RISK_OPINC,LT_RISK_OPDEC))
                FROM LTerm_RISK_SHOCK
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1)	
            ,(SELECT LT_RISK_BIZEXP
                FROM LTerm_RISK_SHOCK
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1)	
            ,(SELECT ROUND(SQRT(POW(DISE_RISK,2)+POW((BIG_DTH_RISK+BIG_OBS_RISK+BIG_PROP_RISK),2)),3)
                FROM LTerm_Risk_Cat
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1)	
            ,(SELECT LT_RISK_DEAD+LT_RISK_LONG+LT_RISK_FXCOMP+LT_RISK_PMCOMP+LT_RISK_PROP
                +IF(LT_RISK_MASS > IF(LT_RISK_OPINC > LT_RISK_OPDEC ,LT_RISK_OPINC,LT_RISK_OPDEC),
                    LT_RISK_MASS, 
                    IF(LT_RISK_OPINC > LT_RISK_OPDEC ,LT_RISK_OPINC,LT_RISK_OPDEC))
                +LT_RISK_BIZEXP
                FROM LTerm_RISK_SHOCK
                WHERE SETL_YM = 202212
                AND EXE_IDNO = 1)
            );	                      
            `
        );
        // SQL : 장기손보 요약 - 시가평가() 위험액
        // LTerm_Risk_SUM 입력
        connection.query(
            `INSERT INTO LTerm_SUMMARY
            (SETL_YM, EXE_IDNO, RSV_SUM, PREM_SUM, RE_RSV_SUM, RE_PREM_SUM, CL_LOAN_SUM, 
                LT_RM, LT_RISK_DEAD, LT_RISK_LONG, LT_RISK_OBSDIS, LT_RISK_PROP, LT_RISK_CANC, 
                LT_RISK_BIZEXP, LT_RISK_CAT, LT_RISK_SUM, LT_RISK_DVS, LT_RISK_FNL)
            VALUES(202212,1                                
            ,(SELECT SUM(RSV_AMT) FROM LTerm_FV
                WHERE SETL_YM=202212
                AND EXE_IDNO=1
                GROUP BY SETL_YM,EXE_IDNO)
            ,(SELECT SUM(PREM_AMT) FROM LTerm_FV
                WHERE SETL_YM=202212
                AND EXE_IDNO=1
                GROUP BY SETL_YM,EXE_IDNO)
            ,(SELECT SUM(RE_RSV_AMT) FROM LTerm_FV
                WHERE SETL_YM=202212
                AND EXE_IDNO=1
                GROUP BY SETL_YM,EXE_IDNO)
            ,(SELECT SUM(RE_PREM_AMT) FROM LTerm_FV
                WHERE SETL_YM=202212
                AND EXE_IDNO=1
                GROUP BY SETL_YM,EXE_IDNO)
            ,(SELECT SUM(CL_LOAN) FROM LTerm_FV
                WHERE SETL_YM=202212
                AND EXE_IDNO=1
                GROUP BY SETL_YM,EXE_IDNO)
            ,(SELECT (A.LT_RISK_SUM - A.LT_RISK_BIZEXP)*B.Z_85*B.Z_995
                FROM LTerm_Risk_SUM A,
                LTerm_Oth_DT B
                WHERE A.SETL_YM=B.SETL_YM
                AND A.EXE_IDNO=B.EXE_IDNO
                AND A.SETL_YM=202212
                AND A.EXE_IDNO=1)
            ,(SELECT LT_RISK_DEAD FROM LTerm_Risk_SUM
                WHERE SETL_YM=202212
                AND EXE_IDNO=1)
            ,(SELECT LT_RISK_LONG FROM LTerm_Risk_SUM
                WHERE SETL_YM=202212
                AND EXE_IDNO=1)
            ,(SELECT LT_RISK_OBSDIS FROM LTerm_Risk_SUM
                WHERE SETL_YM=202212
                AND EXE_IDNO=1)
            ,(SELECT LT_RISK_PROP FROM LTerm_Risk_SUM
                WHERE SETL_YM=202212
                AND EXE_IDNO=1)
            ,(SELECT LT_RISK_CANC FROM LTerm_Risk_SUM
                WHERE SETL_YM=202212
                AND EXE_IDNO=1)
            ,(SELECT LT_RISK_BIZEXP FROM LTerm_Risk_SUM
                WHERE SETL_YM=202212
                AND EXE_IDNO=1)
            ,(SELECT LT_RISK_CAT FROM LTerm_Risk_SUM
                WHERE SETL_YM=202212
                AND EXE_IDNO=1)
            ,(SELECT LT_RISK_SUM FROM LTerm_Risk_SUM
                WHERE SETL_YM=202212
                AND EXE_IDNO=1)
            ,1
            ,2)                
             `   
        );       
        } catch (err) {
            console.error(" ##### Insert From DB Query Error ##### ");
            return false;
        }
    }catch (err) {
        console.error("##### DB Access Error #####");
        return false;
    }
}


// module.exports = kicsCtrl;

