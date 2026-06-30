"use server";

import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/types";

interface SimpleAPICredentials {
  rutEmpresa: string;
  rutCertificado: string;
  passwordCertificado: string;
  ambiente: number; // 0 = Certificacion, 1 = Produccion
  mes: string; // "01"-"12"
  anio: string; // "YYYY"
  forceSimulation: boolean;
}

export interface SimpleAPIResponse {
  success: boolean;
  isMock: boolean;
  message?: string;
  apiResponse?: {
    ventas?: any;
    compras?: any;
  };
}

/**
 * Server Action para consultar el Registro de Compras y Ventas (RCV) en Simple API.
 * Si se solicita simulación o las credenciales no corresponden a producción real,
 * se genera un JSON de respuesta dinámico mapeando las transacciones locales del usuario.
 */
export async function fetchRCVData(params: SimpleAPICredentials): Promise<SimpleAPIResponse> {
  const { rutEmpresa, rutCertificado, passwordCertificado, ambiente, mes, anio, forceSimulation } = params;
  
  const apiKey = process.env.SIMPLE_API_KEY || "";
  
  // Obtener usuario autenticado en la sesión actual
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1) Si se fuerza la simulación, no hay API Key, o son credenciales de prueba, generamos los datos de forma dinámica
  if (
    forceSimulation || 
    !apiKey || 
    rutEmpresa === "78.181.331-1" || 
    passwordCertificado === "*****" ||
    !user
  ) {
    const userId = user?.id || "";
    return getDynamicMockData(userId, rutEmpresa, mes, anio);
  }

  try {
    const cleanRutEmpresa = rutEmpresa.replace(/\./g, "").replace(/-/g, "");
    const cleanRutCertificado = rutCertificado.replace(/\./g, "").replace(/-/g, "");
    
    // Preparar el cuerpo form-data según la especificación de Simple API
    const formDataVentas = new FormData();
    formDataVentas.append("input", JSON.stringify({
      RutCertificado: cleanRutCertificado,
      RutEmpresa: cleanRutEmpresa,
      Ambiente: Number(ambiente),
      Password: passwordCertificado
    }));

    const formDataCompras = new FormData();
    formDataCompras.append("input", JSON.stringify({
      RutCertificado: cleanRutCertificado,
      RutEmpresa: cleanRutEmpresa,
      Ambiente: Number(ambiente),
      Password: passwordCertificado
    }));

    // Realizar consultas en paralelo a los endpoints reales de Simple API
    const [ventasRes, comprasRes] = await Promise.all([
      fetch(`https://servicios.simpleapi.cl/api/RCV/ventas/${mes}/${anio}`, {
        method: "POST",
        headers: {
          "Authorization": apiKey
        },
        body: formDataVentas
      }),
      fetch(`https://servicios.simpleapi.cl/api/RCV/compras/${mes}/${anio}`, {
        method: "POST",
        headers: {
          "Authorization": apiKey
        },
        body: formDataCompras
      })
    ]);

    let ventasData = null;
    let comprasData = null;
    let errorMsg = "";

    if (ventasRes.ok) {
      ventasData = await ventasRes.json();
    } else {
      const txt = await ventasRes.text();
      errorMsg += `Error Ventas: ${ventasRes.statusText} (${txt}). `;
    }

    if (comprasRes.ok) {
      comprasData = await comprasRes.json();
    } else {
      const txt = await comprasRes.text();
      errorMsg += `Error Compras: ${comprasRes.statusText} (${txt}). `;
    }

    // Si ambos fallaron
    if (!ventasData && !comprasData) {
      return {
        success: false,
        isMock: true,
        message: `La API real falló (${errorMsg.trim()}). Cargando simulación dinámica basada en tus transacciones locales.`,
        apiResponse: (await getDynamicMockData(user.id, rutEmpresa, mes, anio)).apiResponse
      };
    }

    return {
      success: true,
      isMock: false,
      apiResponse: {
        ventas: ventasData,
        compras: comprasData
      }
    };
  } catch (error: any) {
    return {
      success: false,
      isMock: true,
      message: `Error de conexión con Simple API: ${error.message || error}. Cargando simulación dinámica basada en tus transacciones locales.`,
      apiResponse: (await getDynamicMockData(user.id, rutEmpresa, mes, anio)).apiResponse
    };
  }
}

