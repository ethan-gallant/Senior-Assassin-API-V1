const neodb = require('../neodb');
const gcs = require('../tools/gcs');

class Teacher {
    constructor(data) {
        this.email = data.Email;
        this.salutation = data.Salutation;
        this.name_last = data.LastName;
    }

    async getCurrentTarget() {
        const data = await neodb.getSession().run(
            'MATCH (t:Teacher) WHERE t.Email = $Email MATCH q=(s)-[r:TARGET]->(t:Student) WHERE ' +
            'COALESCE(t.IsDead, false) = false return t.FirstName as name_first, t.LastName as name_last, t.Email as email, ' +
            'COALESCE(t.HidePhoto, false) as photo_hidden, COALESCE(r.killed, false) as killed;',
            {Email: this.email}
        );
        console.log(data);
        let record = data.records[0];
        if (!record)
            return null;
        let targetJSON = record.toObject();
        if (!targetJSON.photo_hidden) {
            targetJSON.url = await gcs.getReadSignedUrl(`images/${targetJSON.name_last}-${targetJSON.name_first}.jpg`.toLowerCase())
        }
        return targetJSON;
    }

    async getAllTargets() {
        const data = await neodb.getSession().run(
            'MATCH (t:Teacher) WHERE t.Email = $Email MATCH q=(s)-[r:TARGET]->(t:Student) return t.FirstName as name_first,' +
            't.LastName as name_last, t.Email as email, t.HidePhoto as photo_hidden, COALESCE(t.IsDead, false) as dead;',
            {Email: this.email}
        );

        let targets = [];

        for (let i = 0; i < data.records.length; i++) {
            let targetJSON = data.records[i].toObject();
            if (!targetJSON.photo_hidden || targetJSON.dead) {
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

    assignStudentsTarget(studentEmail) {
        neodb.getSession().run(
            'MATCH (t:Teacher),(s:Student) WHERE t.Email = $Email AND s.Email = $StudentEmail ' +
            'MATCH (s)-[sr:TARGET]->(st:Student) WHERE sr.confirmed = false and st.IsDead = false CREATE (t)-[r:TARGET {IsTeacherTarget:true}]->(st)',
            {
                Email: this.email,
                StudentEmail: studentEmail
            }
        );
    }
}

exports.getByEmail = async (email) => {
    const data = await neodb.getSession().run(
        'MATCH (t:Teacher) where t.Email = $Email RETURN t;',
        {Email: email.toLowerCase()}
    );

    const singleRecord = data.records[0];
    if (!singleRecord)
        return null;
    const node = singleRecord.get(0);

    return new Teacher(node.properties);
};


exports.getAllWithoutTarget = async (connection, email, target_email) => {
    const data = await neodb.getSession().run(
        'MATCH (t:Teacher) WHERE NOT (t)-[:TARGET]->(:Student) return t.Salutation as salutation, t.LastName as name_last, t.Email as email;',
        {Email: email}
    );

    let teachers = [];
    for (let i = 0; i < data.records.length; i++) {
        let teacherJSON = data.records[i];
        teachers.push(teacherJSON.toObject());
    }

    if (teachers.length <= 0)
        return null;
    return teachers;
};