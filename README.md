# Scraper de promociones de Banco Patagonia

EL trabajo utiliza Puppeteer para recorrer automáticamente el portal de beneficios de Banco Patagonia y extraer información de todas las promociones disponibles.

El scraper obtiene:

- Nombre del comercio
- Días de vigencia de la promoción
- Fecha de vigencia
- Categorías
- Imagen principal
- Código/SKU
- Términos y condiciones
- URL de la promoción
- Segmentos de beneficios
  - Tipo de tarjeta
  - Porcentaje de descuento
  - Tope de reintegro
  - Medios de pago aceptados

La información se guarda automáticamente en un archivo JSON.

# Requisitos
- Node.js instalado
- Ejecutar: 'npm install'

## Uso
1. `node index.js`
2. El resultado estará en `/data/promociones.json`

# Tecnologías utilizadas
- Node.js
- Puppeteer
- JavaScript

# Problemas encontrados durante el desarrollo

- Algunas páginas tardaban demasiado en cargar y generaban errores de timeout al usar `networkidle2`.  
Se arreglo utilizando `domcontentloaded` y esperando únicamente los elementos necesarios para el scraping.

- La estructura HTML de las promociones no siempre era igual.  
En ciertos casos, múltiples segmentos de beneficios (por ejemplo `CLASICA` y `PLUS`) aparecían dentro del mismo bloque HTML, lo que hacía que el scraper no los detectara correctamente.

- Inicialmente el código buscaba segmentos usando clases fijas como:

js
.list-benef1
.list-benef2
.list-benef3
