"use client";

import { useState } from "react";
import CategorySelector from "@/components/CategorySelector";
import UnitConverter from "@/components/UnitConverter";
import { ArrowLeftRight } from "lucide-react";
import Header from "@/components/Global/Header";

export default function Home() {
    const [category, setCategory] = useState("Length");

    return (
    <>
    <Header />
    <div className="min-h-screen p-10 bg-background">
        <div className="text-center mb-8">
        <ArrowLeftRight className="mx-auto mb-2" />
        <h1 className="text-3xl font-bold">Unit Converter</h1>
        </div>

        <CategorySelector selected={category} onSelect={setCategory} />

        <div className="mt-8">
        <UnitConverter category={category} />
        </div>
    </div>
    </>
    );

}