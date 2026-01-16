import express from "express";
import {pool} from "./utils/db.mjs";
const app = express();
const port = 4008;
app.use(express.json());

//รอบแรกที่ส่งไป เข้าใจว่าให่ไปเพิ่มข้อมูลในระบบ ที่ SQL เอง เลยไม่มี post
//ทำเพิ่มเติม User สามารถเพิ่มข้อมูลได้ในระบบ

app.post("/assignments", async (req, res) =>{

    //     [1] รับของจาก client
// [2] ตรวจของ (validation)
// [3] ทำงานจริง (DB / logic)
// [4] ตอบกลับ

    //1.validation ให้เรียบร้อย

    //ตรงนี้ไปหาเพิ่มมาเราจะกำหนดกติกาให้ว่า ถ้าไม่มีพวกนี้นะ จะคืนค่า 400
    //“เอา required field มาทำเป็น array 
    // แล้ว loop เช็ก req.body[field]ถ้าขาด field ไหน ตอบ 400 ทันที”
    const requiredFields = ["title", "content", "category"]
    for (const field of requiredFields){
        if(!req.body[field]){
            return res.status(400).json({
                message: `${field} is required`
            })
        }
    }
//2.ค่อยสร้าง object หลังจากข้อมูลผ่าน
        const createAssignmentFromClient = {
        ...req.body,
        created_at : new Date(),
        updated_at : new Date(),
        published_at : new Date()
    }
    

    try{ 
        const result =  await pool.query (

        `INSERT INTO assignments 
        (
        title,
        content,
        category,
        length,
        user_id,
        status,
        created_at,
        updated_at,
        published_at 
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING assignment_id`,

        [
            
            createAssignmentFromClient.title,
            createAssignmentFromClient.content,
            createAssignmentFromClient.category,
            createAssignmentFromClient.length,
            createAssignmentFromClient.user_id,
            createAssignmentFromClient.status,
            createAssignmentFromClient.created_at,
            createAssignmentFromClient.updated_at,
            createAssignmentFromClient.published_at 
        ]
    )

    return res.status(201).json({
        "message": "Create assignment successfully",
        assignment_id: result.rows[0].assignment_id
    })
}catch(error){
    return res.status(500).json({
        "message": "Server could not read assignment because database connection"
    })

}
     
})


//ข้อ 1 User สามารถดูข้อมูลแบบทดสอบทั้งหมดในระบบได้
app.get("/assignments", async (req, res) => {
    let result ;

    try{
        result = await pool.query(`SELECT * FROM assignments`)
    
    return res.status(200).json({
        "data": result.rows

    })
    } catch(error){
        return res.status(500).json({
             "message": "Server could not read assignment because database connection" 
        })
    }

    }
);

//ข้อ 2 User สามารถดูข้อมูลแบบทดสอบอันเดียวได้
app.get("/assignments/:assignmentId", async (req, res) =>{
    try{
        const assignmentIdFromClient = req.params.assignmentId;
        const result = await pool.query(
            `SELECT * FROM assignments WHERE assignment_id = $1`,[assignmentIdFromClient]
        )
        if(!result.rows[0]){
            return res.status(404).json({
                 "message": "Server could not find a requested assignment"
            })
        }

        return res.status(200).json({
            "data": result.rows[0]
        }
        )
    } catch (error){
        return res.status(500).json({
            "message": "Server could not read assignment because database connection" 
        });
    }
});

//ข้อ 3 User สามารถแก้ไขแบบทดสอบที่ได้เคยสร้างไว้ก่อนหน้านี้

app.put("/assignments/:assignmentId",async (req, res) =>{
    try{
    const assignmentIdFromClient = req.params.assignmentId;
    const updateAssignmentFromClient = {...req.body,updated_at:new Date ()}
    
    if (!updateAssignmentFromClient.title 
        || !updateAssignmentFromClient.content 
        || !updateAssignmentFromClient.category ){
        return res.status(404).json({
            "message": "Server could not find a requested assignment to update"
        })
    }

    const result = await pool.query(
        `update assignments
        set title = $2,
            content = $3,
            category = $4,
            updated_at = $5
        
        where assignment_id = $1`,
        [
            assignmentIdFromClient,
            updateAssignmentFromClient.title,
            updateAssignmentFromClient.content,
            updateAssignmentFromClient.category,
            updateAssignmentFromClient.updated_at
        ]
    )
    if(result.rowCount === 0){
        return res.status(404).json({
            message: "Server could not find a requested assignment to update"
        })
    }
    return res.status(200).json({
        "message": "Updated assignment successfully" 
    })
} catch(error){
    return res.status(500).json({
         "message": "Server could not update assignment because database connection" 
    })
}
})

//ข้อ 4 User สามารถลบแบบทดสอบที่ได้เคยสร้างไว้ก่อนหน้านี้
app.delete("/assignments/:assignmentId", async (req, res) =>{
    try{
        const assignmentIdFromClient = req.params.assignmentId;
        const result =  await pool.query(
            `DELETE FROM assignments
            WHERE assignment_id = $1`,
            [assignmentIdFromClient]
        )
    if (result.rowCount === 0){
        return res.status(404).json({
            "message": "Server could not find a requested assignment to delete"
        })
    }
    
    return res.status(200).json({
        "message": "Deleted assignment successfully"
    })

    }catch(error){
        return res.status(500).json({
            "message": "Server could not delete assignment because database connection" 
        })

    }
} )


app.listen(port, () => {
    console.log (`🚀 Server is running at ${port}`);
})

