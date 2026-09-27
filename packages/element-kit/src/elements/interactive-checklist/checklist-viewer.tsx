import {
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import type { ElementViewerProps } from "@lumina/element-kit-core";
import type {
  ChecklistConfig,
  ChecklistEstado,
} from "./checklist-types.js";
import styles from "./checklist.module.css";

export function ChecklistViewer({
  estado,
  config,
}: ElementViewerProps<ChecklistEstado, ChecklistConfig>): ReactElement {
  const cfg = estado.configuracion;
  const isThumbnail = Boolean(config?.isThumbnail);
  const items = cfg.items ?? [];

  // Estado de ítems completados
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of items) {
      if (item.completadoPorDefecto) {
        initial.add(item.id);
      }
    }
    return initial;
  });

  const toggleItem = (id: string) => {
    if (isThumbnail) return;
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (isThumbnail) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleItem(id);
    }
  };

  const resetList = () => {
    if (isThumbnail) return;
    setCompletedIds(new Set());
  };

  const completedCount = items.filter((i) => completedIds.has(i.id)).length;
  const totalCount = items.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className={styles.root}>
      {(estado.tituloWidget ||
        estado.subtituloWidget ||
        estado.instruccion) && (
        <div className={styles.header}>
          {estado.tituloWidget && (
            <h3 className={styles.title}>{estado.tituloWidget}</h3>
          )}
          {estado.subtituloWidget && (
            <p className={styles.subtitle}>{estado.subtituloWidget}</p>
          )}
          {estado.instruccion && (
            <p className={styles.instruction}>{estado.instruccion}</p>
          )}
        </div>
      )}

      {/* Barra de progreso y contador */}
      {(cfg.mostrarBarraProgreso || cfg.mostrarContador) && totalCount > 0 && (
        <div className={styles.progressSection}>
          {cfg.mostrarContador && (
            <div className={styles.progressInfo}>
              <span>
                {completedCount} de {totalCount} completados
              </span>
              <span className={styles.progressPercent}>{progressPct}%</span>
            </div>
          )}
          {cfg.mostrarBarraProgreso && (
            <div
              className={styles.progressBarTrack}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Lista de ítems */}
      <div className={styles.itemsList}>
        {items.map((item, index) => {
          const isCompleted = completedIds.has(item.id);

          const itemClass =
            cfg.estiloVisual === "minimal"
              ? `${styles.itemMinimal} ${
                  isCompleted ? styles.itemMinimalCompleted : ""
                }`
              : cfg.estiloVisual === "numerado"
              ? `${styles.itemNumerado} ${
                  isCompleted ? styles.itemCardCompleted : ""
                }`
              : `${styles.itemCard} ${
                  isCompleted ? styles.itemCardCompleted : ""
                }`;

          return (
            <div
              key={item.id}
              className={itemClass}
              onClick={() => toggleItem(item.id)}
            >
              {cfg.estiloVisual === "numerado" && (
                <div
                  className={`${styles.numberBadge} ${
                    isCompleted ? styles.numberBadgeCompleted : ""
                  }`}
                >
                  {index + 1}
                </div>
              )}

              <div
                role="checkbox"
                tabIndex={isThumbnail ? -1 : 0}
                aria-checked={isCompleted}
                aria-label={item.texto}
                className={`${styles.checkboxBox} ${
                  isCompleted ? styles.checkboxBoxCompleted : ""
                }`}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
              >
                {isCompleted && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              <div className={styles.itemTextContainer}>
                <span
                  className={`${styles.itemText} ${
                    isCompleted ? styles.itemTextCompleted : ""
                  }`}
                >
                  {item.texto}
                </span>
                {item.descripcion && (
                  <span className={styles.itemDesc}>{item.descripcion}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner de felicitación / completado */}
      {cfg.mostrarCelebracion && isAllCompleted && !isThumbnail && (
        <div className={styles.celebrationBanner}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <span>
            {cfg.mensajeCelebracion ||
              "¡Excelente trabajo! Has completado todos los pasos."}
          </span>
        </div>
      )}

      {/* Botón de reinicio */}
      {cfg.permitirReinicio && completedCount > 0 && !isThumbnail && (
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={(e) => {
              e.stopPropagation();
              resetList();
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reiniciar
          </button>
        </div>
      )}
    </div>
  );
}
