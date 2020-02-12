const neo4j = require('neo4j-driver');
const uuidv4 = require('uuid/v4');
const neodb = require('../neodb');
const gcs = require('../tools/gcs');


class Student {
    constructor(data) {
        this.email = data.Email;
        this.playing = data.IsPlaying;
        this.name_first = data.FirstName;
        this.name_last = data.LastName;
        this.dead = data.IsDead || false;
        this.is_admin = Boolean(data.IsAdmin) || false;
        this.balance = data.Balance.low || 0;
    }

    async getCurrentTarget() {
        const data = await neodb.getSession().run(
            'MATCH (s:Student) WHERE s.Email = $Email MATCH q=(s)-[r:TARGET]->(t:Student) WHERE ' +
            'COALESCE(t.IsDead, false) = false return t.FirstName as name_first, t.LastName as name_last, t.Email as email, ' +
            'COALESCE(t.HidePhoto, false) as photo_hidden, COALESCE(r.killed, false) as killed, r.uuid as uuid, COALESCE(t.IsDead, false) as dead;',
            {Email: this.email}
        );
        let record = data.records[0];
        if (!record)
            return null;
        let targetJSON = record.toObject();
        if(!targetJSON.photo_hidden){
            targetJSON.url = await gcs.getReadSignedUrl(`images/${targetJSON.name_last}-${targetJSON.name_first}.jpg`.toLowerCase())
        }
        return targetJSON;
    }

    async getAllTargets() {

        const data = await neodb.getSession().run(
            'MATCH (s:Student) WHERE s.Email = $Email MATCH q=(s)-[r:TARGET]->(t:Student) return t.FirstName as name_first, t.LastName as name_last, t.Email as email, t.HidePhoto as photo_hidden, COALESCE(t.IsDead, false) as dead;',
            {Email: this.email}
        );

        let targets = [];

         for(let i = 0; i< data.records.length; i++){
            let targetJSON = data.records[i].toObject();
            if(!targetJSON.photo_hidden || targetJSON.dead){
                targetJSON.url = await gcs.getReadSignedUrl(`images/${targetJSON.name_last}-${targetJSON.name_first}.jpg`.toLowerCase());
                targets.push(targetJSON);

            } else {
                targets.push(targetJSON);
            }
        }

        if (targets.length <= 0)
            return null;
        return targets;
    }

    async submitKill() {
        let currentTarget = await this.getCurrentTarget();
        let killUUID = uuidv4();
        if(currentTarget){
            if(!currentTarget.killed){
                neodb.getSession().run(
                    'MATCH (s:Student) WHERE s.Email = $Email MATCH q=(s)-[r:TARGET]->(t:Student) WHERE COALESCE(t.IsDead,false) = FALSE SET r.killed = TRUE, r.uuid = $UUID',
                    {
                        Email: this.email,
                        UUID: killUUID
                    }
                );
                return await gcs.getWriteSignedUrl(`evidence/${killUUID}.jpg`);
            } else {
                return await gcs.getWriteSignedUrl(`evidence/${currentTarget.uuid}.jpg`);
            }
        }
        return null;
    }

    async exposeAssassin() {
        const data = await neodb.getSession().run(
            'MATCH (s:Student) WHERE s.Email = $Email MATCH q=(s)<-[r:TARGET]-(t:Student) WHERE COALESCE(t.IsDead, false) = false ' +
            'AND r.exposed = true return t.FirstName as name_first, t.LastName as name_last, t.Email as email, COALESCE(t.HidePhoto, false) as photo_hidden;',
            {Email: this.email}
        );
        let record = data.records[0];
        if (!record)
            return null;
        let exposedJSON = record.toObject();
        if(!exposedJSON.photo_hidden){
            exposedJSON.url = await gcs.getReadSignedUrl(`images/${exposedJSON.name_last}-${exposedJSON.name_first}.jpg`.toLowerCase())
        }
        return exposedJSON;
    }

    reduceBalance(amount) {
        neodb.getSession().run(
            'MATCH (s:Student) WHERE s.Email = $Email SET s.Balance = s.Balance - $amount',
            {
                Email: this.email,
                amount: neo4j.int(amount)
            }
        );
    }

    increaseBalance(amount) {
        neodb.getSession().run(
            'MATCH (s:Student) WHERE s.Email = $Email SET s.Balance = s.Balance + $amount',
            {
                Email: this.email,
                amount: neo4j.int(amount)
            }
        );
    }

    async getHiredTeacher() {
        const data = await neodb.getSession().run(
            'MATCH (s:Student),(t:Teacher) WHERE s.Email = $Email MATCH (s)-[r:TARGET]->(x:Student)<-[tt:TARGET]-(t) ' +
            'WHERE r.confirmed = false AND x.IsDead = false return t.Email as email, t.Salutation as salutation, t.LastName as name_last;',
            {Email: this.email}
        );
        let record = data.records[0];
        if (!record)
            return null;
        let targetJSON = record.toObject();
        return targetJSON;
    }

    setRevealTarget() {
        neodb.getSession().run(
            'MATCH (s:Student),(t:Student) WHERE t.Email = $Email MATCH (t)<-[r:TARGET]-(s) WHERE r.confirmed = false SET r.exposed = TRUE',
            {Email: this.email}
        );
    }

    async getKillCount() {
        const data = await neodb.getSession().run(
            'MATCH (s:Student {Email:$Email})-[:TARGET {confirmed:true}]->(v:Student) return COUNT(v) ',
            {Email: this.email}
        );
        let record = data.records[0];
        if (!record)
            return 0;
        let countRec = record.get(0);
        if(!countRec && !countRec.low)
            return 0;
        return countRec.low;
    }

}

exports.getByEmail = async (email) => {
    const data = await neodb.getSession().run(
        'match (s:Student) where s.Email = $Email RETURN s;',
        {Email: email.toLowerCase()}
    );

    const singleRecord = data.records[0];
    if (!singleRecord)
        return null;
    const node = singleRecord.get(0);

    return new Student(node.properties);
};

exports.getAll = async () => {
    const data = await neodb.getSession().run(
        'match (s:Student) OPTIONAL MATCH (s {IsDead:False})-[r:TARGET {confirmed:false}]->(x:Student) return s,r,x;'
    );

    let students = [];

    await data.records.forEach((data)=>{
        let studentJSON = data.get(0).properties;
        if(data.get(2))
            studentJSON.target = data.get(2).properties;
        students.push(studentJSON);
    });
    if (!students)
        return null;
    return students;
};

/*exports.getAllWithTargets = async () =>{
    exports.getAll = async () => {
        const data = await neodb.getSession().run(
            'match (s1:Student),(s2:Student) WHERE (s1)-[r:TARGET]->(s2) RETURN s1,s2,r;'
        );

        let students = [];
        await data.records.forEach((data)=>{
            students.push(data.get(0).properties);
        });
        if (!students)
            return null;
        console.log(students);
        return students;
    };
};*/