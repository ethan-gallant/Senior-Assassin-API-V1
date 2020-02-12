const neodb = require('../neodb');
const gcs = require('../tools/gcs');


exports.getKillsNeedingApproval = async () => {
    const data = await neodb.getSession().run(
        'MATCH (s1:Student)-[r:TARGET]->(s2:Student) WHERE r.killed = true AND r.confirmed = false return s1.Email as assassin_email, r.uuid as uuid, s2.Email as target_email',
    );

    let killsToConfirm = [];
    for(let i = 0; i < data.records.length; i++){
        let record = data.records[i].toObject();
        record.url = await gcs.getReadSignedUrl("evidence/" + record.uuid + ".jpg");
        killsToConfirm.push(record);
    }
    console.log(killsToConfirm);

    return killsToConfirm;
};

exports.confirmKill = (uuid)=> {
     neodb.getSession().run(
        /**
         * a: The student who made the kill
         * v: The victim of the kill
         * r: the relationship between a and t
         * x: the victims target
         * tr (OPTIONAL) : the teacher who we hired to kill our target
         * ss: The person who will be inheriting t(victim)'s target
         */
        /* Get the Killer, set them as A AND set the Victim as T */
        'MATCH (a:Student)-[r:TARGET {uuid:$uuid,confirmed:false}]->(v:Student),' +
        /* Fetch the Victims Target and set them as x */
        '(v)-[:TARGET {confirmed:false}]->(x:Student {IsDead:false}) ' +
        /* Check if we hired a teacher to assassinate our target. Set the relationship to TR (teacher relation)*/
        'OPTIONAL MATCH (v)<-[tr:TARGET]-(:Teacher) ' +
        /* Fetch the alive person who has the target (in-case we died and then it went into review) */
        'MATCH (v)<-[sr:TARGET {confirmed:false}]-(ss:Student {IsDead:false}) ' +
        /* Create a relationship between SS and t */
        'CREATE (ss)-[:TARGET {killed:false,confirmed:false}]->(x) ' +
        /* Set the Kill Relationship to complete and kill the victim */
        'SET r.confirmed = true, v.IsDead = true,a.Balance = a.Balance + 3 ' +
        /* Delete the teacher relationship */
        'DELETE tr ', {uuid:uuid}
        /*Now we clean up any pointless relations in the DB*/
    ).then(data=>neodb.getSession().run('MATCH (s1:Student),(s2:Student {IsDead:true}) MATCH (s1)-[t:TARGET {confirmed:false,killed:false}]->(s2) DELETE t'));
};

exports.denyKill = (uuid)=> {
    neodb.getSession().run(
        'MATCH (:Student)-[r:TARGET {uuid:$uuid}]->(:Student) ' +
        'SET r.killed = false REMOVE r.uuid', {uuid:uuid}
        /*Now we clean up any pointless relations in the DB*/
    ).then(data=>neodb.getSession().run('MATCH (s1:Student),(s2:Student {IsDead:true}) MATCH (s1)-[t:TARGET {confirmed:false,killed:false}]->(s2) DELETE t'));
};
