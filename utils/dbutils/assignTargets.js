const neo4j = require('neo4j-driver');
const arrayShuffle = require('array-shuffle');
const driver = neo4j.driver(
    'bolt://:7687',
    neo4j.auth.basic('neo4j', '')
);

let session = driver.session();

async function main() {
    let emails = await getEmailsInArray();

    let shuffled = arrayShuffle(emails);

    for (let i = 0; i < shuffled.length; i += 1) {
        if (i !== shuffled.length - 1) {
            console.log(`${shuffled[i]}=> ${shuffled[i + 1]}`);
            await assignTarget(shuffled[i], shuffled[i + 1]);
        } else {
            console.log(`${shuffled[i]}=> ${shuffled[0]}`);
            await assignTarget(shuffled[i], shuffled[0]);
        }
    }
}

async function getEmailsInArray() {

    let emails = [];
    let x = await session.run('match (s:Student) WHERE COALESCE(s.IsPlaying, true) return s.Email as email');

    await x.records.forEach((record) => {
        emails.push(record.get('email'));
    });
    return emails;
}

async function assignTarget(assassin, target) {
    await session.run(`MATCH (a:Student),(b:Student) WHERE a.Email = $assassin AND b.Email = $target CREATE (a)-[r:TARGET {killed:false,confirmed:false}]->(b) RETURN r`,
        {
            target,
            assassin
        });

}


main();

