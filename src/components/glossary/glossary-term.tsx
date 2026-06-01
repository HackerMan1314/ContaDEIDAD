"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";

import { GLOSSARY, type GlossaryKey } from "@/lib/glossary/terms";
import { cn } from "@/lib/utils";

interface GlossaryTermProps {
  /** Clave del término en el diccionario centralizado. */
  termKey: GlossaryKey;
  /** Texto a mostrar; por defecto, el nombre del término. */
  children?: React.ReactNode;
  /** Muestra el icono de ayuda (?) junto al término. */
  showIcon?: boolean;
  className?: string;
}

/**
 * Resalta un término técnico y, al pasar el cursor (o enfocarlo con teclado /
 * tocarlo en móvil), muestra su explicación "en lenguaje humano" tomada del
 * diccionario centralizado (Tarea #16). Reutilizable en toda la app.
 */
export function GlossaryTerm({
  termKey,
  children,
  showIcon = true,
  className,
}: GlossaryTermProps) {
  const entry = GLOSSARY[termKey];

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 underline decoration-dotted decoration-zinc-400 underline-offset-2 transition-colors hover:decoration-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 rounded-sm",
              className,
            )}
            aria-label={`¿Qué es ${entry.term}? ${entry.definition}`}
          >
            {children ?? entry.term}
            {showIcon && (
              <HelpCircle className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            )}
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={6}
            collisionPadding={12}
            className="z-50 max-w-xs rounded-lg bg-zinc-900 px-3 py-2 text-left text-xs leading-relaxed text-zinc-100 shadow-lg"
          >
            <p className="mb-0.5 font-semibold text-white">{entry.term}</p>
            <p>{entry.definition}</p>
            <TooltipPrimitive.Arrow className="fill-zinc-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
