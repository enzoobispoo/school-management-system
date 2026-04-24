"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_DASHBOARD_CARDS_ORDER,
  DEFAULT_OPTIONAL_METRIC_CARDS,
  type DashboardMetricKey,
  type OptionalMetricKey,
} from "@/components/dashboard/metrics/dashboard-metric-card-config";

const STORAGE_KEY = "dashboard_optional_cards_v2";
const STORAGE_ORDER_KEY = "dashboard_cards_order_v1";

function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function useDashboardCardsPreferences() {
  const [optionalCards, setOptionalCards] = useState<
    Record<OptionalMetricKey, boolean>
  >(DEFAULT_OPTIONAL_METRIC_CARDS);

  const [cardsOrder, setCardsOrder] = useState<DashboardMetricKey[]>(
    DEFAULT_DASHBOARD_CARDS_ORDER
  );

  const [loadingPreferences, setLoadingPreferences] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoadingPreferences(true);

        const response = await fetch("/api/users/me/dashboard-cards", {
          method: "GET",
          cache: "no-store",
        });

        if (response.ok) {
          const result = await response.json();
          const dbCards = result?.dashboardCards;
          const dbOrder = result?.dashboardCardsOrder;

          if (dbCards && typeof dbCards === "object") {
            setOptionalCards((prev) => ({
              ...prev,
              ...dbCards,
            }));
          }

          if (Array.isArray(dbOrder) && dbOrder.length > 0) {
            setCardsOrder(dbOrder as DashboardMetricKey[]);
          }

          return;
        }

        const savedCards = localStorage.getItem(STORAGE_KEY);
        const savedOrder = localStorage.getItem(STORAGE_ORDER_KEY);

        if (savedCards) {
          const parsedCards = JSON.parse(savedCards);
          setOptionalCards((prev) => ({
            ...prev,
            ...parsedCards,
          }));
        }

        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
            setCardsOrder(parsedOrder as DashboardMetricKey[]);
          }
        }
      } catch {
        try {
          const savedCards = localStorage.getItem(STORAGE_KEY);
          const savedOrder = localStorage.getItem(STORAGE_ORDER_KEY);

          if (savedCards) {
            const parsedCards = JSON.parse(savedCards);
            setOptionalCards((prev) => ({
              ...prev,
              ...parsedCards,
            }));
          }

          if (savedOrder) {
            const parsedOrder = JSON.parse(savedOrder);
            if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
              setCardsOrder(parsedOrder as DashboardMetricKey[]);
            }
          }
        } catch {
          // ignora fallback inválido
        }
      } finally {
        setLoadingPreferences(false);
      }
    }

    loadPreferences();
  }, []);

  async function persistPreferences(
    nextCards: Record<OptionalMetricKey, boolean>,
    nextOrder: DashboardMetricKey[]
  ) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCards));
    localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(nextOrder));

    try {
      await fetch("/api/users/me/dashboard-cards", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dashboardCards: nextCards,
          dashboardCardsOrder: nextOrder,
        }),
      });
    } catch {
      // fallback silencioso
    }
  }

  function toggleCard(key: OptionalMetricKey, checked: boolean) {
    setOptionalCards((prev) => {
      const nextCards = {
        ...prev,
        [key]: checked,
      };

      void persistPreferences(nextCards, cardsOrder);
      return nextCards;
    });
  }

  function updateCardsOrder(nextOrder: DashboardMetricKey[]) {
    setCardsOrder(nextOrder);
    void persistPreferences(optionalCards, nextOrder);
  }

  function moveCardUp(key: DashboardMetricKey) {
    const currentIndex = cardsOrder.indexOf(key);
    if (currentIndex <= 0) return;

    const nextOrder = moveItem(cardsOrder, currentIndex, currentIndex - 1);
    updateCardsOrder(nextOrder);
  }

  function moveCardDown(key: DashboardMetricKey) {
    const currentIndex = cardsOrder.indexOf(key);
    if (currentIndex === -1 || currentIndex >= cardsOrder.length - 1) return;

    const nextOrder = moveItem(cardsOrder, currentIndex, currentIndex + 1);
    updateCardsOrder(nextOrder);
  }

  return {
    optionalCards,
    cardsOrder,
    toggleCard,
    updateCardsOrder,
    moveCardUp,
    moveCardDown,
    loadingPreferences,
  };
}