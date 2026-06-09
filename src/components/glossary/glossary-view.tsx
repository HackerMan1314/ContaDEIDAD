"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  BookOpen, 
  Search, 
  Award, 
  HelpCircle, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Loader2,
  AlertTriangle,
  Lightbulb,
  GraduationCap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GLOSSARY, type GlossaryKey, type GlossaryEntry } from "@/lib/glossary/terms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GlossaryFeedback, GlossarySuggestion } from "@/types";

interface GlossaryViewProps {
  userId: string;
  userEmail: string;
}

interface TermStats {
  helpful: number;
  unhelpful: number;
  myVote: boolean | null; // true = helpful, false = unhelpful, null = no vote
}

export function GlossaryView({ userId, userEmail }: GlossaryViewProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"explorer" | "translator" | "trivia" | "suggestions">("explorer");

  // --- ESTADOS DE EXPLORADOR ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<Record<string, TermStats>>({});
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  // --- ESTADOS DE TRADUCTOR ---
  const [selectedFraseIndex, setSelectedFraseIndex] = useState(0);
  const [hoveredTermInSentence, setHoveredTermInSentence] = useState<GlossaryKey | null>(null);

  // --- ESTADOS DE TRIVIA ---
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [showTriviaResult, setShowTriviaResult] = useState(false);
  const [triviaScore, setTriviaScore] = useState(0);
  const [isTriviaFinished, setIsTriviaFinished] = useState(false);

  // --- ESTADOS DE SUGERENCIAS ---
  const [suggestions, setSuggestions] = useState<GlossarySuggestion[]>([]);
  const [newTermName, setNewTermName] = useState("");
  const [newTermDesc, setNewTermDesc] = useState("");
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // --- DATOS DE FRASES COMPLEJAS (TRADUCTOR) ---
  const frasesTraductor = useMemo(() => [
    {
      titulo: "El IVA y las Finanzas Básicas",
      original: "Tengo que separar el IVA de mis ingresos para calcular el balance y deducir mis egresos operativos.",
      partes: [
        { text: "Tengo que separar el " },
        { text: "IVA", key: "iva" as GlossaryKey, highlight: true },
        { text: " de mis " },
        { text: "ingresos", key: "ingresos" as GlossaryKey, highlight: true },
        { text: " para calcular el " },
        { text: "balance", key: "balance" as GlossaryKey, highlight: true },
        { text: " y deducir mis " },
        { text: "egresos", key: "egresos" as GlossaryKey, highlight: true },
        { text: " operativos." }
      ],
      traduccionSimple: "Debo restar el impuesto que le cobro a mis clientes (que no es mío y debo guardarlo) del total de mis ventas, para ver cuánto dinero me queda realmente y restar los gastos normales del negocio (renta, luz, insumos) para saber si gané o perdí dinero en total."
    },
    {
      titulo: "El problema del Flujo vs Utilidad",
      original: "La utilidad del ejercicio disminuyó porque el flujo de efectivo se concentró en pasivos circulantes con proveedores.",
      partes: [
        { text: "La " },
        { text: "utilidad", key: "utilidad" as GlossaryKey, highlight: true },
        { text: " del ejercicio disminuyó porque el " },
        { text: "flujo de efectivo", key: "flujoEfectivo" as GlossaryKey, highlight: true },
        { text: " se concentró en " },
        { text: "pasivos", key: "pasivo" as GlossaryKey, highlight: true },
        { text: " circulantes con proveedores." }
      ],
      traduccionSimple: "Mi ganancia limpia fue menor este mes porque gasté el dinero en mano que tenía disponible para pagar las deudas urgentes e inmediatas con las personas que me surten materia prima."
    },
    {
      titulo: "Activos y Desgaste (Depreciación)",
      original: "Mi batidora industrial, que es un activo fijo, sufrió una depreciación acelerada disminuyendo mi capital contable.",
      partes: [
        { text: "Mi batidora industrial, que es un " },
        { text: "activo", key: "activo" as GlossaryKey, highlight: true },
        { text: ", sufrió una " },
        { text: "depreciación", key: "depreciacion" as GlossaryKey, highlight: true },
        { text: " acelerada disminuyendo mi " },
        { text: "capital", key: "capital" as GlossaryKey, highlight: true },
        { text: " neto." }
      ],
      traduccionSimple: "Mi batidora (que vale dinero y me ayuda a producir) está perdiendo valor muy rápido por el uso constante, lo que reduce el valor total neto de lo que realmente le pertenece a mi negocio."
    }
  ], []);

  // --- PREGUNTAS DE TRIVIA ---
  const preguntasTrivia = useMemo(() => [
    {
      pregunta: "Si vendes pasteles por $1,000, pero gastaste $300 en harina/huevos y $100 en luz del horno, ¿cuál es tu Utilidad limpia?",
      opciones: [
        { texto: "$1,000 (¡El total de mis ventas!)", esCorrecta: false },
        { texto: "$700 (Solo restando los ingredientes)", esCorrecta: false },
        { texto: "$600 (Restando todos los gastos: ingredientes y luz)", esCorrecta: true }
      ],
      explicacion: "¡Exacto! La Utilidad es la ganancia limpia. Debes restar todos los egresos (harina por $300 y luz por $100) a tus ingresos de $1,000."
    },
    {
      pregunta: "El IVA (Impuesto al Valor Agregado) que cobras a tus clientes en cada venta...",
      opciones: [
        { texto: "Es una ganancia extra de tu negocio que puedes gastar.", esCorrecta: false },
        { texto: "Es dinero del gobierno que solo estás guardando temporalmente.", esCorrecta: true },
        { texto: "Es una deducción de impuestos automática.", esCorrecta: false }
      ],
      explicacion: "¡Correcto! El IVA se cobra al cliente final y se acumula para pagarlo al fisco más adelante. No debes considerarlo parte de tu presupuesto de gastos."
    },
    {
      pregunta: "Si tienes registradas muchas ventas pero tus clientes acordaron pagarte el próximo mes, ¿cómo está tu Flujo de Efectivo hoy?",
      opciones: [
        { texto: "Muy alto, porque vendí bastante.", esCorrecta: false },
        { texto: "Igual a mi utilidad neta.", esCorrecta: false },
        { texto: "En $0, porque el dinero real aún no ingresa a mi mano/cuenta.", esCorrecta: true }
      ],
      explicacion: "¡Muy bien! El Flujo de Efectivo mide la liquidez inmediata, es decir, el dinero real que posees en caja o banco. Vender a crédito no te da dinero líquido en el momento."
    },
    {
      pregunta: "Compraste una moto para reparto por $15,000 y al cabo de un año vale $12,000 debido al uso. ¿Cómo se conoce contablemente esta pérdida de valor?",
      opciones: [
        { texto: "Deducción de Impuestos.", esCorrecta: false },
        { texto: "Depreciación.", esCorrecta: true },
        { texto: "Pasivo circulante.", esCorrecta: false }
      ],
      explicacion: "¡Excelente! La Depreciación es el desgaste que sufren los bienes o equipos del negocio por el uso y el paso del tiempo."
    }
  ], []);

  // --- CARGA DE DATOS DESDE SUPABASE ---
  useEffect(() => {
    async function loadFeedback() {
      try {
        const { data, error } = await supabase
          .from("glossary_feedback")
          .select("*");

        if (error) throw error;

        const stats: Record<string, TermStats> = {};
        
        // Inicializar todos los términos del glosario
        Object.keys(GLOSSARY).forEach((key) => {
          stats[key] = { helpful: 0, unhelpful: 0, myVote: null };
        });

        // Agrupar votos
        (data as GlossaryFeedback[] || []).forEach((row) => {
          if (!stats[row.term_key]) {
            stats[row.term_key] = { helpful: 0, unhelpful: 0, myVote: null };
          }
          if (row.is_helpful) {
            stats[row.term_key].helpful += 1;
          } else {
            stats[row.term_key].unhelpful += 1;
          }
          if (row.user_id === userId) {
            stats[row.term_key].myVote = row.is_helpful;
          }
        });

        setFeedbackStats(stats);
      } catch (err) {
        console.error("Error cargando feedback del glosario:", err);
      } finally {
        setLoadingFeedback(false);
      }
    }

    async function loadSuggestions() {
      try {
        setLoadingSuggestions(true);
        const { data, error } = await supabase
          .from("glossary_suggestions")
          .select(`
            *,
            profiles:user_id (business_name, full_name)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSuggestions(data as any[] || []);
      } catch (err) {
        console.error("Error cargando sugerencias:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }

    loadFeedback();
    loadSuggestions();
  }, [userId, supabase]);

  // --- VOTO DE UTILIDAD (FEEDBACK) ---
  async function handleVote(termKey: string, isHelpful: boolean) {
    const current = feedbackStats[termKey] || { helpful: 0, unhelpful: 0, myVote: null };
    
    // Si pulsa el mismo botón, removemos el voto
    const isUndoing = current.myVote === isHelpful;
    const newVote = isUndoing ? null : isHelpful;

    // Actualización optimista del estado local
    setFeedbackStats((prev) => {
      const next = { ...prev };
      const termStat = { ...next[termKey] };

      // Revertir voto anterior
      if (termStat.myVote === true) termStat.helpful = Math.max(0, termStat.helpful - 1);
      if (termStat.myVote === false) termStat.unhelpful = Math.max(0, termStat.unhelpful - 1);

      // Aplicar nuevo voto
      if (newVote === true) termStat.helpful += 1;
      if (newVote === false) termStat.unhelpful += 1;
      
      termStat.myVote = newVote;
      next[termKey] = termStat;
      return next;
    });

    try {
      if (isUndoing) {
        // Borrar fila en Supabase
        await supabase
          .from("glossary_feedback")
          .delete()
          .eq("user_id", userId)
          .eq("term_key", termKey);
      } else {
        // Upsert en Supabase
        await supabase
          .from("glossary_feedback")
          .upsert({
            user_id: userId,
            term_key: termKey,
            is_helpful: isHelpful
          }, { onConflict: "user_id,term_key" });
      }
    } catch (err) {
      console.error("Error al votar término:", err);
      // En caso de error, una recarga simple restaurará el estado real de la BD
    }
  }

  // --- ENVÍO DE SUGERENCIAS ---
  async function handleSubmitSuggestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newTermName.trim()) return;

    setSubmittingSuggestion(true);
    try {
      const { data, error } = await supabase
        .from("glossary_suggestions")
        .insert({
          user_id: userId,
          term_name: newTermName.trim(),
          description: newTermDesc.trim() || null
        })
        .select(`
          *,
          profiles:user_id (business_name, full_name)
        `)
        .single();

      if (error) throw error;

      setSuggestions((prev) => [data as any, ...prev]);
      setNewTermName("");
      setNewTermDesc("");
    } catch (err) {
      console.error("Error al guardar sugerencia:", err);
    } finally {
      setSubmittingSuggestion(false);
    }
  }

  // --- ELIMINAR SUGERENCIA PROPIA ---
  async function handleDeleteSuggestion(id: string) {
    try {
      const { error } = await supabase
        .from("glossary_suggestions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId); // RLS ya protege esto, pero lo hacemos explícito

      if (error) throw error;

      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error al borrar sugerencia:", err);
    }
  }

  // --- GESTIÓN DE TRIVIA ---
  function handleAnswerSelect(idx: number) {
    if (selectedAnswerIdx !== null) return; // Ya respondió esta pregunta
    setSelectedAnswerIdx(idx);
    const question = preguntasTrivia[currentQuestionIdx];
    if (question.opciones[idx].esCorrecta) {
      setTriviaScore((prev) => prev + 1);
    }
    setShowTriviaResult(true);
  }

  function handleNextQuestion() {
    setSelectedAnswerIdx(null);
    setShowTriviaResult(false);
    if (currentQuestionIdx < preguntasTrivia.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setIsTriviaFinished(true);
    }
  }

  function resetTrivia() {
    setCurrentQuestionIdx(0);
    setSelectedAnswerIdx(null);
    setShowTriviaResult(false);
    setTriviaScore(0);
    setIsTriviaFinished(false);
  }

  // --- FILTRADO DE TÉRMINOS ---
  const filteredTerms = useMemo(() => {
    return (Object.entries(GLOSSARY) as [GlossaryKey, GlossaryEntry][]).filter(([key, entry]) => {
      const matchesSearch = 
        entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.example.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === "Todos" || entry.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const categories = ["Todos", "Finanzas Básicas", "Conceptos Clave", "Operación", "Impuestos"];

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-emerald-600 animate-pulse" />
            Glosario ContaFácil
          </h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base font-medium">
            Aprende contabilidad real explicada "en lenguaje de barrio". Sin tecnicismos raros.
          </p>
        </div>
        
        {/* NAVEGACIÓN EN PESTAÑAS */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 self-start md:self-center overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("explorer")}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap",
              activeTab === "explorer"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            🔍 Explorador
          </button>
          <button
            onClick={() => setActiveTab("translator")}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap",
              activeTab === "translator"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            🧙 Traductor Contable
          </button>
          <button
            onClick={() => setActiveTab("trivia")}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap",
              activeTab === "trivia"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            🎮 Ponte a Prueba
          </button>
          <button
            onClick={() => setActiveTab("suggestions")}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap",
              activeTab === "suggestions"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            💡 Sugerir Término
          </button>
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* PESTAÑA 1: EXPLORADOR DE TÉRMINOS */}
      {activeTab === "explorer" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Panel de Búsqueda y Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Busca palabras (ej. IVA, Utilidad, moto, pasteles...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-slate-50/50 focus-visible:ring-emerald-500 border-slate-200 rounded-xl"
              />
            </div>
            <div className="flex gap-2 items-center overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 hidden md:inline">
                Filtrar:
              </span>
              <div className="flex gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                      selectedCategory === cat
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de Tarjetas */}
          {filteredTerms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No encontramos ese término</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Prueba buscando otra palabra o puedes ir a la pestaña <b>Sugerir Término</b> para pedirnos que la traduzcamos.
              </p>
              <Button
                onClick={() => setActiveTab("suggestions")}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
              >
                Sugerir un nuevo término
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTerms.map(([key, entry]) => {
                const isExpanded = expandedTerm === key;
                const stats = feedbackStats[key] || { helpful: 0, unhelpful: 0, myVote: null };
                
                return (
                  <div
                    key={key}
                    className={cn(
                      "bg-white rounded-2xl border transition-all duration-300 shadow-sm flex flex-col justify-between overflow-hidden",
                      isExpanded 
                        ? "ring-2 ring-emerald-500/20 border-emerald-500/80 scale-[1.01]" 
                        : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                    )}
                  >
                    {/* Tarjeta Cuerpo */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase",
                          entry.category === "Finanzas Básicas" && "bg-blue-50 text-blue-700 border border-blue-100",
                          entry.category === "Conceptos Clave" && "bg-purple-50 text-purple-700 border border-purple-100",
                          entry.category === "Operación" && "bg-amber-50 text-amber-700 border border-amber-100",
                          entry.category === "Impuestos" && "bg-rose-50 text-rose-700 border border-rose-100"
                        )}>
                          {entry.category}
                        </span>
                        
                        {/* Fórmula Badge */}
                        {entry.formula && (
                          <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                            f(x)
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{entry.term}</h3>
                        <p className="text-slate-600 text-sm mt-1.5 leading-relaxed font-medium">
                          {entry.definition}
                        </p>
                      </div>

                      {/* Sección expandible (Fórmula + Ejemplo) */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                          {entry.formula && (
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                La fórmula simplificada
                              </h4>
                              <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                                {entry.formula}
                              </p>
                            </div>
                          )}

                          <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100/50">
                            <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" />
                              Ejemplo del día a día
                            </h4>
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                              {entry.example}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tarjeta Footer */}
                    <div className="bg-slate-50/80 px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setExpandedTerm(isExpanded ? null : key)}
                        className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? "Ocultar detalles" : "Ver ejemplo práctico"}
                        <ArrowRight className={cn("h-3.5 w-3.5 transition-transform", isExpanded ? "rotate-90" : "")} />
                      </button>

                      {/* Feedback Social */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-semibold mr-1">¿Está claro?</span>
                        <button
                          onClick={() => handleVote(key, true)}
                          title="Explicación clara"
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg border transition-all duration-200",
                            stats.myVote === true
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border-slate-200/80"
                          )}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {stats.helpful > 0 && <span className="text-[10px] font-bold">{stats.helpful}</span>}
                        </button>
                        <button
                          onClick={() => handleVote(key, false)}
                          title="Aún me confunde"
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg border transition-all duration-200",
                            stats.myVote === false
                              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                              : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border-slate-200/80"
                          )}
                        >
                          <ThumbsDown className="h-3 w-3" />
                          {stats.unhelpful > 0 && <span className="text-[10px] font-bold">{stats.unhelpful}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: TRADUCTOR CONTABLE */}
      {activeTab === "translator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Panel Izquierdo: Selección de Frases */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Selecciona una frase
            </h3>
            <div className="space-y-2.5">
              {frasesTraductor.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedFraseIndex(idx);
                    setHoveredTermInSentence(null);
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-200",
                    selectedFraseIndex === idx
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10"
                      : "bg-white hover:bg-slate-50/50 border-slate-200 text-slate-800"
                  )}
                >
                  <p className={cn("text-xs font-bold uppercase tracking-wider", selectedFraseIndex === idx ? "text-emerald-100" : "text-slate-400")}>
                    Ejemplo {idx + 1}
                  </p>
                  <p className="text-sm font-bold mt-1 line-clamp-1">{f.titulo}</p>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed font-medium">
              <p className="font-bold mb-1 flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5" />
                ¿Cómo funciona el Traductor?
              </p>
              Las palabras en <span className="underline decoration-dotted font-bold text-emerald-700">verde</span> son términos técnicos. Haz clic o pasa el ratón sobre ellas para ver su definición instantánea y un ejemplo del mundo real a la derecha.
            </div>
          </div>

          {/* Panel Derecho: Visualizador de Traducción */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-950 text-slate-100">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 uppercase tracking-wider border border-zinc-700">
                    Tecnicismo Contable
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 bg-white">
                <p className="text-base font-medium text-slate-800 italic leading-relaxed">
                  "
                  {frasesTraductor[selectedFraseIndex].partes.map((p, pIdx) => {
                    if (p.highlight && p.key) {
                      const entry = GLOSSARY[p.key];
                      const isHovered = hoveredTermInSentence === p.key;
                      return (
                        <button
                          key={pIdx}
                          onClick={() => setHoveredTermInSentence(p.key)}
                          onMouseEnter={() => setHoveredTermInSentence(p.key)}
                          className={cn(
                            "mx-0.5 px-1 rounded-md underline decoration-emerald-500 decoration-2 decoration-dotted font-bold transition-all duration-200 cursor-pointer",
                            isHovered
                              ? "bg-emerald-500 text-white decoration-transparent scale-105"
                              : "text-emerald-600 hover:bg-emerald-50"
                          )}
                        >
                          {p.text}
                        </button>
                      );
                    }
                    return <span key={pIdx}>{p.text}</span>;
                  })}
                  "
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm overflow-hidden ring-2 ring-emerald-500/10">
              <CardHeader className="bg-emerald-600 text-white">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-700 text-emerald-100 uppercase tracking-wider border border-emerald-500">
                    Traducción al Lenguaje Humano
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 bg-emerald-50/20">
                <p className="text-base font-semibold text-emerald-950 leading-relaxed">
                  {frasesTraductor[selectedFraseIndex].traduccionSimple}
                </p>
              </CardContent>
            </Card>

            {/* Ficha Flotante de Detalles del Término Activo */}
            {hoveredTermInSentence && (
              <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-lg animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-slate-900">
                    🔍 Detalle: {GLOSSARY[hoveredTermInSentence].term}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
                    {GLOSSARY[hoveredTermInSentence].category}
                  </span>
                </div>
                <p className="text-sm text-slate-700 font-medium">
                  {GLOSSARY[hoveredTermInSentence].definition}
                </p>
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 mt-3 text-xs">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Ejemplo Ilustrativo
                  </p>
                  <p className="text-slate-600 italic">
                    {GLOSSARY[hoveredTermInSentence].example}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PONTE A PRUEBA (TRIVIA) */}
      {activeTab === "trivia" && (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-200">
          {!isTriviaFinished ? (
            <Card className="border-slate-100 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-950 text-slate-100 p-5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span className="uppercase tracking-wider">Trivia Contable</span>
                  <span>Pregunta {currentQuestionIdx + 1} de {preguntasTrivia.length}</span>
                </div>
                <CardTitle className="text-lg font-bold text-white mt-3 leading-snug">
                  {preguntasTrivia[currentQuestionIdx].pregunta}
                </CardTitle>
                {/* Barra de progreso */}
                <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx) / preguntasTrivia.length) * 100}%` }}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  {preguntasTrivia[currentQuestionIdx].opciones.map((opcion, idx) => {
                    const isSelected = selectedAnswerIdx === idx;
                    const isCorrect = opcion.esCorrecta;
                    
                    return (
                      <button
                        key={idx}
                        disabled={selectedAnswerIdx !== null}
                        onClick={() => handleAnswerSelect(idx)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex justify-between items-center text-sm font-semibold",
                          selectedAnswerIdx === null
                            ? "border-slate-100 bg-slate-50/30 hover:border-emerald-500 hover:bg-emerald-50/20 text-slate-800"
                            : isSelected
                              ? isCorrect
                                ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                                : "border-rose-500 bg-rose-50 text-rose-800 shadow-sm"
                              : isCorrect
                                ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                                : "border-slate-100 bg-white text-slate-400"
                        )}
                      >
                        <span>{opcion.texto}</span>
                        {selectedAnswerIdx !== null && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explicación / Retroalimentación */}
                {showTriviaResult && (
                  <div className={cn(
                    "p-4 rounded-xl border animate-in fade-in duration-200 mt-4 leading-relaxed text-xs md:text-sm font-medium",
                    preguntasTrivia[currentQuestionIdx].opciones[selectedAnswerIdx!].esCorrecta
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                      : "bg-rose-50/80 border-rose-200 text-rose-950"
                  )}>
                    <p className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                      {preguntasTrivia[currentQuestionIdx].opciones[selectedAnswerIdx!].esCorrecta 
                        ? "🎉 ¡Excelente!" 
                        : "❌ ¡Casi lo logras!"}
                    </p>
                    <p>{preguntasTrivia[currentQuestionIdx].explicacion}</p>
                    
                    <Button
                      onClick={handleNextQuestion}
                      className="mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs flex items-center gap-1.5 ml-auto"
                    >
                      {currentQuestionIdx < preguntasTrivia.length - 1 ? "Siguiente pregunta" : "Ver resultados"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Pantalla de Resultados Finales
            <Card className="border-slate-100 shadow-lg rounded-2xl overflow-hidden p-8 text-center bg-white space-y-6">
              <div className="relative inline-flex items-center justify-center p-4 rounded-full bg-emerald-50 mb-2">
                <Award className="h-14 w-14 text-emerald-600 animate-bounce" />
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900">¡Trivia Completada!</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                  Tu puntuación es de <b>{triviaScore}</b> de <b>{preguntasTrivia.length}</b> respuestas correctas.
                </p>
              </div>

              {/* Mensaje personalizado según score */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 max-w-md mx-auto text-sm leading-relaxed text-slate-700 font-medium">
                {triviaScore === preguntasTrivia.length ? (
                  <p>🏆 <b>¡Nivel Experto!</b> Tienes un entendimiento perfecto de los conceptos contables básicos de tu negocio. ¡Estás listo para optimizar tus finanzas!</p>
                ) : triviaScore >= 2 ? (
                  <p>👍 <b>¡Buen trabajo!</b> Tienes las nociones fundamentales bastante claras. Sigue usando ContaFácil y el glosario para pulir tus conocimientos.</p>
                ) : (
                  <p>📚 <b>¡Buen intento!</b> La contabilidad puede ser confusa al principio. Te recomendamos repasar los ejemplos y las tarjetas del explorador para dominar los términos.</p>
                )}
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={resetTrivia}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold px-6 py-2 border border-slate-200"
                >
                  Volver a intentar
                </Button>
                <Button
                  onClick={() => setActiveTab("explorer")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 py-2 shadow-md shadow-emerald-600/10"
                >
                  Ir al explorador
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* PESTAÑA 4: SUGERIR TÉRMINOS */}
      {activeTab === "suggestions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          
          {/* Panel Izquierdo: Formulario */}
          <div className="lg:col-span-1">
            <Card className="border-slate-100 shadow-sm sticky top-6 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-emerald-600" />
                  Sugerir un nuevo término
                </CardTitle>
                <CardDescription className="text-slate-500">
                  ¿Hay alguna palabra en los balances o reportes que no entiendas? Dinos y la traduciremos.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmitSuggestion} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="termName" className="font-bold text-slate-700 text-xs">
                      Término / Palabra *
                    </Label>
                    <Input
                      id="termName"
                      placeholder="Ej. Depreciación acumulada, RAE..."
                      value={newTermName}
                      onChange={(e) => setNewTermName(e.target.value)}
                      required
                      maxLength={50}
                      className="bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="termDesc" className="font-bold text-slate-700 text-xs">
                      ¿Dónde la viste o de qué crees que trata? (Opcional)
                    </Label>
                    <textarea
                      id="termDesc"
                      rows={3}
                      placeholder="Ej. Me apareció en un reporte del banco..."
                      value={newTermDesc}
                      onChange={(e) => setNewTermDesc(e.target.value)}
                      maxLength={250}
                      className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingSuggestion || !newTermName.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 flex items-center justify-center gap-2 font-bold"
                  >
                    {submittingSuggestion ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar sugerencia
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Panel Derecho: Lista de Sugerencias de la Comunidad */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              Sugerencias de la Comunidad
            </h3>

            {loadingSuggestions ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">Cargando sugerencias de los usuarios...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                <Lightbulb className="h-10 w-10 text-emerald-600/30 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Aún no hay sugerencias</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Sé el primero en sugerir un término que te gustaría ver traducido en el glosario.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s) => {
                  const isOwn = s.user_id === userId;
                  const profileName = s.profiles?.business_name || s.profiles?.full_name || "Colega microempresario";
                  const formattedDate = new Date(s.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  });

                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start gap-4"
                    >
                      <div className="space-y-1.5">
                        <h4 className="text-base font-bold text-slate-900">{s.term_name}</h4>
                        {s.description && (
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            "{s.description}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold pt-1">
                          <span className="text-emerald-600">{profileName}</span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {isOwn && (
                        <button
                          onClick={() => handleDeleteSuggestion(s.id)}
                          title="Eliminar mi sugerencia"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
