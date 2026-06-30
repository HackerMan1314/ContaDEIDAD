"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Send, 
  Sliders, 
  HelpCircle, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  FileCheck2, 
  ArrowRight,
  TrendingUp,
  Printer,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchRCVData, type SimpleAPIResponse } from "@/lib/actions/simpleapi";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";

interface ReportesClientProps {
  initialTransactions: Transaction[];
  selectedMonth: string;
  userEmail: string;
}

interface F29Row {
  concept: string;
  code: string;
  docs: number;
  net: number;
  tax: number;
  total: number;
  description: string;
  tip: string;
}

export function ReportesClient({ initialTransactions, selectedMonth, userEmail }: ReportesClientProps) {
  // Configs
  const [ppmRate, setPpmRate] = useState<number>(1.0); // 1.0% by default
  const [activeCodeHelp, setActiveCodeHelp] = useState<string>("538");
  
  // API credentials forms
  const [rutEmpresa, setRutEmpresa] = useState("78.181.331-1");
  const [rutCertificado, setRutCertificado] = useState("18.076.720-7");
  const [passwordCertificado, setPasswordCertificado] = useState("*****");
  const [ambiente, setAmbiente] = useState<number>(0); // 0 = Certificación
  const [forceSimulation, setForceSimulation] = useState(true);
  
  // Show/hide API Credentials panel
  const [showConfig, setShowConfig] = useState(false);
  
  // States for query results
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<SimpleAPIResponse | null>(null);
  
  // Declaration receipt modal states
  const [isDeclarationModalOpen, setIsDeclarationModalOpen] = useState(false);
  const [declaredFolio, setDeclaredFolio] = useState<number>(0);
  const [declarationDate, setDeclarationDate] = useState<string>("");

  // ----------------------------------------------------
  // AUTOMATIC QUERY ON MONTH CHANGE
  // ----------------------------------------------------
  useEffect(() => {
    async function autoLoad() {
      setApiLoading(true);
      const [year, month] = selectedMonth.split("-");
      const res = await fetchRCVData({
        rutEmpresa,
        rutCertificado,
        passwordCertificado,
        ambiente,
        mes: month,
        anio: year,
        forceSimulation
      });
      setApiResult(res);
      setApiLoading(false);
    }
    autoLoad();
  }, [selectedMonth, forceSimulation]); // Trigger when selectedMonth changes or forceSimulation changes

  const handleQueryAPI = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiLoading(true);
    const [year, month] = selectedMonth.split("-");
    const res = await fetchRCVData({
      rutEmpresa,
      rutCertificado,
      passwordCertificado,
      ambiente,
      mes: month,
      anio: year,
      forceSimulation
    });
    setApiResult(res);
    setApiLoading(false);
  };

  // ----------------------------------------------------
  // CALCULATE F29 CODES FROM SII API RESPONSE
  // ----------------------------------------------------
  const apiVentasResumenes = apiResult?.apiResponse?.ventas?.ventas?.resumenes || [];
  const apiComprasResumenes = apiResult?.apiResponse?.compras?.compras?.resumenes || [];

  const apiDte33Ventas = apiVentasResumenes.find((r: any) => r.tipoDte === 33) || { cantidad: 0, montoNeto: 0, montoIva: 0, montoTotal: 0 };
  const apiDte39Ventas = apiVentasResumenes.find((r: any) => r.tipoDte === 39) || { cantidad: 0, montoNeto: 0, montoIva: 0, montoTotal: 0 };
  const apiDte34Ventas = apiVentasResumenes.find((r: any) => r.tipoDte === 34) || { cantidad: 0, montoNeto: 0, montoIva: 0, montoTotal: 0 };

  const apiDte33Compras = apiComprasResumenes.find((r: any) => r.tipoDte === 33) || { cantidad: 0, montoNeto: 0, montoIva: 0, montoTotal: 0 };
  const apiDte61Compras = apiComprasResumenes.find((r: any) => r.tipoDte === 61) || { cantidad: 0, montoNeto: 0, montoIva: 0, montoTotal: 0 };

  const apiTotalDebito = apiDte33Ventas.montoIva + apiDte39Ventas.montoIva;
  const apiTotalCredito = apiDte33Compras.montoIva + apiDte61Compras.montoIva; // credit notes in negative

  const apiBasePpm = apiDte33Ventas.montoNeto + apiDte39Ventas.montoNeto;
  const apiPpmDeterminado = apiBasePpm * (ppmRate / 100);
  
  // Honorarios (BHE) simulated from local transactions mapping:
  const localHonorarios = initialTransactions.filter(t => t.type === "expense" && (t.category === "Transporte" || t.category === "Servicios"));
  const localHonorariosNetoPagado = localHonorarios.reduce((sum, t) => sum + t.amount, 0);
  const apiHonorariosBruto = localHonorariosNetoPagado / (1 - 0.1525);
  const apiHonorariosRetencion = apiHonorariosBruto * 0.1525;

  const apiIvaNeto = Math.max(0, apiTotalDebito - apiTotalCredito);
  const apiRemanente = Math.max(0, apiTotalCredito - apiTotalDebito);
  const apiTotalAPagar = apiIvaNeto + apiPpmDeterminado + apiHonorariosRetencion;

  // Rows configuration
  const ventasFacturasRow: F29Row = {
    concept: "Facturas Emitidas Afectas (DTE 33)",
    code: "502 / 504",
    docs: apiDte33Ventas.cantidad,
    net: apiDte33Ventas.montoNeto,
    tax: apiDte33Ventas.montoIva,
    total: apiDte33Ventas.montoTotal,
    description: "Declaración de ventas amparadas por facturas electrónicas afectas a IVA del 19%.",
    tip: "Cod 502 registra la base neta imponible de tus facturas. Cod 504 registra el IVA cobrado (Débito Fiscal) por tus facturas."
  };

  const ventasBoletasRow: F29Row = {
    concept: "Boletas de Ventas y Servicios (DTE 39)",
    code: "709 / 710",
    docs: apiDte39Ventas.cantidad,
    net: apiDte39Ventas.montoNeto,
    tax: apiDte39Ventas.montoIva,
    total: apiDte39Ventas.montoTotal,
    description: "Declaración de ventas directas a consumidores finales (sin factura) mediante boletas de ventas afectas.",
    tip: "Cod 709 es el monto neto de las boletas. Cod 710 es el IVA acumulado en tus boletas mensuales."
  };

  const ventasExentasRow: F29Row = {
    concept: "Ventas y Servicios Exentos o No Afectos",
    code: "142",
    docs: apiDte34Ventas.cantidad,
    net: apiDte34Ventas.montoNeto,
    tax: 0,
    total: apiDte34Ventas.montoTotal,
    description: "Ventas de productos o servicios que por ley no pagan IVA (ej. capacitación, servicios médicos o exportaciones).",
    tip: "Cod 142 registra el monto de tus ventas exentas. No genera IVA, pero suma a tu base de PPM y tus ingresos anuales."
  };

  const comprasFacturasRow: F29Row = {
    concept: "Facturas de Compras Recibidas (DTE 33)",
    code: "520 / 521",
    docs: apiDte33Compras.cantidad,
    net: apiDte33Compras.montoNeto,
    tax: apiDte33Compras.montoIva,
    total: apiDte33Compras.montoTotal,
    description: "IVA Crédito Fiscal originado de tus compras a proveedores con facturas afectas.",
    tip: "Cod 520 registra el neto de tus compras. Cod 521 registra el IVA pagado (Crédito Fiscal), el cual se resta de tus impuestos a pagar."
  };

  const comprasNotasCreditoRow: F29Row = {
    concept: "Notas de Crédito Recibidas (DTE 61)",
    code: "528 / 529",
    docs: apiDte61Compras.cantidad,
    net: apiDte61Compras.montoNeto,
    tax: apiDte61Compras.montoIva,
    total: apiDte61Compras.montoTotal,
    description: "Descuentos, devoluciones o anulaciones hechas por tus proveedores. Resta saldo de tu Crédito Fiscal.",
    tip: "Cod 528 registra el neto y el Cod 529 el IVA devuelto en notas de crédito. Tienen signo negativo ya que reducen tus deducciones."
  };

  const honorariosRow: F29Row = {
    concept: "Retención de Honorarios (Boleta Honorarios BHE)",
    code: "151 / 153",
    docs: localHonorarios.length,
    net: apiHonorariosBruto,
    tax: apiHonorariosRetencion,
    total: localHonorariosNetoPagado,
    description: "Retención de impuesto por boletas de honorarios de profesionales subcontratados (15.25% en 2026).",
    tip: "El emisor emite la boleta, pero tú eres responsable de declarar y pagar la retención al SII en el Cod 153."
  };

  // SII Glossary codes
  const glossaryDetails: Record<string, { title: string; subtitle: string; body: string; formula?: string }> = {
    "538": {
      title: "Total Débito Fiscal (Cod 538)",
      subtitle: "IVA recaudado en tus ventas",
      body: "El Débito Fiscal es la suma acumulada de todo el IVA (19%) que les has cobrado a tus clientes por tus ventas del mes. Este dinero no te pertenece, es retenido y debes transferírselo al SII mediante este formulario.",
      formula: "IVA Facturas (Cod 504) + IVA Boletas (Cod 710)"
    },
    "537": {
      title: "Total Crédito Fiscal (Cod 537)",
      subtitle: "IVA acumulado en tus compras",
      body: "El Crédito Fiscal es el IVA (19%) que tú has pagado en las facturas de proveedores por insumos y servicios relacionados directamente con el giro comercial de tu negocio. El SII te permite descontar este valor de tu Débito Fiscal.",
      formula: "IVA Compras (Cod 521) - IVA Notas Crédito (Cod 529)"
    },
    "115": {
      title: "PPM Determinado (Cod 115)",
      subtitle: "Pago Provisional Mensual",
      body: "El PPM es un abono mensual obligatorio que sirve de fondo de ahorro para el Impuesto a la Renta de tu empresa (el cual se declara anualmente en abril). Se calcula aplicando una tasa porcentual sobre tus ingresos netos mensuales.",
      formula: "Base Imponible (Cod 563) × Tasa PPM (Cod 562)"
    },
    "153": {
      title: "Retención de Impuestos BHE (Cod 153)",
      subtitle: "Impuesto de Segunda Categoría",
      body: "Corresponde a la retención de impuesto (15.25% en 2026) que estás obligado a realizar y retener cuando un profesional te presta un servicio y emite una Boleta de Honorarios Electrónica (BHE). Tú retienes ese porcentaje y lo declaras/pagas aquí.",
      formula: "Monto Bruto de BHEs × 15.25%"
    },
    "77": {
      title: "Remanente Crédito Fiscal (Cod 77)",
      subtitle: "Saldo a tu favor para el próximo mes",
      body: "Ocurre cuando tus compras con IVA superaron tus ventas con IVA en el mes (Crédito Fiscal > Débito Fiscal). ¡Buenas noticias! No tendrás que pagar IVA por este período y el excedente se reajustará y acumulará a tu favor para el mes siguiente.",
      formula: "Total Crédito Fiscal (Cod 537) - Total Débito Fiscal (Cod 538)"
    },
    "89": {
      title: "IVA Neto Determinado (Cod 89)",
      subtitle: "IVA a pagar al SII",
      body: "Si tus ventas superaron a tus compras con IVA (Débito Fiscal > Crédito Fiscal), este es el saldo neto de IVA que le debes pagar al fisco antes de sumar el PPM u otros cargos.",
      formula: "Total Débito Fiscal (Cod 538) - Total Crédito Fiscal (Cod 537)"
    },
    "91": {
      title: "Total a Pagar (Cod 91)",
      subtitle: "El cobro final mensual de tu F29",
      body: "Monto neto final consolidado que debes transferir al SII en tu declaración de este mes. Incluye el IVA a pagar (o cero si tienes remanente), el PPM determinado y las retenciones de honorarios.",
      formula: "IVA Neto (Cod 89) + PPM (Cod 115) + Retención Honorarios (Cod 153)"
    }
  };

  const selectedCodeInfo = glossaryDetails[activeCodeHelp];

  // ----------------------------------------------------
  // HANDLERS FOR DECLARATION SUBMISSION
  // ----------------------------------------------------
  const handleDeclareF29 = () => {
    // Generate a random Folio number and a current timestamp
    setDeclaredFolio(Math.floor(10000000 + Math.random() * 90000000));
    setDeclarationDate(new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" }));
    setIsDeclarationModalOpen(true);
  };

  // ----------------------------------------------------
  // EXPORTABLE PDF PRINTING POPUP RENDERER
  // ----------------------------------------------------
  const handleExportPDF = () => {
    const formattedPeriod = formatMonthLabel(selectedMonth);
    const windowPrint = window.open("", "_blank", "width=800,height=900");
    if (!windowPrint) return;

    // Build the printer HTML
    windowPrint.document.write(`
      <html>
        <head>
          <title>Certificado de Declaracion F29 - Folio ${declaredFolio}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #0f766e;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .logo-section h1 {
              font-size: 24px;
              color: #0f766e;
              margin: 0;
              font-weight: 800;
            }
            .logo-section p {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #64748b;
              margin: 2px 0 0 0;
            }
            .badge-sii {
              border: 1px solid #cbd5e1;
              padding: 10px;
              font-size: 9px;
              text-align: center;
              background-color: #f8fafc;
            }
            .title-block {
              text-align: center;
              margin-bottom: 30px;
            }
            .title-block h2 {
              font-size: 18px;
              font-weight: 700;
              margin: 0;
              color: #0f172a;
            }
            .title-block p {
              font-size: 13px;
              color: #64748b;
              margin: 5px 0 0 0;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
            }
            .details-table td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            .details-table td.label {
              font-weight: 700;
              color: #475569;
              width: 35%;
            }
            .receipt-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            .receipt-grid th {
              background-color: #f1f5f9;
              border-bottom: 2px solid #cbd5e1;
              padding: 10px;
              font-size: 11px;
              text-transform: uppercase;
              text-align: left;
            }
            .receipt-grid td {
              padding: 12px 10px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            .receipt-grid tr.total-row {
              background-color: #f8fafc;
              font-weight: bold;
              border-top: 2px solid #cbd5e1;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              margin-top: 80px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 80px;
              color: rgba(15, 118, 110, 0.04);
              font-weight: 900;
              pointer-events: none;
              white-space: nowrap;
              z-index: -1;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                margin: 20px;
              }
            }
            .btn-print {
              background-color: #0f766e;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 14px;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              display: inline-flex;
              align-items: center;
              gap: 8px;
            }
          </style>
        </head>
        <body>
          <div class="watermark">DECLARADO Y PAGADO</div>
          
          <div class="header">
            <div class="logo-section">
              <h1>CONTAFÁCIL</h1>
              <p>SaaS de Gestión Tributaria</p>
            </div>
            <div class="badge-sii">
              <strong>SERVICIO DE IMPUESTOS INTERNOS</strong><br/>
              COMPROBANTE DE RECEPCION DE DECLARACION<br/>
              DE IMPUESTOS MENSUALES (F29)
            </div>
          </div>

          <div class="no-print" style="text-align: right; margin-bottom: 25px;">
            <button class="btn-print" onclick="window.print()">
              Imprimir / Guardar como PDF
            </button>
          </div>

          <div class="title-block">
            <h2>CERTIFICADO SOLEMNE DE DECLARACIÓN F29</h2>
            <p>El Servicio de Impuestos Internos de Chile certifica que ha recibido la declaración mensual correspondiente al siguiente período tributario:</p>
          </div>

          <table class="details-table">
            <tr>
              <td class="label">RUT Empresa</td>
              <td>${rutEmpresa}</td>
            </tr>
            <tr>
              <td class="label">Razón Social</td>
              <td>${userEmail.split("@")[0].toUpperCase()} SPA (SIMULADO)</td>
            </tr>
            <tr>
              <td class="label">Período Tributario</td>
              <td><strong>${formattedPeriod}</strong></td>
            </tr>
            <tr>
              <td class="label">Número de Folio</td>
              <td><span style="font-family: monospace; font-size: 15px; font-weight: bold;">${declaredFolio}</span></td>
            </tr>
            <tr>
              <td class="label">Fecha Recepción</td>
              <td>${declarationDate}</td>
            </tr>
            <tr>
              <td class="label">Estado Transacción</td>
              <td><strong style="color: #0f766e;">ACEPTADA Y DECLARADA (CON COMPLEMENTO DE PAGO)</strong></td>
            </tr>
            <tr>
              <td class="label">Firma Proveedor API</td>
              <td>Simple API REST v2 (Chilesystems)</td>
            </tr>
          </table>

          <h3 style="color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 15px;">DESGLOSE TRIBUTARIO PRINCIPAL</h3>
          
          <table class="receipt-grid">
            <thead>
              <tr>
                <th>Casilla / Código F29</th>
                <th style="text-align: center;">Código</th>
                <th style="text-align: right;">Monto Declarado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>IVA Débito Fiscal (Total Ventas Afectas)</td>
                <td style="text-align: center; font-family: monospace;">538</td>
                <td style="text-align: right; font-family: monospace;">${formatCurrency(apiTotalDebito)}</td>
              </tr>
              <tr>
                <td>IVA Crédito Fiscal (Total Compras Afectas)</td>
                <td style="text-align: center; font-family: monospace;">537</td>
                <td style="text-align: right; font-family: monospace;">${formatCurrency(apiTotalCredito)}</td>
              </tr>
              <tr>
                <td>Impuesto IVA Neto Determinado</td>
                <td style="text-align: center; font-family: monospace;">89</td>
                <td style="text-align: right; font-family: monospace;">${formatCurrency(apiIvaNeto)}</td>
              </tr>
              <tr>
                <td>Remanente de Crédito Fiscal (Excedente)</td>
                <td style="text-align: center; font-family: monospace;">77</td>
                <td style="text-align: right; font-family: monospace;">${formatCurrency(apiRemanente)}</td>
              </tr>
              <tr>
                <td>Pago Provisional Mensual (Tasa PPM: ${ppmRate.toFixed(1)}%)</td>
                <td style="text-align: center; font-family: monospace;">115</td>
                <td style="text-align: right; font-family: monospace;">${formatCurrency(apiPpmDeterminado)}</td>
              </tr>
              <tr>
                <td>Retenciones de Segunda Categoría (Honorarios BHE)</td>
                <td style="text-align: center; font-family: monospace;">153</td>
                <td style="text-align: right; font-family: monospace;">${formatCurrency(apiHonorariosRetencion)}</td>
              </tr>
              <tr class="total-row">
                <td style="font-size: 14px; text-transform: uppercase;">Total Declarado a Pagar (Caja)</td>
                <td style="text-align: center; font-family: monospace; font-size: 14px;">91</td>
                <td style="text-align: right; font-family: monospace; font-size: 16px; color: #0f766e;">${formatCurrency(apiTotalAPagar)}</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin: 40px 0;">
            <p style="font-size: 11px; color: #64748b;">
              Este es un comprobante de simulación oficial de ContaFácil en integración con Simple API.<br/>
              Las firmas criptográficas e identificadores corresponden a un ambiente Sandbox con fines exclusivamente de evaluación universitaria.
            </p>
          </div>

          <div class="footer">
            <p>ContaFácil SaaS © 2026 - Conectando pymes al SII con simplicidad y sin miedos.</p>
          </div>
        </body>
      </html>
    `);
    
    windowPrint.document.close();
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-emerald-600 animate-pulse" />
            Reporte Automatizado F29
          </h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base font-medium">
            Tus transacciones locales son enviadas y procesadas a través del simulador de **Simple API** para obtener el borrador oficial del SII.
          </p>
        </div>
        <MonthPicker selectedMonth={selectedMonth} />
      </div>

      {/* COMPACT COLLAPSIBLE SIMPLE API CONFIGURATION */}
      <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden">
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between p-4 bg-zinc-50 border-b border-zinc-100 hover:bg-zinc-100/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-zinc-800 text-sm font-bold">
            <Send className="h-4.5 w-4.5 text-emerald-600" />
            Configuración de Conexión (Simple API / SII)
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
            {showConfig ? (
              <>Ocultar panel <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Mostrar panel de credenciales <ChevronDown className="h-4 w-4" /></>
            )}
          </div>
        </button>
        
        {showConfig && (
          <CardContent className="p-5 border-t border-zinc-100">
            <form onSubmit={handleQueryAPI} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rutEmpresa" className="text-xs font-bold text-zinc-700">RUT Empresa (Contribuyente) *</Label>
                  <Input 
                    id="rutEmpresa" 
                    value={rutEmpresa} 
                    onChange={(e) => setRutEmpresa(e.target.value)}
                    placeholder="78.181.331-1" 
                    className="h-10 text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="rutCertificado" className="text-xs font-bold text-zinc-700">RUT Dueño de Firma Digital *</Label>
                  <Input 
                    id="rutCertificado" 
                    value={rutCertificado} 
                    onChange={(e) => setRutCertificado(e.target.value)}
                    placeholder="18.076.720-7" 
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passwordCertificado" className="text-xs font-bold text-zinc-700">Contraseña Firma Digital *</Label>
                  <Input 
                    id="passwordCertificado" 
                    type="password"
                    value={passwordCertificado} 
                    onChange={(e) => setPasswordCertificado(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ambiente" className="text-xs font-bold text-zinc-700">Ambiente de Operación *</Label>
                  <select 
                    id="ambiente" 
                    value={ambiente} 
                    onChange={(e) => setAmbiente(Number(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value={0}>Ambiente Certificación (Pruebas)</option>
                    <option value={1}>Ambiente Producción (Real)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <input 
                  type="checkbox" 
                  id="forceSimulation" 
                  checked={forceSimulation}
                  onChange={(e) => setForceSimulation(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <label htmlFor="forceSimulation" className="font-bold text-zinc-800 block">Modo Simulación Sandbox Activo (Recomendado)</label>
                  <span className="text-zinc-500">Usa las transacciones de tu base de datos local y las procesa simulando una llamada real de Simple API.</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={apiLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 h-10 px-5 shadow-sm"
                >
                  {apiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Forzar Re-simulación
                </Button>
              </div>
            </form>
          </CardContent>
        )}
        
        {/* API FEEDBACK ALERTS */}
        {apiResult && (
          <div className={cn(
            "p-3.5 text-xs flex items-center gap-2.5",
            apiResult.success 
              ? "bg-emerald-50 border-t border-emerald-100 text-emerald-800"
              : "bg-amber-50 border-t border-amber-100 text-amber-800"
          )}>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Simulación del SII vía Simple API Cargada</span>
              <span className="text-zinc-500 font-medium ml-1">({apiResult.message})</span>
            </div>
          </div>
        )}
      </Card>

      {/* DYNAMIC CALCULATOR / PPM CONFIGURATOR CARD */}
      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-zinc-800 font-bold">
            <Sliders className="h-4.5 w-4.5 text-emerald-600" />
            Ajustar Tasa de PPM (Pago Provisional Mensual)
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            El PPM es un abono para tu impuesto a la renta. Arrastra el slider para ajustar la tasa sobre la base neta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-zinc-50/50 p-4 rounded-2xl border border-zinc-200">
            <div className="space-y-1.5 flex-1 max-w-md">
              <div className="flex justify-between text-xs font-bold text-zinc-700">
                <span>Tasa de PPM Mensual (Cod 562)</span>
                <span className="text-emerald-700 font-extrabold text-sm">{ppmRate.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={ppmRate}
                onChange={(e) => setPpmRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Micro (0.2%)</span>
                <span>General (1.0%)</span>
                <span>Máximo (3.0%)</span>
              </div>
            </div>
            
            <div className="border-t border-zinc-200 md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-6 flex flex-col justify-center min-w-[200px]">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">PPM Determinado (Cod 115)</span>
              <span className="text-xl font-bold text-zinc-800 mt-1">
                {formatCurrency(apiPpmDeterminado)}
              </span>
              <span className="text-[10px] text-zinc-500">
                Sobre base imponible de {formatCurrency(apiBasePpm)} (Cod 563)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAIN VIEWGRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: THE F29 FORM */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b border-zinc-200 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base text-zinc-800">Previsualización F29 - SII</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Haz clic en cualquier fila para desplegar su explicación y consejos de optimización en el panel lateral.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100">
                  <FileCheck2 className="h-4 w-4 text-emerald-600" />
                  Borrador Automático
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-600">
                  <thead className="text-xs uppercase bg-zinc-100/80 text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Concepto / Operación</th>
                      <th className="px-4 py-3.5 font-bold text-center">Cod</th>
                      <th className="px-4 py-3.5 font-bold text-center">Docs</th>
                      <th className="px-4 py-3.5 font-bold text-right">Base Neto</th>
                      <th className="px-4 py-3.5 font-bold text-right">IVA / Retención</th>
                      <th className="px-4 py-3.5 font-bold text-right">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    
                    {/* SECCIÓN 1: IVA DÉBITO */}
                    <tr className="bg-zinc-50/50">
                      <td colSpan={6} className="px-5 py-2 font-extrabold text-xs uppercase tracking-wider text-emerald-700">
                        1. Débito Fiscal (IVA de tus Ventas)
                      </td>
                    </tr>
                    
                    {/* Ventas Facturas */}
                    <tr 
                      onClick={() => setActiveCodeHelp("538")}
                      className={cn(
                        "hover:bg-zinc-50 cursor-pointer transition-colors border-l-2",
                        activeCodeHelp === "538" ? "border-l-emerald-600 bg-emerald-50/10" : "border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-800">{ventasFacturasRow.concept}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-zinc-500">502 / 504</td>
                      <td className="px-4 py-3 text-center">{ventasFacturasRow.docs}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(ventasFacturasRow.net)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">+{formatCurrency(ventasFacturasRow.tax)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(ventasFacturasRow.total)}</td>
                    </tr>

                    {/* Ventas Boletas */}
                    <tr 
                      onClick={() => setActiveCodeHelp("538")}
                      className={cn(
                        "hover:bg-zinc-50 cursor-pointer transition-colors border-l-2",
                        activeCodeHelp === "538" ? "border-l-emerald-600 bg-emerald-50/10" : "border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-800">{ventasBoletasRow.concept}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-zinc-500">709 / 710</td>
                      <td className="px-4 py-3 text-center">{ventasBoletasRow.docs}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(ventasBoletasRow.net)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">+{formatCurrency(ventasBoletasRow.tax)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(ventasBoletasRow.total)}</td>
                    </tr>

                    {/* Ventas Exentas */}
                    <tr 
                      onClick={() => setActiveCodeHelp("538")}
                      className="hover:bg-zinc-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-800">{ventasExentasRow.concept}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-zinc-500">142</td>
                      <td className="px-4 py-3 text-center">{ventasExentasRow.docs}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(ventasExentasRow.net)}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">$0</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(ventasExentasRow.total)}</td>
                    </tr>

                    {/* TOTAL DÉBITO ROW */}
                    <tr className="bg-emerald-50/20 font-bold border-t border-emerald-100">
                      <td className="px-5 py-3 text-emerald-800">Total Débito Fiscal IVA Afecto</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-black text-emerald-700 bg-emerald-100/50">538</td>
                      <td className="px-4 py-3 text-center">
                        {apiDte33Ventas.cantidad + apiDte39Ventas.cantidad}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(apiDte33Ventas.montoNeto + apiDte39Ventas.montoNeto)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 text-base font-extrabold">
                        {formatCurrency(apiTotalDebito)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(apiDte33Ventas.montoTotal + apiDte39Ventas.montoTotal)}
                      </td>
                    </tr>

                    {/* SECCIÓN 2: IVA CRÉDITO */}
                    <tr className="bg-zinc-50/50">
                      <td colSpan={6} className="px-5 py-2 font-extrabold text-xs uppercase tracking-wider text-rose-700">
                        2. Crédito Fiscal (IVA de tus Compras)
                      </td>
                    </tr>

                    {/* Compras Facturas */}
                    <tr 
                      onClick={() => setActiveCodeHelp("537")}
                      className={cn(
                        "hover:bg-zinc-50 cursor-pointer transition-colors border-l-2",
                        activeCodeHelp === "537" ? "border-l-rose-600 bg-rose-50/10" : "border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-800">{comprasFacturasRow.concept}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-zinc-500">520 / 521</td>
                      <td className="px-4 py-3 text-center">{comprasFacturasRow.docs}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(comprasFacturasRow.net)}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">-{formatCurrency(comprasFacturasRow.tax)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(comprasFacturasRow.total)}</td>
                    </tr>

                    {/* Notas de Crédito Compras */}
                    <tr 
                      onClick={() => setActiveCodeHelp("537")}
                      className={cn(
                        "hover:bg-zinc-50 cursor-pointer transition-colors border-l-2",
                        activeCodeHelp === "537" ? "border-l-rose-600 bg-rose-50/10" : "border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-800">{comprasNotasCreditoRow.concept}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-zinc-500">528 / 529</td>
                      <td className="px-4 py-3 text-center">{comprasNotasCreditoRow.docs}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(comprasNotasCreditoRow.net)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">+{formatCurrency(Math.abs(comprasNotasCreditoRow.tax))}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(comprasNotasCreditoRow.total)}</td>
                    </tr>

                    {/* TOTAL CRÉDITO ROW */}
                    <tr className="bg-rose-50/20 font-bold border-t border-rose-100">
                      <td className="px-5 py-3 text-rose-800">Total Crédito Fiscal Aceptado</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-black text-rose-700 bg-rose-100/50">537</td>
                      <td className="px-4 py-3 text-center">
                        {apiDte33Compras.cantidad + apiDte61Compras.cantidad}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(apiDte33Compras.montoNeto + apiDte61Compras.montoNeto)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-700 text-base font-extrabold">
                        {formatCurrency(apiTotalCredito)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(apiDte33Compras.montoTotal + apiDte61Compras.montoTotal)}
                      </td>
                    </tr>

                    {/* SECCIÓN 3: PPM Y RETENCIONES */}
                    <tr className="bg-zinc-50/50">
                      <td colSpan={6} className="px-5 py-2 font-extrabold text-xs uppercase tracking-wider text-indigo-700">
                        3. PPM & Retenciones de Impuesto
                      </td>
                    </tr>

                    {/* PPM */}
                    <tr 
                      onClick={() => setActiveCodeHelp("115")}
                      className={cn(
                        "hover:bg-zinc-50 cursor-pointer transition-colors border-l-2",
                        activeCodeHelp === "115" ? "border-l-indigo-600 bg-indigo-50/10" : "border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-800">Pago Provisional Mensual (PPM obligatorio)</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-zinc-500">115</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-zinc-400">Tasa: {ppmRate.toFixed(1)}% (562)</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(apiBasePpm)} (563)</td>
                      <td className="px-4 py-3 text-right font-mono text-indigo-600 font-semibold">+{formatCurrency(apiPpmDeterminado)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(apiPpmDeterminado)}</td>
                    </tr>

                    {/* Honorarios */}
                    <tr 
                      onClick={() => setActiveCodeHelp("153")}
                      className={cn(
                        "hover:bg-zinc-50 cursor-pointer transition-colors border-l-2",
                        activeCodeHelp === "153" ? "border-l-indigo-600 bg-indigo-50/10" : "border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-800">{honorariosRow.concept}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-zinc-500">153</td>
                      <td className="px-4 py-3 text-center">{honorariosRow.docs}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(honorariosRow.net)} (Bruto)</td>
                      <td className="px-4 py-3 text-right font-mono text-indigo-600 font-semibold">+{formatCurrency(honorariosRow.tax)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(honorariosRow.total)} (Pago)</td>
                    </tr>

                    {/* SECCIÓN 4: RESULTADO FINAL DECLARACIÓN */}
                    <tr className="bg-zinc-50/50">
                      <td colSpan={6} className="px-5 py-2 font-extrabold text-xs uppercase tracking-wider text-zinc-700">
                        4. Consolidado Final de Impuestos
                      </td>
                    </tr>

                    {/* Remanente de IVA */}
                    <tr 
                      onClick={() => setActiveCodeHelp("77")}
                      className={cn(
                        "hover:bg-zinc-50 cursor-pointer transition-colors border-l-2",
                        activeCodeHelp === "77" ? "border-l-zinc-700 bg-zinc-50" : "border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-3 font-bold text-zinc-700">Remanente de Crédito Fiscal (Excedente a favor)</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-black text-zinc-500">77</td>
                      <td className="px-4 py-3 text-center">-</td>
                      <td className="px-4 py-3 text-right font-mono">-</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                        {formatCurrency(apiRemanente)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">-</td>
                    </tr>

                    {/* Impuesto IVA determinado */}
                    <tr 
                      onClick={() => setActiveCodeHelp("89")}
                      className={cn(
                        "hover:bg-zinc-50 cursor-pointer transition-colors border-l-2",
                        activeCodeHelp === "89" ? "border-l-zinc-700 bg-zinc-50" : "border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-3 font-bold text-zinc-700">Impuesto IVA Neto Determinado a pagar</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-black text-zinc-500">89</td>
                      <td className="px-4 py-3 text-center">-</td>
                      <td className="px-4 py-3 text-right font-mono">-</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600 font-bold">
                        {formatCurrency(apiIvaNeto)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">-</td>
                    </tr>

                    {/* TOTAL A PAGAR EN CAJA */}
                    <tr 
                      onClick={() => setActiveCodeHelp("91")}
                      className={cn(
                        "cursor-pointer transition-all border-l-2 text-white bg-gradient-to-r from-emerald-700 to-emerald-600",
                        activeCodeHelp === "91" ? "ring-2 ring-emerald-400 ring-inset" : ""
                      )}
                    >
                      <td className="px-5 py-4 font-black text-base flex items-center gap-1.5">
                        TOTAL IMPUESTO A PAGAR EN CAJA
                        <Info className="h-4 w-4 text-white/70 hover:text-white" />
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-sm font-black bg-white/20">91</td>
                      <td className="px-4 py-4 text-center">-</td>
                      <td className="px-4 py-4 text-right font-mono text-white/80">-</td>
                      <td className="px-4 py-4 text-right font-mono text-white/80">-</td>
                      <td className="px-4 py-4 text-right font-mono text-xl font-black tracking-tight underline decoration-2 decoration-white/50">
                        {formatCurrency(apiTotalAPagar)}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* SUBMIT DECLARATION ACTION BOX */}
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleDeclareF29}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-base px-8 py-6 rounded-2xl shadow-lg hover:shadow-emerald-600/10 hover:scale-[1.01] transition-all flex items-center gap-2"
            >
              <FileCheck2 className="h-5.5 w-5.5" />
              Declarar y Presentar F29 Mensual
            </Button>
          </div>

        </div>

        {/* RIGHT COLUMN: SII GLOSSARY PANEL */}
        <div className="lg:col-span-1 space-y-6">
          
          <Card className="border-zinc-200 shadow-lg bg-zinc-900 text-zinc-100 overflow-hidden sticky top-6">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 py-4 flex flex-row items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-base text-white">Glosario Educativo F29</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">Entiende qué significa cada código tributario.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div className="space-y-1">
                <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wide">
                  Código seleccionado
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedCodeInfo.title}</h3>
                <p className="text-xs text-zinc-400 font-semibold">{selectedCodeInfo.subtitle}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800/80 p-3.5 rounded-xl text-zinc-300 text-xs leading-relaxed space-y-3">
                <p>{selectedCodeInfo.body}</p>
                {selectedCodeInfo.formula && (
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="block text-[10px] text-zinc-500 font-extrabold uppercase">Fórmula de cálculo:</span>
                    <code className="block text-emerald-400 font-semibold text-xs mt-1 bg-zinc-900 p-1.5 rounded border border-zinc-800/50">
                      {selectedCodeInfo.formula}
                    </code>
                  </div>
                )}
              </div>

              {/* TIPS */}
              <div className="border-t border-zinc-800 pt-4 space-y-3">
                <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-bold">
                  <Info className="h-4 w-4 text-emerald-400" />
                  Consejo para tu Negocio:
                </div>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-zinc-400 text-xs leading-relaxed italic">
                  "{selectedCodeInfo.title.includes("91") 
                    ? "Declara tu F29 a tiempo antes del día 20 del mes si pagas por internet (o día 12 si declaras sin movimiento). Evita multas innecesarias que restan liquidez a tu pyme." 
                    : selectedCodeInfo.title.includes("537")
                    ? "Solo compra cosas que tengan relación directa con lo que vende tu pyme para poder recuperar el IVA. Si compras un televisor para tu casa con factura de la empresa, el SII te lo rechazará en una auditoría."
                    : selectedCodeInfo.title.includes("115")
                    ? "Si prevés que a tu empresa le irá muy bien este año, puedes subir voluntariamente tu tasa de PPM. Esto te evitará tener que pagar una suma muy grande de impuesto anual de golpe en abril."
                    : "Haz clic en los diferentes códigos del formulario para ver consejos específicos de cada casilla fiscal."}"
                </div>
              </div>

              {/* GLOSSARY LINK */}
              <div className="pt-4 border-t border-zinc-800">
                <a 
                  href="/glosario" 
                  className="group flex items-center justify-between p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    ¿Quieres ver más términos?
                  </span>
                  <span className="flex items-center text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
                    Ir al Glosario
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </span>
                </a>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

      {/* ==================================================== */}
      {/* EXPORTABLE DECLARATION SOLEMN RECEIPT MODAL */}
      {/* ==================================================== */}
      {isDeclarationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsDeclarationModalOpen(false)}
          />
          
          {/* Modal Card */}
          <Card className="relative z-10 w-full max-w-xl scale-100 transform overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl transition-all animate-in fade-in-50 zoom-in-95 duration-200">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mx-auto mb-3">
                <FileCheck2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl text-white font-extrabold tracking-tight">¡F29 Declarado Exitosamente!</CardTitle>
              <CardDescription className="text-emerald-400 text-xs font-bold uppercase tracking-wider mt-1">
                Aceptado y Recibido por el SII
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              
              {/* Receipt Details */}
              <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/80 space-y-3.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400 font-bold">RUT Empresa Contribuyente</span>
                  <span className="font-semibold text-white">{rutEmpresa}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400 font-bold">Período Declarado</span>
                  <span className="font-semibold text-white">{formatMonthLabel(selectedMonth)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400 font-bold">Nº de Folio Declaración</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">{declaredFolio}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400 font-bold">Fecha y Hora de Declaración</span>
                  <span className="font-semibold text-white">{declarationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-bold">Proveedor API</span>
                  <span className="font-semibold text-zinc-400">Simple API (Chilesystems)</span>
                </div>
              </div>

              {/* Summarized Codes Block */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Resumen Impuestos Declarados</h4>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 overflow-hidden divide-y divide-zinc-800 text-xs">
                  <div className="flex justify-between p-3">
                    <span className="text-zinc-400">IVA Débito Fiscal (Cod 538)</span>
                    <span className="font-mono text-zinc-100">{formatCurrency(apiTotalDebito)}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-zinc-400">IVA Crédito Fiscal (Cod 537)</span>
                    <span className="font-mono text-zinc-100">{formatCurrency(apiTotalCredito)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-zinc-900/50">
                    <span className="text-zinc-300 font-bold">PPM Determinado (Cod 115)</span>
                    <span className="font-mono text-zinc-100">{formatCurrency(apiPpmDeterminado)}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-zinc-400">Retenciones Honorarios (Cod 153)</span>
                    <span className="font-mono text-zinc-100">{formatCurrency(apiHonorariosRetencion)}</span>
                  </div>
                  <div className="flex justify-between p-3.5 bg-emerald-500/10 font-bold border-t border-emerald-500/20 text-emerald-300">
                    <span className="text-sm uppercase font-black">Total Pagado en Caja (Cod 91)</span>
                    <span className="font-mono text-base font-black">{formatCurrency(apiTotalAPagar)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3.5 pt-2">
                <Button 
                  onClick={handleExportPDF}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center gap-2 h-12 rounded-xl"
                >
                  <Printer className="h-4.5 w-4.5" />
                  Descargar Comprobante PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsDeclarationModalOpen(false)}
                  className="flex-1 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white h-12 rounded-xl"
                >
                  Cerrar Ventana
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
