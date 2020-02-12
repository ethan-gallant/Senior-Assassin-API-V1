const neodb = require('./neodb');
const gcs = require('./tools/gcs');
const teacherModel = require('./models/teacher');
const items = {
    "hidden-photo": {
        name: "Hidden Photo",
        description: "Hide your photo so other assassins can't see it!",
        image: "hide",
        cost: 5,
        preflight: async (buyer)=> {
            const data = await neodb.getSession().run(
                'MATCH (s:Student) WHERE s.Email = $Email return s.HidePhoto as photo_hidden',
                {Email: buyer.email}
            );
            let record = data.records[0];
            let studentJSON = record.toObject();
            return !studentJSON.photo_hidden;

        },
        onBuy: (buyer) => {
            neodb.getSession().run(
                'MATCH (s:Student) WHERE s.Email = $Email SET s.HidePhoto = true',
                {Email: buyer.email}
            );
        }
    },
    "teacher-assassin": {
        name: "Teacher Assassin (Temporarily Unavailable)",
        description: "Hire a teacher to help you do your dirty work. Once the teacher is chosen they will remain your hired assassin until your target is eliminated.",
        image: "school",
        cost: 1000000,
        preflight: async (student, body)=> {
            if(!body.teacher)
                return false;
            let teacherEmail = body.teacher;
            let availableTeachers = await teacherModel.getAllWithoutTarget();
            let teacherFound = false;
            await availableTeachers.forEach((dbEmail)=>{
                if(dbEmail.email === teacherEmail){
                    teacherFound = true;
                    console.log("Checking " + teacherEmail + " Against " + dbEmail.email);
                }
            });
            if(await student.getHiredTeacher()){
                console.log("Student has a hired teacher already");
                return false;
            }
            return teacherFound;
        },
        onBuy: async (buyer, body) => {
            let teacher = await teacherModel.getByEmail(body.teacher);
            teacher.assignStudentsTarget(buyer.email);
        }
    },
    "reveal-assassin": {
        name: "Reveal Who's Targeting You",
        description: "Wonder who is trying to slap a sticker on you? Well with this product, you will know!",
        image: "search",
        cost:20,
        preflight: async (student)=>{
            let exposed = await student.exposeAssassin();
            return !exposed;
        },
        onBuy: async (student)=>{
            return student.setRevealTarget();
        }
    },
    "waste-your-money":{
        name:"Waste Your Cash",
        description: "Ever wondered 'Boy I have so much money, what will I ever do with it?!' Well we have got you covered. Buying this item grants you absolutely nothing other than the loss of your cash. So buy away!",
        image: "gentleman",
        cost:5,
        preflight: async (student)=>{
            return true;
        },
        onBuy: async (student)=>{
            return true;
        }
    }
};

module.exports = items;