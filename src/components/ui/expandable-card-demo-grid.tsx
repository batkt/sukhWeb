"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

interface Card {
  _id: string;
  title: string;
  description: string;
  src: string;
  previewContent?: string;
  content: string | (() => React.ReactNode);
  ctaText?: string;
  ctaLink?: string;
  originalData?: any;
}

interface ExpandableCardDemoProps {
  cards: Card[];
  onEdit?: (card: any) => void;
  onDelete?: (id: string) => void;
}

export default function ExpandableCardDemo({ cards, onEdit, onDelete }: ExpandableCardDemoProps) {
  const [active, setActive] = useState<Card | null>(null);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm h-full w-full z-[150]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[200] p-4 lg:p-8">
            <motion.div
              layoutId={`card-${active._id}-${id}`}
              ref={ref}
              className="w-full max-w-[1000px] h-full md:h-fit md:max-h-[90%] flex flex-col md:flex-row bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              {/* Left Side: Large Image */}
              <motion.div layoutId={`image-${active._id}-${id}`} className="relative w-full md:w-1/2 h-64 md:h-auto min-h-[300px]">
                <img
                  src={active.src}
                  alt={active.title}
                  className="w-full h-full object-cover object-top"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActive(null)}
                  className="absolute top-4 left-4 md:hidden !rounded-xl !w-10 !h-10 !p-0 !bg-black/40 hover:!bg-black/60 !border-none"
                  icon={<X size={20} className="text-white" />}
                />
              </motion.div>

              {/* Right Side: Content Area */}
              <div className="md:w-1/2 flex flex-col bg-white dark:bg-neutral-900 relative">
                <div className="flex justify-between items-start p-6 md:p-8 pb-4">
                  <div className="flex-1">
                    <motion.h3
                      layoutId={`title-${active._id}-${id}`}
                      className="font-black text-neutral-800 dark:text-neutral-100 text-2xl md:text-3xl mb-2 leading-tight"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active._id}-${id}`}
                      className="text-theme font-bold text-xs tracking-widest uppercase"
                    >
                      {active.description}
                    </motion.p>
                  </div>
                  
                  <Button
                     onClick={() => setActive(null)}
                     variant="ghost"
                     size="sm"
                     className="hidden md:flex !rounded-xl !p-2 !h-auto !bg-neutral-50 dark:!bg-neutral-800 hover:!bg-neutral-100 dark:hover:!bg-neutral-700 !border-none"
                     icon={<X className="w-5 h-5 text-neutral-500" />}
                  />
                </div>

                <div className="px-6 md:px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-neutral-600 dark:text-neutral-300 text-sm md:text-base leading-relaxed"
                  >
                    {typeof active.content === "function"
                      ? active.content()
                      : active.content}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card._id}-${id}`}
            key={card._id}
            onClick={() => setActive(card)}
            className="group relative flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl cursor-pointer hover:shadow-xl dark:hover:shadow-neutral-900/50 transition-all duration-300 overflow-hidden"
          >
            <div className="relative h-56 w-full overflow-hidden">
              <motion.div layoutId={`image-${card._id}-${id}`} className="h-full w-full">
                <img
                  src={card.src}
                  alt={card.title}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="p-5 flex flex-col bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
              <motion.h3
                layoutId={`title-${card._id}-${id}`}
                className="font-bold text-neutral-800 dark:text-neutral-100 text-base mb-1 line-clamp-1"
              >
                {card.title}
              </motion.h3>
              <motion.p
                layoutId={`description-${card._id}-${id}`}
                className="text-neutral-500 dark:text-neutral-400 text-xs line-clamp-2"
              >
                {card.description}
              </motion.p>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