/**
 * Genera datos de RCV de forma dinámica basándose en las transacciones que el usuario
 * tiene guardadas en la base de datos para el período seleccionado.
 */
async function getDynamicMockData(userId: string, rutEmpresa: string, mes: string, anio: string): Promise<SimpleAPIResponse> {
  const supabase = await createClient();
  
  const mesNum = parseInt(mes, 10);
  const anioNum = parseInt(anio, 10);
  
  // Calcular límites de fecha del mes para la consulta
  const rangeStart = `${anio}-${mes}-01`;
  const nextMonth = mesNum === 12 ? 1 : mesNum + 1;
  const nextYear = mesNum === 12 ? anioNum + 1 : anioNum;
  const rangeEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  // Consultar transacciones locales del usuario para este periodo
  let localRows: Transaction[] = [];
  if (userId) {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", rangeStart)
      .lt("occurred_at", rangeEnd)
      .order("occurred_at", { ascending: true })
      .returns<Transaction[]>();
    
    localRows = data ?? [];
  }

  // Agrupar Ventas (Ingresos)
  const ventasLocales = localRows.filter(t => t.type === "income");
  
  const vFacturas = ventasLocales.filter(t => t.category === "Ventas");
  const vBoletas = ventasLocales.filter(t => t.category === "Servicios");
  const vExentas = ventasLocales.filter(t => t.category === "Otros ingresos");

  // Agrupar Compras (Egresos)
  const comprasLocales = localRows.filter(t => t.type === "expense");
  
  // Consideramos compras afectas a las categorías Insumos o Marketing
  const cAfectas = comprasLocales.filter(t => t.category === "Insumos" || t.category === "Marketing");
  
  // Simulamos Notas de Crédito (DTE 61) si la descripción contiene "descuento" o "anulacion"
  const cNotasCredito = cAfectas.filter(t => 
    t.description?.toLowerCase().includes("descuento") || 
    t.description?.toLowerCase().includes("anulaci") ||
    t.description?.toLowerCase().includes("nota de cr")
  );
  
  // Las facturas de compras normales serán las que no se clasificaron como notas de crédito
  const cFacturas = cAfectas.filter(t => !cNotasCredito.includes(t));

  // --- CONSTRUIR VENTAS RESUMEN & DETALLE ---
  const ventasResumenes: any[] = [];
  const ventasDetalle: any[] = [];

  if (vFacturas.length > 0) {
    const total = vFacturas.reduce((sum, t) => sum + t.amount, 0);
    const net = total / 1.19;
    const tax = total - net;
    
    ventasResumenes.push({
      tipoDte: 33,
      tipoDteString: "Factura Electrónica Afecta",
      cantidad: vFacturas.length,
      montoNeto: Math.round(net),
      montoIva: Math.round(tax),
      montoTotal: Math.round(total)
    });

    vFacturas.forEach((t, idx) => {
      const tNet = t.amount / 1.19;
      const tTax = t.amount - tNet;
      ventasDetalle.push({
        folio: 100 + idx,
        fechaDoc: t.occurred_at,
        rutReceptor: "76.122.394-5",
        razonSocial: t.description || "Cliente Factura SpA",
        montoNeto: Math.round(tNet),
        montoIva: Math.round(tTax),
        montoTotal: Math.round(t.amount),
        tipoDte: 33
      });
    });
  }

  if (vBoletas.length > 0) {
    const total = vBoletas.reduce((sum, t) => sum + t.amount, 0);
    const net = total / 1.19;
    const tax = total - net;

    ventasResumenes.push({
      tipoDte: 39,
      tipoDteString: "Boleta Electrónica de Ventas y Servicios",
      cantidad: vBoletas.length,
      montoNeto: Math.round(net),
      montoIva: Math.round(tax),
      montoTotal: Math.round(total)
    });

    // Mapeamos boletas en detalle (típicamente se consolidan por día, aquí individual)
    vBoletas.forEach((t, idx) => {
      const tNet = t.amount / 1.19;
      const tTax = t.amount - tNet;
      ventasDetalle.push({
        folio: 500 + idx,
        fechaDoc: t.occurred_at,
        rutReceptor: "66.666.666-6",
        razonSocial: "Consumidor Final (Boletas)",
        montoNeto: Math.round(tNet),
        montoIva: Math.round(tTax),
        montoTotal: Math.round(t.amount),
        tipoDte: 39
      });
    });
  }

  if (vExentas.length > 0) {
    const total = vExentas.reduce((sum, t) => sum + t.amount, 0);

    ventasResumenes.push({
      tipoDte: 34,
      tipoDteString: "Factura Electrónica Exenta",
      cantidad: vExentas.length,
      montoNeto: Math.round(total),
      montoIva: 0,
      montoTotal: Math.round(total)
    });

    vExentas.forEach((t, idx) => {
      ventasDetalle.push({
        folio: 80 + idx,
        fechaDoc: t.occurred_at,
        rutReceptor: "77.491.054-2",
        razonSocial: t.description || "Cliente Exento Internacional",
        montoNeto: Math.round(t.amount),
        montoIva: 0,
        montoTotal: Math.round(t.amount),
        tipoDte: 34
      });
    });
  }

  // --- CONSTRUIR COMPRAS RESUMEN & DETALLE ---
  const comprasResumenes: any[] = [];
  const comprasDetalle: any[] = [];

  if (cFacturas.length > 0) {
    const total = cFacturas.reduce((sum, t) => sum + t.amount, 0);
    const net = total / 1.19;
    const tax = total - net;

    comprasResumenes.push({
      tipoDte: 33,
      tipoDteString: "Factura Electrónica Afecta Proveedores",
      cantidad: cFacturas.length,
      montoNeto: Math.round(net),
      montoIva: Math.round(tax),
      montoTotal: Math.round(total)
    });

    cFacturas.forEach((t, idx) => {
      const tNet = t.amount / 1.19;
      const tTax = t.amount - tNet;
      comprasDetalle.push({
        folio: 8400 + idx,
        fechaDoc: t.occurred_at,
        rutEmisor: "76.001.222-1",
        razonSocial: t.description || "Proveedor Insumos S.A.",
        montoNeto: Math.round(tNet),
        montoIva: Math.round(tTax),
        montoTotal: Math.round(t.amount),
        tipoDte: 33
      });
    });
  }

  if (cNotasCredito.length > 0) {
    const total = cNotasCredito.reduce((sum, t) => sum + t.amount, 0);
    const net = total / 1.19;
    const tax = total - net;

    // Las Notas de Crédito recibidas reducen el IVA Crédito Fiscal,
    // por lo que se declaran en montos negativos en el resumen del SII.
    comprasResumenes.push({
      tipoDte: 61,
      tipoDteString: "Nota de Crédito Electrónica Recibida",
      cantidad: cNotasCredito.length,
      montoNeto: -Math.round(net),
      montoIva: -Math.round(tax),
      montoTotal: -Math.round(total)
    });

    cNotasCredito.forEach((t, idx) => {
      const tNet = t.amount / 1.19;
      const tTax = t.amount - tNet;
      comprasDetalle.push({
        folio: 900 + idx,
        fechaDoc: t.occurred_at,
        rutEmisor: "76.001.222-1",
        razonSocial: t.description || "Proveedor Descuento/Anulación",
        montoNeto: -Math.round(tNet),
        montoIva: -Math.round(tTax),
        montoTotal: -Math.round(t.amount),
        tipoDte: 61
      });
    });
  }

  const mesesNombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const mesIdx = mesNum - 1;
  const nombreMes = mesesNombres[mesIdx] || "Mes";

  const mockVentas = {
    caratula: {
      rutEmpresa: rutEmpresa || "78.181.331-1",
      nombreMes: nombreMes,
      mes: mesNum,
      anio: anioNum,
      dia: null,
      periodo: `${anio}${mes}`
    },
    compras: {
      resumenes: [],
      detalleCompras: []
    },
    ventas: {
      resumenes: ventasResumenes,
      detalleVentas: ventasDetalle
    }
  };

  const mockCompras = {
    caratula: {
      rutEmpresa: rutEmpresa || "78.181.331-1",
      nombreMes: nombreMes,
      mes: mesNum,
      anio: anioNum,
      dia: null,
      periodo: `${anio}${mes}`
    },
    compras: {
      resumenes: comprasResumenes,
      detalleCompras: comprasDetalle
    },
    ventas: {
      resumenes: [],
      detalleVentas: []
    }
  };

  return {
    success: true,
    isMock: true,
    message: "Simulación dinámica completada. Mapeando tus transacciones locales al formato RCV de Simple API.",
    apiResponse: {
      ventas: mockVentas,
      compras: mockCompras
    }
  };
}
