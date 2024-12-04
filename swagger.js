const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger_output.json'; // File di output della documentazione
const endpointsFiles = ['./server.js']; // File che contiene le rotte (puoi aggiungere più file)

// Configurazione di base
const doc = {
    info: {
        title: 'API Documentation',
        description: 'Descrizione della tua API',
    },
    host: 'localhost:8080', // Modifica con il tuo host
    schemes: ['http'], // Usa https se necessario
};

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log('Documentazione Swagger generata!');
});
