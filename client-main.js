let battery = 100

const fleecaZones = [
    vector3(150.26, -1040.2, 29.37),
    vector3(313.5, -278.8, 54.17),
    vector3(-2962.6, 482.1, 15.7)
]

const deadZones = [
    vector3(-1095.0, -836.0, 4.8) // exemplo zona sem sinal
]

function nearZone(coords, zones, dist = 50.0) {
    return zones.some(z => #(coords - z) < dist)
}

RegisterCommand('tablet', () => {
    if (battery <= 0) {
        lib.notify({type:'error', description:'Tablet sem bateria'})
        return
    }

    SetNuiFocus(true, true)
    SendNUIMessage({action:"boot"})
})

RegisterNUICallback('inject', (data, cb) => {
    const ped = PlayerPedId()
    const coords = GetEntityCoords(ped)

    if (!nearZone(coords, fleecaZones)) {
        lib.notify({type:'error', description:'Você precisa estar perto de um banco'})
        return
    }

    let signal = !nearZone(coords, deadZones)

    battery -= 15
    emitNet('darkwash:server:inject', parseInt(data.amount), signal)

    cb('ok')
})

onNet('darkwash:client:result', (result, value) => {
    SendNUIMessage({
        action:"result",
        result,
        value
    })
})

onNet('darkwash:client:dispatch', () => {
    exports['ps-dispatch']:SuspiciousActivity({
        coords: GetEntityCoords(PlayerPedId()),
        message: "Atividade financeira suspeita",
        dispatchCode: "10-90"
    })
})

onNet('darkwash:client:trace', () => {
    SendNUIMessage({action:"trace"})
})
