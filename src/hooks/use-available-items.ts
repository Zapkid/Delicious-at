"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import type { Item } from "@/types";

function sortFeaturedFirst(list: Item[]): Item[] {
  return [...list].sort(
    (a: Item, b: Item) =>
      Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured))
  );
}

export function useAvailableItems(): {
  items: Item[];
  isLoading: boolean;
} {
  const supabase = useSupabase();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetch(): Promise<void> {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("is_available_now", true)
        .order("updated_at", { ascending: false });

      setItems(sortFeaturedFirst((data as Item[]) ?? []));
      setIsLoading(false);
    }

    fetch();

    const channel = supabase
      .channel("available-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
        },
        (payload) => {
          const updated: Item = payload.new as Item;
          setItems((prev: Item[]) => {
            const without: Item[] = prev.filter((i: Item) => i.id !== updated.id);
            if (updated.is_available_now) {
              return sortFeaturedFirst([updated, ...without]);
            }
            return without;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { items, isLoading };
}
