const neodb = require('../neodb');
const gcs = require('../tools/gcs');
async function main() {
    this.email = "test1@ljcds.org";

    await neodb.createSession();
    const data = await neodb.getSession().run(
        'MATCH (s:Student)-[:TARGET {confirmed:true}]->(s2:Student) ' +
        'WITH s,count(s2) as kills ' +
        'RETURN s.FirstName as name_first,s.LastName as name_last,kills ORDER BY kills DESC LIMIT 5 ',
        {Email: this.email}
    );

    let hs = [];
    for (let i = 0; i < data.records.length; i++) {
        let hsJSON = data.records[i].toObject();
        hsJSON.url = await gcs.getReadSignedUrl(`images/${hsJSON.name_last}-${hsJSON.name_first}.jpg`.toLowerCase());
        hs.push(hsJSON);
    }
    console.log(hs);

}

main();
