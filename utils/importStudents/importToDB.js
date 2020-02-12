const fs = require('fs');
const neodb = require('../../neodb');
if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' LIST_OF_EMAILS');
    process.exit(1);
}
const filename = process.argv[2];

async function main() {
    let driver = await neodb.createSession();
    let x =  fs.readFileSync(filename, 'utf8');
    const lines = x.split("\n");
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let session = neodb.getSession();
        let email = line.replace(/(\r\n|\n|\r)/gm, "").toLowerCase();
        let name_first = ucfirst(email.split(".")[0]);
        let name_last = ucfirst(email.split("@").shift().split('.').splice(1).join(' '));
        await session.run('CREATE (s:Student { Email: $Email, FirstName: $FirstName, LastName: $LastName, IsDead:false, IsPlaying:true, Balance:0, HidePhoto:false })',
            {
                Email: email,
                FirstName: name_first,
                LastName: name_last
            });
        console.log(++count + " Students imported");
        await session.close();
    }
}

main();

function ucfirst(str) {
    str = str.toLowerCase();
    str = str.charAt(0).toUpperCase() + str.substr(1, str.length);
    return str;
}
