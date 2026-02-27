const fs = require('fs')
const QBCore = exports['qb-core'].GetCoreObject()

const LOG_FILE = './data/logs.json'
const SKILL_FILE = './data/skills.json'

if (!fs.existsSync('./data')) fs.mkdirSync('./data')
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '[]')
if (!fs.existsSync(SKILL_FILE)) fs.writeFileSync(SKILL_FILE, '{}')

function getSkills() {
    return JSON.parse(fs.readFileSync(SKILL_FILE))
}

function saveSkills(data) {
    fs.writeFileSync(SKILL_FILE, JSON.stringify(data, null, 2))
}

function addLog(entry) {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE))
    logs.push(entry)
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2))
}

onNet('darkwash:server:inject', (amount, zoneSignal) => {
    const src = source
    const Player = QBCore.Functions.GetPlayer(src)
    if (!Player) return

    const identifier = Player.PlayerData.license
    const skills = getSkills()

    if (!skills[identifier]) {
        skills[identifier] = { level: 1, xp: 0 }
    }

    let level = skills[identifier].level

    const dirty = Player.Functions.GetItemByName('markedbills')
    if (!dirty || dirty.amount < amount) {
        emitNet('ox_lib:notify', src, {type:'error', description:'Dinheiro sujo insuficiente'})
        return
    }

    if (!zoneSignal) {
        emitNet('darkwash:client:trace', src)
        return
    }

    Player.Functions.RemoveItem('markedbills', amount)

    let successChance = 40 + (level * 5)
    let policeChance = 15 - (level * 2)

    let roll = Math.random() * 100
    let converted = 0
    let result = "fail"
    let traced = false

    if (roll <= successChance) {
        converted = Math.floor(amount * 0.75)
        Player.Functions.AddMoney('bank', converted)
        result = "success"
    } else if (roll <= successChance + 20) {
        converted = Math.floor(amount * 0.4)
        Player.Functions.AddMoney('bank', converted)
        result = "partial"
    }

    if (Math.random() * 100 <= policeChance) {
        traced = true
        emitNet('darkwash:client:dispatch', src)
    }

    skills[identifier].xp += 20
    if (skills[identifier].xp >= 200) {
        skills[identifier].level++
        skills[identifier].xp = 0
    }

    saveSkills(skills)

    addLog({
        identifier,
        amount,
        converted,
        result,
        traced,
        timestamp: new Date().toISOString()
    })

    emitNet('darkwash:client:result', src, result, converted)
})
