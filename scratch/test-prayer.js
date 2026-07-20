import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const baseUrl = 'http://localhost:3000/api/prayer-requests';

async function runTests() {
  let passed = 0;
  let failed = 0;
  const results = [];

  const logResult = (name, expected, actual, success) => {
    results.push({ name, expected, actual, success });
    if (success) passed++;
    else failed++;
    console.log(`${success ? '✅' : '❌'} ${name} (Obtenido: ${actual})`);
  };

  const userA = uuidv4();
  const userB = uuidv4();

  // Test 1: Crear 5 peticiones
  let lastReqId = null;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userA, message: `Petición ${i+1}` })
    });
    const data = await res.json();
    if (i === 4) lastReqId = data.id;
  }
  
  // Test 2: Intentar orar dos veces (idempotency by SAME interactionId)
  const sameInteraction = uuidv4();
  await fetch(`${baseUrl}/${lastReqId}/pray`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userB, interactionId: sameInteraction })
  });
  let prayRes2 = await fetch(`${baseUrl}/${lastReqId}/pray`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userB, interactionId: sameInteraction })
  });
  let prayData2 = await prayRes2.json();
  logResult('Orar con mismo interactionId (Idempotencia Offline-first)', 'success: true', `success: ${prayData2.success}`, prayData2.success === true);

  // Test 3: Intentar orar dos veces (diferente interactionId, mismo user, simulando doble click UI)
  let prayRes3 = await fetch(`${baseUrl}/${lastReqId}/pray`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userB, interactionId: uuidv4() })
  });
  let prayData3 = await prayRes3.json();
  logResult('Orar dos veces mismo user (Doble click UI)', 'alreadyPrayed: true', `alreadyPrayed: ${prayData3.alreadyPrayed}`, prayData3.alreadyPrayed === true);

  // Test 4: Unirse
  let joinRes = await fetch(`${baseUrl}/${lastReqId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userB, interactionId: uuidv4() })
  });
  let joinData = await joinRes.json();
  logResult('Unirse a petición', 'success: true', `success: ${joinData.success}`, joinData.success === true);

  // Test 5: Cancelar petición ajena (debería fallar)
  let cancelFailRes = await fetch(`${baseUrl}/${lastReqId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userB })
  });
  logResult('Cancelar petición ajena', 403, cancelFailRes.status, cancelFailRes.status === 403);

  // Test 6: Cancelar petición propia
  let cancelRes = await fetch(`${baseUrl}/${lastReqId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userA })
  });
  let cancelData = await cancelRes.json();
  logResult('Cancelar petición propia', 'success: true', `success: ${cancelData.success}`, cancelData.success === true);

  // Test 7: Interaccionar con petición cancelada
  let prayFailRes = await fetch(`${baseUrl}/${lastReqId}/pray`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: uuidv4(), interactionId: uuidv4() })
  });
  logResult('Interaccionar con cancelada', 410, prayFailRes.status, prayFailRes.status === 410);

  // Test 8: Obtener comunidad, validar no exposición de datos privados
  let getRes = await fetch(`${baseUrl}?scope=community&userId=${uuidv4()}`);
  let getBody = await getRes.text();
  let hasEmail = getBody.includes('@local.kadosh');
  let hasLastName = getBody.includes('lastName');
  logResult('Privacidad (no email/lastName)', 'false', `${hasEmail || hasLastName}`, !hasEmail && !hasLastName);

  console.log('\n--- Resumen ---');
  console.log(`Pasaron: ${passed}, Fallaron: ${failed}`);
}

runTests();
