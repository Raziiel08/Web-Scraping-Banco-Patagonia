const puppeteer = require('puppeteer');
const fs = require('fs');

// URL principal del portal de beneficios
const URL_BASE = 'https://ahorrosybeneficios.bancopatagonia.com.ar/ahorrosybeneficios/';

(async () => {
  // Iniciar navegador
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Simular navegador real
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Crear carpeta data si no existe
  if (!fs.existsSync('./data')) fs.mkdirSync('./data');

  await page.goto(URL_BASE, {
    waitUntil: 'networkidle2', 
    timeout: 60000
  });

  await new Promise(r => setTimeout(r, 3000));

  // Obtener links únicos de promociones
  const linksPromos = await page.evaluate(() => {

    const anchors = Array.from(document.querySelectorAll('a'));

    const links = anchors
      .map(a => a.href)
      .filter(href =>
        href.includes('/ahorrosybeneficios/') &&
        href.endsWith('.html') &&
        !href.includes('farmacias') &&
        !href.includes('indumentaria') &&
        !href.includes('librerias') &&
        !href.includes('shopping') &&
        !href.includes('combustibles') &&
        !href.includes('peluqueria') &&
        !href.includes('supermercados') &&
        !href.includes('mascota') &&
        !href.includes('espectaculos') &&
        !href.includes('rio-negro') &&
        !href.includes('invierno') &&
        !href.includes('modo.html') &&
        !href.includes('servicios') &&
        !href.includes('mundial') &&
        !href.includes('turismo') &&
        !href.includes('educacion') &&
        !href.includes('hogar') &&
        !href.includes('gastronomia') &&
        !href.includes('automotor') &&
        !href.includes('patagonia-sale') &&
        !href.includes('privacy') &&
        !href.includes('contact') &&
        !href.includes('catalogsearch') &&
        !href.includes('customer') &&
        !href.includes('checkout') &&
        !href.includes('inicio-')
      );

    // Eliminar duplicados
    return [...new Set(links)];
  });


  const todasLasPromos = [];

  // Recorrer cada promoción
  for (let i = 0; i < linksPromos.length; i++) {

    const url = linksPromos[i];

    console.log(`\n[${i + 1}/${linksPromos.length}]`);

    try {

      // Entrar a la página de la promoción
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000
      });

      await page.waitForSelector('.block-info-detalles', {
        timeout: 10000
      }).catch(() => {});

      await new Promise(r => setTimeout(r, 1500));

      // Extraer información de la promoción
      const promo = await page.evaluate((urlActual) => {

        const nombre =
          document.querySelector('.block-info-detalles .name')
          ?.innerText?.trim() ?? null;

        const dias =
          document.querySelector('.block-info-detalles .dias')
          ?.innerText?.trim() ?? null;

        const vigencia =
          document.querySelector('.block-info-detalles .vigencia')
          ?.innerText?.trim() ?? null;

        const imagen =
          document.querySelector('.gallery-placeholder__image')
          ?.src ?? null;

        const sku =
          document.querySelector('.product.attribute.sku .value')
          ?.innerText?.trim() ?? null;

        const condiciones =
          document.querySelector('#popup-modal')
          ?.innerText?.trim() ?? null;

        const url_promo = urlActual;

        // Obtener categorías
        const catImgs = Array.from(
          document.querySelectorAll('.product-categories img')
        );

        const categorias = [
          ...new Set(
            catImgs
              .map(img => img.getAttribute('alt'))
              .filter(Boolean)
          )
        ].join(', ') || null;

        // Extraer segmentos dinámicamente
        const segmentos = [];

        const bloques = Array.from(
          document.querySelectorAll('.list-benef')
        );

        for (const bloque of bloques) {

          // Cuando alguno de los bloques tienen más de un segmento
          const nombres = Array.from(
            bloque.querySelectorAll('[class*="misc-"]')
          )
          .map(el => el.innerText.trim())
          .filter(Boolean);

          const porcentaje =
            bloque.querySelector('.list-benef-price-percentage')
            ?.innerText
            ?.replace('%', '')
            ?.trim() ?? null;

          const tope =
            bloque.querySelector('[data-th="Tope"]')
            ?.innerText?.trim() ?? null;

          const medios_pago = Array.from(
            bloque.querySelectorAll('.add-cards img')
          )
          .map(img => img.getAttribute('title'))
          .filter(Boolean);

          segmentos.push({
            segmentos: nombres,
            porcentaje,
            tope,
            medios_pago
          });
        }

        // Objeto final
        return {
          nombre,
          dias,
          vigencia,
          categorias,
          imagen,
          codigo: sku,
          condiciones,
          url_promo,
          segmentos
        };

      }, url);

      console.log(`OK - ${promo.nombre}`);

      todasLasPromos.push(promo);

    } catch (err) {

      console.log(`Error en ${url}: ${err.message}`);

      // Guardar error sin detener el scraper
      todasLasPromos.push({
        url_promo: url,
        error: err.message
      });
    }

    // Pausa entre requests
    await new Promise(r => setTimeout(r, 1000));
  }

  // Guardar resultado final
  fs.writeFileSync(
    './data/promociones.json',
    JSON.stringify(todasLasPromos, null, 2),
    'utf-8'
  );

  console.log(`\n${todasLasPromos.length} promociones guardadas`);

  await browser.close();

  console.log('Scraping finalizado.');

})();