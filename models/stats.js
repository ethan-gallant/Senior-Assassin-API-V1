const neodb = require('../neodb');
const gcs = require('../tools/gcs');


exports.getMostKills = async () => {
    const data = await neodb.getSession().run(
        'MATCH (s:Student)-[:TARGET {confirmed:true}]->(s2:Student) ' +
        'WITH s,count(s2) as kills ' +
        'RETURN s.FirstName as name_first,s.LastName as name_last,kills ORDER BY kills DESC LIMIT 3 '
    );

    let hs = [];
    for (let i = 0; i < data.records.length; i++) {
        let hsJSON = data.records[i].toObject();
        hsJSON.url = await gcs.getReadSignedUrl(`images/${hsJSON.name_last}-${hsJSON.name_first}.jpg`.toLowerCase());
        hs.push(hsJSON);
    }
    return hs;
};

exports.deadStudents = async () => {
    const data = await neodb.getSession().run(
        'MATCH (s:Student {IsDead:true}) WHERE s.LastName <> "testaccount" OPTIONAL MATCH ' +
        '(s)-[:TARGET {confirmed:true}]->(s2:Student) ' +
        'WITH s,count(s2) as kills ' +
        'RETURN s.FirstName as name_first,s.LastName as name_last,kills'
    );

    let deadStudents = [];
    for (let i = 0; i < data.records.length; i++) {
        let deadJSON = data.records[i].toObject();
        deadJSON.url = await gcs.getReadSignedUrl(`images/${deadJSON.name_last}-${deadJSON.name_first}.jpg`.toLowerCase());
        deadStudents.push(deadJSON);
    }
    return deadStudents;
};

