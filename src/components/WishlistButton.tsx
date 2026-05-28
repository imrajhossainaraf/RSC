"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import styles from "./WishlistButton.module.css";

type Props = {
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
};

export default function WishlistButton({ productId, name, price, image, stock }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const wishlist: Props[] = JSON.parse(localStorage.getItem("wishlist") ?? "[]");
    setSaved(wishlist.some((i) => i.productId === productId));
  }, [productId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const wishlist: Props[] = JSON.parse(localStorage.getItem("wishlist") ?? "[]");
    let updated: Props[];
    if (saved) {
      updated = wishlist.filter((i) => i.productId !== productId);
    } else {
      updated = [...wishlist, { productId, name, price, image, stock }];
    }
    localStorage.setItem("wishlist", JSON.stringify(updated));
    setSaved(!saved);
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
