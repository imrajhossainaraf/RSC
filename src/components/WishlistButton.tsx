"use client";

import { useSyncExternalStore } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import styles from "./WishlistButton.module.css";

type Props = {
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
};

const listeners = new Set<() => void>();
let cachedWishlist: Props[] | null = null;

function readWishlist(): Props[] {
  if (cachedWishlist !== null) return cachedWishlist;
  try {
    cachedWishlist = JSON.parse(localStorage.getItem("wishlist") ?? "[]") as Props[];
  } catch {
    cachedWishlist = [];
  }
  return cachedWishlist;
}

function writeWishlist(wishlist: Props[]) {
  cachedWishlist = wishlist;
  try {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const serverWishlist: Props[] = [];

export default function WishlistButton({ productId, name, price, image, stock }: Props) {
  const wishlist = useSyncExternalStore(subscribe, readWishlist, () => serverWishlist);
  const saved = wishlist.some((i) => i.productId === productId);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const current = readWishlist();
    if (saved) {
      writeWishlist(current.filter((i) => i.productId !== productId));
      toast.info(`${name} removed from wishlist`);
    } else {
      writeWishlist([...current, { productId, name, price, image, stock }]);
      toast.success(`${name} added to wishlist`);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`${styles.wishBtn} ${saved ? styles.saved : ""}`}
      title={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
    >
      {saved ? <HeartSolid width={16} height={16} /> : <HeartIcon width={16} height={16} />}
    </button>
  );
}
