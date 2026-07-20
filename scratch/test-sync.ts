import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();

async function runTest() {
  console.log('--- TEST: Simulación de Sincronización de Peticiones ---');
  
  const userA_id = uuidv4();
  const userB_id = uuidv4();
  const requestId = uuidv4();

  console.log(`User A (Creador): ${userA_id}`);
  console.log(`User B (Lector): ${userB_id}`);
  console.log(`Request ID: ${requestId}`);

  // 1. User A encola la petición y SyncQueue llama al POST /api/prayer-requests
  console.log('\n1. User A envía petición (POST /api/prayer-requests)...');
  
  try {
    const postRes = await fetch('http://127.0.0.1:3000/api/prayer-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: requestId,
        userId: userA_id,
        message: 'Por favor oren por mi nuevo trabajo',
        name: 'User',
        lastName: 'A'
      })
    });

    const postData = await postRes.json();
    console.log('Respuesta POST:', postRes.status, postData);

    if (postRes.status !== 200) {
      console.error('Error al crear la petición.');
      return;
    }

    // 2. User B hace pull (GET /api/prayer-requests?scope=community&userId={userB})
    console.log('\n2. User B solicita peticiones comunitarias (GET /api/prayer-requests?scope=community)...');
    const getRes = await fetch(`http://127.0.0.1:3000/api/prayer-requests?scope=community&userId=${userB_id}`);
    
    const getData = await getRes.json();
    console.log('Respuesta GET Status:', getRes.status);
    
    if (getRes.status === 200) {
      console.log('Resumen devuelto:', getData.summary);
      
      const found = getData.pending?.find((p: any) => p.id === requestId);
      if (found) {
        console.log('\n✅ ÉXITO: La petición de User A llegó a User B correctamente.');
        console.log('Detalle:', found);
      } else {
        console.log('\n❌ ERROR: La petición no llegó a User B.');
        console.log('Peticiones devueltas:', getData.pending);
      }
    } else {
      console.log('Error GET:', getData);
    }
  } catch (err) {
    console.error('Error de conexión:', err);
    console.log('Asegúrate de que el servidor de desarrollo esté corriendo en el puerto 3000.');
  }
}

runTest().catch(console.error);
